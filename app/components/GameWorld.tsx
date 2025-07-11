import React, { useRef } from "react";
import { GLView } from "expo-gl";
import { TextureLoader, Renderer } from "expo-three";
import * as THREE from "three";
import {
  WORLD_LEFT, WORLD_RIGHT, WORLD_TOP, WORLD_BOTTOM,
  SPRITE_COLS, SPRITE_ROWS, WALK_FRAMES, DIRECTIONS, CUBE_SIZE, EXIT_MARGIN
} from "../constants";
import { willCollide } from "../utils";

export default function GameWorld({
  currentScene,
  imageUris,
  playerPos,
  pickups,
  onPickup,
  goToScene,
  targetDestination,
}) {
  const meshRef = useRef(null);
  const spriteState = useRef({ direction: "down", frame: 0, frameTick: 0 });
  const textureRef = useRef(null);
  const pickupRefs = useRef([]);
  const pickupBuffer = useRef([]); // nepieļauj dubult-pickup per frame

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

        // Obstacles from scene
        currentScene.obstacles.forEach(obj => {
          const geo = new THREE.PlaneGeometry(obj.size, obj.size);
          const mat = new THREE.MeshBasicMaterial({ color: 0x888888 });
          const obs = new THREE.Mesh(geo, mat);
          obs.position.set(obj.x, obj.y, 0);
          scene.add(obs);
        });
	
	// Ielādē unikālus tekstūras tikai 1x katram tipam
        const loadedTextures = {};
        for (const item of pickups) {
          if (!loadedTextures[item.type]) {
            loadedTextures[item.type] = await new TextureLoader().loadAsync({
              uri: imageUris[item.type],
            });
            loadedTextures[item.type].magFilter = THREE.NearestFilter;
          }
        }

        pickups.forEach((item, i) => {
          if (item.taken) return;
          const mat = new THREE.MeshBasicMaterial({
            map: loadedTextures[item.type],
            transparent: true,
          });
          const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(CUBE_SIZE * 2, CUBE_SIZE * 1),
            mat
          );
          mesh.position.set(item.x, item.y, 0);
          mesh.visible = true;
          scene.add(mesh);
          pickupRefs.current[i] = mesh;
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
          // SCENE CHANGE
          if (playerPos.current.x <= WORLD_LEFT + EXIT_MARGIN && currentScene.exits.left !== null) {
            goToScene(currentScene.exits.left.scene, "left", playerPos.current.y);
            return;
          }
          if (playerPos.current.x >= WORLD_RIGHT - EXIT_MARGIN && currentScene.exits.right !== null) {
            goToScene(currentScene.exits.right.scene, "right", playerPos.current.y);
            return;
          }

          // MOVEMENT
          if (targetDestination.current) {
            const dx = targetDestination.current.x - playerPos.current.x;
            const dy = targetDestination.current.y - playerPos.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0.01) {
              const STEP = 0.01;
              const step = Math.min(STEP, dist);
              const nx = playerPos.current.x + (dx / dist) * step;
              const ny = playerPos.current.y + (dy / dist) * step;

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

          pickups.forEach((p, i) => {
            if (p.taken) return;
            const dx = playerPos.current.x - p.x;
            const dy = playerPos.current.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CUBE_SIZE * 0.7 && !pickupBuffer.current.includes(i)) {
              pickupBuffer.current.push(i);
              setTimeout(() => onPickup(i, p.type), 0);
            }
          });

          renderer.render(scene, camera);
          gl.endFrameEXP();
          requestAnimationFrame(animate);
        }
        animate();
      }}
    />
  );
}
