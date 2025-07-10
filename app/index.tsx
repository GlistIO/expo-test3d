import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { GLView } from "expo-gl";
import { TextureLoader, Renderer } from "expo-three";
import * as THREE from "three";
import { downloadAllImages } from "./imageAssets";
import {
  WORLD_LEFT, WORLD_RIGHT, WORLD_TOP, WORLD_BOTTOM,
  SPRITE_COLS, SPRITE_ROWS,
  WALK_FRAMES, DIRECTIONS, CUBE_SIZE, EXIT_MARGIN
} from "./constants";
import { willCollide } from "./utils";
import CoinCounter from "./components/CoinCounter";
import GameDialog from "./components/GameDialog";
import scenes from "./scenes";

export default function App() {
  const meshRef = useRef(null);
  const spriteState = useRef({ direction: "down", frame: 0, frameTick: 0 });
  const textureRef = useRef(null);
  const coinRefs = useRef([]);
  const [coinCount, setCoinCount] = useState(0);
  const [imageUris, setImageUris] = useState(null);
  const [dialog, setDialog] = useState({ visible: false, text: "" });
  const targetDestination = useRef(null);

  // == SCENE STUFF ==
  const [sceneIndex, setSceneIndex] = useState(0);
  const currentScene = scenes[sceneIndex];
  const playerPos = useRef({ ...currentScene.playerStart });
  const [coins, setCoins] = useState(currentScene.coins.map(c => ({ ...c, taken: false })));

  // Reset on scene change
  useEffect(() => {
    playerPos.current = { ...scenes[sceneIndex].playerStart };
    setCoins(scenes[sceneIndex].coins.map(c => ({ ...c, taken: false })));
    if (coinRefs.current.length > 0) coinRefs.current = [];
    targetDestination.current = null;
  }, [sceneIndex]);

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

  function setSpriteFrame(dir, frame) {
    const tex = textureRef.current;
    if (!tex) return;
    const col = frame % SPRITE_COLS;
    const row = DIRECTIONS[dir];
    tex.repeat.set(1 / SPRITE_COLS, 1 / SPRITE_ROWS);
    tex.offset.x = col * (1 / SPRITE_COLS);
    tex.offset.y = 1 - (row + 1) * (1 / SPRITE_ROWS);
  }

  function handleTap(locationX, locationY) {
    const { width, height } = Dimensions.get("window");
    const worldX = WORLD_LEFT + (locationX / width) * (WORLD_RIGHT - WORLD_LEFT);
    const worldY = WORLD_TOP - (locationY / height) * (WORLD_TOP - WORLD_BOTTOM);
    targetDestination.current = { x: worldX, y: worldY };
  }

  // Pāreja uz citu scēnu
  function goToScene(newSceneIdx, entry = "left", y = 0) {
    setSceneIndex(newSceneIdx);
console.log(
    `[DEBUG] Pārejam uz scēnu ${newSceneIdx} (ieeja: ${entry}, y: ${y})`
  );
    let newX;
    if (entry === "left") {
      newX = WORLD_RIGHT - 0.3;
    } else if (entry === "right") {
      newX = WORLD_LEFT + 0.3;
    } else {
      newX = scenes[newSceneIdx].playerStart.x;
    }
    playerPos.current = { x: newX, y };
console.log("[DEBUG] Jaunā pozīcija:", playerPos.current);
    targetDestination.current = null; // Lai cilvēciņš neiet uzreiz atpakaļ!
  }

  function checkForSceneChange(pos) {
    const exit = currentScene.exits.left;
  if (exit && pos.x <= WORLD_LEFT + EXIT_MARGIN) {
    if (!exit.yRange || (pos.y >= exit.yRange[0] && pos.y <= exit.yRange[1])) {
      goToScene(exit.scene, "left", pos.y);
      return true;
    }
  }
  if (exit && pos.x <= WORLD_RIGHT + EXIT_MARGIN) {
    if (!exit.yRange || (pos.y >= exit.yRange[0] && pos.y <= exit.yRange[1])) {
      goToScene(exit.scene, "right", pos.y);
      return true;
    }
  }
    return false;
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
          <GLView
            style={{ flex: 1 }}
            key={sceneIndex}
            onContextCreate={async (gl) => {
              const renderer = new Renderer({ gl });
              renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

              const scene = new THREE.Scene();
              const camera = new THREE.OrthographicCamera(
                WORLD_LEFT, WORLD_RIGHT, WORLD_TOP, WORLD_BOTTOM, 0.1, 10
              );
              camera.position.z = 2;

              // PLAYER SPRITE
              const texture = await new TextureLoader().loadAsync({ uri: imageUris.player });
              texture.magFilter = THREE.NearestFilter;
              texture.repeat.set(1 / SPRITE_COLS, 1 / SPRITE_ROWS);
              texture.offset.set(0, 1 - 1 / SPRITE_ROWS);
              textureRef.current = texture;

              // Obstacles from scene
              currentScene.obstacles.forEach(obj => {
                const geo = new THREE.PlaneGeometry(obj.size, obj.size);
                const mat = new THREE.MeshBasicMaterial({ color: 0x888888 });
                const obs = new THREE.Mesh(geo, mat);
                obs.position.set(obj.x, obj.y, 0);
                scene.add(obs);
              });

              // Ielādē vienu coinTexture ārpus forEach!
		const coinTexture = await new TextureLoader().loadAsync({ uri: imageUris.coin });
		coinTexture.magFilter = THREE.NearestFilter;

		coins.forEach((c, i) => {
		  if (c.taken) return;
		  const coinMaterial = new THREE.MeshBasicMaterial({
		    map: coinTexture,
		    transparent: true,
		  });
		  const coinMesh = new THREE.Mesh(
		    new THREE.PlaneGeometry(CUBE_SIZE * 2, CUBE_SIZE * 1),
		    coinMaterial
		  );
		  coinMesh.position.set(c.x, c.y, 0);
		  coinMesh.visible = true;
		  scene.add(coinMesh);
		  coinRefs.current[i] = coinMesh;
		});

              // PLAYER MESH
              const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
              });
              const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(CUBE_SIZE * 2, CUBE_SIZE),
                material
              );
              mesh.position.set(playerPos.current.x, playerPos.current.y, 0);
              scene.add(mesh);
              meshRef.current = mesh;

              function animate() {
  // 1. Pārbaudi — vai nav jāmaina scene!

  if (playerPos.current.x <= WORLD_LEFT + EXIT_MARGIN  && currentScene.exits.left !== null) {
    goToScene(currentScene.exits.left, "left", playerPos.current.y);
    console.log("[DEBUG] Kreisa mala sasniegta! Mainām scenu.");
    return; // animācija šim ciklam stop — viss renderosies nākamajā
  }
  if (playerPos.current.x >= WORLD_RIGHT - EXIT_MARGIN && currentScene.exits.right !== null) {
    goToScene(currentScene.exits.right, "right", playerPos.current.y);
    return;
  }
  // (Atkārto ar TOP/BOTTOM, ja vajag)

  // Kustības loģika
  if (targetDestination.current) {
    const dx = targetDestination.current.x - playerPos.current.x;
    const dy = targetDestination.current.y - playerPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.01) {
      const STEP = 0.01;
      const step = Math.min(STEP, dist);
      const nx = playerPos.current.x + (dx / dist) * step;
      const ny = playerPos.current.y + (dy / dist) * step;

      // Tagad PĒC robežas pārbaudes, tikai collision
      if (!willCollide(nx, ny, currentScene.obstacles)) {
        mesh.position.set(nx, ny, 0);
        playerPos.current = { x: nx, y: ny };

        // Virziens
        let dir;
        if (Math.abs(dx) > Math.abs(dy)) {
          dir = dx > 0 ? "right" : "left";
        } else {
          dir = dy > 0 ? "up" : "down";
        }
        spriteState.current.direction = dir;

        // Sprite frame
        spriteState.current.frameTick++;
        if (spriteState.current.frameTick % 6 === 0) {
          let idx = Math.floor(spriteState.current.frameTick / 6) % WALK_FRAMES.length;
          spriteState.current.frame = WALK_FRAMES[idx];
        }
        setSpriteFrame(spriteState.current.direction, spriteState.current.frame);
      } else {
        targetDestination.current = null;
      }
    } else {
      targetDestination.current = null;
      spriteState.current.frame = 0;
      setSpriteFrame(spriteState.current.direction, 0);
    }
  } else {
    spriteState.current.frame = 0;
    setSpriteFrame(spriteState.current.direction, 0);
  }

  // Coin pickup utml (kā iepriekš)
  // ...

  renderer.render(scene, camera);
  gl.endFrameEXP();
  requestAnimationFrame(animate);
}
              animate();
            }}
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

const styles = StyleSheet.create({});
