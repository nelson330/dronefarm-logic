import { Mission } from '../types/game';

export const MISSIONS: Mission[] = [
  // =========================================================================
  // NIVEL 1: TUTORIAL 1 - PRIMER VUELO RECTO (Concepto: Conectar Bloques)
  // =========================================================================
  {
    id: 'mission-1',
    title: 'Nivel 1: Primer Vuelo Recto',
    subtitle: 'Aprende a conectar bloques para moverte y cosechar',
    description: '¡Bienvenido a la granja robótica! Tu dron está sobre la pista mirando hacia el Este. Programa el dron para avanzar 2 casillas en línea recta y cosechar la zanahoria madura.',
    difficulty: 'tutorial',
    gridSize: { width: 5, height: 3 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 1,
    hint: 'Debajo de "AL INICIAR", conecta el bloque [AVANZAR 2] y luego el bloque [COSECHAR]. ¡Presiona RUN para despegar!',
    allowedBlocks: ['move_forward', 'harvest_crop'],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 0, type: 'grass' },
      { x: 2, z: 0, type: 'grass' },
      { x: 3, z: 0, type: 'grass' },
      { x: 4, z: 0, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 1, type: 'grass' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'soil' }, // Camino recto
      { x: 3, z: 1, type: 'soil', hasCarrot: true, isTarget: true }, // Meta: Zanahoria
      { x: 4, z: 1, type: 'grass' },

      { x: 0, z: 2, type: 'grass' },
      { x: 1, z: 2, type: 'grass' },
      { x: 2, z: 2, type: 'grass', obstacle: 'rock' },
      { x: 3, z: 2, type: 'grass' },
      { x: 4, z: 2, type: 'grass' },
    ]
  },

  // =========================================================================
  // NIVEL 2: TUTORIAL 2 - LA CURVA EN L (Concepto: Rotación de 90°)
  // =========================================================================
  {
    id: 'mission-2',
    title: 'Nivel 2: La Curva en L',
    subtitle: 'Aprende a girar 90° para cambiar de dirección',
    description: 'La zanahoria no está en línea recta: el camino de tierra forma una "L". Avanza 1 casilla hasta la esquina, gira 90° a la derecha hacia el Sur, avanza 2 casillas y cosecha.',
    difficulty: 'tutorial',
    gridSize: { width: 4, height: 4 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 1,
    hint: 'Secuencia: [AVANZAR 1] ➔ [GIRAR A LA DERECHA 90°] ➔ [AVANZAR 2] ➔ [COSECHAR].',
    allowedBlocks: ['move_forward', 'turn_direction', 'harvest_crop'],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 0, type: 'grass' },
      { x: 2, z: 0, type: 'grass' },
      { x: 3, z: 0, type: 'grass' },

      { x: 0, z: 1, type: 'grass' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'soil' }, // Esquina de giro
      { x: 3, z: 1, type: 'grass', obstacle: 'rock' },

      { x: 0, z: 2, type: 'grass' },
      { x: 1, z: 2, type: 'grass' },
      { x: 2, z: 2, type: 'soil' }, // Camino sur
      { x: 3, z: 2, type: 'grass' },

      { x: 0, z: 3, type: 'grass' },
      { x: 1, z: 3, type: 'grass' },
      { x: 2, z: 3, type: 'soil', hasCarrot: true, isTarget: true }, // Meta
      { x: 3, z: 3, type: 'grass', obstacle: 'tree' },
    ]
  },

  // =========================================================================
  // NIVEL 3: TUTORIAL 3 - EL HUERTO EN BUCLE (Concepto: Bucles Repetir)
  // =========================================================================
  {
    id: 'mission-3',
    title: 'Nivel 3: El Huerto en Bucle',
    subtitle: 'Aprende a usar "REPETIR X VECES" para ahorrar código',
    description: '¡Una hilera con 3 zanahorias seguidas! En lugar de repetir los mismos bloques una y otra vez, coloca [AVANZAR 1] y [COSECHAR] dentro de un bucle [REPETIR 3 VECES].',
    difficulty: 'tutorial',
    gridSize: { width: 6, height: 3 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 3,
    hint: 'Arrastra "REPETIR (3) VECES" e inserta dentro: [AVANZAR 1] y [COSECHAR]. ¡El dron recogerá las 3 automáticamente!',
    allowedBlocks: ['repeat_times', 'move_forward', 'harvest_crop'],
    tiles: [
      { x: 0, z: 0, type: 'grass' },
      { x: 1, z: 0, type: 'grass' },
      { x: 2, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 3, z: 0, type: 'grass' },
      { x: 4, z: 0, type: 'grass' },
      { x: 5, z: 0, type: 'grass' },

      { x: 0, z: 1, type: 'grass' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'soil', hasCarrot: true }, // Zanahoria 1
      { x: 3, z: 1, type: 'soil', hasCarrot: true }, // Zanahoria 2
      { x: 4, z: 1, type: 'soil', hasCarrot: true, isTarget: true }, // Zanahoria 3
      { x: 5, z: 1, type: 'grass' },

      { x: 0, z: 2, type: 'grass' },
      { x: 1, z: 2, type: 'grass' },
      { x: 2, z: 2, type: 'grass' },
      { x: 3, z: 2, type: 'grass', obstacle: 'rock' },
      { x: 4, z: 2, type: 'grass' },
      { x: 5, z: 2, type: 'grass' },
    ]
  },

  // =========================================================================
  // NIVEL 4: FÁCIL 1 - ESQUIVAR LA ROCA (Concepto: Evasión de Obstáculos)
  // =========================================================================
  {
    id: 'mission-4',
    title: 'Nivel 4: Esquivar la Roca',
    subtitle: 'Rodea un obstáculo para alcanzar los cultivos',
    description: 'Una roca gigante bloquea el paso directo en la fila superior. Desciende hacia el Sur, avanza al Este para esquivarla y cosecha las 2 zanahorias maduras.',
    difficulty: 'facil',
    gridSize: { width: 5, height: 4 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 2,
    hint: 'Gira a la derecha 90° para mirar al Sur ➔ Avanza 1 ➔ Gira a la izquierda 90° para mirar al Este ➔ Avanza y cosecha las 2 zanahorias.',
    allowedBlocks: ['move_forward', 'turn_direction', 'harvest_crop', 'repeat_times'],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 0, type: 'grass' },
      { x: 2, z: 0, type: 'grass' },
      { x: 3, z: 0, type: 'grass' },
      { x: 4, z: 0, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 1, type: 'grass' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'soil', obstacle: 'rock' }, // Obstáculo bloqueando camino directo
      { x: 3, z: 1, type: 'soil', hasCarrot: true },  // Zanahoria 1
      { x: 4, z: 1, type: 'grass' },

      { x: 0, z: 2, type: 'grass' },
      { x: 1, z: 2, type: 'soil' }, // Desvío sur
      { x: 2, z: 2, type: 'soil' }, // Paso libre
      { x: 3, z: 2, type: 'soil', hasCarrot: true, isTarget: true }, // Zanahoria 2
      { x: 4, z: 2, type: 'grass' },

      { x: 0, z: 3, type: 'grass' },
      { x: 1, z: 3, type: 'grass' },
      { x: 2, z: 3, type: 'grass', obstacle: 'rock' },
      { x: 3, z: 3, type: 'grass' },
      { x: 4, z: 3, type: 'grass' },
    ]
  },

  // =========================================================================
  // NIVEL 5: FÁCIL 2 - LA PARCELA CUADRADA (Concepto: Bucle de Perímetro)
  // =========================================================================
  {
    id: 'mission-5',
    title: 'Nivel 5: La Parcela Cuadrada',
    subtitle: 'Patrulla un perímetro regular con bucles',
    description: 'Hay 4 zanahorias en las 4 esquinas de una parcela cuadrada de 3x3 bancales. Crea un bucle de 4 repeticiones: avanzar 2 casillas, cosechar y girar 90° a la derecha.',
    difficulty: 'facil',
    gridSize: { width: 5, height: 5 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 4,
    hint: 'Usa "REPETIR (4) VECES" con: [AVANZAR 2] ➔ [COSECHAR] ➔ [GIRAR A LA DERECHA 90°]. ¡El dron dará toda la vuelta!',
    allowedBlocks: ['repeat_times', 'move_forward', 'turn_direction', 'harvest_crop'],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'fence' },
      { x: 1, z: 0, type: 'grass', obstacle: 'fence' },
      { x: 2, z: 0, type: 'grass', obstacle: 'fence' },
      { x: 3, z: 0, type: 'grass', obstacle: 'fence' },
      { x: 4, z: 0, type: 'grass', obstacle: 'fence' },

      { x: 0, z: 1, type: 'grass', obstacle: 'fence' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'soil' },
      { x: 3, z: 1, type: 'soil', hasCarrot: true }, // Esquina 1 (Este)
      { x: 4, z: 1, type: 'grass', obstacle: 'fence' },

      { x: 0, z: 2, type: 'grass', obstacle: 'fence' },
      { x: 1, z: 2, type: 'soil' },
      { x: 2, z: 2, type: 'soil' },
      { x: 3, z: 2, type: 'soil' },
      { x: 4, z: 2, type: 'grass', obstacle: 'fence' },

      { x: 0, z: 3, type: 'grass', obstacle: 'fence' },
      { x: 1, z: 3, type: 'soil', hasCarrot: true }, // Esquina 3 (Oeste)
      { x: 2, z: 3, type: 'soil' },
      { x: 3, z: 3, type: 'soil', hasCarrot: true }, // Esquina 2 (Sur)
      { x: 4, z: 3, type: 'grass', obstacle: 'fence' },

      { x: 0, z: 4, type: 'grass', obstacle: 'fence' },
      { x: 1, z: 4, type: 'soil', hasCarrot: true, isTarget: true }, // Esquina 4 (Cierre)
      { x: 2, z: 4, type: 'grass', obstacle: 'fence' },
      { x: 3, z: 4, type: 'grass', obstacle: 'fence' },
      { x: 4, z: 4, type: 'grass', obstacle: 'fence' },
    ]
  },

  // =========================================================================
  // NIVEL 6: MEDIO 1 - DOS SURCOS EN ZIG-ZAG (Concepto: Patrón Serpiente / S)
  // =========================================================================
  {
    id: 'mission-6',
    title: 'Nivel 6: Dos Surcos en Zig-Zag',
    subtitle: 'Navega en forma de S entre dos hileras paralelas',
    description: 'Los agricultores recorren los campos en zig-zag. Cosecha la primera hilera hacia el Este (2 zanahorias), haz una curva en U bajando al sur y regresa hacia el Oeste para cosechar las otras 2.',
    difficulty: 'medio',
    gridSize: { width: 5, height: 4 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 4,
    hint: 'Fila 1: Avanza y cosecha hacia el Este. Al llegar a (3, 1), gira a la derecha dos veces bajando a la fila 2 para regresar hacia el Oeste.',
    allowedBlocks: ['repeat_times', 'move_forward', 'turn_direction', 'harvest_crop', 'wait_seconds'],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 0, type: 'grass' },
      { x: 2, z: 0, type: 'grass' },
      { x: 3, z: 0, type: 'grass' },
      { x: 4, z: 0, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 1, type: 'grass' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'soil', hasCarrot: true }, // Fila 1 zanahoria 1
      { x: 3, z: 1, type: 'soil', hasCarrot: true }, // Fila 1 zanahoria 2
      { x: 4, z: 1, type: 'grass', obstacle: 'rock' }, // Límite del surco

      { x: 0, z: 2, type: 'grass', obstacle: 'rock' },
      { x: 1, z: 2, type: 'soil', hasCarrot: true, isTarget: true }, // Fila 2 zanahoria 4
      { x: 2, z: 2, type: 'soil', hasCarrot: true }, // Fila 2 zanahoria 3
      { x: 3, z: 2, type: 'soil' }, // Conector curva
      { x: 4, z: 2, type: 'grass' },

      { x: 0, z: 3, type: 'grass' },
      { x: 1, z: 3, type: 'grass' },
      { x: 2, z: 3, type: 'grass' },
      { x: 3, z: 3, type: 'grass' },
      { x: 4, z: 3, type: 'grass', obstacle: 'tree' },
    ]
  },

  // =========================================================================
  // NIVEL 7: MEDIO 2 - EL SENSOR INTELIGENTE (Concepto: Condicional IF)
  // =========================================================================
  {
    id: 'mission-7',
    title: 'Nivel 7: El Sensor Inteligente',
    subtitle: 'Reacciona ante obstáculos automáticamente sin contar pasos',
    description: 'En lugar de programar casillas exactas, programa al dron para patrullar con el sensor: avanza cosechando y, si detecta un obstáculo al frente, gira 90° a la derecha automáticamente.',
    difficulty: 'medio',
    gridSize: { width: 6, height: 5 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 4,
    hint: 'Dentro de "POR SIEMPRE": coloca [AVANZAR 1], [COSECHAR], y [SI OBSTÁCULO DETECTADO ENTONCES GIRAR DERECHA 90°].',
    allowedBlocks: ['forever_loop', 'move_forward', 'if_obstacle_detected', 'turn_direction', 'harvest_crop', 'wait_seconds'],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 0, type: 'grass' },
      { x: 2, z: 0, type: 'grass' },
      { x: 3, z: 0, type: 'grass' },
      { x: 4, z: 0, type: 'grass' },
      { x: 5, z: 0, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 1, type: 'grass' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'soil', hasCarrot: true },
      { x: 3, z: 1, type: 'soil', hasCarrot: true },
      { x: 4, z: 1, type: 'soil' }, // Sensor detecta roca adelante
      { x: 5, z: 1, type: 'soil', obstacle: 'rock' }, // Roca al final de la fila 1

      { x: 0, z: 2, type: 'grass' },
      { x: 1, z: 2, type: 'grass' },
      { x: 2, z: 2, type: 'grass' },
      { x: 3, z: 2, type: 'grass' },
      { x: 4, z: 2, type: 'soil', hasCarrot: true }, // Fila 2 sur
      { x: 5, z: 2, type: 'grass' },

      { x: 0, z: 3, type: 'grass' },
      { x: 1, z: 3, type: 'grass' },
      { x: 2, z: 3, type: 'grass' },
      { x: 3, z: 3, type: 'grass' },
      { x: 4, z: 3, type: 'soil', hasCarrot: true, isTarget: true }, // Fila 3 sur
      { x: 5, z: 3, type: 'soil', obstacle: 'rock' },

      { x: 0, z: 4, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 4, type: 'grass' },
      { x: 2, z: 4, type: 'grass' },
      { x: 3, z: 4, type: 'grass' },
      { x: 4, z: 4, type: 'grass', obstacle: 'tree' },
      { x: 5, z: 4, type: 'grass', obstacle: 'tree' },
    ]
  },

  // =========================================================================
  // NIVEL 8: MEDIO 3 - EL MOLINO Y EL PUENTE (Concepto: Navegación de Puentes)
  // =========================================================================
  {
    id: 'mission-8',
    title: 'Nivel 8: El Molino y el Puente',
    subtitle: 'Cruza el canal de agua para completar la recolección',
    description: 'Un canal de agua divide el huerto por la mitad. Cosecha la zanahoria del sector oeste, cruza el puente de adoquines de piedra y recolecta las 3 zanahorias del sector este junto al molino.',
    difficulty: 'medio',
    gridSize: { width: 6, height: 5 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 4,
    hint: 'Baja hacia (1, 3) para cosechar la primera zanahoria, sube al puente en Z=2 para cruzar el agua y cosecha el sector este.',
    allowedBlocks: ['repeat_times', 'move_forward', 'turn_direction', 'harvest_crop', 'wait_seconds'],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 0, type: 'grass' },
      { x: 2, z: 0, type: 'grass', obstacle: 'windmill' }, // Molino en el norte
      { x: 3, z: 0, type: 'grass' },
      { x: 4, z: 0, type: 'grass' },
      { x: 5, z: 0, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 1, type: 'grass' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'water' }, // Canal de agua
      { x: 3, z: 1, type: 'water' }, // Canal de agua
      { x: 4, z: 1, type: 'soil', hasCarrot: true }, // Sector este zanahoria 2
      { x: 5, z: 1, type: 'grass' },

      { x: 0, z: 2, type: 'grass' },
      { x: 1, z: 2, type: 'soil' },
      { x: 2, z: 2, type: 'path' }, // Puente de piedra
      { x: 3, z: 2, type: 'path' }, // Puente de piedra
      { x: 4, z: 2, type: 'soil', hasCarrot: true }, // Sector este zanahoria 3
      { x: 5, z: 2, type: 'grass' },

      { x: 0, z: 3, type: 'grass' },
      { x: 1, z: 3, type: 'soil', hasCarrot: true }, // Sector oeste zanahoria 1
      { x: 2, z: 3, type: 'water' }, // Canal de agua
      { x: 3, z: 3, type: 'water' }, // Canal de agua
      { x: 4, z: 3, type: 'soil', hasCarrot: true, isTarget: true }, // Sector este zanahoria 4
      { x: 5, z: 3, type: 'grass' },

      { x: 0, z: 4, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 4, type: 'grass' },
      { x: 2, z: 4, type: 'grass' },
      { x: 3, z: 4, type: 'grass' },
      { x: 4, z: 4, type: 'grass' },
      { x: 5, z: 4, type: 'grass', obstacle: 'tree' },
    ]
  },

  // =========================================================================
  // NIVEL 9: DIFÍCIL 1 - EL ESPIRAL DEL HUERTO (Concepto: Espiral Geométrica)
  // =========================================================================
  {
    id: 'mission-9',
    title: 'Nivel 9: El Espiral del Huerto',
    subtitle: 'Navega en espiral hacia el corazón de la granja',
    description: 'Los setos de la granja forman un camino en espiral concéntrica. En cada esquina hay una zanahoria madura. Recorre la espiral girando a la derecha en cada estación hasta cosechar las 5 zanahorias.',
    difficulty: 'dificil',
    gridSize: { width: 6, height: 6 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 5,
    hint: 'Avanza 3 al Este y cosecha en (4, 1) ➔ Gira derecha, avanza 3 al Sur y cosecha en (4, 4) ➔ Gira derecha, avanza 3 al Oeste y cosecha en (1, 4) ➔ Gira derecha y adéntrate en el centro.',
    allowedBlocks: ['repeat_times', 'move_forward', 'turn_direction', 'harvest_crop', 'if_obstacle_detected', 'wait_seconds'],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 2, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 3, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 4, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 5, z: 0, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 1, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'soil' },
      { x: 3, z: 1, type: 'soil' },
      { x: 4, z: 1, type: 'soil', hasCarrot: true }, // Esquina 1 (Este)
      { x: 5, z: 1, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 2, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 2, type: 'soil', hasCarrot: true }, // Esquina 4 (Interior)
      { x: 2, z: 2, type: 'soil' },
      { x: 3, z: 2, type: 'soil', hasCarrot: true, isTarget: true }, // Meta centro (5)
      { x: 4, z: 2, type: 'soil' },
      { x: 5, z: 2, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 3, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 3, type: 'soil' },
      { x: 2, z: 3, type: 'grass', obstacle: 'rock' },
      { x: 3, z: 3, type: 'soil', obstacle: 'rock' },
      { x: 4, z: 3, type: 'soil' },
      { x: 5, z: 3, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 4, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 4, type: 'soil', hasCarrot: true }, // Esquina 3 (Oeste)
      { x: 2, z: 4, type: 'soil' },
      { x: 3, z: 4, type: 'soil' },
      { x: 4, z: 4, type: 'soil', hasCarrot: true }, // Esquina 2 (Sur)
      { x: 5, z: 4, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 5, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 5, type: 'grass', obstacle: 'tree' },
      { x: 2, z: 5, type: 'grass', obstacle: 'tree' },
      { x: 3, z: 5, type: 'grass', obstacle: 'tree' },
      { x: 4, z: 5, type: 'grass', obstacle: 'tree' },
      { x: 5, z: 5, type: 'grass', obstacle: 'tree' },
    ]
  },

  // =========================================================================
  // NIVEL 10: DIFÍCIL 2 - MISIÓN AUTÓNOMA TOTAL (Concepto: Algoritmo Autónomo)
  // =========================================================================
  {
    id: 'mission-10',
    title: 'Nivel 10: Misión Autónoma',
    subtitle: 'El examen maestro: diseña un algoritmo de recolección continua',
    description: '¡La prueba final de la academia de drones! Hay 6 zanahorias dispersas en una granja compleja. Programa una rutina autónoma continua con "POR SIEMPRE" y sensores de detección para cosecharlas todas sin estrellarte.',
    difficulty: 'dificil',
    gridSize: { width: 6, height: 6 },
    initialDrone: { x: 1, z: 1, facing: 1 }, // (1, 1) mirando al Este
    targetCarrots: 6,
    hint: 'Usa "POR SIEMPRE": avanza 1, cosecha y, si detectas un obstáculo al frente, gira 90° a la derecha. ¡El dron explorará cada rincón de forma inteligente!',
    allowedBlocks: ['forever_loop', 'repeat_times', 'move_forward', 'turn_direction', 'if_obstacle_detected', 'harvest_crop', 'wait_seconds'],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 0, type: 'grass' },
      { x: 2, z: 0, type: 'grass', obstacle: 'rock' },
      { x: 3, z: 0, type: 'grass' },
      { x: 4, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 5, z: 0, type: 'grass' },

      { x: 0, z: 1, type: 'grass' },
      { x: 1, z: 1, type: 'soil' }, // Dron inicio
      { x: 2, z: 1, type: 'soil', hasCarrot: true }, // Zanahoria 1
      { x: 3, z: 1, type: 'soil', hasCarrot: true }, // Zanahoria 2
      { x: 4, z: 1, type: 'soil', obstacle: 'rock' }, // Obstáculo para girar
      { x: 5, z: 1, type: 'grass' },

      { x: 0, z: 2, type: 'grass' },
      { x: 1, z: 2, type: 'soil', hasCarrot: true }, // Zanahoria 3
      { x: 2, z: 2, type: 'soil' },
      { x: 3, z: 2, type: 'soil' },
      { x: 4, z: 2, type: 'soil', hasCarrot: true }, // Zanahoria 4
      { x: 5, z: 2, type: 'grass' },

      { x: 0, z: 3, type: 'grass' },
      { x: 1, z: 3, type: 'soil', obstacle: 'tree' },
      { x: 2, z: 3, type: 'soil' },
      { x: 3, z: 3, type: 'soil', hasCarrot: true }, // Zanahoria 5
      { x: 4, z: 3, type: 'soil' },
      { x: 5, z: 3, type: 'grass', obstacle: 'rock' },

      { x: 0, z: 4, type: 'grass' },
      { x: 1, z: 4, type: 'soil', hasCarrot: true, isTarget: true }, // Zanahoria 6
      { x: 2, z: 4, type: 'soil' },
      { x: 3, z: 4, type: 'soil', obstacle: 'rock' },
      { x: 4, z: 4, type: 'soil' },
      { x: 5, z: 4, type: 'grass' },

      { x: 0, z: 5, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 5, type: 'grass' },
      { x: 2, z: 5, type: 'grass', obstacle: 'tree' },
      { x: 3, z: 5, type: 'grass' },
      { x: 4, z: 5, type: 'grass' },
      { x: 5, z: 5, type: 'grass', obstacle: 'tree' },
    ]
  },

  // =========================================================================
  // SANDBOX: MODO LIBRE CREATIVO (Concepto: Experimentación Total)
  // =========================================================================
  {
    id: 'mission-sandbox',
    title: 'Modo Libre (Sandbox)',
    subtitle: 'Diseña y experimenta sin límites en una granja abierta',
    description: 'Un campo amplio de 7x7 con molino de viento, canales de agua cristalina, puentes de adoquines, árboles frutales, rocas, zanahorias y cristales de energía. ¡Crea cualquier algoritmo o rutina que imagines!',
    difficulty: 'sandbox',
    gridSize: { width: 7, height: 7 },
    initialDrone: { x: 3, z: 3, facing: 1 }, // Centro del campo
    targetCarrots: 5,
    hint: 'Tienes acceso a todos los bloques disponibles en el laboratorio. ¡Inventa tus propias rutinas de patrulla!',
    allowedBlocks: [
      'move_forward',
      'turn_direction',
      'wait_seconds',
      'harvest_crop',
      'repeat_times',
      'forever_loop',
      'if_obstacle_detected',
      'obstacle_detected'
    ],
    tiles: [
      { x: 0, z: 0, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 0, type: 'grass' },
      { x: 2, z: 0, type: 'grass', obstacle: 'windmill' },
      { x: 3, z: 0, type: 'grass' },
      { x: 4, z: 0, type: 'grass', obstacle: 'rock' },
      { x: 5, z: 0, type: 'grass' },
      { x: 6, z: 0, type: 'grass', obstacle: 'tree' },

      { x: 0, z: 1, type: 'grass' },
      { x: 1, z: 1, type: 'soil', hasCarrot: true },
      { x: 2, z: 1, type: 'soil' },
      { x: 3, z: 1, type: 'soil', hasCarrot: true },
      { x: 4, z: 1, type: 'soil' },
      { x: 5, z: 1, type: 'grass', hasCrystal: true },
      { x: 6, z: 1, type: 'grass' },

      { x: 0, z: 2, type: 'grass', obstacle: 'fence' },
      { x: 1, z: 2, type: 'soil' },
      { x: 2, z: 2, type: 'water' },
      { x: 3, z: 2, type: 'path' },
      { x: 4, z: 2, type: 'water' },
      { x: 5, z: 2, type: 'soil', hasCarrot: true },
      { x: 6, z: 2, type: 'grass', obstacle: 'fence' },

      { x: 0, z: 3, type: 'grass' },
      { x: 1, z: 3, type: 'soil', hasCrystal: true },
      { x: 2, z: 3, type: 'water' },
      { x: 3, z: 3, type: 'path' }, // Inicio del dron en el centro
      { x: 4, z: 3, type: 'water' },
      { x: 5, z: 3, type: 'soil' },
      { x: 6, z: 3, type: 'grass' },

      { x: 0, z: 4, type: 'grass', obstacle: 'fence' },
      { x: 1, z: 4, type: 'soil', hasCarrot: true },
      { x: 2, z: 4, type: 'water' },
      { x: 3, z: 4, type: 'path' },
      { x: 4, z: 4, type: 'water' },
      { x: 5, z: 4, type: 'soil', hasCarrot: true, isTarget: true },
      { x: 6, z: 4, type: 'grass', obstacle: 'fence' },

      { x: 0, z: 5, type: 'grass' },
      { x: 1, z: 5, type: 'soil' },
      { x: 2, z: 5, type: 'soil', obstacle: 'rock' },
      { x: 3, z: 5, type: 'soil' },
      { x: 4, z: 5, type: 'soil', obstacle: 'tree' },
      { x: 5, z: 5, type: 'soil' },
      { x: 6, z: 5, type: 'grass' },

      { x: 0, z: 6, type: 'grass', obstacle: 'tree' },
      { x: 1, z: 6, type: 'grass' },
      { x: 2, z: 6, type: 'grass', obstacle: 'rock' },
      { x: 3, z: 6, type: 'grass' },
      { x: 4, z: 6, type: 'grass', obstacle: 'tree' },
      { x: 5, z: 6, type: 'grass' },
      { x: 6, z: 6, type: 'grass', obstacle: 'tree' },
    ]
  }
];
