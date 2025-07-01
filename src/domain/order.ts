import type { CustomerOrder, TakoyakiOnPlate, CustomerMood, ToppingBreakdown } from './types';

/**
 * 주문 완료 시 기분에 따른 보너스 점수를 계산합니다.
 *
 * @param mood - 서빙 완료 시점의 손님 기분
 * @param totalCount - 전체 주문 개수
 * @returns 보너스 점수
 */
export function calculateCompletionBonus(mood: CustomerMood, totalCount: number): number {
  const bonusPerItem = 50;
  switch (mood) {
    case 'happy':
      return totalCount * bonusPerItem;
    case 'angry':
      return -totalCount * bonusPerItem;
    default:
      return 0;
  }
}

/**
 * 주문과 서빙된 타코야끼를 비교하여 점수를 계산합니다.
 * 기분은 시간(인내심) 기반으로만 결정되며, 보너스는 최종 완료 시에만 적용됩니다.
 *
 * @param order - 손님의 주문 내용
 * @param servedTakoyaki - 서빙된 타코야끼 배열
 * @param currentPatience - 현재 손님의 인내심
 * @param finalMood - 서빙 완료 시점의 손님 기분 (완료 시에만 전달)
 * @param isOrderCompleted - 주문이 완전히 완료되었는지 여부
 * @returns 비교 결과 (점수, 감정, 상세 breakdown 포함)
 */
export function compareOrderWithServedTakoyaki(
  order: CustomerOrder,
  servedTakoyaki: TakoyakiOnPlate[],
  currentPatience: number,
  finalMood?: CustomerMood,
  isOrderCompleted: boolean = false
): {
  correctCount: number;
  servedCount: number;
  mood: CustomerMood;
  score: number;
  bonusScore: number;
  breakdown: {
    negi: { requested: number; correct: number };
    katsuobushi: { requested: number; correct: number };
    nori: { requested: number; correct: number };
    none: { requested: number; correct: number };
    sauceIssues: number;
    cookingIssues: number;
  };
} {
  const breakdown = {
    negi: { requested: order.remainingToppingBreakdown.negi, correct: 0 },
    katsuobushi: { requested: order.remainingToppingBreakdown.katsuobushi, correct: 0 },
    nori: { requested: order.remainingToppingBreakdown.nori, correct: 0 },
    none: { requested: order.remainingToppingBreakdown.none, correct: 0 },
    sauceIssues: 0,
    cookingIssues: 0,
  };

  const servedCount = servedTakoyaki.length;

  for (const takoyaki of servedTakoyaki) {
    if (!takoyaki.sauce) {
      breakdown.sauceIssues++;
      continue;
    }

    // 실질적으로 익힘 이슈는 생길 수 없음
    // 왜냐! 꼬챙이가 익힘이 perfect일때만 접시로 이동시키기 때문
    if (takoyaki.cookingLevel !== 'perfect') {
      breakdown.cookingIssues++;
      continue;
    }

    const toppingType = takoyaki.topping || 'none';

    if (toppingType === 'negi' && breakdown.negi.correct < breakdown.negi.requested) {
      breakdown.negi.correct++;
    } else if (
      toppingType === 'katsuobushi' &&
      breakdown.katsuobushi.correct < breakdown.katsuobushi.requested
    ) {
      breakdown.katsuobushi.correct++;
    } else if (toppingType === 'nori' && breakdown.nori.correct < breakdown.nori.requested) {
      breakdown.nori.correct++;
    } else if (toppingType === 'none' && breakdown.none.correct < breakdown.none.requested) {
      breakdown.none.correct++;
    }
  }

  const correctCount =
    breakdown.negi.correct +
    breakdown.katsuobushi.correct +
    breakdown.nori.correct +
    breakdown.none.correct;

  const baseScore = correctCount * 100;
  const bonusScore =
    isOrderCompleted && finalMood ? calculateCompletionBonus(finalMood, order.totalQuantity) : 0;

  const totalScore = baseScore + bonusScore;

  const mood = currentPatience >= 30 ? 'happy' : currentPatience >= 15 ? 'neutral' : 'angry';

  return {
    correctCount,
    servedCount,
    mood,
    score: totalScore,
    bonusScore,
    breakdown,
  };
}

/**
 * 레벨에 따른 주문 구성 정보
 */
export function getLevelOrderConfig(level: number): {
  minQuantity: number;
  maxQuantity: number;
  toppingComplexity: number;
} {
  const minQuantity = Math.min(3 + Math.floor(level / 2), 15);
  const maxQuantity = Math.min(6 + level * 2, 27);
  const toppingComplexity = Math.min(0.2 + (level - 1) * 0.08, 1.0);

  return { minQuantity, maxQuantity, toppingComplexity };
}

/**
 * 토핑 복잡도에 따른 토핑 분배
 * @param totalQuantity - 총 타코야끼 개수
 * @param complexity - 토핑 복잡도 (0-1)
 */
function distributeToppings(totalQuantity: number, complexity: number): ToppingBreakdown {
  const result = { negi: 0, katsuobushi: 0, nori: 0, none: 0 };
  const toppings = ['negi', 'katsuobushi', 'nori', 'none'] as const;
  let remaining = totalQuantity;

  if (complexity <= 0.3) {
    const main = toppings[Math.floor(Math.random() * toppings.length)];
    result[main]++;
    remaining--;
  }

  while (remaining > 0) {
    const t = toppings[Math.floor(Math.random() * toppings.length)];
    result[t]++;
    remaining--;
  }

  return result;
}

/**
 * 레벨 기반 랜덤 주문 생성
 */
export function generateRandomOrder(level: number): CustomerOrder {
  const config = getLevelOrderConfig(level);
  const quantityRange = config.maxQuantity - config.minQuantity + 1;
  const totalQuantity = config.minQuantity + Math.floor(Math.random() * quantityRange);

  const toppingBreakdown = distributeToppings(totalQuantity, config.toppingComplexity);

  return {
    totalQuantity,
    remainingQuantity: totalQuantity,
    toppingBreakdown,
    remainingToppingBreakdown: { ...toppingBreakdown },
  };
}
