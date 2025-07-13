import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Dimensions, Text, ActivityIndicator } from "react-native";
import { downloadAllImages } from "./imageAssets";
import PickupCounter from "./components/PickupCounter";
import GameDialog from "./components/GameDialog";
import useSceneManager from "./hooks/useSceneManager";
import GameWorld from "./components/GameWorld";
import { clearGameData } from "./storage/gameStorage";

export default function App() {
  const [imageUris, setImageUris] = useState(null);
  const [dialog, setDialog] = useState({ visible: false, text: "" });

  // Scene management
  const {
    currentScene,
    sceneIndex,
    pickupCounts,
    pickups,
    isLoading,
    setPickups,
    playerPos,
    goToScene,
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

  // Show loading screen while assets and save data are loading
  if (!imageUris || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 18 }}>
          {!imageUris ? 'Loading assets...' : 'Loading game...'}
        </Text>
      </View>
    );
  }

  // Debug function to clear save data (you can remove this in production)
  async function resetGame() {
    await clearGameData();
    // You might want to reload the app or reset state here
  }

  function showDialog(text, icon = null, timeout = 2000, background = null) {
    setDialog({ visible: true, text, icon, timeout, background });
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Debug reset button - remove in production */}
      <View style={{ position: 'absolute', top: 24, right: 16, zIndex: 101 }}>
        <Pressable
          onPress={resetGame}
          style={{ backgroundColor: 'rgba(255,0,0,0.7)', padding: 8, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontSize: 12 }}>Reset</Text>
        </Pressable>
      </View>
      
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
