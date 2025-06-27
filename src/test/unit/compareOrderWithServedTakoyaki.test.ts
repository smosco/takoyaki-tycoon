import { describe, it, expect } from 'vitest';
import { compareOrderWithServedTakoyaki } from '../../domain/order';
import type { CustomerOrder, TakoyakiOnPlate } from '../../domain/types';

describe('compareOrderWithServedTakoyaki', () => {
  /**
   * 주문 생성 헬퍼 함수 : 타코야끼 3개(파:1, 가츠오:1, 김:1)
   *
   * @param {Partial<CustomerOrder>} [overrides={}]
   * @returns {CustomerOrder}
   */
  const createOrder = (overrides: Partial<CustomerOrder> = {}): CustomerOrder => ({
    totalQuantity: 3,
    remainingQuantity: 3,
    toppingBreakdown: { negi: 1, katsuobushi: 1, nori: 1, none: 0 },
    remainingToppingBreakdown: { negi: 1, katsuobushi: 1, nori: 1, none: 0 },
    ...overrides,
  });

  /**
   * 타코야끼 만드는 헬퍼 함수: 소스 o, 익힘 정도 perfect, 토핑 negi
   *
   * @param {Partial<TakoyakiOnPlate>} [overrides={}]
   * @returns {TakoyakiOnPlate}
   */
  const createTakoyaki = (overrides: Partial<TakoyakiOnPlate> = {}): TakoyakiOnPlate => ({
    sauce: true,
    cookingLevel: 'perfect',
    topping: 'negi',
    ...overrides,
  });

  describe('완벽한 주문 처리', () => {
    it('모든 조건이 맞는 완벽한 주문 시 최고 점수를 받아야 한다', () => {
      const order = createOrder();
      const servedTakoyaki = [
        createTakoyaki({ topping: 'negi' }),
        createTakoyaki({ topping: 'katsuobushi' }),
        createTakoyaki({ topping: 'nori' }),
      ];

      const result = compareOrderWithServedTakoyaki(
        order,
        servedTakoyaki,
        80, // happy mood
        'happy',
        true // completed
      );

      expect(result.correctCount).toBe(3);
      expect(result.servedCount).toBe(3);
      expect(result.score).toBe(450); // 300 (기본) + 150 (보너스: 3 * 50)
      expect(result.bonusScore).toBe(150);
      expect(result.mood).toBe('happy');
      expect(result.breakdown.sauceIssues).toBe(0);
      expect(result.breakdown.cookingIssues).toBe(0);
    });

    it('토핑 없는(none) 주문도 완벽하게 처리해야 한다', () => {
      const order = createOrder({
        toppingBreakdown: { negi: 0, katsuobushi: 0, nori: 0, none: 2 },
        remainingToppingBreakdown: { negi: 0, katsuobushi: 0, nori: 0, none: 2 },
        totalQuantity: 2,
      });
      const servedTakoyaki = [createTakoyaki({ topping: null }), createTakoyaki({ topping: null })];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.correctCount).toBe(2);
      expect(result.breakdown.none.correct).toBe(2);
      expect(result.score).toBe(200); // 2 * 100
    });
  });

  describe('소스 관련 테스트', () => {
    it('소스가 없는 타코야끼는 sauceIssues로 분류되어야 한다', () => {
      const order = createOrder();
      const servedTakoyaki = [
        createTakoyaki({ sauce: false, topping: 'negi' }),
        createTakoyaki({ sauce: false, topping: 'katsuobushi' }),
        createTakoyaki({ topping: 'nori' }), // 정상
      ];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.breakdown.sauceIssues).toBe(2);
      expect(result.correctCount).toBe(1); // 정상인 것만 카운트
      expect(result.servedCount).toBe(3);
    });
  });

  describe('조리 상태 관련 테스트', () => {
    it('잘못 조리된 타코야끼는 cookingIssues로 분류되어야 한다', () => {
      const order = createOrder();
      const servedTakoyaki = [
        createTakoyaki({ cookingLevel: 'burnt', topping: 'negi' }),
        createTakoyaki({ cookingLevel: 'raw', topping: 'katsuobushi' }),
        createTakoyaki({ cookingLevel: 'perfect', topping: 'nori' }), // 정상
      ];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.breakdown.cookingIssues).toBe(2);
      expect(result.correctCount).toBe(1);
      expect(result.servedCount).toBe(3);
    });

    it('소스와 조리 문제가 동시에 있는 경우 소스 문제가 우선되어야 한다', () => {
      const order = createOrder();
      const servedTakoyaki = [
        createTakoyaki({ sauce: false, cookingLevel: 'burnt', topping: 'negi' }),
      ];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.breakdown.sauceIssues).toBe(1);
      expect(result.breakdown.cookingIssues).toBe(0); // 소스 문제가 먼저 체크되므로
      expect(result.correctCount).toBe(0);
    });
  });

  describe('토핑 매칭 로직', () => {
    it('요청된 토핑보다 많이 서빙해도 초과분은 카운트하지 않아야 한다', () => {
      const order = createOrder({
        toppingBreakdown: { negi: 1, katsuobushi: 0, nori: 0, none: 0 },
        remainingToppingBreakdown: { negi: 1, katsuobushi: 0, nori: 0, none: 0 },
        totalQuantity: 1,
      });
      const servedTakoyaki = [
        createTakoyaki({ topping: 'negi' }),
        createTakoyaki({ topping: 'negi' }), // 초과분
        createTakoyaki({ topping: 'negi' }), // 초과분
      ];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.breakdown.negi.correct).toBe(1);
      expect(result.breakdown.negi.requested).toBe(1);
      expect(result.correctCount).toBe(1);
      expect(result.servedCount).toBe(3);
    });

    it('각 토핑 타입별로 올바르게 매칭되어야 한다', () => {
      const order = createOrder({
        toppingBreakdown: { negi: 2, katsuobushi: 1, nori: 1, none: 1 },
        remainingToppingBreakdown: { negi: 2, katsuobushi: 1, nori: 1, none: 1 },
        totalQuantity: 5,
      });
      const servedTakoyaki = [
        createTakoyaki({ topping: 'negi' }),
        createTakoyaki({ topping: 'negi' }),
        createTakoyaki({ topping: 'katsuobushi' }),
        createTakoyaki({ topping: 'nori' }),
        createTakoyaki({ topping: null }),
      ];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.breakdown.negi.correct).toBe(2);
      expect(result.breakdown.katsuobushi.correct).toBe(1);
      expect(result.breakdown.nori.correct).toBe(1);
      expect(result.breakdown.none.correct).toBe(1);
      expect(result.correctCount).toBe(5);
    });

    it('잘못된 토핑은 카운트되지 않아야 한다', () => {
      const order = createOrder({
        toppingBreakdown: { negi: 1, katsuobushi: 0, nori: 0, none: 0 },
        remainingToppingBreakdown: { negi: 1, katsuobushi: 0, nori: 0, none: 0 },
        totalQuantity: 1,
      });
      const servedTakoyaki = [
        createTakoyaki({ topping: 'katsuobushi' }), // 요청하지 않은 토핑
        createTakoyaki({ topping: 'nori' }), // 요청하지 않은 토핑
      ];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.breakdown.negi.correct).toBe(0);
      expect(result.breakdown.katsuobushi.correct).toBe(0);
      expect(result.breakdown.nori.correct).toBe(0);
      expect(result.correctCount).toBe(0);
      expect(result.servedCount).toBe(2);
    });
  });

  describe('인내심에 따른 기분 계산', () => {
    const order = createOrder();
    const servedTakoyaki = [createTakoyaki()];

    it('인내심 60 이상일 때 happy여야 한다', () => {
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 60).mood).toBe('happy');
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 80).mood).toBe('happy');
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 100).mood).toBe('happy');
    });

    it('인내심 30-59일 때 neutral이어야 한다', () => {
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 30).mood).toBe('neutral');
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 45).mood).toBe('neutral');
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 59).mood).toBe('neutral');
    });

    it('인내심 30 미만일 때 angry여야 한다', () => {
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 29).mood).toBe('angry');
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 15).mood).toBe('angry');
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 0).mood).toBe('angry');
    });

    it('경계값에서 올바르게 동작해야 한다', () => {
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 59.9).mood).toBe('neutral');
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 60).mood).toBe('happy');
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 29.9).mood).toBe('angry');
      expect(compareOrderWithServedTakoyaki(order, servedTakoyaki, 30).mood).toBe('neutral');
    });
  });

  describe('보너스 점수 계산', () => {
    const order = createOrder({ totalQuantity: 5 });
    const servedTakoyaki = [createTakoyaki()];

    it('주문이 완료되지 않으면 보너스가 없어야 한다', () => {
      const result = compareOrderWithServedTakoyaki(
        order,
        servedTakoyaki,
        80,
        'happy',
        false // not completed
      );

      expect(result.bonusScore).toBe(0);
      expect(result.score).toBe(100); // 기본 점수만
    });

    it('주문이 완료되었지만 finalMood가 없으면 보너스가 없어야 한다', () => {
      const result = compareOrderWithServedTakoyaki(
        order,
        servedTakoyaki,
        80,
        undefined, // no finalMood
        true // completed
      );

      expect(result.bonusScore).toBe(0);
      expect(result.score).toBe(100);
    });

    it('주문이 완료되고 happy 상태이면 보너스를 받아야 한다', () => {
      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80, 'happy', true);

      expect(result.bonusScore).toBe(250); // 5 * 50
      expect(result.score).toBe(350); // 100 + 250
    });

    it('완료되었지만 neutral/angry 상태이면 보너스가 없어야 한다', () => {
      const neutralResult = compareOrderWithServedTakoyaki(
        order,
        servedTakoyaki,
        80,
        'neutral',
        true
      );
      const angryResult = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80, 'angry', true);

      expect(neutralResult.bonusScore).toBe(0);
      expect(angryResult.bonusScore).toBe(0);
    });
  });

  describe('점수 계산', () => {
    it('기본 점수는 correctCount * 100이어야 한다', () => {
      const order = createOrder({
        toppingBreakdown: { negi: 3, katsuobushi: 0, nori: 0, none: 0 },
        remainingToppingBreakdown: { negi: 3, katsuobushi: 0, nori: 0, none: 0 },
        totalQuantity: 3,
      });
      const servedTakoyaki = [
        createTakoyaki({ topping: 'negi' }),
        createTakoyaki({ topping: 'negi' }),
      ];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 50);

      expect(result.correctCount).toBe(2);
      expect(result.score).toBe(200); // 2 * 100, no bonus
      expect(result.bonusScore).toBe(0);
    });

    it('전체 점수는 기본 점수 + 보너스 점수여야 한다', () => {
      const order = createOrder({ totalQuantity: 4 });
      const servedTakoyaki = [
        createTakoyaki({ topping: 'negi' }),
        createTakoyaki({ topping: 'katsuobushi' }),
        createTakoyaki({ topping: 'nori' }),
      ];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80, 'happy', true);

      const expectedBaseScore = 3 * 100; // 300
      const expectedBonusScore = 4 * 50; // 200
      const expectedTotalScore = expectedBaseScore + expectedBonusScore; // 500

      expect(result.score).toBe(expectedTotalScore);
      expect(result.bonusScore).toBe(expectedBonusScore);
    });
  });

  describe('breakdown 정보 검증', () => {
    it('breakdown이 주문 정보를 올바르게 반영해야 한다', () => {
      const order = createOrder({
        toppingBreakdown: { negi: 2, katsuobushi: 1, nori: 0, none: 1 },
        remainingToppingBreakdown: { negi: 2, katsuobushi: 1, nori: 0, none: 1 },
      });
      const servedTakoyaki = [createTakoyaki({ topping: 'negi' })];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.breakdown.negi.requested).toBe(2);
      expect(result.breakdown.katsuobushi.requested).toBe(1);
      expect(result.breakdown.nori.requested).toBe(0);
      expect(result.breakdown.none.requested).toBe(1);

      expect(result.breakdown.negi.correct).toBe(1);
      expect(result.breakdown.katsuobushi.correct).toBe(0);
      expect(result.breakdown.nori.correct).toBe(0);
      expect(result.breakdown.none.correct).toBe(0);
    });

    it('문제 카운트가 올바르게 집계되어야 한다', () => {
      const order = createOrder();
      const servedTakoyaki = [
        createTakoyaki({ sauce: false }), // sauce issue
        createTakoyaki({ cookingLevel: 'burnt' }), // cooking issue
        createTakoyaki(), // normal
      ];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.breakdown.sauceIssues).toBe(1);
      expect(result.breakdown.cookingIssues).toBe(1);
    });
  });

  describe('에지 케이스', () => {
    it('서빙된 타코야끼가 없어도 오류가 발생하지 않아야 한다', () => {
      const order = createOrder();
      const result = compareOrderWithServedTakoyaki(order, [], 80);

      expect(result.servedCount).toBe(0);
      expect(result.correctCount).toBe(0);
      expect(result.score).toBe(0);
      expect(result.breakdown.sauceIssues).toBe(0);
      expect(result.breakdown.cookingIssues).toBe(0);
    });

    it('주문 수량이 0이어도 처리해야 한다', () => {
      const order = createOrder({
        totalQuantity: 0,
        toppingBreakdown: { negi: 0, katsuobushi: 0, nori: 0, none: 0 },
        remainingToppingBreakdown: { negi: 0, katsuobushi: 0, nori: 0, none: 0 },
      });
      const servedTakoyaki = [createTakoyaki()];

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.correctCount).toBe(0);
      expect(result.servedCount).toBe(1);
      expect(result.score).toBe(0);
    });

    it('매우 많은 서빙에서도 올바르게 동작해야 한다', () => {
      const order = createOrder({
        toppingBreakdown: { negi: 1, katsuobushi: 0, nori: 0, none: 0 },
        remainingToppingBreakdown: { negi: 1, katsuobushi: 0, nori: 0, none: 0 },
        totalQuantity: 1,
      });
      const servedTakoyaki = Array(100)
        .fill(null)
        .map(() => createTakoyaki({ topping: 'negi' }));

      const result = compareOrderWithServedTakoyaki(order, servedTakoyaki, 80);

      expect(result.correctCount).toBe(1); // 요청한 것만 카운트
      expect(result.servedCount).toBe(100);
      expect(result.breakdown.negi.correct).toBe(1);
    });
  });
});
