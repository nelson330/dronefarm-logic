export type Direction = 0 | 1 | 2 | 3; // 0: North (-Z / Up), 1: East (+X / Right), 2: South (+Z / Down), 3: West (-X / Left)

export const DIRECTION_NAMES: Record<Direction, string> = {
  0: 'Norte ↑',
  1: 'Este →',
  2: 'Sur ↓',
  3: 'Oeste ←'
};

export const DIRECTION_OFFSETS: Record<Direction, { dx: number; dz: number }> = {
  0: { dx: 0, dz: -1 }, // North
  1: { dx: 1, dz: 0 },  // East
  2: { dx: 0, dz: 1 },  // South
  3: { dx: -1, dz: 0 }  // West
};

export interface DroneState {
  x: number;
  z: number;
  facing: Direction; // 0, 1, 2, 3
  isFlying: boolean;
  statusText: string;
}

export type TileType = 'soil' | 'grass' | 'water' | 'path';
export type ObstacleType = 'rock' | 'tree' | 'fence' | 'windmill';

export interface FarmTile {
  x: number;
  z: number;
  type: TileType;
  obstacle?: ObstacleType;
  hasCarrot?: boolean;
  hasCrystal?: boolean;
  isTarget?: boolean;
}

export type ActionCommand =
  | { type: 'MOVE_FORWARD'; units: number; blockId?: string }
  | { type: 'TURN'; direction: 'RIGHT' | 'LEFT'; blockId?: string }
  | { type: 'WAIT'; seconds: number; blockId?: string }
  | { type: 'HARVEST'; blockId?: string }
  | { type: 'ANALYZE'; blockId?: string };

export type MissionDifficulty = 'tutorial' | 'facil' | 'medio' | 'dificil' | 'sandbox';

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty?: MissionDifficulty;
  gridSize: { width: number; height: number };
  initialDrone: { x: number; z: number; facing: Direction };
  tiles: FarmTile[];
  targetCarrots: number;
  hint: string;
  allowedBlocks: string[];
  starterWorkspaceXml?: string;
}
