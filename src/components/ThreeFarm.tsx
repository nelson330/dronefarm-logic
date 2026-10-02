import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';
import { DroneState, FarmTile, DIRECTION_NAMES, DIRECTION_OFFSETS } from '../types/game';
import { soundManager } from '../utils/audio';

interface ThreeFarmProps {
  droneState: DroneState;
  tiles: FarmTile[];
  gridSize: { width: number; height: number };
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  statusMessage: string;
  carrotsCount: number;
  targetCarrots: number;
  isScanning?: boolean;
}

const TILE_SIZE = 2.0;
const TILE_HEIGHT = 0.5;

export const ThreeFarm: React.FC<ThreeFarmProps> = ({
  droneState,
  tiles,
  gridSize,
  status,
  statusMessage,
  carrotsCount,
  targetCarrots,
  isScanning = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const droneGroupRef = useRef<THREE.Group | null>(null);
  const propellersRef = useRef<THREE.Group[]>([]);
  const windmillsRef = useRef<THREE.Group[]>([]);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
  const scanConeRef = useRef<THREE.Mesh | null>(null);
  const itemsMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const particlesRef = useRef<{ mesh: THREE.Points; life: number }[]>([]);

  // CRITICAL: Keep live refs for animation loop
  const droneStateRef = useRef(droneState);
  droneStateRef.current = droneState;

  const statusRef = useRef(status);
  statusRef.current = status;

  const isScanningRef = useRef(isScanning);
  isScanningRef.current = isScanning;

  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;

  // Animated drone 3D position and rotation
  const animPosRef = useRef({ x: 0, y: 1.3, z: 0 });
  const animRotYRef = useRef(0);

  // Convert grid (x, z) to 3D world (wx, wz)
  const gridToWorld = (gx: number, gz: number, gw: number, gh: number) => {
    const wx = (gx - (gw - 1) / 2) * TILE_SIZE;
    const wz = (gz - (gh - 1) / 2) * TILE_SIZE;
    return { wx, wz };
  };

  // Convert direction (0: North, 1: East, 2: South, 3: West) to Euler Y
  const dirToAngle = (dir: number) => {
    switch (dir) {
      case 0: return Math.PI;       // Facing North (-Z)
      case 1: return Math.PI / 2;   // Facing East (+X)
      case 2: return 0;             // Facing South (+Z)
      case 3: return -Math.PI / 2;  // Facing West (-X)
      default: return 0;
    }
  };

  // Frustum calculation that adapts to mobile portrait & desktop landscape
  const updateCameraFrustum = (w: number, h: number) => {
    if (!cameraRef.current || !rendererRef.current) return;
    const gSize = Math.max(gridSizeRef.current.width, gridSizeRef.current.height);
    const baseFrustum = gSize * 2.8 + 4.5;
    const aspect = w / h;

    let fw = baseFrustum;
    let fh = baseFrustum;

    if (aspect < 1) {
      fw = baseFrustum;
      fh = baseFrustum / aspect;
    } else {
      fw = baseFrustum * aspect;
      fh = baseFrustum;
    }

    cameraRef.current.left = -fw / 2;
    cameraRef.current.right = fw / 2;
    cameraRef.current.top = fh / 2;
    cameraRef.current.bottom = -fh / 2;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(w, h);
  };

  // Initialize Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;

    // 1. Scene with previous clean sky color
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbbe4f9);
    sceneRef.current = scene;

    // 2. Camera (Isometric Orthographic)
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);
    camera.position.set(24, 24, 24);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    updateCameraFrustum(width, height);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 6;
    controls.maxDistance = 60;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x86a873, 0.45);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    sunLight.position.set(18, 28, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 70;
    const d = 20;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // 6. Ground Shadow for Drone
    const shadowGeo = new THREE.PlaneGeometry(1.1, 1.1);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.26;
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;

    // 7. Build Grid & Previous Drone
    buildGrid(scene, tiles, gridSize);
    const drone = createOriginalDroneMesh();
    scene.add(drone);
    droneGroupRef.current = drone;

    // Synchronize initial position
    const initW = gridToWorld(droneState.x, droneState.z, gridSize.width, gridSize.height);
    animPosRef.current = { x: initW.wx, y: 1.3, z: initW.wz };
    animRotYRef.current = dirToAngle(droneState.facing);
    drone.position.set(initW.wx, 1.3, initW.wz);
    drone.rotation.y = animRotYRef.current;
    shadowMesh.position.set(initW.wx, 0.26, initW.wz);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nw, height: nh } = entry.contentRect;
        if (nw > 0 && nh > 0) {
          updateCameraFrustum(nw, nh);
        }
      }
    });
    resizeObserver.observe(container);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      const curDrone = droneStateRef.current;
      const curGrid = gridSizeRef.current;
      const curStatus = statusRef.current;

      const targetPos = gridToWorld(curDrone.x, curDrone.z, curGrid.width, curGrid.height);

      // Smooth position interpolation
      animPosRef.current.x += (targetPos.wx - animPosRef.current.x) * 0.18;
      animPosRef.current.z += (targetPos.wz - animPosRef.current.z) * 0.18;

      const hoverHeight = curDrone.isFlying ? 1.3 + Math.sin(elapsedTime * 4) * 0.04 : 0.5;
      animPosRef.current.y += (hoverHeight - animPosRef.current.y) * 0.15;

      // Shortest angle rotation lerp
      const targetRotY = dirToAngle(curDrone.facing);
      let diff = targetRotY - animRotYRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      animRotYRef.current += diff * 0.2;

      if (droneGroupRef.current) {
        droneGroupRef.current.position.set(
          animPosRef.current.x,
          animPosRef.current.y,
          animPosRef.current.z
        );
        droneGroupRef.current.rotation.y = animRotYRef.current;

        // Dynamic tilt based on movement speed
        const tiltZ = -(targetPos.wx - animPosRef.current.x) * 0.35;
        const tiltX = (targetPos.wz - animPosRef.current.z) * 0.35;
        droneGroupRef.current.rotation.z = THREE.MathUtils.lerp(droneGroupRef.current.rotation.z, tiltZ, 0.15);
        droneGroupRef.current.rotation.x = THREE.MathUtils.lerp(droneGroupRef.current.rotation.x, tiltX, 0.15);
      }

      // Shadow position & scale
      if (shadowMeshRef.current) {
        shadowMeshRef.current.position.set(animPosRef.current.x, 0.26, animPosRef.current.z);
        const shadowScale = Math.max(0.65, 1.25 - animPosRef.current.y * 0.3);
        shadowMeshRef.current.scale.set(shadowScale, shadowScale, shadowScale);
      }

      // Propeller spin speed
      const propSpeed = curDrone.isFlying ? (curStatus === 'running' ? 38 : 18) : 2;
      propellersRef.current.forEach((prop, i) => {
        prop.rotation.y += propSpeed * delta * (i % 2 === 0 ? 1 : -1);
      });

      // Windmills rotation
      windmillsRef.current.forEach((wm) => {
        const rotor = wm.getObjectByName('windmill_rotor');
        if (rotor) rotor.rotation.z += 1.4 * delta;
      });

      // Scan cone pulse
      if (scanConeRef.current) {
        const targetOpacity = isScanningRef.current ? 0.5 + Math.sin(elapsedTime * 14) * 0.15 : 0;
        const mat = scanConeRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity += (targetOpacity - mat.opacity) * 0.2;
      }

      // Bobbing carrots & crystals
      itemsMapRef.current.forEach((itemGroup) => {
        const carrot = itemGroup.getObjectByName('carrot_model');
        if (carrot) {
          carrot.position.y = 0.3 + Math.sin(elapsedTime * 3.5 + itemGroup.position.x) * 0.04;
        }
        const crystal = itemGroup.getObjectByName('crystal_model');
        if (crystal) {
          crystal.rotation.y += 1.8 * delta;
          crystal.position.y = 0.55 + Math.sin(elapsedTime * 2.5 + itemGroup.position.z) * 0.06;
        }
      });

      // Harvest particle burst
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life -= delta;
        const positions = p.mesh.geometry.attributes.position.array as Float32Array;
        for (let j = 1; j < positions.length; j += 3) {
          positions[j] += delta * 1.8;
        }
        p.mesh.geometry.attributes.position.needsUpdate = true;
        (p.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, p.life);

        if (p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
          particlesRef.current.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
    };
  }, [gridSize.width, gridSize.height]);

  // Re-build tiles when tile state changes
  useEffect(() => {
    if (!sceneRef.current) return;
    buildGrid(sceneRef.current, tiles, gridSize);
  }, [tiles, gridSize]);

  // Particle burst on harvest
  const prevCarrotsRef = useRef(carrotsCount);
  useEffect(() => {
    if (carrotsCount > prevCarrotsRef.current && sceneRef.current) {
      spawnHarvestParticles(sceneRef.current, animPosRef.current.x, animPosRef.current.z);
    }
    prevCarrotsRef.current = carrotsCount;
  }, [carrotsCount]);

  const [isTopDown, setIsTopDown] = useState(false);

  // Camera Orbit Rotation (Left / Right by 30 degrees)
  const handleRotateCamera = (direction: 'left' | 'right') => {
    if (controlsRef.current) {
      const angle = direction === 'left' ? -Math.PI / 6 : Math.PI / 6;
      controlsRef.current.rotateLeft(angle);
      controlsRef.current.update();
      soundManager.playTurn();
    }
  };

  // Camera Zoom (Multiply frustum zoom)
  const handleZoom = (factor: number) => {
    if (cameraRef.current && controlsRef.current) {
      const curZoom = cameraRef.current.zoom || 1.0;
      const nextZoom = Math.min(2.6, Math.max(0.45, curZoom * factor));
      cameraRef.current.zoom = nextZoom;
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.update();
      soundManager.playTurn();
    }
  };

  // Toggle between 3D Isometric View and 2D Top-Down View
  const handleToggleView = () => {
    if (cameraRef.current && controlsRef.current) {
      if (!isTopDown) {
        cameraRef.current.position.set(0.001, 36, 0.001);
        setIsTopDown(true);
      } else {
        cameraRef.current.position.set(24, 24, 24);
        setIsTopDown(false);
      }
      cameraRef.current.zoom = 1.0;
      cameraRef.current.updateProjectionMatrix();
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      soundManager.playTurn();
    }
  };

  // Reset Camera View Helper
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(24, 24, 24);
      cameraRef.current.zoom = 1.0;
      cameraRef.current.updateProjectionMatrix();
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      setIsTopDown(false);
      soundManager.playTurn();
    }
  };

  // ==============================================================
  // RESTORED ORIGINAL FARM GRID & OBSTACLES (PREVIOUS DESIGN)
  // ==============================================================
  const buildGrid = (scene: THREE.Scene, tilesList: FarmTile[], size: { width: number; height: number }) => {
    itemsMapRef.current.forEach((group) => {
      scene.remove(group);
    });
    itemsMapRef.current.clear();
    windmillsRef.current = [];

    const existingGrid = scene.getObjectByName('farm_grid_group');
    if (existingGrid) scene.remove(existingGrid);

    const gridGroup = new THREE.Group();
    gridGroup.name = 'farm_grid_group';

    // Original base soil chunk underneath tiles
    const totalW = size.width * TILE_SIZE;
    const totalH = size.height * TILE_SIZE;
    const baseGeo = new THREE.BoxGeometry(totalW + 0.15, 1.3, totalH + 0.15);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x5d3b1e });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.65;
    baseMesh.receiveShadow = true;
    gridGroup.add(baseMesh);

    // Warm soil & lush grass materials (Original Colors)
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.85,
      metalness: 0.05,
    });
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x76b92a,
      roughness: 0.8,
      metalness: 0.05,
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.85,
      metalness: 0.05,
    });

    const tileGeo = new THREE.BoxGeometry(TILE_SIZE * 0.96, TILE_HEIGHT, TILE_SIZE * 0.96);

    tilesList.forEach((tile) => {
      const { wx, wz } = gridToWorld(tile.x, tile.z, size.width, size.height);

      let chosenMat = grassMat;
      if (tile.type === 'soil') chosenMat = soilMat;
      else if (tile.type === 'water') chosenMat = waterMat;
      else if (tile.type === 'path') chosenMat = pathMat;

      // 1. Tile Base Mesh
      const tileMesh = new THREE.Mesh(tileGeo, chosenMat);
      tileMesh.position.set(wx, 0, wz);
      tileMesh.receiveShadow = true;
      tileMesh.castShadow = true;
      gridGroup.add(tileMesh);

      // Item Container
      const itemGroup = new THREE.Group();
      itemGroup.position.set(wx, 0, wz);

      // White footprint ring for resources
      if (tile.hasCarrot || tile.hasCrystal) {
        const ringGeo = new THREE.RingGeometry(0.55, 0.65, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = TILE_HEIGHT / 2 + 0.01;
        itemGroup.add(ring);
      }

      // Glowing green square for target tile
      if (tile.isTarget) {
        const glowGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0x4ade80,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = TILE_HEIGHT / 2 + 0.015;
        itemGroup.add(glow);

        const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9));
        const borderMat = new THREE.LineBasicMaterial({ color: 0x22c55e });
        const borderLines = new THREE.LineSegments(borderGeo, borderMat);
        borderLines.rotation.x = -Math.PI / 2;
        borderLines.position.y = TILE_HEIGHT / 2 + 0.02;
        itemGroup.add(borderLines);
      }

      // Obstacles
      if (tile.obstacle === 'tree') {
        const tree = createOriginalTreeMesh();
        itemGroup.add(tree);
      } else if (tile.obstacle === 'rock') {
        const rock = createOriginalRockClusterMesh();
        itemGroup.add(rock);
      } else if (tile.obstacle === 'fence') {
        const fence = createOriginalFenceMesh();
        itemGroup.add(fence);
      } else if (tile.obstacle === 'windmill') {
        const windmill = createOriginalWindmillMesh();
        itemGroup.add(windmill);
        windmillsRef.current.push(windmill);
      }

      // Carrot
      if (tile.hasCarrot) {
        const carrot = createOriginalCarrotMesh();
        carrot.name = 'carrot_model';
        itemGroup.add(carrot);
      }

      // Crystal
      if (tile.hasCrystal) {
        const crystal = createOriginalCrystalMesh();
        crystal.name = 'crystal_model';
        itemGroup.add(crystal);
      }

      const key = `${tile.x}_${tile.z}`;
      itemsMapRef.current.set(key, itemGroup);
      scene.add(itemGroup);
    });

    scene.add(gridGroup);
  };

  // Helper: Original Low-poly Tree
  const createOriginalTreeMesh = () => {
    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.8, 7);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    const foliageGeo = new THREE.DodecahedronGeometry(0.55, 1);
    const foliageMat = new THREE.MeshLambertMaterial({ color: 0x43a047 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 1.05;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    treeGroup.add(foliage);

    const foliageTopGeo = new THREE.DodecahedronGeometry(0.4, 1);
    const foliageTopMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
    const foliageTop = new THREE.Mesh(foliageTopGeo, foliageTopMat);
    foliageTop.position.y = 1.45;
    foliageTop.castShadow = true;
    treeGroup.add(foliageTop);

    return treeGroup;
  };

  // Helper: Original Low-poly Rock Boulders
  const createOriginalRockClusterMesh = () => {
    const rockGroup = new THREE.Group();
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });
    const darkRockMat = new THREE.MeshLambertMaterial({ color: 0x757575 });

    const r1Geo = new THREE.DodecahedronGeometry(0.45, 0);
    const r1 = new THREE.Mesh(r1Geo, rockMat);
    r1.scale.set(1.0, 1.2, 0.9);
    r1.position.set(0.05, 0.4, 0);
    r1.castShadow = true;
    r1.receiveShadow = true;
    rockGroup.add(r1);

    const r2Geo = new THREE.DodecahedronGeometry(0.3, 0);
    const r2 = new THREE.Mesh(r2Geo, darkRockMat);
    r2.position.set(-0.35, 0.25, 0.2);
    r2.castShadow = true;
    rockGroup.add(r2);

    const r3Geo = new THREE.DodecahedronGeometry(0.25, 0);
    const r3 = new THREE.Mesh(r3Geo, rockMat);
    r3.position.set(0.3, 0.2, -0.25);
    r3.castShadow = true;
    rockGroup.add(r3);

    return rockGroup;
  };

  // Helper: Low-poly Wooden Fence
  const createOriginalFenceMesh = () => {
    const fenceGroup = new THREE.Group();
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });

    const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.12), woodMat);
    post1.position.set(-0.6, 0.32, 0);
    post1.castShadow = true;
    fenceGroup.add(post1);

    const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.12), woodMat);
    post2.position.set(0.6, 0.32, 0);
    post2.castShadow = true;
    fenceGroup.add(post2);

    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.06), woodMat);
    rail1.position.set(0, 0.45, 0);
    rail1.castShadow = true;
    fenceGroup.add(rail1);

    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.06), woodMat);
    rail2.position.set(0, 0.22, 0);
    rail2.castShadow = true;
    fenceGroup.add(rail2);

    return fenceGroup;
  };

  // Helper: Low-poly Windmill
  const createOriginalWindmillMesh = () => {
    const wmGroup = new THREE.Group();
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xb71c1c });

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 1.1, 8), stoneMat);
    tower.position.y = 0.55;
    tower.castShadow = true;
    wmGroup.add(tower);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.5, 8), roofMat);
    roof.position.y = 1.35;
    roof.castShadow = true;
    wmGroup.add(roof);

    const rotor = new THREE.Group();
    rotor.name = 'windmill_rotor';
    rotor.position.set(0, 1.1, 0.42);

    const sailMat = new THREE.MeshLambertMaterial({ color: 0xfff9c4 });
    const sailGeo = new THREE.BoxGeometry(0.12, 0.75, 0.02);
    for (let i = 0; i < 4; i++) {
      const sail = new THREE.Mesh(sailGeo, sailMat);
      sail.rotation.z = (i * Math.PI) / 2;
      sail.position.set(Math.cos((i * Math.PI) / 2) * 0.36, Math.sin((i * Math.PI) / 2) * 0.36, 0);
      rotor.add(sail);
    }
    wmGroup.add(rotor);

    return wmGroup;
  };

  // Helper: Original Carrot
  const createOriginalCarrotMesh = () => {
    const carrotGroup = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.2, 0.6, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xff6d00 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI;
    body.position.y = 0.35;
    body.castShadow = true;
    carrotGroup.add(body);

    const leafGeo = new THREE.ConeGeometry(0.12, 0.3, 6);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x388e3c });
    const leaf1 = new THREE.Mesh(leafGeo, leafMat);
    leaf1.position.set(0, 0.7, 0);
    leaf1.castShadow = true;
    carrotGroup.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeo, leafMat);
    leaf2.position.set(0.08, 0.68, 0.05);
    leaf2.rotation.z = -0.3;
    carrotGroup.add(leaf2);

    const leaf3 = new THREE.Mesh(leafGeo, leafMat);
    leaf3.position.set(-0.08, 0.68, -0.05);
    leaf3.rotation.z = 0.3;
    carrotGroup.add(leaf3);

    return carrotGroup;
  };

  // Helper: Original Crystal
  const createOriginalCrystalMesh = () => {
    const crystalGroup = new THREE.Group();
    const crystalGeo = new THREE.OctahedronGeometry(0.28, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.scale.set(0.7, 1.4, 0.7);
    crystal.castShadow = true;
    crystalGroup.add(crystal);
    return crystalGroup;
  };

  // ==============================================================
  // RESTORED ORIGINAL DRONE MESH (PREVIOUS DESIGN)
  // ==============================================================
  const createOriginalDroneMesh = () => {
    const droneGroup = new THREE.Group();
    propellersRef.current = [];

    // Central chassis
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.22, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    droneGroup.add(body);

    // Top canopy
    const domeGeo = new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.8,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.1;
    dome.castShadow = true;
    droneGroup.add(dome);

    // Front sensor eye (points forward in local +Z)
    const eyeGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0.04, 0.35);
    droneGroup.add(eye);

    // 4 Arms & Rotors
    const armAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    const armRadius = 0.65;

    armAngles.forEach((angle) => {
      const armGeo = new THREE.CylinderGeometry(0.035, 0.035, armRadius, 8);
      const armMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = angle;
      arm.position.set((Math.cos(angle) * armRadius) / 2, 0, (Math.sin(angle) * armRadius) / 2);
      arm.castShadow = true;
      droneGroup.add(arm);

      const motorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12);
      const motorMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
      const motor = new THREE.Mesh(motorGeo, motorMat);
      motor.position.set(Math.cos(angle) * armRadius, 0.05, Math.sin(angle) * armRadius);
      motor.castShadow = true;
      droneGroup.add(motor);

      // Spinning propeller assembly
      const propGroup = new THREE.Group();
      propGroup.position.set(Math.cos(angle) * armRadius, 0.12, Math.sin(angle) * armRadius);
      const bladeGeo = new THREE.BoxGeometry(0.42, 0.02, 0.07);
      const bladeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.castShadow = true;
      propGroup.add(blade);
      droneGroup.add(propGroup);
      propellersRef.current.push(propGroup);
    });

    // Downward scan cone
    const coneGeo = new THREE.ConeGeometry(0.8, 1.2, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const scanCone = new THREE.Mesh(coneGeo, coneMat);
    scanCone.position.set(0, -0.6, 0);
    droneGroup.add(scanCone);
    scanConeRef.current = scanCone;

    return droneGroup;
  };

  // Helper: Particle Burst on Harvest
  const spawnHarvestParticles = (scene: THREE.Scene, x: number, z: number) => {
    const count = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = x + (Math.random() - 0.5) * 0.8;
      positions[i + 1] = 0.4 + Math.random() * 0.6;
      positions[i + 2] = z + (Math.random() - 0.5) * 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.15,
      transparent: true,
      opacity: 1,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    particlesRef.current.push({ mesh: points, life: 0.8 });
  };

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden select-none bg-sky-200">
      {/* 3D WebGL Canvas with touch-none so touch gestures rotate/pinch smoothly without page scroll */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* Floating 3D Camera Controls Hub (Subtle, elegant, super adapted for touch & mobile) */}
      <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-30 flex items-center gap-1 bg-white/90 hover:bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-md border border-slate-200/90 text-slate-700 pointer-events-auto transition-all">
        {/* Rotate Left 30° */}
        <button
          onClick={() => handleRotateCamera('left')}
          className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center hover:bg-sky-50 active:bg-sky-100 text-slate-700 hover:text-sky-600 transition-all active:scale-90 cursor-pointer"
          title="Girar cámara a la izquierda 30°"
          aria-label="Girar izquierda"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Rotate Right 30° */}
        <button
          onClick={() => handleRotateCamera('right')}
          className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center hover:bg-sky-50 active:bg-sky-100 text-slate-700 hover:text-sky-600 transition-all active:scale-90 cursor-pointer"
          title="Girar cámara a la derecha 30°"
          aria-label="Girar derecha"
        >
          <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="w-px h-3.5 sm:h-4 bg-slate-200 my-auto mx-0.5" />

        {/* Zoom In */}
        <button
          onClick={() => handleZoom(1.2)}
          className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center hover:bg-sky-50 active:bg-sky-100 text-slate-700 hover:text-sky-600 transition-all active:scale-90 cursor-pointer"
          title="Acercar zoom (+)"
          aria-label="Acercar zoom"
        >
          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom(0.83)}
          className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center hover:bg-sky-50 active:bg-sky-100 text-slate-700 hover:text-sky-600 transition-all active:scale-90 cursor-pointer"
          title="Alejar zoom (-)"
          aria-label="Alejar zoom"
        >
          <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="w-px h-3.5 sm:h-4 bg-slate-200 my-auto mx-0.5" />

        {/* 3D Isometric / 2D Top-Down Toggle */}
        <button
          onClick={handleToggleView}
          className={`px-2 h-7.5 sm:h-8 rounded-xl flex items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-bold transition-all active:scale-90 cursor-pointer ${
            isTopDown
              ? 'bg-sky-600 text-white shadow-xs'
              : 'hover:bg-sky-50 text-slate-700 hover:text-sky-600'
          }`}
          title={isTopDown ? 'Cambiar a Vista Isométrica 3D' : 'Cambiar a Vista Cenital 2D (Plano)'}
          aria-label="Alternar vista 2D/3D"
        >
          <span>{isTopDown ? '2D Plano' : '3D Iso'}</span>
        </button>

        {/* Reset Camera to Center */}
        <button
          onClick={handleResetCamera}
          className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center hover:bg-emerald-50 active:bg-emerald-100 text-slate-700 hover:text-emerald-600 transition-all active:scale-90 cursor-pointer"
          title="Centrar y restablecer cámara"
          aria-label="Centrar cámara"
        >
          <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
        </button>
      </div>

      {/* Contextual Drone Telemetry Overlay */}
      {(() => {
        const currentTile = tiles.find((t) => t.x === droneState.x && t.z === droneState.z);
        const hasCarrotHere = !!currentTile?.hasCarrot;

        const offset = DIRECTION_OFFSETS[droneState.facing];
        const frontX = droneState.x + offset.dx;
        const frontZ = droneState.z + offset.dz;
        const frontTile = tiles.find((t) => t.x === frontX && t.z === frontZ);
        const isFrontBlocked =
          frontX < 0 ||
          frontX >= gridSize.width ||
          frontZ < 0 ||
          frontZ >= gridSize.height ||
          !!frontTile?.obstacle;

        return (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200 text-slate-800 text-xs font-semibold tracking-wide flex flex-col gap-1 max-w-[210px] sm:max-w-[230px]">
            {/* Header: Flight State */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  status === 'running'
                    ? 'bg-amber-500 animate-pulse'
                    : status === 'completed'
                    ? 'bg-emerald-500'
                    : status === 'error'
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                }`}
              />
              <span className="text-slate-900 font-bold text-xs truncate">
                {status === 'running'
                  ? '🚁 Dron en Vuelo'
                  : status === 'completed'
                  ? '🏆 ¡Misión Lograda!'
                  : status === 'error'
                  ? '⚠️ ¡Alerta de Vuelo!'
                  : '🚁 Dron Listo para despegar'}
              </span>
            </div>

            {/* GPS Position & Heading */}
            <div className="text-slate-600 text-[11px] flex items-center justify-between font-mono bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
              <span>📍 ({droneState.x}, {droneState.z})</span>
              <span className="text-slate-700 font-semibold">{DIRECTION_NAMES[droneState.facing]}</span>
            </div>

            {/* Active Sensor Reading */}
            <div className="text-[11px] leading-tight flex items-center gap-1 font-medium pt-0.5">
              {hasCarrotHere ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span>🥕</span>
                  <span>¡Zanahoria lista aquí!</span>
                </span>
              ) : isFrontBlocked ? (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Obstáculo adelante</span>
                </span>
              ) : (
                <span className="text-slate-600 flex items-center gap-1">
                  <span>✅</span>
                  <span>Baldosa libre</span>
                </span>
              )}
            </div>

            {/* Progress */}
            <div className="text-slate-500 text-[10px] sm:text-[11px] flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <span className="text-slate-600 font-bold">Cosecha:</span>
              <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                🥕 {carrotsCount}/{targetCarrots}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
