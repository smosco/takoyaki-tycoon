import { describe, it, expect } from 'vitest';
import { calculateCompletionBonus } from '../../domain/order';

describe('calculateCompletionBonus', () => {
  describe('기분에 따른 보너스 계산', () => {
    it('happy 상태일 때 올바른 보너스를 계산해야 한다', () => {
      expect(calculateCompletionBonus('happy', 1)).toBe(50);
      expect(calculateCompletionBonus('happy', 5)).toBe(250);
      expect(calculateCompletionBonus('happy', 10)).toBe(500);
      expect(calculateCompletionBonus('happy', 15)).toBe(750);
    });

    it('neutral 상태일 때 보너스가 0이어야 한다', () => {
      expect(calculateCompletionBonus('neutral', 1)).toBe(0);
      expect(calculateCompletionBonus('neutral', 5)).toBe(0);
      expect(calculateCompletionBonus('neutral', 10)).toBe(0);
      expect(calculateCompletionBonus('neutral', 100)).toBe(0);
    });

    it('angry 상태일 때 보너스가 0이어야 한다', () => {
      expect(calculateCompletionBonus('angry', 1)).toBe(0);
      expect(calculateCompletionBonus('angry', 5)).toBe(0);
      expect(calculateCompletionBonus('angry', 10)).toBe(0);
      expect(calculateCompletionBonus('angry', 100)).toBe(0);
    });
  });

  describe('수량별 보너스 계산', () => {
    it('수량이 0일 때는 항상 0이어야 한다', () => {
      expect(calculateCompletionBonus('happy', 0)).toBe(0);
      expect(calculateCompletionBonus('neutral', 0)).toBe(0);
      expect(calculateCompletionBonus('angry', 0)).toBe(0);
    });

    it('큰 수량에서도 올바르게 계산해야 한다', () => {
      expect(calculateCompletionBonus('happy', 20)).toBe(1000);
      expect(calculateCompletionBonus('happy', 50)).toBe(2500);
      expect(calculateCompletionBonus('happy', 100)).toBe(5000);
    });
  });
});
