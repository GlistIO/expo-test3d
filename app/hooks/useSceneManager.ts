import { useRef, useState, useEffect } from "react";
import scenes from "../scenes";
import { EXIT_MARGIN, WORLD_LEFT, WORLD_RIGHT, WORLD_TOP, WORLD_BOTTOM } from "../constants";
import { Dimensions } from "react-native";
import { saveGameData, loadGameData, GameData } from "../storage/gameStorage";

// Debug flag - set to false to disable debug logging
const DEBUG_SCENES = true;

function debugLog(...args) {
  if (DEBUG_SCENES) {
    console.log('[SCENE DEBUG]', ...args);
  }
}

export default function useSceneManager() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [pickupCounts, setPickupCounts] = useState({}); // {coin: 0, key: 0, ...}
  const [isLoading, setIsLoading] = useState(true);
  const playerPos = useRef(scenes[0]?.playerStart || { x: 0, y: 0 });
  
  // Store which pickups have been collected globally (by their unique ID)
  const collectedPickups = useRef(new Set());
  
  // Get current scene's available pickups (filtered by what hasn't been collected)
  const getCurrentScenePickups = (sceneIdx) => {
    const scene = scenes[sceneIdx];
    if (!scene || !scene.pickups) return [];
    
    return scene.pickups.filter(pickup => !collectedPickups.current.has(pickup.id));
  };

  const [pickups, setPickups] = useState(() => getCurrentScenePickups(0));
  const targetDestination = useRef(null);

  // Load saved game data on app start
  useEffect(() => {
    loadSavedGame();
  }, []);

  // Save game data whenever important state changes
  useEffect(() => {
    if (!isLoading && sceneIndex !== undefined && pickupCounts !== undefined) {
      saveCurrentGameState();
    }
  }, [sceneIndex, pickupCounts, isLoading]);

  async function loadSavedGame() {
    debugLog('Loading saved game...');
    try {
      const savedData = await loadGameData();
      
      if (savedData) {
        debugLog('Saved data found:', savedData);
        // Restore saved state
        setSceneIndex(savedData.currentScene);
        setPickupCounts(savedData.pickupCounts);
        playerPos.current = savedData.playerPosition;
        
        // Restore collected pickups
        if (savedData.collectedPickups) {
          collectedPickups.current = new Set(savedData.collectedPickups);
        }
        
        debugLog(`Restored to scene ${savedData.currentScene} with collected pickups:`, Array.from(collectedPickups.current));
        
        // Set pickups for the current scene
        const scenePickups = getCurrentScenePickups(savedData.currentScene);
        setPickups([...scenePickups]);
        
        console.log('Game data loaded successfully');
      } else {
        debugLog('No saved data found, starting fresh');
        // No saved data, start fresh
        console.log('No saved game found, starting fresh');
        const scenePickups = getCurrentScenePickups(0);
        setPickups([...scenePickups]);
      }
    } catch (error) {
      console.error('Failed to load saved game:', error);
      // Fallback to fresh start
      const scenePickups = getCurrentScenePickups(0);
      setPickups([...scenePickups]);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveCurrentGameState() {
    try {
      // Don't save if essential data is undefined
      if (sceneIndex === undefined || !pickupCounts || !playerPos.current) {
        debugLog('Skipping save - incomplete data', { sceneIndex, pickupCounts, playerPos: playerPos.current });
        return;
      }

      debugLog('Saving game state:', {
        currentScene: sceneIndex,
        pickupCounts,
        collectedPickups: Array.from(collectedPickups.current),
        playerPosition: playerPos.current
      });

      const gameData: GameData = {
        pickupCounts,
        collectedPickups: Array.from(collectedPickups.current),
        currentScene: sceneIndex,
        playerPosition: playerPos.current,
      };
      
      await saveGameData(gameData);
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  useEffect(() => {
    if (!isLoading) {
      debugLog(`Scene changed to ${sceneIndex}`);
      debugLog('Player position before change:', playerPos.current);
      
      // Only reset player position if it's a fresh scene load (not from saved game)
      if (!playerPos.current || (playerPos.current.x === 0 && playerPos.current.y === 0)) {
        playerPos.current = scenes[sceneIndex]?.playerStart || { x: 0, y: 0 };
        debugLog('Player position reset to start:', playerPos.current);
      }
      
      // Load the available pickups for this scene
      const scenePickups = getCurrentScenePickups(sceneIndex);
      debugLog(`Setting pickups for scene ${sceneIndex}:`, scenePickups);
      
      setPickups([...scenePickups]); // Create copy to trigger re-render
      targetDestination.current = null;
      
      debugLog('Collected pickups:', Array.from(collectedPickups.current));
    }
  }, [sceneIndex, isLoading]);

  function goToScene(newSceneIdx, entry = "left", y = 0) {
    debugLog(`=== SCENE TRANSITION ===`);
    debugLog(`From scene ${sceneIndex} to scene ${newSceneIdx}`);
    debugLog(`Entry point: ${entry}, Y position: ${y}`);
    debugLog('Current collected pickups before transition:', Array.from(collectedPickups.current));
    
    setSceneIndex(newSceneIdx);
    let newX;
    if (entry === "left") newX = WORLD_RIGHT - 0.3;
    else if (entry === "right") newX = WORLD_LEFT + 0.3;
    else newX = scenes[newSceneIdx]?.playerStart?.x || 0;
    
    debugLog(`New player position will be: x=${newX}, y=${y}`);
    playerPos.current = { x: newX, y };
    targetDestination.current = null;
    debugLog(`=== END SCENE TRANSITION ===`);
  }

  function handleTap(locationX, locationY) {
    const { width, height } = Dimensions.get("window");
    const worldX = WORLD_LEFT + (locationX / width) * (WORLD_RIGHT - WORLD_LEFT);
    const worldY = WORLD_TOP - (locationY / height) * (WORLD_TOP - WORLD_BOTTOM);
    targetDestination.current = { x: worldX, y: worldY };
  }

  function handlePickup(pickup) {
    debugLog(`=== PICKUP EVENT ===`);
    debugLog(`Scene ${sceneIndex}, pickup ID: ${pickup.id}, type: ${pickup.type}, value: ${pickup.value}`);
    debugLog('Collected pickups before:', Array.from(collectedPickups.current));
    
    // Mark this pickup as collected globally
    collectedPickups.current.add(pickup.id);
    debugLog('Collected pickups after:', Array.from(collectedPickups.current));
    
    // Remove from current scene's pickups
    setPickups(prev => prev.filter(p => p.id !== pickup.id));
    
    // Update pickup counts (add the value, not just 1)
    setPickupCounts(counts => ({
      ...counts,
      [pickup.type]: (counts[pickup.type] || 0) + (pickup.value || 1),
    }));
    
    debugLog(`Updated pickup counts:`, { ...pickupCounts, [pickup.type]: (pickupCounts[pickup.type] || 0) + (pickup.value || 1) });
    debugLog(`=== END PICKUP EVENT ===`);
    
    return pickup; // Return the pickup for use in GameWorld (for dialog)
  }

  return {
    currentScene: scenes[sceneIndex] || scenes[0] || {},
    sceneIndex,
    pickupCounts,
    playerPos,
    pickups,
    isLoading,
    setPickupCounts,
    setSceneIndex,
    setPickups,
    goToScene,
    handleTap,
    targetDestination,
    handlePickup,
    saveCurrentGameState,
  };
}
