// src/state/gameState.ts
export interface TakoyakiCellState {
  hasBatter: boolean;
  hasOctopus: boolean;
  flipped: boolean;
  startedAt: number | null;
  flippedAt: number | null;
  cookedLevel: 'raw' | 'flipped' | 'perfect' | 'burnt';
  movedToPlate: boolean;
}

export interface TakoyakiOnPlate {
  sauce: string | null;
  topping: string | null;
  cookedLevel: 'raw' | 'flipped' | 'perfect' | 'burnt';
}

export type Tool =
  | 'batter'
  | 'octopus'
  | 'stick'
  | 'sauce'
  | 'topping1'
  | 'topping2'
  | 'topping3'
  | 'serve';

// 게임 상태
export const gridState: TakoyakiCellState[][] = [];
export const plateState: TakoyakiOnPlate[] = [];
export const toolState = { current: 'batter' as Tool };

// 초기화
for (let row = 0; row < 3; row++) {
  gridState[row] = [];
  for (let col = 0; col < 3; col++) {
    gridState[row][col] = {
      hasBatter: false,
      hasOctopus: false,
      flipped: false,
      startedAt: null,
      flippedAt: null,
      cookedLevel: 'raw',
      movedToPlate: false,
    };
  }
}
