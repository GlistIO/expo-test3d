import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { downloadAllImages } from "./imageAssets";
import PickupCounter from "./components/PickupCounter";
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
    pickupCounts,
    pickups,
    setPickups,
    setPickupCount,
    playerPos,
    goToScene,
    setSceneIndex,
    targetDestination,
    handleTap,
    handlePickup,
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

  return (
    <View style={{ flex: 1 }}>
<PickupCounter
  pickups={pickupCounts}
  icons={{
    coin: imageUris.coin,
    key: imageUris.key,
    // vēl citi tipi ja vajag
  }}
/>
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
            pickups={pickups}
	    onPickup={handlePickup}
            goToScene={goToScene}
            targetDestination={targetDestination}
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
