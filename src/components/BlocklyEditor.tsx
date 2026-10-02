import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator, Order } from 'blockly/javascript';
import { Plus, Minus, Crosshair, Trash2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

// Register Custom Drone Logic Lab Blocks in Zelos/Scratch 3.0 style
const registerCustomBlocks = () => {
  if (Blockly.Blocks['when_start']) return;

  // 1. Hat Block: AL INICIAR ⚑
  Blockly.defineBlocksWithJsonArray([
    {
      type: 'when_start',
      message0: 'AL INICIAR ⚑',
      nextStatement: null,
      colour: '#ffab19',
      tooltip: 'Punto de partida del dron',
    },
    {
      type: 'move_forward',
      message0: 'AVANZAR %1 casillas',
      args0: [
        {
          type: 'field_number',
          name: 'UNITS',
          value: 1,
          min: 1,
          max: 10,
          precision: 1,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#4c97ff',
      tooltip: 'Avanza hacia la dirección en la que apunta el dron',
    },
    {
      type: 'turn_direction',
      message0: 'GIRAR %1 90°',
      args0: [
        {
          type: 'field_dropdown',
          name: 'DIRECTION',
          options: [
            ['A LA DERECHA ↷', 'RIGHT'],
            ['A LA IZQUIERDA ↶', 'LEFT'],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#4c97ff',
      tooltip: 'Gira el dron 90 grados sobre su propio eje',
    },
    {
      type: 'wait_seconds',
      message0: 'ESPERAR %1 seg',
      args0: [
        {
          type: 'field_number',
          name: 'SECONDS',
          value: 1,
          min: 0.2,
          max: 5,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#ffab19',
      tooltip: 'Pausa el dron durante los segundos indicados',
    },
    {
      type: 'harvest_crop',
      message0: 'COSECHAR / ANALIZAR SUELO',
      previousStatement: null,
      nextStatement: null,
      colour: '#00be98',
      tooltip: 'Analiza la baldosa actual y recolecta el cultivo si está listo',
    },
    {
      type: 'forever_loop',
      message0: 'POR SIEMPRE [loop] %1 %2',
      args0: [
        {
          type: 'input_dummy',
        },
        {
          type: 'input_statement',
          name: 'DO',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#ffab19',
      tooltip: 'Bucle que repite las acciones en su interior de forma continua',
    },
    {
      type: 'repeat_times',
      message0: 'REPETIR %1 VECES %2 %3',
      args0: [
        {
          type: 'field_number',
          name: 'TIMES',
          value: 2,
          min: 1,
          max: 20,
          precision: 1,
        },
        {
          type: 'input_dummy',
        },
        {
          type: 'input_statement',
          name: 'DO',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#ffab19',
      tooltip: 'Repite las acciones el número de veces indicado',
    },
    {
      type: 'if_obstacle_detected',
      message0: 'SI OBSTÁCULO DETECTADO ENTONCES %1 %2',
      args0: [
        {
          type: 'input_dummy',
        },
        {
          type: 'input_statement',
          name: 'DO',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#59c059',
      tooltip: 'Ejecuta las acciones si hay un obstáculo o límite en frente',
    },
    {
      type: 'obstacle_detected',
      message0: 'OBSTÁCULO DETECTADO',
      output: 'Boolean',
      colour: '#59c059',
      tooltip: 'Verdadero si la casilla en frente contiene un obstáculo',
    },
    {
      type: 'crop_detected',
      message0: 'HAY CULTIVO AQUÍ',
      output: 'Boolean',
      colour: '#00be98',
      tooltip: 'Verdadero si hay un cultivo en la casilla actual',
    },
  ]);

  // Code Generators
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['when_start'] = function () {
    return '// START\n';
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['move_forward'] = function (block: Blockly.Block) {
    const units = block.getFieldValue('UNITS') || 1;
    return `await api.highlight("${block.id}");\nawait api.moveForward(${units}, "${block.id}");\n`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['turn_direction'] = function (block: Blockly.Block) {
    const dir = block.getFieldValue('DIRECTION');
    return `await api.highlight("${block.id}");\nawait api.turn("${dir}", "${block.id}");\n`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['wait_seconds'] = function (block: Blockly.Block) {
    const sec = block.getFieldValue('SECONDS') || 1;
    return `await api.highlight("${block.id}");\nawait api.wait(${sec}, "${block.id}");\n`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['harvest_crop'] = function (block: Blockly.Block) {
    return `await api.highlight("${block.id}");\nawait api.harvest("${block.id}");\n`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['forever_loop'] = function (block: Blockly.Block, generator: typeof javascriptGenerator) {
    const branch = generator.statementToCode(block, 'DO');
    return `while (!api.isStopped()) {\n  await api.checkLoopGuard();\n  await api.highlight("${block.id}");\n${branch}}\n`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['repeat_times'] = function (block: Blockly.Block, generator: typeof javascriptGenerator) {
    const times = block.getFieldValue('TIMES') || 1;
    const branch = generator.statementToCode(block, 'DO');
    return `for (let i = 0; i < ${times} && !api.isStopped(); i++) {\n  await api.checkLoopGuard();\n  await api.highlight("${block.id}");\n${branch}}\n`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['if_obstacle_detected'] = function (block: Blockly.Block, generator: typeof javascriptGenerator) {
    const branch = generator.statementToCode(block, 'DO');
    return `await api.highlight("${block.id}");\nif (api.isObstacleDetected()) {\n${branch}}\n`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['obstacle_detected'] = function () {
    return ['api.isObstacleDetected()', Order.FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (javascriptGenerator as any).forBlock['crop_detected'] = function () {
    return ['api.isCropDetected()', Order.FUNCTION_CALL];
  };
};

// Reset workspace with only the initial starter block
export const resetWorkspaceStarter = (workspace: Blockly.WorkspaceSvg) => {
  workspace.clear();
  const startBlock = workspace.newBlock('when_start');
  startBlock.initSvg();
  startBlock.render();
  startBlock.moveBy(20, 20);
  startBlock.setDeletable(false);
  try {
    workspace.scroll(0, 0);
  } catch (e) {
    // Ignore
  }
};

// Helper: Append a block automatically snapped to the end of the stack
export const appendBlockToWorkspace = (
  workspace: Blockly.WorkspaceSvg,
  blockType: string,
  fieldValues?: Record<string, string | number>
) => {
  const allBlocks = workspace.getAllBlocks(false);
  const startBlock = allBlocks.find((b) => b.type === 'when_start');

  let targetBlock: Blockly.Block | null = startBlock || null;
  while (targetBlock?.nextConnection?.targetBlock()) {
    targetBlock = targetBlock.nextConnection.targetBlock();
  }

  const newBlock = workspace.newBlock(blockType);
  if (fieldValues) {
    Object.entries(fieldValues).forEach(([k, v]) => {
      newBlock.setFieldValue(v, k);
    });
  }
  newBlock.initSvg();
  newBlock.render();

  if (targetBlock && targetBlock.nextConnection && newBlock.previousConnection) {
    targetBlock.nextConnection.connect(newBlock.previousConnection);
  } else {
    newBlock.moveBy(20, 90 + allBlocks.length * 35);
  }

  soundManager.playTurn();
};

// Helper: Load structural skeleton of an example (DOES NOT give away exact answers!)
// The player can learn the structure and adjust distances and blocks
export const loadMissionSkeleton = (workspace: Blockly.WorkspaceSvg, missionId: string) => {
  workspace.clear();

  const startBlock = workspace.newBlock('when_start');
  startBlock.initSvg();
  startBlock.render();
  startBlock.moveBy(20, 20);
  startBlock.setDeletable(false);

  if (missionId === 'mission-1') {
    // Nivel 1: Avanzar -> Cosechar
    const move = workspace.newBlock('move_forward');
    move.setFieldValue(2, 'UNITS');
    move.initSvg();
    move.render();
    if (startBlock.nextConnection && move.previousConnection) {
      startBlock.nextConnection.connect(move.previousConnection);
    }

    const harvest = workspace.newBlock('harvest_crop');
    harvest.initSvg();
    harvest.render();
    if (move.nextConnection && harvest.previousConnection) {
      move.nextConnection.connect(harvest.previousConnection);
    }
  } else if (missionId === 'mission-2') {
    // Nivel 2: Avanzar 1 -> Girar Derecha 90° -> Avanzar 2 -> Cosechar
    const move1 = workspace.newBlock('move_forward');
    move1.setFieldValue(1, 'UNITS');
    move1.initSvg();
    move1.render();
    if (startBlock.nextConnection && move1.previousConnection) {
      startBlock.nextConnection.connect(move1.previousConnection);
    }

    const turn = workspace.newBlock('turn_direction');
    turn.setFieldValue('RIGHT', 'DIRECTION');
    turn.initSvg();
    turn.render();
    if (move1.nextConnection && turn.previousConnection) {
      move1.nextConnection.connect(turn.previousConnection);
    }

    const move2 = workspace.newBlock('move_forward');
    move2.setFieldValue(2, 'UNITS');
    move2.initSvg();
    move2.render();
    if (turn.nextConnection && move2.previousConnection) {
      turn.nextConnection.connect(move2.previousConnection);
    }

    const harvest = workspace.newBlock('harvest_crop');
    harvest.initSvg();
    harvest.render();
    if (move2.nextConnection && harvest.previousConnection) {
      move2.nextConnection.connect(harvest.previousConnection);
    }
  } else if (missionId === 'mission-3') {
    // Nivel 3: Repetir 3 veces { Avanzar 1 -> Cosechar }
    const repeat = workspace.newBlock('repeat_times');
    repeat.setFieldValue(3, 'TIMES');
    repeat.initSvg();
    repeat.render();
    if (startBlock.nextConnection && repeat.previousConnection) {
      startBlock.nextConnection.connect(repeat.previousConnection);
    }

    const move = workspace.newBlock('move_forward');
    move.setFieldValue(1, 'UNITS');
    move.initSvg();
    move.render();
    const doConn = repeat.getInput('DO')?.connection;
    if (doConn && move.previousConnection) {
      doConn.connect(move.previousConnection);
    }

    const harvest = workspace.newBlock('harvest_crop');
    harvest.initSvg();
    harvest.render();
    if (move.nextConnection && harvest.previousConnection) {
      move.nextConnection.connect(harvest.previousConnection);
    }
  } else if (missionId === 'mission-4') {
    // Nivel 4: Rodeo de roca
    const turnR = workspace.newBlock('turn_direction');
    turnR.setFieldValue('RIGHT', 'DIRECTION');
    turnR.initSvg();
    turnR.render();
    if (startBlock.nextConnection && turnR.previousConnection) {
      startBlock.nextConnection.connect(turnR.previousConnection);
    }

    const move1 = workspace.newBlock('move_forward');
    move1.setFieldValue(1, 'UNITS');
    move1.initSvg();
    move1.render();
    if (turnR.nextConnection && move1.previousConnection) {
      turnR.nextConnection.connect(move1.previousConnection);
    }

    const turnL = workspace.newBlock('turn_direction');
    turnL.setFieldValue('LEFT', 'DIRECTION');
    turnL.initSvg();
    turnL.render();
    if (move1.nextConnection && turnL.previousConnection) {
      move1.nextConnection.connect(turnL.previousConnection);
    }

    const move2 = workspace.newBlock('move_forward');
    move2.setFieldValue(1, 'UNITS');
    move2.initSvg();
    move2.render();
    if (turnL.nextConnection && move2.previousConnection) {
      turnL.nextConnection.connect(move2.previousConnection);
    }

    const harvest = workspace.newBlock('harvest_crop');
    harvest.initSvg();
    harvest.render();
    if (move2.nextConnection && harvest.previousConnection) {
      move2.nextConnection.connect(harvest.previousConnection);
    }
  } else if (missionId === 'mission-5') {
    // Nivel 5: Repetir 4 veces { Avanzar 2 -> Cosechar -> Girar Derecha 90° }
    const repeat = workspace.newBlock('repeat_times');
    repeat.setFieldValue(4, 'TIMES');
    repeat.initSvg();
    repeat.render();
    if (startBlock.nextConnection && repeat.previousConnection) {
      startBlock.nextConnection.connect(repeat.previousConnection);
    }

    const move = workspace.newBlock('move_forward');
    move.setFieldValue(2, 'UNITS');
    move.initSvg();
    move.render();
    const doConn = repeat.getInput('DO')?.connection;
    if (doConn && move.previousConnection) {
      doConn.connect(move.previousConnection);
    }

    const harvest = workspace.newBlock('harvest_crop');
    harvest.initSvg();
    harvest.render();
    if (move.nextConnection && harvest.previousConnection) {
      move.nextConnection.connect(harvest.previousConnection);
    }

    const turn = workspace.newBlock('turn_direction');
    turn.setFieldValue('RIGHT', 'DIRECTION');
    turn.initSvg();
    turn.render();
    if (harvest.nextConnection && turn.previousConnection) {
      harvest.nextConnection.connect(turn.previousConnection);
    }
  } else if (missionId === 'mission-7' || missionId === 'mission-10') {
    // Niveles con sensor: Por siempre { Avanzar 1 -> Cosechar -> Si obstáculo girar derecha }
    const loop = workspace.newBlock('forever_loop');
    loop.initSvg();
    loop.render();
    if (startBlock.nextConnection && loop.previousConnection) {
      startBlock.nextConnection.connect(loop.previousConnection);
    }

    const move = workspace.newBlock('move_forward');
    move.setFieldValue(1, 'UNITS');
    move.initSvg();
    move.render();
    const doConn = loop.getInput('DO')?.connection;
    if (doConn && move.previousConnection) {
      doConn.connect(move.previousConnection);
    }

    const harvest = workspace.newBlock('harvest_crop');
    harvest.initSvg();
    harvest.render();
    if (move.nextConnection && harvest.previousConnection) {
      move.nextConnection.connect(harvest.previousConnection);
    }

    const ifObs = workspace.newBlock('if_obstacle_detected');
    ifObs.initSvg();
    ifObs.render();
    if (harvest.nextConnection && ifObs.previousConnection) {
      harvest.nextConnection.connect(ifObs.previousConnection);
    }

    const turn = workspace.newBlock('turn_direction');
    turn.setFieldValue('RIGHT', 'DIRECTION');
    turn.initSvg();
    turn.render();
    const ifDoConn = ifObs.getInput('DO')?.connection;
    if (ifDoConn && turn.previousConnection) {
      ifDoConn.connect(turn.previousConnection);
    }
  }

  soundManager.playHarvest();
};

interface BlocklyEditorProps {
  missionId: string;
  onWorkspaceChange?: (workspace: Blockly.WorkspaceSvg) => void;
  workspaceRef?: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
}

export const BlocklyEditor: React.FC<BlocklyEditorProps> = ({
  missionId,
  onWorkspaceChange,
  workspaceRef,
}) => {
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const internalWorkspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    registerCustomBlocks();

    if (!blocklyDivRef.current) return;

    // Standard workspace with native scrollbars and controls
    const workspace = Blockly.inject(blocklyDivRef.current, {
      renderer: 'zelos',
      theme: Blockly.Themes.Zelos,
      move: {
        scrollbars: {
          horizontal: true,
          vertical: true,
        },
        drag: true,
        wheel: true,
      },
      grid: {
        spacing: 24,
        length: 3,
        colour: '#f1f5f9',
        snap: true,
      },
      zoom: {
        controls: false, // Disables outdated gray SVG controls
        wheel: true,
        startScale: 0.9,
        maxScale: 2.0,
        minScale: 0.4,
        scaleSpeed: 1.15,
        pinch: true,
      },
      trashcan: false, // Replaced by modern high-contrast floating button
      sounds: true,
      media: 'https://unpkg.com/blockly/media/',
    });

    internalWorkspaceRef.current = workspace;
    if (workspaceRef) workspaceRef.current = workspace;

    // Initialize with starter block AL INICIAR ⚑
    resetWorkspaceStarter(workspace);

    if (onWorkspaceChange) {
      workspace.addChangeListener(() => {
        onWorkspaceChange(workspace);
      });
      onWorkspaceChange(workspace);
    }

    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(workspace);
    });
    if (blocklyDivRef.current) {
      resizeObserver.observe(blocklyDivRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      workspace.dispose();
      internalWorkspaceRef.current = null;
      if (workspaceRef) workspaceRef.current = null;
    };
  }, []);

  // Reset workspace when mission changes
  useEffect(() => {
    const ws = internalWorkspaceRef.current;
    if (!ws) return;

    try {
      resetWorkspaceStarter(ws);
      Blockly.svgResize(ws);
    } catch (e) {
      console.error('Error resetting Blockly workspace:', e);
    }
  }, [missionId]);

  // Modern Floating Controls Handlers
  const handleZoomCenter = () => {
    const ws = internalWorkspaceRef.current;
    if (!ws) return;
    ws.scroll(20, 20);
    ws.setScale(0.9);
    soundManager.playTurn();
  };

  const handleZoom = (delta: 1 | -1) => {
    const ws = internalWorkspaceRef.current;
    if (!ws) return;
    const metrics = ws.getMetrics();
    const cx = metrics ? metrics.viewWidth / 2 : 200;
    const cy = metrics ? metrics.viewHeight / 2 : 200;
    ws.zoom(cx, cy, delta);
    soundManager.playTurn();
  };

  const handleDelete = () => {
    const ws = internalWorkspaceRef.current;
    if (!ws) return;

    // If user has selected a specific block, delete it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selected = Blockly.getSelected() as any;
    if (selected && typeof selected.dispose === 'function' && selected.type !== 'when_start') {
      selected.dispose(true);
      soundManager.playCrash();
      return;
    }

    // Otherwise, clear workspace back to initial state
    resetWorkspaceStarter(ws);
    soundManager.playCrash();
  };

  return (
    <div className="relative w-full h-full min-h-[300px] bg-white rounded-2xl overflow-hidden touch-none select-none">
      <div ref={blocklyDivRef} className="w-full h-full min-h-full" />

      {/* Modern Floating Controls Widget */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 z-10 select-none">
        {/* Zoom & Center Actions Card */}
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 p-1 divide-y divide-slate-100">
          <button
            onClick={handleZoomCenter}
            className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer group"
            title="Centrar vista en el bloque de inicio"
          >
            <Crosshair className="w-4 h-4 transition-transform group-hover:scale-110" />
          </button>
          <button
            onClick={() => handleZoom(1)}
            className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer group"
            title="Acercar (Zoom In)"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer group"
            title="Alejar (Zoom Out)"
          >
            <Minus className="w-4 h-4 transition-transform group-hover:scale-110" />
          </button>
        </div>

        {/* Modern Trash Button */}
        <button
          onClick={handleDelete}
          className="p-2.5 bg-white/95 backdrop-blur-md hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-2xl shadow-lg border border-slate-200/90 transition-all active:scale-95 cursor-pointer group"
          title="Eliminar bloque seleccionado o reiniciar código"
        >
          <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
        </button>
      </div>
    </div>
  );
};
