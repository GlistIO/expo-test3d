import React, { useRef, useState } from "react";
import { Image, View, Button, StyleSheet, Platform } from "react-native";
import { GLView } from "expo-gl";
import { TextureLoader,  Renderer, loadTextureAsync } from "expo-three";
import * as THREE from "three";
import * as FileSystem from "expo-file-system";

const fileUri = FileSystem.cacheDirectory + "player2.png";
FileSystem.downloadAsync("http://10.254.131.19:8000/player2.png", fileUri);

FileSystem.getInfoAsync(fileUri).then(info => {
  if (info.exists) {
    console.log("Fails eksistē!", fileUri);
  } else {
    console.log("Fails NAV atrasts!", fileUri);
  }
});

// ==== KONSTANTES ====
const WORLD_LEFT = -2;
const WORLD_RIGHT = 2;
const WORLD_TOP = 2;
const WORLD_BOTTOM = -2;

const CUBE_SIZE = 0.35;
const OBSTACLE_SIZE = 0.5;
const STEP = 0.2;

const MIN_X = WORLD_LEFT + CUBE_SIZE / 2;
const MAX_X = WORLD_RIGHT - CUBE_SIZE / 2;
const MIN_Y = WORLD_BOTTOM + CUBE_SIZE / 2;
const MAX_Y = WORLD_TOP - CUBE_SIZE / 2;

const OBSTACLE = { x: 0.5, y: 0, size: OBSTACLE_SIZE };

const SPRITE_COLS = 4;
const SPRITE_ROWS = 4;

// Virzienu nosaukumi — izmanto "directionIndex"
const DIRECTIONS = {
  up: 3,     // atpakaļ
  left: 1,
  right: 2,
  down: 0,   // uz priekšu
};
const COLORS = {
  up: 0x0074d9,
  down: 0xffdc00,
  left: 0x2ecc40,
  right: 0xff4136
};

function willCollide(newX, newY) {
  const half = CUBE_SIZE / 2;
  const oHalf = OBSTACLE.size / 2;
  return (
    Math.abs(newX - OBSTACLE.x) < half + oHalf &&
    Math.abs(newY - OBSTACLE.y) < half + oHalf
  );
}

function getSafeDestination(x, y, dx, dy) {
  const TOTAL = STEP;
  const SUBSTEP = 0.01;
  let travelled = 0;
  let lastSafe = { x, y };

  while (travelled < TOTAL) {
    let nx = x + dx * travelled;
    let ny = y + dy * travelled;
    if (nx < MIN_X || nx > MAX_X || ny < MIN_Y || ny > MAX_Y) break;
    if (willCollide(nx, ny)) break;
    lastSafe = { x: nx, y: ny };
    travelled += SUBSTEP;
  }
  return lastSafe;
}

export default function App() {
  const meshRef = useRef(null);
  const obstacleRef = useRef(null);
  const currentPos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const moveAnim = useRef(null);
  const [_, setRerender] = useState(0);
  // Sprite stāvoklis
  const spriteState = useRef({
    direction: "down",
    frame: 0,
    frameTick: 0
  });
  const textureRef = useRef(null);

  function move(direction) {
    if (moveAnim.current) return;

    let { x, y } = targetPos.current;
    let dx = 0, dy = 0;
    switch (direction) {
      case "up":    dy = 1; break;
      case "down":  dy = -1; break;
      case "left":  dx = -1; break;
      case "right": dx = 1; break;
    }
    const dest = getSafeDestination(x, y, dx, dy);
    if (dest.x === x && dest.y === y) return;

    // Sprite: sāk no 0 frame, uzstāda virzienu
    spriteState.current.direction = direction;
    spriteState.current.frame = 0;
    spriteState.current.frameTick = 0;

    targetPos.current = dest;
    setRerender(v => v + 1);

    moveAnim.current = {
      from: { x, y },
      to: { x: dest.x, y: dest.y },
      progress: 0
    };
  }

  // Sprite helpers
  function setSpriteFrame(dir, frame) {
    const tex = textureRef.current;
    if (!tex) return;
    const col = frame % SPRITE_COLS;
    const row = DIRECTIONS[dir]; // 0=up, 1=left, 2=right, 3=down
    tex.repeat.set(1 / SPRITE_COLS, 1 / SPRITE_ROWS);
    tex.offset.x = col * (1 / SPRITE_COLS);
    tex.offset.y = 1 - (row + 1) * (1 / SPRITE_ROWS);
  }
  console.log('Rendering...');
  return (
    <View style={{ flex: 1 }}>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={async (gl) => {
          console.log('GLView onContextCreate triggered!');

	  const renderer = new Renderer({ gl });
          renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

          const scene = new THREE.Scene();
          const camera = new THREE.OrthographicCamera(
            WORLD_LEFT, WORLD_RIGHT, WORLD_TOP, WORLD_BOTTOM, 0.1, 10
          );
          camera.position.z = 2;

          // === PLAYER SPRITE ===
          // !! Ceļu uz savu PNG failu ieliec šeit:
          const texture = await new TextureLoader().loadAsync({ uri: fileUri });
	  texture.magFilter = THREE.NearestFilter;
	  texture.repeat.set(1 / SPRITE_COLS, 1 / SPRITE_ROWS);
	  texture.offset.set(0, 1 - 1 / SPRITE_ROWS);
	  textureRef.current = texture;
	  console.log("Texture loaded!", texture.image ? "OK" : "NO IMAGE", texture);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
          });
          const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(CUBE_SIZE * 2, CUBE_SIZE),
            material
          );
          mesh.position.set(currentPos.current.x, currentPos.current.y, 0);
          scene.add(mesh);
          meshRef.current = mesh;

          // Šķērslis
          const obsGeometry = new THREE.PlaneGeometry(OBSTACLE.size, OBSTACLE.size);
          const obsMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
          const obstacle = new THREE.Mesh(obsGeometry, obsMaterial);
          obstacle.position.set(OBSTACLE.x, OBSTACLE.y, 0);
          scene.add(obstacle);
          obstacleRef.current = obstacle;

          function animate() {
            // === Sprite animācija ===
            if (moveAnim.current) {
              const anim = moveAnim.current;
              anim.progress += 0.08;
              // Kustības laikā: mainām sprite kadru ik pa brīdim
              spriteState.current.frameTick++;
              if (spriteState.current.frameTick % 6 === 0) { // frame speed
                spriteState.current.frame = (spriteState.current.frame + 1) % SPRITE_COLS;
              }
              setSpriteFrame(spriteState.current.direction, spriteState.current.frame);

              if (anim.progress >= 1) {
                currentPos.current = { ...anim.to };
                mesh.position.x = anim.to.x;
                mesh.position.y = anim.to.y;
                moveAnim.current = null;
                // Pēc kustības - nostājas pirmajā frame
                spriteState.current.frame = 0;
                setSpriteFrame(spriteState.current.direction, 0);
              } else {
                let nx = anim.from.x + (anim.to.x - anim.from.x) * anim.progress;
                let ny = anim.from.y + (anim.to.y - anim.from.y) * anim.progress;
                if (willCollide(nx, ny)) {
                  currentPos.current = { ...anim.from };
                  mesh.position.x = anim.from.x;
                  mesh.position.y = anim.from.y;
                  moveAnim.current = null;
                  spriteState.current.frame = 0;
                  setSpriteFrame(spriteState.current.direction, 0);
                } else {
                  mesh.position.x = nx;
                  mesh.position.y = ny;
                  currentPos.current = { x: nx, y: ny };
                }
              }
            } else {
              // Nekustas? Parāda stāvošu kadru
              setSpriteFrame(spriteState.current.direction, 0);
            }
            renderer.render(scene, camera);
            gl.endFrameEXP();
            requestAnimationFrame(animate);
          }
          animate();
        }}
      />
      <View style={styles.controls}>
        <Button title="←" onPress={() => move("left")} />
        <Button title="↑" onPress={() => move("up")} />
        <Button title="↓" onPress={() => move("down")} />
        <Button title="→" onPress={() => move("right")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 12,
    gap: 4
  }
});
