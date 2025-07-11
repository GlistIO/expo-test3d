import { useRef, useState, useEffect } from "react";
import scenes from "../scenes";
import { EXIT_MARGIN, WORLD_LEFT, WORLD_RIGHT, WORLD_TOP, WORLD_BOTTOM } from "../constants";
import { Dimensions } from "react-native";

export default function useSceneManager() {
  const [sceneIndex, setSceneIndex] = useState(0);
  // Ja gribi count atsevišķiem pickupiem, piemēram, coins, vari izveidot useState objektu
  const [pickupCounts, setPickupCounts] = useState({}); // {coin: 0, key: 0, ...}
  const playerPos = useRef(scenes[0]?.playerStart || { x: 0, y: 0 });
  const [pickups, setPickups] = useState(
    (scenes[0]?.pickups || []).map(p => ({ ...p, taken: false }))
  );
  const targetDestination = useRef(null);

  useEffect(() => {
    playerPos.current = scenes[sceneIndex]?.playerStart || { x: 0, y: 0 };
    setPickups(scenes[sceneIndex]?.pickups?.map(p => ({ ...p, taken: false })) || []);
    targetDestination.current = null;
  }, [sceneIndex]);

  function goToScene(newSceneIdx, entry = "left", y = 0) {
    setSceneIndex(newSceneIdx);
    let newX;
    if (entry === "left") newX = WORLD_RIGHT - 0.3;
    else if (entry === "right") newX = WORLD_LEFT + 0.3;
    else newX = scenes[newSceneIdx]?.playerStart?.x || 0;
    playerPos.current = { x: newX, y };
    targetDestination.current = null;
  }

  function handleTap(locationX, locationY) {
    const { width, height } = Dimensions.get("window");
    const worldX = WORLD_LEFT + (locationX / width) * (WORLD_RIGHT - WORLD_LEFT);
    const worldY = WORLD_TOP - (locationY / height) * (WORLD_TOP - WORLD_BOTTOM);
    targetDestination.current = { x: worldX, y: worldY };
  }

  // Funkcija priekš pickup skaita atjaunošanas
  function handlePickup(type) {
    setPickupCounts(counts => ({
      ...counts,
      [type]: (counts[type] || 0) + 1,
    }));
    if (type === "coin") setCoinCount(c => c + 1);
    if (type === "key") setKeyCount(k => k + 1);
  }

  return {
    currentScene: scenes[sceneIndex] || scenes[0] || {},
    sceneIndex,
    pickupCounts, // te glabā visus count, piem {coin: 1, key: 2}
    playerPos,
    pickups,
    setPickupCounts,
    setSceneIndex,
    setPickups,
    goToScene,
    handleTap,
    targetDestination,
    handlePickup,
  };
}
