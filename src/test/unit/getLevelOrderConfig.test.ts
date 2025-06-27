import { describe, it, expect } from 'vitest';
import { getLevelOrderConfig } from '../../domain/order';

describe('getLevelOrderConfig', () => {
  describe('기본 레벨별 설정 계산', () => {
    it('레벨 1의 설정을 올바르게 계산해야 한다', () => {
      const config = getLevelOrderConfig(1);

      // minQuantity = Math.min(3 + Math.floor(1/2), 15) = Math.min(3 + 0, 15) = 3
      expect(config.minQuantity).toBe(3);

      // maxQuantity = Math.min(6 + 1*2, 27) = Math.min(8, 27) = 8
      expect(config.maxQuantity).toBe(8);

      // toppingComplexity = Math.min(0.2 + (1-1)*0.08, 1.0) = Math.min(0.2, 1.0) = 0.2
      expect(config.toppingComplexity).toBe(0.2);
    });

    it('레벨 2의 설정을 올바르게 계산해야 한다', () => {
      const config = getLevelOrderConfig(2);

      // minQuantity = Math.min(3 + Math.floor(2/2), 15) = Math.min(3 + 1, 15) = 4
      expect(config.minQuantity).toBe(4);

      // maxQuantity = Math.min(6 + 2*2, 27) = Math.min(10, 27) = 10
      expect(config.maxQuantity).toBe(10);

      // toppingComplexity = Math.min(0.2 + (2-1)*0.08, 1.0) = Math.min(0.28, 1.0) = 0.28
      expect(config.toppingComplexity).toBe(0.28);
    });

    it('레벨 5의 설정을 올바르게 계산해야 한다', () => {
      const config = getLevelOrderConfig(5);

      // minQuantity = Math.min(3 + Math.floor(5/2), 15) = Math.min(3 + 2, 15) = 5
      expect(config.minQuantity).toBe(5);

      // maxQuantity = Math.min(6 + 5*2, 27) = Math.min(16, 27) = 16
      expect(config.maxQuantity).toBe(16);

      // toppingComplexity = Math.min(0.2 + (5-1)*0.08, 1.0) = Math.min(0.52, 1.0) = 0.52
      expect(config.toppingComplexity).toBe(0.52);
    });

    it('레벨 10의 설정을 올바르게 계산해야 한다', () => {
      const config = getLevelOrderConfig(10);

      // minQuantity = Math.min(3 + Math.floor(10/2), 15) = Math.min(8, 15) = 8
      expect(config.minQuantity).toBe(8);

      // maxQuantity = Math.min(6 + 10*2, 27) = Math.min(26, 27) = 26
      expect(config.maxQuantity).toBe(26);

      // toppingComplexity = Math.min(0.2 + (10-1)*0.08, 1.0) = Math.min(0.92, 1.0) = 0.92
      expect(config.toppingComplexity).toBeCloseTo(0.92, 10);
    });
  });

  describe('최대값 제한 테스트', () => {
    it('minQuantity가 15를 넘지 않아야 한다', () => {
      const config20 = getLevelOrderConfig(20);
      const config50 = getLevelOrderConfig(50);
      const config100 = getLevelOrderConfig(100);

      expect(config20.minQuantity).toBe(13); // 3 + floor(20/2) = 13, but max is 15
      expect(config50.minQuantity).toBe(15); // 3 + floor(50/2) = 28, limited to 15
      expect(config100.minQuantity).toBe(15);
    });

    it('maxQuantity가 27을 넘지 않아야 한다', () => {
      const config15 = getLevelOrderConfig(15);
      const config20 = getLevelOrderConfig(20);
      const config50 = getLevelOrderConfig(50);

      expect(config15.maxQuantity).toBe(27); // 6 + 15*2 = 36, limited to 27
      expect(config20.maxQuantity).toBe(27); // 6 + 20*2 = 46, limited to 27
      expect(config50.maxQuantity).toBe(27);
    });

    it('toppingComplexity가 1.0을 넘지 않아야 한다', () => {
      // toppingComplexity = 0.2 + (level-1)*0.08 >= 1.0
      // (level-1)*0.08 >= 0.8
      // level-1 >= 10
      // level >= 11

      const config11 = getLevelOrderConfig(11);
      const config20 = getLevelOrderConfig(20);
      const config50 = getLevelOrderConfig(50);

      expect(config11.toppingComplexity).toBe(1.0); // 0.2 + 10*0.08 = 1.0
      expect(config20.toppingComplexity).toBe(1.0); // limited to 1.0
      expect(config50.toppingComplexity).toBe(1.0); // limited to 1.0
    });
  });

  describe('공식 검증 테스트', () => {
    it('minQuantity 공식이 올바르게 동작해야 한다', () => {
      const testCases = [
        { level: 1, expected: 3 }, // 3 + floor(1/2) = 3 + 0 = 3
        { level: 3, expected: 4 }, // 3 + floor(3/2) = 3 + 1 = 4
        { level: 4, expected: 5 }, // 3 + floor(4/2) = 3 + 2 = 5
        { level: 6, expected: 6 }, // 3 + floor(6/2) = 3 + 3 = 6
        { level: 24, expected: 15 }, // 3 + floor(24/2) = 3 + 12 = 15 (max)
      ];

      testCases.forEach(({ level, expected }) => {
        const config = getLevelOrderConfig(level);
        expect(config.minQuantity).toBe(expected);
      });
    });

    it('maxQuantity 공식이 올바르게 동작해야 한다', () => {
      const testCases = [
        { level: 1, expected: 8 }, // 6 + 1*2 = 8
        { level: 3, expected: 12 }, // 6 + 3*2 = 12
        { level: 5, expected: 16 }, // 6 + 5*2 = 16
        { level: 10, expected: 26 }, // 6 + 10*2 = 26
        { level: 11, expected: 27 }, // 6 + 11*2 = 28, limited to 27
      ];

      testCases.forEach(({ level, expected }) => {
        const config = getLevelOrderConfig(level);
        expect(config.maxQuantity).toBe(expected);
      });
    });

    it('toppingComplexity 공식이 올바르게 동작해야 한다', () => {
      const testCases = [
        { level: 1, expected: 0.2 }, // 0.2 + (1-1)*0.08 = 0.2
        { level: 2, expected: 0.28 }, // 0.2 + (2-1)*0.08 = 0.28
        { level: 5, expected: 0.52 }, // 0.2 + (5-1)*0.08 = 0.52
        { level: 10, expected: 0.92 }, // 0.2 + (10-1)*0.08 = 0.92
        { level: 11, expected: 1.0 }, // 0.2 + (11-1)*0.08 = 1.0
        { level: 15, expected: 1.0 }, // limited to 1.0
      ];

      testCases.forEach(({ level, expected }) => {
        const config = getLevelOrderConfig(level);
        expect(config.toppingComplexity).toBeCloseTo(expected, 10);
      });
    });
  });

  describe('에지 케이스', () => {
    it('레벨 0에서도 유효한 설정을 반환해야 한다', () => {
      const config = getLevelOrderConfig(0);

      // minQuantity = Math.min(3 + Math.floor(0/2), 15) = 3
      expect(config.minQuantity).toBe(3);

      // maxQuantity = Math.min(6 + 0*2, 27) = 6
      expect(config.maxQuantity).toBe(6);

      // toppingComplexity = Math.min(0.2 + (0-1)*0.08, 1.0) = Math.min(0.12, 1.0) = 0.12
      expect(Number(config.toppingComplexity.toFixed(2))).toBe(0.12);
    });

    it('음수 레벨에서도 처리해야 한다', () => {
      const config = getLevelOrderConfig(-1);

      // minQuantity = Math.min(3 + Math.floor(-1/2), 15) = Math.min(3 + (-1), 15) = 2
      expect(config.minQuantity).toBe(2);

      // maxQuantity = Math.min(6 + (-1)*2, 27) = Math.min(4, 27) = 4
      expect(config.maxQuantity).toBe(4);

      // toppingComplexity = Math.min(0.2 + (-1-1)*0.08, 1.0) = Math.min(0.04, 1.0) = 0.04
      expect(Number(config.toppingComplexity)).toBeCloseTo(0.04);
    });

    it('매우 큰 레벨에서 모든 제한이 적용되어야 한다', () => {
      const config = getLevelOrderConfig(1000);

      expect(config.minQuantity).toBe(15); // 최대 제한
      expect(config.maxQuantity).toBe(27); // 최대 제한
      expect(config.toppingComplexity).toBe(1.0); // 최대 제한
    });

    it('소수점 레벨에서도 동작해야 한다', () => {
      const config = getLevelOrderConfig(2.7);

      // Math.floor(2.7/2) = Math.floor(1.35) = 1
      expect(config.minQuantity).toBe(4); // 3 + 1 = 4

      // 6 + 2.7*2 = 6 + 5.4 = 11.4, Math.min으로 정수가 되지는 않지만...
      expect(config.maxQuantity).toBe(11.4);

      // 0.2 + (2.7-1)*0.08 = 0.2 + 1.7*0.08 = 0.2 + 0.136 = 0.336
      expect(config.toppingComplexity).toBeCloseTo(0.336, 10);
    });
  });

  describe('반환 객체 구조 검증', () => {
    it('올바른 속성들을 가진 객체를 반환해야 한다', () => {
      const config = getLevelOrderConfig(5);

      expect(config).toHaveProperty('minQuantity');
      expect(config).toHaveProperty('maxQuantity');
      expect(config).toHaveProperty('toppingComplexity');

      expect(typeof config.minQuantity).toBe('number');
      expect(typeof config.maxQuantity).toBe('number');
      expect(typeof config.toppingComplexity).toBe('number');
    });

    it('minQuantity가 maxQuantity보다 작거나 같아야 한다', () => {
      const testLevels = [0, 1, 5, 10, 20, 50, 100];

      testLevels.forEach((level) => {
        const config = getLevelOrderConfig(level);
        expect(config.minQuantity).toBeLessThanOrEqual(config.maxQuantity);
      });
    });

    it('모든 값이 양수여야 한다', () => {
      const config = getLevelOrderConfig(5);

      expect(config.minQuantity).toBeGreaterThan(0);
      expect(config.maxQuantity).toBeGreaterThan(0);
      expect(config.toppingComplexity).toBeGreaterThanOrEqual(0);
    });
  });
});
