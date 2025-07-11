import { useRef, useState, useEffect } from "react";
import scenes from "../scenes";
import { EXIT_MARGIN, WORLD_LEFT, WORLD_RIGHT, WORLD_TOP, WORLD_BOTTOM } from "../constants";
import { Dimensions } from "react-native";


export default function useSceneManager() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const playerPos = useRef(scenes[0]?.playerStart || { x: 0, y: 0 });
  const [coins, setCoins] = useState(
    (scenes[0]?.coins || []).map(c => ({ ...c, taken: false }))
  );
  const targetDestination = useRef(null);

  useEffect(() => {
    playerPos.current = scenes[sceneIndex]?.playerStart || { x: 0, y: 0 };
    setCoins(scenes[sceneIndex]?.coins?.map(c => ({ ...c, taken: false })) || []);
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

  return {
    currentScene: scenes[sceneIndex] || scenes[0] || {},
    sceneIndex,
    coinCount,
    playerPos,
    coins,
    setCoinCount,
    setSceneIndex,
    setCoins,
    goToScene,
    handleTap,
    targetDestination,
  };
}
