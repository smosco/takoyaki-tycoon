import type { CookingLevel, IronPanCellState } from './types';

export const TAKOYAKI_COOKING_TIMES = {
  PERFECT_TIME: 5000,
  BURNT_TIME: 10000,
} as const;

/**
 * 현재 익힘 상태를 계산합니다.
 * 뒤집기와 관계없이 총 요리 시간으로만 판단합니다.
 *
 * @param cellState - 철판 셀의 현재 상태
 * @param currentTime - 현재 시간 (밀리초)
 * @returns 계산된 익힘 정도 ('raw' | 'perfect' | 'burnt')
 */
export function calculateCurrentCookingLevel(
  cellState: IronPanCellState,
  currentTime: number
): CookingLevel {
  if (!cellState.hasBatter || !cellState.cookingStartTime) {
    return 'raw';
  }

  const totalCookingTime = currentTime - cellState.cookingStartTime;

  if (totalCookingTime < TAKOYAKI_COOKING_TIMES.PERFECT_TIME) {
    return 'raw';
  } else if (totalCookingTime < TAKOYAKI_COOKING_TIMES.BURNT_TIME) {
    return 'perfect';
  } else {
    return 'burnt';
  }
}
