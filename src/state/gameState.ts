export type Sauce = 'okonomiyaki';
export type Topping = 'mayo' | 'katsuobushi' | 'nori';
export type CookingLevel = 'raw' | 'perfect' | 'burnt';

export type Tool =
  | 'batter'
  | 'octopus'
  | 'stick'
  | 'sauce'
  | 'mayo'
  | 'katsuobushi'
  | 'nori'
  | 'serve';

// 철판 각 셀 상태
// TODO: 셀과 타코야끼 상태가 뭔가 겹치는것 같아서 불편
export interface IronPanCellState {
  hasBatter: boolean;
  hasOctopus: boolean;
  isFlipped: boolean;
  cookingStartTime: number | null;
  cookingLevel: CookingLevel;
  isMovedToPlate: boolean;
}

// TODO: 접시 위 타코야끼 상태가 따로 존재 이게 베스트인가?
export interface TakoyakiOnPlate {
  sauce: Sauce | null;
  topping: Topping | null;
  cookingLevel: CookingLevel;
}

export const ironPanCells: IronPanCellState[][] = [];
export const platesWithTakoyaki: TakoyakiOnPlate[] = [];
export const currentSelectedTool = { current: 'batter' as Tool };

export const TAKOYAKI_COOKING_TIMES = {
  PERFECT_TIME: 3000, // 3초 후 완벽하게 익음
  BURNT_TIME: 6000, // 6초 후 탐
} as const;

/**
 * 익힘 정도를 계산하는 함수
 */
export function calculateCurrentCookingLevel(
  cellState: IronPanCellState,
  currentTime: number
): CookingLevel {
  if (!cellState.hasBatter || !cellState.cookingStartTime) {
    return 'raw';
  }

  // 뒤집기와 관계없이 총 요리 시간으로만 판단
  const totalCookingTime = currentTime - cellState.cookingStartTime;

  if (totalCookingTime < TAKOYAKI_COOKING_TIMES.PERFECT_TIME) {
    return 'raw';
  } else if (totalCookingTime < TAKOYAKI_COOKING_TIMES.BURNT_TIME) {
    return 'perfect';
  } else {
    return 'burnt';
  }
}

/**
 * 익힘 정도에 따른 타코야끼 색 변화 함수
 */
export function getTakoyakiColorByCookingLevel(cookingLevel: CookingLevel): number {
  // 뒤집기 여부와 관계없이 익힘 상태로만 색상 결정
  switch (cookingLevel) {
    case 'raw':
      return 0xdaa520; // 노란색 (반죽)
    case 'perfect':
      return 0xcd853f; // 주황색 (적당히 익음)
    case 'burnt':
      return 0x654321; // 갈색 (탐)
  }
}

export function isTopping(tool: Tool): tool is Topping {
  return tool === 'mayo' || tool === 'katsuobushi' || tool === 'nori';
}

// 초기화 (기존과 동일)
for (let row = 0; row < 3; row++) {
  ironPanCells[row] = [];
  for (let col = 0; col < 3; col++) {
    ironPanCells[row][col] = {
      hasBatter: false,
      hasOctopus: false,
      isFlipped: false,
      cookingStartTime: null,
      cookingLevel: 'raw',
      isMovedToPlate: false,
    };
  }
}
