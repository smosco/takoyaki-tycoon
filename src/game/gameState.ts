// 타입 정의
export type ToolMode = 'batter' | 'octopus' | 'skewer' | 'sauce' | 'topping' | 'serve' | null;
export type CookedLevel = 'raw' | 'flipped' | 'undercooked' | 'perfect' | 'burnt';
export type Topping = 'mayo' | 'katsuobushi' | 'greenOnion';
export type Sauce = 'okonomiyaki';

export interface TakoyakiCellState {
  hasBatter: boolean;
  hasOctopus: boolean;
  flipped: boolean;
  startedAt: number | null;
  flippedAt: number | null;
  cookedLevel: CookedLevel;
  movedToPlate: boolean;
}

export interface TakoyakiOnPlate {
  sauce: Sauce | null;
  topping: Topping | null;
  cookedLevel: CookedLevel;
}

export interface Plate {
  id: number;
  takoyaki: TakoyakiOnPlate | null;
}

export interface Customer {
  id: string;
  requestCount: number;
  requestSauce: Sauce;
  requestToppings: Record<Topping, number>;
}

// 상태 정의
export let mode: ToolMode = null;
export const grid: TakoyakiCellState[] = Array.from({ length: 9 }, () => ({
  hasBatter: false,
  hasOctopus: false,
  flipped: false,
  startedAt: null,
  flippedAt: null,
  cookedLevel: 'raw',
  movedToPlate: false,
}));

export const plates: Plate[] = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  takoyaki: null,
}));

// 모드 토글
export function toggleMode(newMode: ToolMode) {
  mode = mode === newMode ? null : newMode;
}

// 철판 셀 클릭 핸들링
export function handleCellClick(index: number, now: number) {
  const cell = grid[index];

  if (mode === 'batter' && !cell.hasBatter) {
    cell.hasBatter = true;
    cell.startedAt = now;
    cell.cookedLevel = 'raw';
  } else if (mode === 'octopus' && cell.hasBatter && !cell.hasOctopus) {
    cell.hasOctopus = true;
  } else if (mode === 'skewer' && cell.hasBatter && cell.hasOctopus) {
    if (!cell.flipped) {
      cell.flipped = true;
      cell.flippedAt = now;
      cell.cookedLevel = 'flipped';
    } else if (!cell.movedToPlate) {
      const cookedLevel = calculateCookedLevel(cell.startedAt, cell.flippedAt, now);
      const availablePlate = plates.find((p) => p.takoyaki === null);
      if (availablePlate) {
        availablePlate.takoyaki = {
          sauce: null,
          topping: null,
          cookedLevel,
        };
        cell.movedToPlate = true;
      }
    }
  }
}

// 접시 클릭 핸들링
export function handlePlateClick(plateId: number, selectedSauce: Sauce, selectedTopping: Topping) {
  const plate = plates[plateId];
  if (!plate.takoyaki) return;

  if (mode === 'sauce' && !plate.takoyaki.sauce) {
    plate.takoyaki.sauce = selectedSauce;
  } else if (mode === 'topping' && !plate.takoyaki.topping) {
    plate.takoyaki.topping = selectedTopping;
  }
}

// 익힘 정도 계산
export function calculateCookedLevel(
  start: number | null,
  flipped: number | null,
  now: number
): CookedLevel {
  if (!start || !flipped) return 'raw';
  const timeFlipped = now - flipped;
  if (timeFlipped < 1000) return 'undercooked';
  if (timeFlipped < 3000) return 'perfect';
  return 'burnt';
}
