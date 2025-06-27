import { describe, it, expect } from 'vitest';
import { calculateCurrentCookingLevel, TAKOYAKI_COOKING_TIMES } from '../domain/cooking';
import type { IronPanCellState } from '../domain/types';

describe('calculateCurrentCookingLevel', () => {
  const baseTime = 1000; // 기준 시간

  // 헬퍼 함수: 기본 셀 상태 생성
  const createCellState = (overrides: Partial<IronPanCellState> = {}): IronPanCellState => ({
    hasBatter: true,
    hasOctopus: false,
    cookingStartTime: baseTime,
    isFlipped: false,
    cookingLevel: 'raw',
    isMovedToPlate: false,
    ...overrides,
  });

  describe('초기 상태 및 경계 조건', () => {
    it('반죽이 없는 경우 raw를 반환해야 한다', () => {
      const cellState = createCellState({ hasBatter: false });
      const result = calculateCurrentCookingLevel(
        cellState,
        baseTime + TAKOYAKI_COOKING_TIMES.PERFECT_TIME
      );

      expect(result).toBe('raw');
    });

    it('요리 시작 시간이 없는 경우 raw를 반환해야 한다', () => {
      const cellState = createCellState({ cookingStartTime: null });
      const result = calculateCurrentCookingLevel(
        cellState,
        baseTime + TAKOYAKI_COOKING_TIMES.PERFECT_TIME
      );

      expect(result).toBe('raw');
    });

    it('반죽도 없고 시작 시간도 없는 경우 raw를 반환해야 한다', () => {
      const cellState = createCellState({
        hasBatter: false,
        cookingStartTime: null,
      });
      const result = calculateCurrentCookingLevel(
        cellState,
        baseTime + TAKOYAKI_COOKING_TIMES.PERFECT_TIME
      );

      expect(result).toBe('raw');
    });
  });

  describe('요리 시간에 따른 상태 변화', () => {
    it('요리 시간이 0일 때 raw를 반환해야 한다', () => {
      const cellState = createCellState();
      const result = calculateCurrentCookingLevel(cellState, baseTime);

      expect(result).toBe('raw');
    });

    it('완벽한 시간보다 1ms 적을 때 raw를 반환해야 한다', () => {
      const cellState = createCellState();
      const currentTime = baseTime + TAKOYAKI_COOKING_TIMES.PERFECT_TIME - 1;
      const result = calculateCurrentCookingLevel(cellState, currentTime);

      expect(result).toBe('raw');
    });

    it('정확히 완벽한 시간일 때 perfect를 반환해야 한다', () => {
      const cellState = createCellState();
      const currentTime = baseTime + TAKOYAKI_COOKING_TIMES.PERFECT_TIME;
      const result = calculateCurrentCookingLevel(cellState, currentTime);

      expect(result).toBe('perfect');
    });

    it('완벽한 시간과 탄 시간 사이일 때 perfect를 반환해야 한다', () => {
      const cellState = createCellState();
      const midTime = (TAKOYAKI_COOKING_TIMES.PERFECT_TIME + TAKOYAKI_COOKING_TIMES.BURNT_TIME) / 2;
      const currentTime = baseTime + midTime;
      const result = calculateCurrentCookingLevel(cellState, currentTime);

      expect(result).toBe('perfect');
    });

    it('탄 시간보다 1ms 적을 때 perfect를 반환해야 한다', () => {
      const cellState = createCellState();
      const currentTime = baseTime + TAKOYAKI_COOKING_TIMES.BURNT_TIME - 1;
      const result = calculateCurrentCookingLevel(cellState, currentTime);

      expect(result).toBe('perfect');
    });

    it('정확히 탄 시간일 때 burnt를 반환해야 한다', () => {
      const cellState = createCellState();
      const currentTime = baseTime + TAKOYAKI_COOKING_TIMES.BURNT_TIME;
      const result = calculateCurrentCookingLevel(cellState, currentTime);

      expect(result).toBe('burnt');
    });

    it('탄 시간을 훨씬 넘었을 때 burnt를 반환해야 한다', () => {
      const cellState = createCellState();
      const currentTime = baseTime + TAKOYAKI_COOKING_TIMES.BURNT_TIME + 10000;
      const result = calculateCurrentCookingLevel(cellState, currentTime);

      expect(result).toBe('burnt');
    });
  });
});
