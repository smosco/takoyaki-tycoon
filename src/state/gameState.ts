import type { TakoyakiCellState, ToolMode } from '../types';

export const toolState = {
  current: 'batter' as ToolMode,
};

export const gridState: TakoyakiCellState[][] = Array.from({ length: 3 }, () =>
  Array.from({ length: 3 }, () => ({
    hasBatter: false,
    hasOctopus: false,
    flipped: false,
    startedAt: null,
    flippedAt: null,
    cookedLevel: 'raw',
    movedToPlate: false,
  }))
);
