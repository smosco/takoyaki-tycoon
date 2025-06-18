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

export interface TakoyakiOnPlate {
  sauce: Sauce | null; // 아직 없지만 예약
  topping: Topping | null; // 아직 없지만 예약
  cookedLevel: 'raw' | 'flipped' | 'perfect' | 'burnt';
}
