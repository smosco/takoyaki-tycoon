export type ToolMode = 'batter' | 'octopus' | 'stick' | 'sauce' | 'topping' | 'serve';

export interface TakoyakiCellState {
  hasBatter: boolean;
  hasOctopus: boolean;
  flipped: boolean;
  startedAt: number | null;
  flippedAt: number | null;
  cookedLevel: 'raw' | 'flipped' | 'perfect' | 'burnt';
  movedToPlate: boolean;
}
