import { createNewCustomer } from '../domain/customer';
import { compareOrderWithServedTakoyaki } from '../domain/order';
import {
  gameFlow,
  gameScore,
  platesWithTakoyaki,
  currentCustomer,
  gameLevel,
  gameStats,
} from '../state/gameState';

export function spawnNewCustomer() {
  if (!currentCustomer.customer && gameFlow.isGameActive) {
    console.log('새로운 손님');
    currentCustomer.customer = createNewCustomer(gameLevel.value);
  }
}

/**
 * 손님에게 서빙합니다.
 * 기분은 인내심 기반으로만 결정되며, 주문 완료 시 보너스가 적용됩니다.
 *
 * @param customerMood - 현재 손님의 기분
 * @returns 서빙 결과 (성공 여부, 점수, 메시지 포함)
 */
export function serveToCustomer(customerMood?: 'happy' | 'neutral' | 'angry') {
  const customer = currentCustomer.customer;

  if (!customer) {
    return { success: false, message: '대기 중인 손님이 없습니다.', orderCompleted: false };
  }

  if (platesWithTakoyaki.length === 0) {
    return { success: false, message: '서빙할 타코야끼가 없습니다.', orderCompleted: false };
  }

  const order = customer.order;
  const validTakoyaki = platesWithTakoyaki.filter((t) => t.sauce && t.cookingLevel === 'perfect');

  const willComplete = order.remainingQuantity <= validTakoyaki.length;

  const result = compareOrderWithServedTakoyaki(
    order,
    platesWithTakoyaki,
    customer.patience,
    willComplete ? customerMood : undefined,
    willComplete
  );

  // 주문에서 서빙된 만큼 차감 (정확한 개수만)
  order.remainingQuantity -= result.correctCount;
  // 토핑별로도 차감 (정확한 것만)
  order.remainingToppingBreakdown.negi -= result.breakdown.negi.correct;
  order.remainingToppingBreakdown.katsuobushi -= result.breakdown.katsuobushi.correct;
  order.remainingToppingBreakdown.nori -= result.breakdown.nori.correct;
  order.remainingToppingBreakdown.none -= result.breakdown.none.correct;

  gameScore.value += result.score;
  // 서빙된 타코야끼 제거
  platesWithTakoyaki.splice(0, result.servedCount);

  // 서빙 완료 체크
  const orderCompleted = order.remainingQuantity <= 0;

  if (orderCompleted) {
    // 레벨 업
    gameLevel.value += 1;
    // 통계 업데이트
    gameStats.servedCustomers++;
    if (result.mood === 'happy') {
      gameStats.happyCustomers++;
      gameStats.happyBonus += result.bonusScore;
    }
    if (result.mood === 'angry') gameStats.angryCustomers++;
    currentCustomer.customer = null;

    return {
      success: true,
      result,
      message: `주문 완료! 레벨 ${gameLevel.value}! ${result.correctCount}개 정확! +${
        result.score
      }점${result.bonusScore ? ` (보너스 +${result.bonusScore}점!)` : ''}`,
      orderCompleted: true,
    };
  } else {
    return {
      success: true,
      result,
      message: `${result.correctCount}개 정확 서빙! (남은 주문: ${order.remainingQuantity}개) +${result.score}점`,
      orderCompleted: false,
    };
  }
}
