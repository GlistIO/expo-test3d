import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { downloadAllImages } from "./imageAssets";
import CoinCounter from "./components/CoinCounter";
import GameDialog from "./components/GameDialog";
import useSceneManager from "./hooks/useSceneManager";
import GameWorld from "./components/GameWorld";

export default function App() {
  const [imageUris, setImageUris] = useState(null);
  const [dialog, setDialog] = useState({ visible: false, text: "" });

  // Scene management
  const {
    currentScene,
    sceneIndex,
    coinCount,
    playerPos,
    coins,
    goToScene,
    setCoinCount,
    setSceneIndex,
    setCoins,
    targetDestination,
    handleTap,
  } = useSceneManager();

  useEffect(() => {
    (async () => {
      const uris = await downloadAllImages();
      setImageUris(uris);
    })();
  }, []);

  if (!imageUris) return null;

  function showDialog(text, icon = null, timeout = 2000, background = null) {
    setDialog({ visible: true, text, icon, timeout, background });
  }
  
  function handleCoinPickup(idx) {
    setCoins(prev => prev.map((c, i) => i === idx ? { ...c, taken: true } : c));
    setCoinCount(c => c + 1);
    showDialog("Tu atradi 1 zelta monētu!", imageUris.coin, 2200);
 }

  return (
    <View style={{ flex: 1 }}>
      <CoinCounter count={coinCount} />
      <View style={{ flex: 1 }}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={e => {
            const { locationX, locationY } = e.nativeEvent;
            handleTap(locationX, locationY);
          }}
        >
          <GameWorld
            key={sceneIndex}
            currentScene={currentScene}
            imageUris={imageUris}
            playerPos={playerPos}
            coins={coins}
            setCoins={setCoins}
            onCoinPickup={handleCoinPickup}
            goToScene={goToScene}
            targetDestination={targetDestination}
            setCoinCount={setCoinCount}
            showDialog={showDialog}
          />
        </Pressable>
      </View>
      <GameDialog
        visible={dialog.visible}
        text={dialog.text}
        icon={dialog.icon}
        timeout={dialog.timeout || 2200}
        onHide={() => setDialog({ ...dialog, visible: false })}
      />
    </View>
  );
}
