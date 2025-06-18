// 소스 타입 정의
export type Sauce = 'okonomiyaki';

// 토핑 타입 정의
export type Topping = 'mayo' | 'katsuobushi' | 'nori';

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
export interface IronPanCellState {
  hasBatter: boolean;
  hasOctopus: boolean;
  isFlipped: boolean;
  cookingStartTime: number | null;
  flipTime: number | null;
  cookingLevel: 'raw' | 'perfect' | 'burnt';
  isMovedToPlate: boolean;
}

// 접시 위 타코야끼 상태
export interface TakoyakiOnPlate {
  sauce: Sauce | null;
  topping: Topping | null;
  cookingLevel: 'raw' | 'perfect' | 'burnt';
}

// 게임 상태
export const ironPanCells: IronPanCellState[][] = [];
export const platesWithTakoyaki: TakoyakiOnPlate[] = [];
export const currentSelectedTool = { current: 'batter' as Tool };

// 도구와 실제 소스/토핑 매핑 (더 명확한 이름)
export const toolToActualSauce: Record<string, Sauce> = {
  sauce: 'okonomiyaki',
};

export const toolToActualTopping: Record<string, Topping> = {
  topping1: 'mayo',
  topping2: 'katsuobushi',
  topping3: 'nori',
};

// 익힘 시간 설정 (밀리초)
export const TAKOYAKI_COOKING_TIMES = {
  FIRST_SIDE_PERFECT: 3000,
  FIRST_SIDE_BURNT: 6000,
  SECOND_SIDE_PERFECT: 2000,
  SECOND_SIDE_BURNT: 4000,
} as const;

// 현재 익힘 상태 계산 함수
export function calculateCurrentCookingLevel(
  cellState: IronPanCellState,
  currentTime: number
): 'raw' | 'perfect' | 'burnt' {
  if (!cellState.hasBatter || !cellState.cookingStartTime) {
    return 'raw';
  }

  const totalCookingTime = currentTime - cellState.cookingStartTime;

  if (!cellState.isFlipped) {
    // 첫 번째 면 익히는 중
    if (totalCookingTime < TAKOYAKI_COOKING_TIMES.FIRST_SIDE_PERFECT) {
      return 'raw';
    } else if (totalCookingTime < TAKOYAKI_COOKING_TIMES.FIRST_SIDE_BURNT) {
      return 'perfect';
    } else {
      return 'burnt';
    }
  } else {
    // 뒤집힌 후 두 번째 면 익히는 중
    if (!cellState.flipTime) return 'raw';

    const secondSideCookingTime = currentTime - cellState.flipTime;

    if (secondSideCookingTime < TAKOYAKI_COOKING_TIMES.SECOND_SIDE_PERFECT) {
      return 'raw';
    } else if (secondSideCookingTime < TAKOYAKI_COOKING_TIMES.SECOND_SIDE_BURNT) {
      return 'perfect';
    } else {
      return 'burnt';
    }
  }
}

// 익힘 상태에 따른 색상 반환
export function getTakoyakiColorByCookingLevel(
  cookingLevel: 'raw' | 'perfect' | 'burnt',
  isFlipped: boolean
): number {
  if (!isFlipped) {
    // 첫 번째 면
    switch (cookingLevel) {
      case 'raw':
        return 0xdaa520; // 노란색 (반죽)
      case 'perfect':
        return 0xcd853f; // 주황색 (적당히 익음)
      case 'burnt':
        return 0x654321; // 갈색 (탐)
    }
  } else {
    // 뒤집힌 후
    switch (cookingLevel) {
      case 'raw':
        return 0xdaa520;
      case 'perfect':
        return 0xcd853f;
      case 'burnt':
        return 0x654321;
    }
  }
}

// 초기화
for (let row = 0; row < 3; row++) {
  ironPanCells[row] = [];
  for (let col = 0; col < 3; col++) {
    ironPanCells[row][col] = {
      hasBatter: false,
      hasOctopus: false,
      isFlipped: false,
      cookingStartTime: null,
      flipTime: null,
      cookingLevel: 'raw',
      isMovedToPlate: false,
    };
  }
}
