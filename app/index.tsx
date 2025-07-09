import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { GLView } from "expo-gl";
import { TextureLoader, Renderer } from "expo-three";
import * as THREE from "three";
import * as FileSystem from "expo-file-system";
import { downloadAllImages } from "./imageAssets";
import {
  WORLD_LEFT, WORLD_RIGHT, WORLD_TOP, WORLD_BOTTOM,
  SPRITE_COLS, SPRITE_ROWS,
  WALK_FRAMES, WALK_FRAME_COUNT,
  DIRECTIONS, OBSTACLE, CUBE_SIZE,
} from "./constants";
import { willCollide, getSafeDestination } from "./utils";
import MoveButton from "./components/MoveButton";
import CoinCounter from "./components/CoinCounter";
import { isCoinCollected } from "./game/coins";
import { initialCoins } from "./game/coinData";

export default function App() {
  const meshRef = useRef(null);
  const obstacleRef = useRef(null);
  const currentPos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const moveAnim = useRef(null);
  const [_, setRerender] = useState(0);
  const spriteState = useRef({
    direction: "down",
    frame: 0,
    frameTick: 0
  });
  const textureRef = useRef(null);
  const [queuedDirection, setQueuedDirection] = useState(null);
  const [coinCount, setCoinCount] = useState(0);
const [coin, setCoin] = useState({ x: -1, y: 1, taken: false }); // piemērs ar vienu monētu
const coinRef = useRef(null);
const [imageUris, setImageUris] = useState(null);

  useEffect(() => {
    (async () => {
      const uris = await downloadAllImages();
      setImageUris(uris);
    })();
  }, []);

  if (!imageUris) return null; // vai Loading...


  function move(direction) {
    if (moveAnim.current) {
      setQueuedDirection(direction);
      return;
    }
    setQueuedDirection(null);
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

  function setSpriteFrame(dir, frame) {
    const tex = textureRef.current;
    if (!tex) return;
    const col = frame % SPRITE_COLS;
    const row = DIRECTIONS[dir];
    tex.repeat.set(1 / SPRITE_COLS, 1 / SPRITE_ROWS);
    tex.offset.x = col * (1 / SPRITE_COLS);
    tex.offset.y = 1 - (row + 1) * (1 / SPRITE_ROWS);
  }

  return (
    <View style={{ flex: 1 }}>
    <CoinCounter count={coinCount} />
      <GLView
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
      
	  // PIEVIENO coin.png kā plane
	const coinTexture = await new TextureLoader().loadAsync({ uri: imageUri.coin });
	coinTexture.magFilter = THREE.NearestFilter;
	const coinMaterial = new THREE.MeshBasicMaterial({
	  map: coinTexture,
	  transparent: true
	});
	const coinMesh = new THREE.Mesh(
	  new THREE.PlaneGeometry(CUBE_SIZE * 1.1, CUBE_SIZE * 1.1),
	  coinMaterial
	);
	coinMesh.position.set(coin.x, coin.y, 0);
	scene.add(coinMesh);
	coinRef.current = coinMesh;
    
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

          // OBSTACLE
          const obsGeometry = new THREE.PlaneGeometry(OBSTACLE.size, OBSTACLE.size);
          const obsMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
          const obstacle = new THREE.Mesh(obsGeometry, obsMaterial);
          obstacle.position.set(OBSTACLE.x, OBSTACLE.y, 0);
          scene.add(obstacle);
          obstacleRef.current = obstacle;

          function animate() {
            if (moveAnim.current) {
              const anim = moveAnim.current;
              anim.progress += 0.04;
              spriteState.current.frameTick++;
              if (spriteState.current.frameTick % 6 === 0) {
                let idx = Math.floor(spriteState.current.frameTick / 6) % WALK_FRAME_COUNT;
                spriteState.current.frame = WALK_FRAMES[idx];
              }
              setSpriteFrame(spriteState.current.direction, spriteState.current.frame);

              if (moveAnim.current && anim.progress >= 1) {
                moveAnim.current = null;
                if (queuedDirection) {
                  move(queuedDirection);
                  setQueuedDirection(null);
                }
              }

              if (anim.progress >= 1) {
                currentPos.current = { ...anim.to };
                mesh.position.x = anim.to.x;
                mesh.position.y = anim.to.y;
                moveAnim.current = null;
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
              spriteState.current.frame = 0;
              setSpriteFrame(spriteState.current.direction, 0);
            }
// Saskares pārbaude pēc pozīcijas izmaiņas!
if (!coin.taken) {
  const dx = currentPos.current.x - coin.x;
  const dy = currentPos.current.y - coin.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < CUBE_SIZE * 0.7) { // vai cik cieši vēlies
    setCoinCount(c => c + 1);
    setCoin(c => ({ ...c, taken: true }));
    if (coinRef.current) coinRef.current.visible = false; // paslēpjam coin
  }
}
            renderer.render(scene, camera);
            gl.endFrameEXP();
            requestAnimationFrame(animate);
          }
          animate();
        }}
      />
      <View style={styles.controls}>
        <MoveButton direction="left" onMove={move}>←</MoveButton>
        <MoveButton direction="up" onMove={move}>↑</MoveButton>
        <MoveButton direction="down" onMove={move}>↓</MoveButton>
        <MoveButton direction="right" onMove={move}>→</MoveButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 12,
  },
});
