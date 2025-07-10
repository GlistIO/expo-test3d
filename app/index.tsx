import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { GLView } from "expo-gl";
import { TextureLoader, Renderer } from "expo-three";
import * as THREE from "three";
import { downloadAllImages } from "./imageAssets";
import {
  WORLD_LEFT, WORLD_RIGHT, WORLD_TOP, WORLD_BOTTOM,
  SPRITE_COLS, SPRITE_ROWS,
  WALK_FRAMES, WALK_FRAME_COUNT,
  DIRECTIONS, OBSTACLE, CUBE_SIZE,
} from "./constants";
import { willCollide } from "./utils";
import CoinCounter from "./components/CoinCounter";
import GameDialog from "./components/GameDialog";

export default function App() {
  const meshRef = useRef(null);
  const currentPos = useRef({ x: 0, y: 0 });
  const spriteState = useRef({
    direction: "down",
    frame: 0,
    frameTick: 0,
  });
  const textureRef = useRef(null);
  const [coinCount, setCoinCount] = useState(0);
  const coin = useRef({ x: -1, y: 1, taken: false });
  const coinRef = useRef(null);
  const [imageUris, setImageUris] = useState(null);
  const [dialog, setDialog] = useState({ visible: false, text: "" });
  const glViewRef = useRef(null);

  // Jaunais: tap-to-go
  const targetDestination = useRef(null);

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

  // Sprite helpers
  function setSpriteFrame(dir, frame) {
    const tex = textureRef.current;
    if (!tex) return;
    const col = frame % SPRITE_COLS;
    const row = DIRECTIONS[dir];
    tex.repeat.set(1 / SPRITE_COLS, 1 / SPRITE_ROWS);
    tex.offset.x = col * (1 / SPRITE_COLS);
    tex.offset.y = 1 - (row + 1) * (1 / SPRITE_ROWS);
  }

  // TAP — saglabā galamērķi, uz kurieni jākustas!
  function handleTap(locationX, locationY) {
    const { width, height } = Dimensions.get("window");
    const worldX = WORLD_LEFT + (locationX / width) * (WORLD_RIGHT - WORLD_LEFT);
    const worldY = WORLD_TOP - (locationY / height) * (WORLD_TOP - WORLD_BOTTOM);
    targetDestination.current = { x: worldX, y: worldY };
  }

  return (
    <View style={{ flex: 1 }}>
      <CoinCounter count={coinCount} />
      <View style={{ flex: 1 }}>
        {/* Overlay: Pressable pa visu laukumu */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={e => {
            const { locationX, locationY } = e.nativeEvent;
            handleTap(locationX, locationY);
          }}
        >
          <GLView
            ref={glViewRef}
            style={{ flex: 1 }}
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

              // COIN
              const coinTexture = await new TextureLoader().loadAsync({ uri: imageUris.coin });
              coinTexture.magFilter = THREE.NearestFilter;
              const coinMaterial = new THREE.MeshBasicMaterial({
                map: coinTexture,
                transparent: true,
              });
              const coinMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(CUBE_SIZE * 2, CUBE_SIZE * 1),
                coinMaterial
              );
              coinMesh.position.set(coin.current.x, coin.current.y, 0);
              coinMesh.visible = true;
              scene.add(coinMesh);
              coinRef.current = coinMesh;

              // PLAYER MESH
              const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
              });
              const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(CUBE_SIZE * 2, CUBE_SIZE),
                material
              );
              mesh.position.set(currentPos.current.x, currentPos.current.y, 0);
              scene.add(mesh);
              meshRef.current = mesh;

              // OBSTACLE
              const obsGeometry = new THREE.PlaneGeometry(OBSTACLE.size, OBSTACLE.size);
              const obsMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
              const obstacle = new THREE.Mesh(obsGeometry, obsMaterial);
              obstacle.position.set(OBSTACLE.x, OBSTACLE.y, 0);
              scene.add(obstacle);

              // === ANIMATE ===
              function animate() {
                // TAP-TO-GO movement!
                if (targetDestination.current) {
                  const dx = targetDestination.current.x - currentPos.current.x;
                  const dy = targetDestination.current.y - currentPos.current.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);

                  if (dist > 0.01) {
                    const STEP = 0.01; // kustības ātrums
                    const step = Math.min(STEP, dist);
                    const nx = currentPos.current.x + (dx / dist) * step;
                    const ny = currentPos.current.y + (dy / dist) * step;
                    if (!willCollide(nx, ny)) {
                      mesh.position.set(nx, ny, 0);
                      currentPos.current = { x: nx, y: ny };

                      // Sprite virziens
                      let dir;
                      if (Math.abs(dx) > Math.abs(dy)) {
                        dir = dx > 0 ? "right" : "left";
                      } else {
                        dir = dy > 0 ? "up" : "down";
                      }
                      spriteState.current.direction = dir;

                      // Sprite frame animācija
                      spriteState.current.frameTick++;
                      if (spriteState.current.frameTick % 6 === 0) {
                        let idx = Math.floor(spriteState.current.frameTick / 6) % WALK_FRAMES.length;
                        spriteState.current.frame = WALK_FRAMES[idx];
                      }
                      setSpriteFrame(spriteState.current.direction, spriteState.current.frame);
                    } else {
                      targetDestination.current = null; // Ja ir šķērslis, apstājas!
                    }
                  } else {
                    targetDestination.current = null; // Sasniegts galamērķis
                    spriteState.current.frame = 0;
                    setSpriteFrame(spriteState.current.direction, 0);
                  }
                } else {
                  // Idle frame, ja nestāv
                  spriteState.current.frame = 0;
                  setSpriteFrame(spriteState.current.direction, 0);
                }

                // COIN pickup
                if (!coin.current.taken) {
                  const dx = currentPos.current.x - coin.current.x;
                  const dy = currentPos.current.y - coin.current.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < CUBE_SIZE * 0.7) {
                    setCoinCount(c => c + 1);
                    coin.current.taken = true;
                    if (coinRef.current) coinRef.current.visible = false;
                    showDialog("Tu atradi 1 zelta monētu!", imageUris.coin, 2400);
                  }
                }

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

const styles = StyleSheet.create({
  // Ja vēlāk vajag overlay/citus style
});
