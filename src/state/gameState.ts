// 소스 타입 정의
export type Sauce = 'okonomiyaki' | 'mayo-sauce' | 'teriyaki';

// 토핑 타입 정의
export type Topping = 'mayo' | 'katsuobushi' | 'nori' | 'aonori';

// 도구 타입 정의
export type Tool =
  | 'batter'
  | 'octopus'
  | 'stick'
  | 'sauce'
  | 'topping1' // mayo
  | 'topping2' // katsuobushi
  | 'topping3' // nori
  | 'serve';

// 철판 셀 상태
export interface TakoyakiCellState {
  hasBatter: boolean;
  hasOctopus: boolean;
  flipped: boolean;
  startedAt: number | null;
  flippedAt: number | null;
  cookedLevel: 'raw' | 'flipped' | 'perfect' | 'burnt';
  movedToPlate: boolean;
}

// 접시 위 타코야끼 상태
export interface TakoyakiOnPlate {
  sauce: Sauce | null;
  topping: Topping | null;
  cookedLevel: 'raw' | 'flipped' | 'perfect' | 'burnt';
}

// 게임 상태
export const cellState: TakoyakiCellState[][] = [];
export const plateState: TakoyakiOnPlate[] = [];
export const toolState = { current: 'batter' as Tool };

// 도구와 실제 소스/토핑 매핑
export const toolToSauce: Record<string, Sauce> = {
  sauce: 'okonomiyaki', // 기본 소스
};

export const toolToTopping: Record<string, Topping> = {
  topping1: 'mayo',
  topping2: 'katsuobushi',
  topping3: 'nori',
};

// 초기화
for (let row = 0; row < 3; row++) {
  cellState[row] = [];
  for (let col = 0; col < 3; col++) {
    cellState[row][col] = {
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
