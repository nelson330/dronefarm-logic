/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Code2,
  HelpCircle,
  Trophy,
  Compass,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  X,
  Flame,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Columns,
} from 'lucide-react';
import { ThreeFarm } from './components/ThreeFarm';
import {
  BlocklyEditor,
  resetWorkspaceStarter,
  appendBlockToWorkspace,
  loadMissionSkeleton,
} from './components/BlocklyEditor';
import { WelcomeModal } from './components/WelcomeModal';
import { MISSIONS } from './data/missions';
import {
  DroneState,
  FarmTile,
  Direction,
  DIRECTION_OFFSETS,
  DIRECTION_NAMES,
  Mission,
} from './types/game';
import { soundManager } from './utils/audio';

// Map of block types to UI labels, distinct Scratch colors and puzzle-like shapes
const BLOCK_BUTTON_META: Record<string, { label: string; icon: string; style: string }> = {
  move_forward: {
    label: 'AVANZAR 1',
    icon: '➔',
    style: 'bg-[#4c97ff] hover:bg-[#3884f5] border-b-4 border-[#2b72db] text-white rounded-xl shadow-sm hover:shadow-md',
  },
  turn_direction: {
    label: 'GIRAR 90°',
    icon: '↷',
    style: 'bg-[#3880f5] hover:bg-[#256ee0] border-b-4 border-[#1b56b8] text-white rounded-xl shadow-sm hover:shadow-md',
  },
  harvest_crop: {
    label: 'COSECHAR',
    icon: '🥕',
    style: 'bg-[#00be98] hover:bg-[#00a887] border-b-4 border-[#008c70] text-white rounded-xl shadow-sm hover:shadow-md',
  },
  wait_seconds: {
    label: 'ESPERAR 1s',
    icon: '⏱️',
    style: 'bg-[#ffab19] hover:bg-[#e6980d] border-b-4 border-[#c98000] text-white rounded-xl shadow-sm hover:shadow-md',
  },
  repeat_times: {
    label: 'REPETIR',
    icon: '🔁',
    style: 'bg-[#ff8c1a] hover:bg-[#e87a07] border-b-4 border-[#c96300] text-white rounded-xl shadow-sm hover:shadow-md',
  },
  forever_loop: {
    label: 'POR SIEMPRE',
    icon: '🔄',
    style: 'bg-[#ffab19] hover:bg-[#e6980d] border-b-4 border-[#c98000] text-white rounded-xl shadow-sm hover:shadow-md',
  },
  if_obstacle_detected: {
    label: 'SI OBSTÁCULO',
    icon: '⚠️',
    style: 'bg-[#59c059] hover:bg-[#47a847] border-b-4 border-[#358a35] text-white rounded-xl shadow-sm hover:shadow-md',
  },
  obstacle_detected: {
    label: '¿OBSTÁCULO?',
    icon: '🔍',
    style: 'bg-[#43a047] hover:bg-[#388e3c] border-2 border-[#2e7d32] text-white rounded-full shadow-sm',
  },
  crop_detected: {
    label: '¿CULTIVO?',
    icon: '🌱',
    style: 'bg-[#00897b] hover:bg-[#00796b] border-2 border-[#00695c] text-white rounded-full shadow-sm',
  },
};

export default function App() {
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
  const currentMission: Mission = MISSIONS[currentMissionIndex] || MISSIONS[0];

  // Mobile / Tablet Tab View ('editor' | 'simulation')
  const [mobileTab, setMobileTab] = useState<'editor' | 'simulation'>('editor');

  // Desktop View Mode ('split' | 'editor' | 'simulation')
  const [desktopViewMode, setDesktopViewMode] = useState<'split' | 'editor' | 'simulation'>('split');

  // Simulation execution state
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('Listo para despegar.');
  const [execSpeed, setExecSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Consecutive levels streak counter
  const [consecutiveStreak, setConsecutiveStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('dronefarm_consecutive_streak');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [bestStreak, setBestStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('dronefarm_best_streak');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const levelCompletedRef = useRef(false);

  // Modals & Feedback (Requirements 2, 3, 4)
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [collisionBanner, setCollisionBanner] = useState<string | null>(null);
  const [failedGoalBanner, setFailedGoalBanner] = useState<string | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);

  // Modals
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  // Drone State & Farm Tiles State
  const [droneState, setDroneState] = useState<DroneState>({
    x: currentMission.initialDrone.x,
    z: currentMission.initialDrone.z,
    facing: currentMission.initialDrone.facing,
    isFlying: true,
    statusText: 'Idle',
  });

  const [farmTiles, setFarmTiles] = useState<FarmTile[]>(() =>
    JSON.parse(JSON.stringify(currentMission.tiles))
  );

  const [carrotsHarvested, setCarrotsHarvested] = useState(0);

  // Live Refs for real-time simulation synchronization
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const isStoppedRef = useRef(false);
  const droneStateRef = useRef(droneState);
  droneStateRef.current = droneState;

  const farmTilesRef = useRef(farmTiles);
  farmTilesRef.current = farmTiles;

  const carrotsHarvestedRef = useRef(carrotsHarvested);
  carrotsHarvestedRef.current = carrotsHarvested;

  const execSpeedRef = useRef(execSpeed);
  execSpeedRef.current = execSpeed;

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  // Start pleasant retro BGM on first user interaction if audio context was suspended
  useEffect(() => {
    const handleFirstGesture = () => {
      if (soundManager.enabled) {
        soundManager.startBgm();
      }
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  // Reset Farm and Drone
  const handleReset = useCallback(() => {
    isStoppedRef.current = true;
    levelCompletedRef.current = false;
    setShowVictoryModal(false);
    setCollisionBanner(null);
    setFailedGoalBanner(null);
    setIsScreenShaking(false);
    setStatus('idle');
    setStatusMessage('Dron reiniciado. Listo para despegar.');
    setIsScanning(false);

    const initialDrone = {
      x: currentMission.initialDrone.x,
      z: currentMission.initialDrone.z,
      facing: currentMission.initialDrone.facing,
      isFlying: true,
      statusText: 'Idle',
    };

    droneStateRef.current = initialDrone;
    setDroneState(initialDrone);

    const initialTiles = JSON.parse(JSON.stringify(currentMission.tiles));
    farmTilesRef.current = initialTiles;
    setFarmTiles(initialTiles);

    carrotsHarvestedRef.current = 0;
    setCarrotsHarvested(0);

    if (workspaceRef.current) {
      resetWorkspaceStarter(workspaceRef.current);
      workspaceRef.current.highlightBlock(null);
    }
  }, [currentMission]);

  // Load Mission
  const selectMission = useCallback((index: number) => {
    isStoppedRef.current = true;
    levelCompletedRef.current = false;
    setShowVictoryModal(false);
    setCollisionBanner(null);
    setFailedGoalBanner(null);
    setIsScreenShaking(false);
    setStatus('idle');
    setIsScanning(false);

    const safeIndex = Math.min(Math.max(0, index), MISSIONS.length - 1);
    setCurrentMissionIndex(safeIndex);
    const m = MISSIONS[safeIndex];

    const newDrone = {
      x: m.initialDrone.x,
      z: m.initialDrone.z,
      facing: m.initialDrone.facing,
      isFlying: true,
      statusText: 'Idle',
    };
    droneStateRef.current = newDrone;
    setDroneState(newDrone);

    const newTiles = JSON.parse(JSON.stringify(m.tiles));
    farmTilesRef.current = newTiles;
    setFarmTiles(newTiles);

    carrotsHarvestedRef.current = 0;
    setCarrotsHarvested(0);
    setStatusMessage(`Cargada ${m.title}`);

    // On mobile, switch back to editor so student can code the new level
    if (window.innerWidth < 1024) {
      setMobileTab('editor');
    }

    if (workspaceRef.current) {
      resetWorkspaceStarter(workspaceRef.current);
      workspaceRef.current.highlightBlock(null);
    }
  }, []);

  // Handle Level Victory: increments consecutive streak and keeps modal open waiting for user click
  const handleLevelVictory = useCallback((harvested: number) => {
    if (levelCompletedRef.current) return;
    levelCompletedRef.current = true;

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
    soundManager.playVictory();
    setStatus('completed');
    setStatusMessage('¡Misión Cumplida! Has cosechado todos los objetivos.');

    setConsecutiveStreak((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem('dronefarm_consecutive_streak', next.toString());
      } catch {}
      setBestStreak((best) => {
        const nextBest = Math.max(best, next);
        try {
          localStorage.setItem('dronefarm_best_streak', nextBest.toString());
        } catch {}
        return nextBest;
      });
      return next;
    });

    setShowVictoryModal(true);
  }, []);

  // Reset consecutive streak on crashes, out of bounds or unmet goals
  const handleStreakReset = useCallback(() => {
    setConsecutiveStreak(0);
    try {
      localStorage.setItem('dronefarm_consecutive_streak', '0');
    } catch {}
  }, []);

  // Sleep helper honoring execution speed and cancellation
  const sleep = (ms: number) => {
    const adjusted = Math.max(20, ms / execSpeedRef.current);
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (isStoppedRef.current) {
          reject(new Error('EXECUTION_STOPPED'));
        } else {
          resolve();
        }
      }, adjusted);

      if (isStoppedRef.current) {
        clearTimeout(timeout);
        reject(new Error('EXECUTION_STOPPED'));
      }
    });
  };

  // Run the Blockly script
  const handleRun = async () => {
    if (!workspaceRef.current) return;

    if (status === 'completed' || status === 'error') {
      handleReset();
      await new Promise((r) => setTimeout(r, 80));
    }

    isStoppedRef.current = false;
    levelCompletedRef.current = false;
    setShowVictoryModal(false);
    setStatus('running');
    setStatusMessage('Status: Running...');

    // Switch to 3D simulation tab so user sees the flight
    if (window.innerWidth < 1024) {
      setMobileTab('simulation');
    } else if (desktopViewMode === 'editor') {
      setDesktopViewMode('simulation');
    }

    soundManager.playMove();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (javascriptGenerator as any).workspaceToCode(workspaceRef.current);
    setGeneratedCode(code);

    let loopGuardCounter = 0;

    // Execution API
    const api = {
      isStopped: () => isStoppedRef.current,

      highlight: async (blockId: string) => {
        if (workspaceRef.current && !isStoppedRef.current) {
          workspaceRef.current.highlightBlock(blockId);
        }
        await sleep(100);
      },

      checkLoopGuard: async () => {
        loopGuardCounter++;
        if (loopGuardCounter > 1200) {
          throw new Error('LÍMITE_BUCLE: Se superaron 1200 iteraciones.');
        }
        if (isStoppedRef.current) {
          throw new Error('EXECUTION_STOPPED');
        }
        await sleep(15);
      },

      moveForward: async (units: number, blockId?: string) => {
        if (isStoppedRef.current) throw new Error('EXECUTION_STOPPED');

        const stepUnits = Math.max(1, Math.floor(units));
        for (let s = 0; s < stepUnits; s++) {
          if (isStoppedRef.current) throw new Error('EXECUTION_STOPPED');

          const cur = droneStateRef.current;
          const offset = DIRECTION_OFFSETS[cur.facing];
          const nextX = cur.x + offset.dx;
          const nextZ = cur.z + offset.dz;

          // Check Bounds
          const inBounds =
            nextX >= 0 &&
            nextX < currentMission.gridSize.width &&
            nextZ >= 0 &&
            nextZ < currentMission.gridSize.height;

          if (!inBounds) {
            handleStreakReset();
            soundManager.playCrash();
            setStatus('error');
            const alertMsg = `💥 ¡Límite alcanzado! Saliste del campo en (${nextX}, ${nextZ}).`;
            setStatusMessage(alertMsg);
            setCollisionBanner(alertMsg);
            setIsScreenShaking(true);
            setTimeout(() => setIsScreenShaking(false), 700);
            setTimeout(() => {
              handleReset();
            }, 1900);
            throw new Error('COLLISION_BOUNDARY');
          }

          // Check Obstacles
          const targetTile = farmTilesRef.current.find((t) => t.x === nextX && t.z === nextZ);
          if (targetTile?.obstacle) {
            handleStreakReset();
            soundManager.playCrash();
            setStatus('error');
            const obsName =
              targetTile.obstacle === 'tree'
                ? 'un Árbol Frutal'
                : targetTile.obstacle === 'fence'
                ? 'una Valla de Madera'
                : targetTile.obstacle === 'windmill'
                ? 'el Molino de Viento'
                : 'una Roca';
            const alertMsg = `💥 ¡Colisión con ${obsName} en (${nextX}, ${nextZ})!`;
            setStatusMessage(alertMsg);
            setCollisionBanner(alertMsg);
            setIsScreenShaking(true);
            setTimeout(() => setIsScreenShaking(false), 700);
            setTimeout(() => {
              handleReset();
            }, 1900);
            throw new Error('COLLISION_OBSTACLE');
          }

          // Update drone state ref and React state
          const updatedDrone = {
            ...cur,
            x: nextX,
            z: nextZ,
            statusText: `Moviendo a (${nextX}, ${nextZ})`,
          };
          droneStateRef.current = updatedDrone;
          setDroneState(updatedDrone);
          soundManager.playMove();

          await sleep(440);
        }
      },

      turn: async (direction: 'RIGHT' | 'LEFT', blockId?: string) => {
        if (isStoppedRef.current) throw new Error('EXECUTION_STOPPED');

        const cur = droneStateRef.current;
        const delta = direction === 'RIGHT' ? 1 : 3;
        const nextFacing = ((cur.facing + delta) % 4) as Direction;

        const updatedDrone = {
          ...cur,
          facing: nextFacing,
          statusText: `Giro a ${DIRECTION_NAMES[nextFacing]}`,
        };
        droneStateRef.current = updatedDrone;
        setDroneState(updatedDrone);
        soundManager.playTurn();

        await sleep(360);
      },

      wait: async (seconds: number) => {
        if (isStoppedRef.current) throw new Error('EXECUTION_STOPPED');
        setStatusMessage(`Esperando ${seconds}s...`);
        await sleep(seconds * 1000);
      },

      harvest: async (blockId?: string) => {
        if (isStoppedRef.current) throw new Error('EXECUTION_STOPPED');

        setIsScanning(true);
        const { x, z } = droneStateRef.current;
        const tileIndex = farmTilesRef.current.findIndex((t) => t.x === x && t.z === z);

        if (tileIndex !== -1 && farmTilesRef.current[tileIndex].hasCarrot) {
          soundManager.playHarvest();
          const updated = [...farmTilesRef.current];
          updated[tileIndex] = { ...updated[tileIndex], hasCarrot: false };
          farmTilesRef.current = updated;
          setFarmTiles(updated);

          const newCount = carrotsHarvestedRef.current + 1;
          carrotsHarvestedRef.current = newCount;
          setCarrotsHarvested(newCount);
          setStatusMessage(`¡Zanahoria cosechada en (${x}, ${z})! (${newCount}/${currentMission.targetCarrots})`);

          // Victory condition reached! Handled by handleLevelVictory without auto-advancing
          if (newCount >= currentMission.targetCarrots) {
            handleLevelVictory(newCount);
          }
        } else {
          soundManager.playAnalyze();
          setStatusMessage(`Suelo analizado en (${x}, ${z}). Sin cosechas.`);
        }

        await sleep(350);
        setIsScanning(false);
      },

      isObstacleDetected: () => {
        const cur = droneStateRef.current;
        const offset = DIRECTION_OFFSETS[cur.facing];
        const nextX = cur.x + offset.dx;
        const nextZ = cur.z + offset.dz;

        if (
          nextX < 0 ||
          nextX >= currentMission.gridSize.width ||
          nextZ < 0 ||
          nextZ >= currentMission.gridSize.height
        ) {
          return true;
        }

        const tile = farmTilesRef.current.find((t) => t.x === nextX && t.z === nextZ);
        return !!tile?.obstacle;
      },

      isCropDetected: () => {
        const { x, z } = droneStateRef.current;
        const tile = farmTilesRef.current.find((t) => t.x === x && t.z === z);
        return !!tile?.hasCarrot;
      },
    };

    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction('api', code);
      await fn(api);

      if (!isStoppedRef.current) {
        if (carrotsHarvestedRef.current >= currentMission.targetCarrots) {
          handleLevelVictory(carrotsHarvestedRef.current);
        } else {
          handleStreakReset();
          setStatus('error');
          const msg = `⚠️ ¡Objetivo no cumplido! Cosechaste ${carrotsHarvestedRef.current} de ${currentMission.targetCarrots} zanahorias.`;
          setStatusMessage(msg);
          setFailedGoalBanner(msg);
          setTimeout(() => {
            handleReset();
          }, 2000);
        }
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || '';
      if (msg === 'EXECUTION_STOPPED') {
        setStatus('idle');
        setStatusMessage('Ejecución detenida.');
      } else if (msg.startsWith('COLLISION')) {
        // Status handled
      } else if (msg.startsWith('LÍMITE_BUCLE')) {
        handleStreakReset();
        setStatus('error');
        setStatusMessage('Bucle infinito detenido por seguridad.');
      } else {
        console.error('Runtime error:', err);
        setStatus('error');
        setStatusMessage(`Error: ${msg}`);
      }
    } finally {
      if (workspaceRef.current) {
        workspaceRef.current.highlightBlock(null);
      }
      setIsScanning(false);
    }
  };

  const handleOpenCodeModal = () => {
    if (workspaceRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (javascriptGenerator as any).workspaceToCode(workspaceRef.current);
      setGeneratedCode(code || '// No hay bloques conectados aún');
    }
    setShowCodeModal(true);
  };

  // Quick-Add Block from the top dock
  const handleQuickAdd = (type: string) => {
    if (workspaceRef.current) {
      appendBlockToWorkspace(workspaceRef.current, type);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#7dd3fc] text-slate-800">
      
      {/* 1. Main Navigation Bar (Clean, Responsive & Well-Organized) */}
      <header className="flex-none bg-white/95 backdrop-blur-md border-b border-sky-200 px-3 sm:px-4 py-2 sm:py-2.5 shadow-xs z-30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
          
          {/* Brand & Utility Row (Mobile Top Row / Desktop Left) */}
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => setShowWelcomeModal(true)}
              className="flex items-center gap-2 cursor-pointer group"
              title="Click para ver bienvenida institucional"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-base">🚁</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xs sm:text-sm font-black font-heading tracking-tight text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                  Crea tu primer Algoritmo
                </h1>
                <div className="text-[10px] sm:text-[11px] font-bold text-sky-800 flex items-center gap-1">
                  <span>CT. Ricardo Morales Avilés, Diriamba</span>
                </div>
              </div>
            </div>

            {/* Mobile Streak Badge & Utility Controls */}
            <div className="flex md:hidden items-center gap-1.5">
              <div
                className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 font-black text-xs shadow-2xs"
                title={`Racha consecutiva: ${consecutiveStreak} niveles`}
              >
                <Flame className={`w-3.5 h-3.5 ${consecutiveStreak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-slate-400'}`} />
                <span className="text-orange-600 font-black">{consecutiveStreak}</span>
              </div>

              <button
                onClick={() => setShowWelcomeModal(true)}
                className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer border border-blue-200"
                title="Bienvenida e Información Institucional"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowHintModal(true)}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="Ver pista para resolver esta misión"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>Pista</span>
              </button>

              <button
                onClick={toggleSound}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Ayuda"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mission Selector & Actions (Mobile Row 2 / Desktop Center & Right) */}
          <div className="flex items-center justify-between md:justify-end gap-2 flex-1">
            {/* Desktop Consecutive Levels Streak Counter */}
            <div
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-900 rounded-xl shadow-2xs font-bold text-xs shrink-0 select-none"
              title={`Racha consecutiva actual: ${consecutiveStreak} niveles. Récord: ${bestStreak}`}
            >
              <Flame className={`w-4 h-4 ${consecutiveStreak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-slate-600 font-semibold">Racha:</span>
              <span className="text-orange-600 font-black text-sm">{consecutiveStreak}</span>
              <span className="text-amber-800 text-[11px] font-semibold">{consecutiveStreak === 1 ? 'nivel' : 'niveles'}</span>
              {bestStreak > 0 && (
                <span className="ml-1 text-[10px] text-amber-800 font-bold bg-amber-200/70 border border-amber-300 px-1.5 py-0.5 rounded-md">
                  ★ Récord {bestStreak}
                </span>
              )}
            </div>

            {/* Mission Dropdown Selector: flex-1 on mobile so it has plenty of space and doesn't get squished! */}
            <div className="relative flex-1 md:flex-initial md:min-w-[240px] max-w-[260px] sm:max-w-none">
              <select
                value={currentMissionIndex}
                onChange={(e) => selectMission(Number(e.target.value))}
                className="w-full bg-sky-50 hover:bg-sky-100/70 border border-sky-300 text-sky-900 font-bold text-xs sm:text-sm rounded-xl px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer appearance-none shadow-xs truncate"
              >
                {MISSIONS.map((m, idx) => {
                  const icon =
                    m.difficulty === 'tutorial'
                      ? '🔰'
                      : m.difficulty === 'facil'
                      ? '🟢'
                      : m.difficulty === 'medio'
                      ? '🟡'
                      : m.difficulty === 'dificil'
                      ? '🔴'
                      : '🚀';
                  const tag =
                    m.difficulty === 'tutorial'
                      ? '[Tutorial]'
                      : m.difficulty === 'facil'
                      ? '[Fácil]'
                      : m.difficulty === 'medio'
                      ? '[Medio]'
                      : m.difficulty === 'dificil'
                      ? '[Difícil]'
                      : '[Sandbox]';
                  return (
                    <option key={m.id} value={idx}>
                      {icon} {m.title} {tag}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-sky-700">
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>

            {/* Desktop Pista Button */}
            <button
              onClick={() => setShowHintModal(true)}
              className="hidden md:flex px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm rounded-xl shadow-xs active:scale-95 transition-all items-center gap-1.5 cursor-pointer shrink-0"
              title="Ver pista para resolver esta misión"
            >
              <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Pista</span>
            </button>

            {/* RUN & RESET Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={status === 'running' ? handleReset : handleRun}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 text-white shadow-md active:scale-95 transition-all cursor-pointer ${
                  status === 'running'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                {status === 'running' ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{status === 'running' ? 'DETENER' : 'RUN'}</span>
              </button>

              <button
                onClick={handleReset}
                className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                title="Reiniciar dron y granja"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">RESET</span>
              </button>

              {/* Desktop Speed, Sound, Help */}
              <button
                onClick={() => setExecSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
                className="hidden md:flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                title="Velocidad"
              >
                <Flame className={`w-3.5 h-3.5 ${execSpeed > 1 ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{execSpeed}x</span>
              </button>

              <button
                onClick={toggleSound}
                className="hidden md:flex p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                className="hidden md:flex p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Ayuda"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowWelcomeModal(true)}
                className="hidden md:flex p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                title="Bienvenida e Información Institucional"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Responsive Tab Switcher (Mobile Tabs + Desktop Mode Switcher) */}
      <div className="flex-none bg-sky-100/95 border-b border-sky-200 px-3 py-1.5 flex items-center justify-between gap-2 z-20">
        {/* Mobile View Switcher */}
        <div className="lg:hidden flex rounded-xl bg-white/90 p-0.5 border border-sky-300 shadow-xs flex-1">
          <button
            onClick={() => setMobileTab('editor')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'editor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Editor de Bloques</span>
          </button>
          <button
            onClick={() => setMobileTab('simulation')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'simulation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Simulación 3D</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 font-mono font-bold">
              🥕 {carrotsHarvested}/{currentMission.targetCarrots}
            </span>
          </button>
        </div>

        {/* Desktop View Mode Switcher (Split 50/50 | Full Editor | Full 3D Simulation) */}
        <div className="hidden lg:flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>🖥️ Vista:</span>
            </span>
            <div className="flex rounded-xl bg-white/90 p-0.5 border border-sky-300 shadow-xs">
              <button
                onClick={() => setDesktopViewMode('split')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  desktopViewMode === 'split'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ver Editor y Simulación en columnas paralelas (50% / 50%)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Vista Dividida (50/50)</span>
              </button>
              <button
                onClick={() => setDesktopViewMode('editor')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  desktopViewMode === 'editor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Maximizar Editor de Bloques a pantalla completa"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pestaña: Editor Completo</span>
              </button>
              <button
                onClick={() => setDesktopViewMode('simulation')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  desktopViewMode === 'simulation'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Maximizar Simulación 3D a pantalla completa"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Pestaña: Simulación 3D</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 font-mono font-bold">
                  🥕 {carrotsHarvested}/{currentMission.targetCarrots}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Objetivo de Cosecha:</span>
            <span className="font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
              🥕 {carrotsHarvested} / {currentMission.targetCarrots} zanahorias
            </span>
          </div>
        </div>
      </div>



      {/* 4. Main Workspace Panels */}
      <main className="flex-1 min-h-0 p-2 sm:p-3 md:p-4 relative overflow-hidden">
        <div
          className={`relative w-full h-full ${
            desktopViewMode === 'split'
              ? 'lg:grid lg:grid-cols-2 lg:gap-4'
              : 'lg:flex lg:flex-col'
          }`}
        >
          
          {/* Panel 1: Block Editor */}
          <div
            className={`flex flex-col bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden w-full h-full ${
              mobileTab === 'editor'
                ? 'absolute inset-0 z-10 opacity-100 pointer-events-auto'
                : 'absolute inset-0 z-0 opacity-0 pointer-events-none'
            } ${
              desktopViewMode === 'split'
                ? 'lg:relative lg:inset-auto lg:opacity-100 lg:pointer-events-auto lg:z-auto'
                : desktopViewMode === 'editor'
                ? 'lg:relative lg:inset-auto lg:opacity-100 lg:pointer-events-auto lg:z-auto lg:flex-1'
                : 'lg:hidden'
            }`}
          >
            {/* Panel Top Header Bar */}
            <div className="flex-none px-3 sm:px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-white gap-2">
              <div className="flex items-center gap-2 truncate">
                <h2 className="text-sm sm:text-base font-bold font-heading text-slate-800 shrink-0">
                  Block Editor
                </h2>
                <span
                  className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    currentMission.difficulty === 'tutorial'
                      ? 'bg-teal-100 text-teal-800'
                      : currentMission.difficulty === 'facil'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentMission.difficulty === 'medio'
                      ? 'bg-amber-100 text-amber-800'
                      : currentMission.difficulty === 'dificil'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {currentMission.difficulty === 'tutorial'
                    ? '🔰 Tutorial'
                    : currentMission.difficulty === 'facil'
                    ? '🟢 Fácil'
                    : currentMission.difficulty === 'medio'
                    ? '🟡 Medio'
                    : currentMission.difficulty === 'dificil'
                    ? '🔴 Difícil'
                    : '🚀 Sandbox'}
                </span>
                <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full hidden sm:inline">
                  {currentMission.allowedBlocks.length} bloques
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs hidden md:block">
                  {currentMission.subtitle}
                </div>
                {/* Desktop Expand / Collapse Button */}
                <button
                  onClick={() =>
                    setDesktopViewMode((prev) => (prev === 'editor' ? 'split' : 'editor'))
                  }
                  className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  title={
                    desktopViewMode === 'editor'
                      ? 'Restaurar vista dividida (50/50)'
                      : 'Maximizar Editor a pantalla completa'
                  }
                >
                  {desktopViewMode === 'editor' ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick-Add Block Dock: Level's allowed blocks with smooth horizontal scroll without visual scrollbar */}
            <div className="flex-none px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto overflow-y-hidden touch-pan-x select-none no-scrollbar">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                <span>🧩 Bloques:</span>
              </span>
              {currentMission.allowedBlocks.map((bType) => {
                const meta = BLOCK_BUTTON_META[bType] || { label: bType, icon: '＋', style: 'bg-blue-500 text-white rounded-xl' };
                return (
                  <button
                    key={bType}
                    onClick={() => handleQuickAdd(bType)}
                    className={`px-3 py-1.5 font-bold text-xs sm:text-sm active:translate-y-0.5 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${meta.style}`}
                    title={`Agregar ${meta.label} al código`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Blockly SVG Workspace: Full screen, no giant flyout overlay! */}
            <div className="flex-1 min-h-0 relative">
              <BlocklyEditor
                workspaceRef={workspaceRef}
                missionId={currentMission.id}
              />
            </div>
          </div>

          {/* Panel 2: Simulation Area */}
          <div
            className={`flex flex-col bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden w-full h-full transition-transform ${
              isScreenShaking ? 'screen-shake ring-4 ring-rose-500/70' : ''
            } ${
              mobileTab === 'simulation'
                ? 'absolute inset-0 z-10 opacity-100 pointer-events-auto'
                : 'absolute inset-0 z-0 opacity-0 pointer-events-none'
            } ${
              desktopViewMode === 'split'
                ? 'lg:relative lg:inset-auto lg:opacity-100 lg:pointer-events-auto lg:z-auto'
                : desktopViewMode === 'simulation'
                ? 'lg:relative lg:inset-auto lg:opacity-100 lg:pointer-events-auto lg:z-auto lg:flex-1'
                : 'lg:hidden'
            }`}
          >
            {/* Panel Header */}
            <div className="flex-none px-3 sm:px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-heading text-slate-800">
                  Simulation Area
                </h2>
                <span className="text-[11px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                  {currentMission.gridSize.width}x{currentMission.gridSize.height} Granja
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <span>Objetivo:</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-xs">
                    🥕 {carrotsHarvested}/{currentMission.targetCarrots}
                  </span>
                </div>
                {/* Desktop Expand / Collapse Button */}
                <button
                  onClick={() =>
                    setDesktopViewMode((prev) => (prev === 'simulation' ? 'split' : 'simulation'))
                  }
                  className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  title={
                    desktopViewMode === 'simulation'
                      ? 'Restaurar vista dividida (50/50)'
                      : 'Maximizar Simulación a pantalla completa'
                  }
                >
                  {desktopViewMode === 'simulation' ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Three.js 3D View */}
            <div className="flex-1 min-h-0 relative">
              {/* Collision Alert Banner (Requirement 4) */}
              {collisionBanner && (
                <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-4 z-40 bg-rose-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-rose-300 flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
                    <span className="text-xl animate-bounce">💥</span>
                    <span>{collisionBanner}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold bg-rose-800 px-2 py-1 rounded-lg shrink-0">
                    Reiniciando...
                  </span>
                </div>
              )}

              {/* Failed Goal Alert Banner (Requirement 3) */}
              {failedGoalBanner && (
                <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-4 z-40 bg-amber-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
                    <span className="text-xl animate-bounce">⚠️</span>
                    <span>{failedGoalBanner}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold bg-amber-800 px-2 py-1 rounded-lg shrink-0">
                    Reiniciando...
                  </span>
                </div>
              )}

              <ThreeFarm
                droneState={droneState}
                tiles={farmTiles}
                gridSize={currentMission.gridSize}
                status={status}
                statusMessage={statusMessage}
                carrotsCount={carrotsHarvested}
                targetCarrots={currentMission.targetCarrots}
                isScanning={isScanning}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Hint Modal: Shown when clicking the visible "Pista" button */}
      {showHintModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/80">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600 fill-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  Pista: {currentMission.title}
                </h3>
              </div>
              <button
                onClick={() => setShowHintModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-600 max-h-[70vh] overflow-y-auto">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 font-medium leading-relaxed flex items-start gap-2.5">
                <span className="text-xl shrink-0">💡</span>
                <div>
                  <strong className="block text-amber-900 font-bold mb-1">Pista de la Misión:</strong>
                  {currentMission.hint}
                </div>
              </div>

              <div className="p-3.5 bg-sky-50 rounded-2xl border border-sky-200 text-sky-950 text-xs leading-relaxed space-y-1.5">
                <strong className="block text-sky-900 font-bold mb-1">¿Cómo resolverlo?</strong>
                <p>
                  1. Observa la cuadrícula de la granja y la posición del dron ({droneState.x}, {droneState.z}).
                </p>
                <p>
                  2. Toca los botones de arriba para añadir los bloques necesarios.
                </p>
                <p>
                  3. Haz clic en el número de casillas o en el giro para ajustarlo a tu ruta.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (workspaceRef.current) {
                    loadMissionSkeleton(workspaceRef.current, currentMission.id);
                  }
                  setShowHintModal(false);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Inserta una plantilla de bloques sugerida en el lienzo"
              >
                <span>🧩</span>
                <span>Cargar Bloques de Ayuda</span>
              </button>

              <button
                onClick={() => setShowHintModal(false)}
                className="px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                ¡Entendido, a volar!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-sm">Código JavaScript Generado</h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-900 text-sky-300 rounded-xl m-4 font-mono text-xs max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{generatedCode || '// No hay bloques conectados aún'}</pre>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-sm">Guía de Programación</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs sm:text-sm text-slate-600 max-h-[70vh] overflow-y-auto">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-xs">
                  1
                </div>
                <p>
                  Usa los <strong>botones de la barra superior</strong> o arrastra bloques desde la paleta izquierda para agregarlos al programa.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 text-xs">
                  2
                </div>
                <p>
                  Ajusta los números (casillas a avanzar) y las direcciones de giro (derecha / izquierda) haciendo clic en ellos.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 text-xs">
                  3
                </div>
                <p>
                  Cosecha las zanahorias 🥕 con <strong>COSECHAR</strong>. ¡Al completar el objetivo, presiona "Siguiente Nivel" para continuar tu racha!
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                ¡A Volar!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Modal (Requirement 2 & Streak) */}
      {showVictoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-emerald-400 text-center relative p-6 sm:p-7">
            {/* Background celebratory glow */}
            <div className="absolute -top-14 -left-14 w-36 h-36 bg-emerald-300/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -top-14 -right-14 w-36 h-36 bg-amber-300/30 rounded-full blur-2xl pointer-events-none" />

            {/* Trophy & Stars Animation */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-3xl animate-bounce">⭐</span>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30 scale-110">
                🏆
              </div>
              <span className="text-3xl animate-bounce delay-100">⭐</span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-900 tracking-tight mb-1">
              ¡NIVEL COMPLETADO!
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-emerald-600 mb-3">
              🎉 ¡Felicitaciones! Has completado {currentMission.title}
            </p>

            {/* Streak Card in Victory Modal */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 mb-3 flex items-center justify-between text-left shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                  🔥
                </div>
                <div>
                  <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                    Racha de Niveles
                  </div>
                  <div className="text-sm sm:text-base font-black text-amber-950">
                    {consecutiveStreak} {consecutiveStreak === 1 ? 'nivel consecutivo' : 'niveles consecutivos'}
                  </div>
                </div>
              </div>
              <div className="text-right pl-3 border-l border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Récord</span>
                <span className="text-xs font-black text-slate-700">⭐ {bestStreak}</span>
              </div>
            </div>

            {/* Achievement Summary Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-5 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700">
                <span>🥕 Cosecha lograda:</span>
                <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {carrotsHarvested} / {currentMission.targetCarrots} zanahorias
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700">
                <span>🚁 Vuelo del Dron:</span>
                <span className="text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  Sin colisiones ✅
                </span>
              </div>
            </div>

            {/* Action Buttons: User must click next level to advance */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
              {currentMissionIndex < MISSIONS.length - 1 ? (
                <button
                  onClick={() => {
                    setShowVictoryModal(false);
                    selectMission(currentMissionIndex + 1);
                  }}
                  className="w-full sm:w-auto flex-1 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Siguiente Nivel</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowVictoryModal(false);
                    selectMission(0);
                  }}
                  className="w-full sm:w-auto flex-1 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm sm:text-base rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Volver al Nivel 1</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowVictoryModal(false);
                  handleReset();
                }}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl border border-slate-300/80 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Repetir este nivel para practicar"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onStart={() => {
          setShowWelcomeModal(false);
          soundManager.playSuccess();
          if (soundEnabled) {
            soundManager.startBgm();
          }
        }}
      />

    </div>
  );
}
