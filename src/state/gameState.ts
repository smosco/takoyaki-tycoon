export type Sauce = 'okonomiyaki';
export type Topping = 'mayo' | 'katsuobushi' | 'nori';
export type CookingLevel = 'raw' | 'perfect' | 'burnt';

// 손님 주문
export interface CustomerOrder {
  totalQuantity: number; // 총 개수 (예: 9개)
  sauceRequired: true; // 소스는 무조건 필요
  toppingBreakdown: {
    // 토핑별 개수
    mayo: number; // 마요네즈 몇 개
    katsuobushi: number; // 가츠오부시 몇 개
    nori: number; // 김 몇 개
    none: number; // 토핑 없이 몇 개
  };
  preferredCookingLevel: 'perfect'; // 무조건 완벽하게 익힌 것만
}

export interface Customer {
  id: string;
  order: CustomerOrder;
  isWaiting: boolean;
  patience: number; // 0-100, 시간이 지나면 감소
}

export type CustomerMood = 'happy' | 'neutral' | 'angry';

export type Tool =
  | 'batter'
  | 'octopus'
  | 'stick'
  | 'sauce'
  | 'mayo'
  | 'katsuobushi'
  | 'nori'
  | 'serve';

/**
 * 철판에서 조리 중인 타코야끼 상태
 * 시간에 따라 동적으로 변하는 요리 과정을 관리
 */
export interface IronPanCellState {
  hasBatter: boolean;
  hasOctopus: boolean;
  isFlipped: boolean;
  cookingStartTime: number | null;
  cookingLevel: CookingLevel;
  isMovedToPlate: boolean;
}

/**
 * 접시에 담긴 완성된 타코야끼의 상태
 * 소스/토핑 추가 및 서빙을 위한 정적 상태 관리
 */
export interface TakoyakiOnPlate {
  sauce: Sauce | null;
  topping: Topping | null;
  cookingLevel: CookingLevel;
}

export const ironPanCells: IronPanCellState[][] = [];
export const platesWithTakoyaki: TakoyakiOnPlate[] = [];
export const currentSelectedTool = { current: 'batter' as Tool };

// 손님 시스템 상태
export const currentCustomer: { customer: Customer | null } = { customer: null };
export const gameScore = { value: 0 };
export const gameStats = {
  servedCustomers: 0,
  happyCustomers: 0,
  angryCustomers: 0,
};

export const TAKOYAKI_COOKING_TIMES = {
  PERFECT_TIME: 3000, // 3초 후 완벽하게 익음
  BURNT_TIME: 6000, // 6초 후 탐
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
 * 익힘 정도에 따른 타코야끼 색상을 반환합니다.
 *
 * @param cookingLevel - 익힘 정도
 * @returns 해당하는 색상 코드 (16진수)
 */
export function getTakoyakiColorByCookingLevel(cookingLevel: CookingLevel): number {
  switch (cookingLevel) {
    case 'raw':
      return 0xdaa520; // 노란색 (반죽)
    case 'perfect':
      return 0xcd853f; // 주황색 (적당히 익음)
    case 'burnt':
      return 0x654321; // 갈색 (탐)
  }
}

/**
 * 주어진 도구가 토핑인지 확인하는 타입 가드 함수
 *
 * @param tool - 확인할 도구
 * @returns 토핑이면 true, 아니면 false
 */
export function isTopping(tool: Tool): tool is Topping {
  return tool === 'mayo' || tool === 'katsuobushi' || tool === 'nori';
}

// =====================================
// 손님 시스템 함수들
// =====================================

/**
 * 랜덤한 손님 주문을 생성합니다.
 * 총 개수를 정하고 토핑별로 개수를 랜덤하게 분배합니다.
 *
 * @returns 생성된 랜덤 주문
 */
export function generateRandomOrder(): CustomerOrder {
  // TODO: 여러 접시도 주문 가능하게 (현재 서빙할 때 비교)
  const totalQuantity = Math.floor(Math.random() * 6) + 3; // 3-8개

  // 토핑 개수를 랜덤하게 분배
  let remainingQuantity = totalQuantity;
  const toppingBreakdown = {
    mayo: 0,
    katsuobushi: 0,
    nori: 0,
    none: 0,
  };

  // 각 토핑에 랜덤하게 할당
  const toppings: (keyof typeof toppingBreakdown)[] = ['mayo', 'katsuobushi', 'nori', 'none'];

  for (let i = 0; i < toppings.length && remainingQuantity > 0; i++) {
    if (i === toppings.length - 1) {
      // 마지막 토핑에는 남은 모든 개수 할당
      toppingBreakdown[toppings[i]] = remainingQuantity;
    } else {
      // 랜덤하게 0 ~ 남은 개수만큼 할당
      const maxAssign = Math.min(
        remainingQuantity,
        Math.floor(remainingQuantity / (toppings.length - i)) + 1
      );
      const assigned = Math.floor(Math.random() * (maxAssign + 1));
      toppingBreakdown[toppings[i]] = assigned;
      remainingQuantity -= assigned;
    }
  }

  return {
    totalQuantity,
    sauceRequired: true,
    toppingBreakdown,
    preferredCookingLevel: 'perfect',
  };
}

/**
 * 새로운 손님을 생성합니다.
 *
 * @returns 생성된 새 손님 객체
 */
export function createNewCustomer(): Customer {
  return {
    id: `customer_${Date.now()}`,
    order: generateRandomOrder(),
    isWaiting: true,
    patience: 100,
  };
}

/**
 * 주문과 서빙된 타코야끼를 비교하여 점수와 만족도를 계산합니다.
 * 점수는 정확히 맞은 개수 × 100점으로 단순 계산됩니다.
 *
 * @param order - 손님의 주문 내용
 * @param servedTakoyaki - 서빙된 타코야끼 배열
 * @returns 비교 결과 (점수, 감정, 상세 breakdown 포함)
 */
export function compareOrderWithServedTakoyaki(
  order: CustomerOrder,
  servedTakoyaki: TakoyakiOnPlate[]
): {
  correctCount: number;
  totalRequested: number;
  mood: CustomerMood;
  score: number;
  breakdown: {
    mayo: { requested: number; correct: number };
    katsuobushi: { requested: number; correct: number };
    nori: { requested: number; correct: number };
    none: { requested: number; correct: number };
    sauceIssues: number; // 소스 없는 타코야끼 개수
    cookingIssues: number; // 잘못 익힌 타코야끼 개수
  };
} {
  console.log('주문과 서빙 비교:', order, servedTakoyaki);

  const breakdown = {
    mayo: { requested: order.toppingBreakdown.mayo, correct: 0 },
    katsuobushi: { requested: order.toppingBreakdown.katsuobushi, correct: 0 },
    nori: { requested: order.toppingBreakdown.nori, correct: 0 },
    none: { requested: order.toppingBreakdown.none, correct: 0 },
    sauceIssues: 0,
    cookingIssues: 0,
  };

  // 서빙된 타코야끼를 토핑별로 분류
  const servedCount = Math.min(order.totalQuantity, servedTakoyaki.length);

  for (let i = 0; i < servedCount; i++) {
    const takoyaki = servedTakoyaki[i];

    // 소스 체크 (무조건 있어야 함)
    if (!takoyaki.sauce) {
      breakdown.sauceIssues++;
      continue; // 소스 없으면 완전 실패
    }

    // 익힘 정도 체크 (무조건 perfect여야 함)
    if (takoyaki.cookingLevel !== 'perfect') {
      breakdown.cookingIssues++;
      continue; // 잘못 익혔으면 완전 실패
    }

    // 토핑 체크
    const toppingType = takoyaki.topping || 'none';

    if (toppingType === 'mayo' && breakdown.mayo.correct < breakdown.mayo.requested) {
      breakdown.mayo.correct++;
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
    // 토핑이 맞지 않거나 이미 충분하면 틀린 것으로 처리
  }

  // 올바른 타코야끼 개수 계산
  const correctCount =
    breakdown.mayo.correct +
    breakdown.katsuobushi.correct +
    breakdown.nori.correct +
    breakdown.none.correct;

  // 단순한 점수 계산: 맞은 개수 × 100점
  const score = correctCount * 100;

  // 만족도 계산 (점수와 별개로 완성도 기준)
  const satisfactionRate = correctCount / order.totalQuantity;
  let mood: CustomerMood;

  if (satisfactionRate >= 1.0) {
    mood = 'happy'; // 100% 완성
  } else if (satisfactionRate >= 0.7) {
    mood = 'neutral'; // 70% 이상 완성
  } else {
    mood = 'angry'; // 70% 미만 완성
  }

  console.log(
    `점수 계산: ${correctCount}개 맞음 × 100점 = ${score}점 (${satisfactionRate * 100}% 완성)`
  );

  return {
    correctCount,
    totalRequested: order.totalQuantity,
    mood,
    score: score,
    breakdown,
  };
}

/**
 * 현재 손님에게 타코야끼를 서빙합니다.
 * 주문과 비교하여 점수를 계산하고 통계를 업데이트합니다.
 *
 * @returns 서빙 결과 (성공 여부, 점수, 메시지 포함)
 */
export function serveToCustomer(): {
  success: boolean;
  result?: {
    correctCount: number;
    totalRequested: number;
    mood: CustomerMood;
    score: number;
    breakdown: any;
  };
  message: string;
} {
  if (!currentCustomer.customer) {
    return { success: false, message: '대기 중인 손님이 없습니다.' };
  }

  if (platesWithTakoyaki.length === 0) {
    return { success: false, message: '서빙할 타코야끼가 없습니다.' };
  }

  console.log('서빙된 타코야끼:', platesWithTakoyaki);

  // 주문과 비교
  const result = compareOrderWithServedTakoyaki(currentCustomer.customer.order, platesWithTakoyaki);

  // 통계 업데이트
  gameStats.servedCustomers++;
  if (result.mood === 'happy') gameStats.happyCustomers++;
  if (result.mood === 'angry') gameStats.angryCustomers++;

  // 점수 추가
  gameScore.value += result.score;

  // 서빙된 타코야끼 제거 (주문 수량만큼만)
  const servedCount = Math.min(
    currentCustomer.customer.order.totalQuantity,
    platesWithTakoyaki.length
  );
  platesWithTakoyaki.splice(0, servedCount);

  // 손님 제거
  currentCustomer.customer = null;

  return {
    success: true,
    result,
    message: `${result.correctCount}/${result.totalRequested} 정확! ${result.score}점 획득!`,
  };
}

/**
 * 새로운 손님을 등장시킵니다.
 * 현재 대기 중인 손님이 없을 때만 새 손님을 생성합니다.
 */
export function spawnNewCustomer(): void {
  if (!currentCustomer.customer) {
    currentCustomer.customer = createNewCustomer();
  }
}

// =====================================
// 초기화
// =====================================

// 3x3 철판 셀 초기화
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
