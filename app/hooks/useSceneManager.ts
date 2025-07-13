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
  
  // Store pickup state for each scene separately
  const scenePickupStates = useRef({});
  
  // Initialize pickup state for current scene
  const initializeScenePickups = (sceneIdx) => {
    debugLog(`Initializing pickups for scene ${sceneIdx}`);
    if (!scenePickupStates.current[sceneIdx]) {
      debugLog(`Creating new pickup state for scene ${sceneIdx}`);
      // Create a deep copy of the scene's pickups with taken: false
      scenePickupStates.current[sceneIdx] = (scenes[sceneIdx]?.pickups || []).map(p => ({ 
        ...p, 
        taken: false 
      }));
      debugLog(`Scene ${sceneIdx} pickups initialized:`, scenePickupStates.current[sceneIdx]);
    } else {
      debugLog(`Using existing pickup state for scene ${sceneIdx}:`, scenePickupStates.current[sceneIdx]);
    }
    return scenePickupStates.current[sceneIdx];
  };

  const [pickups, setPickups] = useState(() => initializeScenePickups(0));
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
        scenePickupStates.current = savedData.scenePickupStates;
        playerPos.current = savedData.playerPosition;
        
        debugLog(`Restored to scene ${savedData.currentScene} with pickup states:`, savedData.scenePickupStates);
        
        // Initialize pickups for the current scene
        const scenePickups = initializeScenePickups(savedData.currentScene);
        setPickups([...scenePickups]);
        
        console.log('Game data loaded successfully');
      } else {
        debugLog('No saved data found, starting fresh');
        // No saved data, start fresh
        console.log('No saved game found, starting fresh');
        const scenePickups = initializeScenePickups(0);
        setPickups([...scenePickups]);
      }
    } catch (error) {
      console.error('Failed to load saved game:', error);
      // Fallback to fresh start
      const scenePickups = initializeScenePickups(0);
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
        scenePickupStates: scenePickupStates.current,
        playerPosition: playerPos.current
      });

      const gameData: GameData = {
        pickupCounts,
        scenePickupStates: scenePickupStates.current,
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
      
      playerPos.current = scenes[sceneIndex]?.playerStart || { x: 0, y: 0 };
      debugLog('Player position after reset:', playerPos.current);
      
      // Load the pickup state for this scene, or initialize if first time
      const scenePickups = initializeScenePickups(sceneIndex);
      debugLog(`Setting pickups for scene ${sceneIndex}:`, scenePickups);
      
      setPickups(scenePickups.map(p => ({ ...p }))); // Create deep copy to trigger re-render
      targetDestination.current = null;
      
      debugLog('All scene pickup states:', scenePickupStates.current);
    }
  }, [sceneIndex, isLoading]);

  function goToScene(newSceneIdx, entry = "left", y = 0) {
    debugLog(`=== SCENE TRANSITION ===`);
    debugLog(`From scene ${sceneIndex} to scene ${newSceneIdx}`);
    debugLog(`Entry point: ${entry}, Y position: ${y}`);
    debugLog('Current pickup states before transition:', scenePickupStates.current);
    
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

  function handlePickup(pickupIndex, type) {
    debugLog(`=== PICKUP EVENT ===`);
    debugLog(`Scene ${sceneIndex}, pickup ${pickupIndex}, type: ${type}`);
    debugLog('Pickup states before:', scenePickupStates.current[sceneIndex]);
    
    // Update the pickup state for current scene (make sure we're modifying the right scene)
    if (scenePickupStates.current[sceneIndex] && scenePickupStates.current[sceneIndex][pickupIndex]) {
      scenePickupStates.current[sceneIndex][pickupIndex].taken = true;
      debugLog(`Marked pickup ${pickupIndex} as taken in scene ${sceneIndex}`);
    }
    
    debugLog('Pickup states after:', scenePickupStates.current[sceneIndex]);
    
    // Update the local pickups state to trigger re-render
    setPickups(prev => prev.map((p, i) => 
      i === pickupIndex ? { ...p, taken: true } : p
    ));
    
    // Update pickup counts
    setPickupCounts(counts => ({
      ...counts,
      [type]: (counts[type] || 0) + 1,
    }));
    
    debugLog(`Updated pickup counts:`, { ...pickupCounts, [type]: (pickupCounts[type] || 0) + 1 });
    debugLog(`=== END PICKUP EVENT ===`);
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
