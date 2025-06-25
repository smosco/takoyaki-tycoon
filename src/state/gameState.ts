export interface Customer {
  id: string;
  order: CustomerOrder;
  isWaiting: boolean;
  patience: number; // 0-100, 시간이 지나면 감소
}

// 손님 주문
export interface CustomerOrder {
  totalQuantity: number; // 총 개수 (예: 27개)
  remainingQuantity: number; // 아직 받지 못한 개수
  sauceRequired: true; // 소스는 무조건 필요
  toppingBreakdown: {
    // 토핑별 개수 (원본 주문)
    negi: number; // 파 몇 개
    katsuobushi: number; // 가츠오부시 몇 개
    nori: number; // 김 몇 개
    none: number; // 토핑 없이 몇 개
  };
  remainingToppingBreakdown: {
    // 아직 받지 못한 토핑별 개수
    negi: number;
    katsuobushi: number;
    nori: number;
    none: number;
  };
  preferredCookingLevel: 'perfect'; // 무조건 완벽하게 익힌 것만
}

export type CustomerMood = 'happy' | 'neutral' | 'angry';

export type Tool =
  | 'batter'
  | 'octopus'
  | 'stick'
  | 'sauce'
  | 'negi'
  | 'katsuobushi'
  | 'nori'
  | 'serve';

export type Sauce = 'okonomiyaki';
export type Topping = 'negi' | 'katsuobushi' | 'nori';
export type CookingLevel = 'raw' | 'perfect' | 'burnt';

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
export const gameLevel = { value: 1 }; // gameLevel 추가
export const gameScore = { value: 0 };
export const gameStats = {
  servedCustomers: 0,
  happyCustomers: 0,
  angryCustomers: 0,
};

// 게임 타이머 및 상태 관리
export const gameTimer = {
  totalTime: 180000, // 3분 (180초)
  remainingTime: 180000,
  isRunning: false,
  startTime: 0,
};

export const gameFlow = {
  isGameActive: false,
  isGameStarted: false,
  isGameEnded: false,
};

export const TAKOYAKI_COOKING_TIMES = {
  PERFECT_TIME: 5000, // 5초 후 완벽하게 익음
  BURNT_TIME: 10000, // 10초 후 탐
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
 * 주어진 도구가 토핑인지 확인하는 타입 가드 함수
 *
 * @param tool - 확인할 도구
 * @returns 토핑이면 true, 아니면 false
 */
export function isTopping(tool: Tool): tool is Topping {
  return tool === 'negi' || tool === 'katsuobushi' || tool === 'nori';
}

// =====================================
// 손님 시스템 함수들
// =====================================

// 기분 상태 캐시 (성능 최적화)
const moodCache = new Map<number, { mood: CustomerMood; message: string }>();

/**
 * 레벨에 따른 주문 범위와 토핑 복잡도를 계산합니다.
 * @param level - 현재 레벨
 * @returns 주문 설정 객체
 */
export function getLevelOrderConfig(level: number): {
  minQuantity: number;
  maxQuantity: number;
  toppingComplexity: number; // 0-1 사이값, 높을수록 다양한 토핑
} {
  // 레벨에 따른 최소 개수 (3개부터 시작해서 점진적 증가)
  const minQuantity = Math.min(3 + Math.floor(level / 2), 15);

  // 레벨에 따른 최대 개수 (6개부터 시작해서 27개까지)
  const maxQuantity = Math.min(6 + level * 2, 27);

  // 토핑 복잡도 (레벨이 높을수록 다양한 토핑 조합)
  const toppingComplexity = Math.min(0.2 + (level - 1) * 0.08, 1.0);

  return {
    minQuantity,
    maxQuantity,
    toppingComplexity,
  };
}

/**
 * 토핑 복잡도에 따른 토핑 분배
 * @param totalQuantity - 총 타코야끼 개수
 * @param complexity - 토핑 복잡도 (0-1)
 */
function distributeToppings(
  totalQuantity: number,
  complexity: number
): { negi: number; katsuobushi: number; nori: number; none: number } {
  const result = { negi: 0, katsuobushi: 0, nori: 0, none: 0 };
  const toppings: (keyof typeof result)[] = ['negi', 'katsuobushi', 'nori', 'none'];
  let remaining = totalQuantity;

  if (complexity <= 0.3) {
    // 낮은 복잡도: 주로 1가지 토핑
    const mainTopping = toppings[Math.floor(Math.random() * toppings.length)];
    result[mainTopping] = totalQuantity;
  } else if (complexity <= 0.6) {
    // 중간 복잡도: 2가지 토핑
    const topping1 = toppings[Math.floor(Math.random() * toppings.length)];
    let topping2 = toppings[Math.floor(Math.random() * toppings.length)];

    // 같은 토핑이 선택되면 다른 토핑 선택
    while (topping2 === topping1) {
      topping2 = toppings[Math.floor(Math.random() * toppings.length)];
    }

    const split = Math.floor(totalQuantity / 2);
    result[topping1] = split;
    result[topping2] = totalQuantity - split;
  } else {
    // 높은 복잡도: 모든 토핑 골고루

    // 각 토핑에 최소 1개씩 배정 (가능한 경우)
    if (totalQuantity >= 4) {
      toppings.forEach((topping) => {
        result[topping] = 1;
        remaining -= 1;
      });
    }

    // 나머지 수량을 랜덤하게 분배
    while (remaining > 0) {
      const randomTopping = toppings[Math.floor(Math.random() * toppings.length)];
      result[randomTopping]++;
      remaining--;
    }
  }

  // 검증: 총합이 맞는지 확인
  const sum = result.negi + result.katsuobushi + result.nori + result.none;
  if (sum !== totalQuantity) {
    console.error(`토핑 분배 오류: 총 ${totalQuantity}개 주문, 분배된 토핑 ${sum}개`);
    console.error('토핑 분배:', result);

    // 오류 수정: 차이만큼 none에 추가/차감
    const diff = totalQuantity - sum;
    result.none = Math.max(0, result.none + diff);
  }

  return result;
}

/**
 * 레벨 기반 랜덤 주문 생성 (기존 generateRandomOrder 함수 대체)
 */
export function generateRandomOrder(): CustomerOrder {
  const config = getLevelOrderConfig(gameLevel.value);

  // 주문 개수 결정
  const quantityRange = config.maxQuantity - config.minQuantity + 1;
  const totalQuantity = config.minQuantity + Math.floor(Math.random() * quantityRange);

  // 토핑 분배
  const toppingBreakdown = distributeToppings(totalQuantity, config.toppingComplexity);

  // 검증 로그
  const sum =
    toppingBreakdown.negi +
    toppingBreakdown.katsuobushi +
    toppingBreakdown.nori +
    toppingBreakdown.none;
  console.log(
    `레벨 ${gameLevel.value} 주문: ${totalQuantity}개 (복잡도: ${config.toppingComplexity.toFixed(
      2
    )})`
  );
  console.log(
    `토핑 분배 - 파:${toppingBreakdown.negi}, 가츠오:${toppingBreakdown.katsuobushi}, 김:${toppingBreakdown.nori}, 없음:${toppingBreakdown.none} (총:${sum})`
  );

  if (sum !== totalQuantity) {
    console.error(`토핑 분배 오류 발생! 주문:${totalQuantity}, 분배:${sum}`);
  }

  return {
    totalQuantity,
    remainingQuantity: totalQuantity,
    sauceRequired: true,
    toppingBreakdown,
    remainingToppingBreakdown: { ...toppingBreakdown },
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
 * 인내심 기반으로 손님의 기분을 결정합니다.
 * 정확도는 고려하지 않고 오직 시간(인내심)만 기반으로 합니다.
 * 캐시를 사용하여 성능을 최적화합니다.
 *
 * @param patience - 현재 손님의 인내심 (0-100)
 * @returns 손님의 기분과 메시지
 */
export function getCustomerMoodByPatience(patience: number): {
  mood: CustomerMood;
  message: string;
} {
  // 캐시에서 확인
  if (moodCache.has(patience)) {
    return moodCache.get(patience)!;
  }

  let result: { mood: CustomerMood; message: string };

  if (patience >= 60) {
    result = { mood: 'happy', message: '히히 완전 맛나겠다옹~' };
  } else if (patience >= 30) {
    result = { mood: 'neutral', message: '언제 나오냐옹ㅜ' };
  } else {
    result = { mood: 'angry', message: '캬악! 빨리 주라옹!' };
  }

  // 캐시에 저장 (최대 100개까지만)
  if (moodCache.size < 100) {
    moodCache.set(patience, result);
  }

  return result;
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
  finalMood?: 'happy' | 'neutral' | 'angry',
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

  // 서빙된 타코야끼 검증 및 카운팅
  for (const takoyaki of servedTakoyaki) {
    // 소스 체크 (무조건 있어야 함)
    if (!takoyaki.sauce) {
      breakdown.sauceIssues++;
      continue;
    }

    // 익힘 정도 체크 (무조건 perfect여야 함)
    if (takoyaki.cookingLevel !== 'perfect') {
      breakdown.cookingIssues++;
      continue;
    }

    // 토핑 체크 (주문 범위 내에서만 카운트)
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

  // 올바른 타코야끼 개수 계산
  const correctCount =
    breakdown.negi.correct +
    breakdown.katsuobushi.correct +
    breakdown.nori.correct +
    breakdown.none.correct;

  // 기본 점수 계산: 정확한 개수만 × 100점
  const baseScore = correctCount * 100;

  // 보너스 점수 계산 (주문 완료 시에만)
  let bonusScore = 0;
  if (isOrderCompleted && finalMood) {
    bonusScore = calculateCompletionBonus(finalMood, order.totalQuantity);
  }

  const totalScore = baseScore + bonusScore;

  // 기분은 인내심으로 결정 (표시용)
  const moodData = getCustomerMoodByPatience(currentPatience);
  const mood = moodData.mood;

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
 * 주문 완료 시 기분에 따른 보너스 점수를 계산합니다.
 *
 * @param mood - 서빙 완료 시점의 손님 기분
 * @param totalCount - 전체 주문 개수
 * @returns 보너스 점수
 */
export function calculateCompletionBonus(mood: CustomerMood, totalCount: number): number {
  const bonusPerItem = 50; // 개당 보너스 점수

  switch (mood) {
    case 'happy':
      return totalCount * bonusPerItem; // 개당 +50점
    // 향후 다른 기분별 보너스가 필요하면 추가
    default:
      return 0;
  }
}

/**
 * 손님에게 서빙합니다.
 * 기분은 인내심 기반으로만 결정되며, 주문 완료 시 보너스가 적용됩니다.
 *
 * @param customerMood - 현재 손님의 기분 (CustomerManager에서 전달)
 * @returns 서빙 결과 (성공 여부, 점수, 메시지 포함)
 */
export function serveToCustomer(customerMood?: 'happy' | 'neutral' | 'angry'): {
  success: boolean;
  result?: {
    correctCount: number;
    servedCount: number;
    mood: CustomerMood;
    score: number;
    bonusScore: number;
    breakdown: any;
  };
  message: string;
  orderCompleted: boolean;
} {
  if (!currentCustomer.customer) {
    return { success: false, message: '대기 중인 손님이 없습니다.', orderCompleted: false };
  }

  if (platesWithTakoyaki.length === 0) {
    return { success: false, message: '서빙할 타코야끼가 없습니다.', orderCompleted: false };
  }

  // 주문 완료 체크 (미리 확인)
  const order = currentCustomer.customer.order;
  const validTakoyaki = platesWithTakoyaki.filter((t) => t.sauce && t.cookingLevel === 'perfect');
  const willComplete = order.remainingQuantity <= validTakoyaki.length;

  // 주문과 비교 (완료 시에만 기분 전달)
  const result = compareOrderWithServedTakoyaki(
    order,
    platesWithTakoyaki,
    currentCustomer.customer.patience,
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

  // 점수 추가
  gameScore.value += result.score;

  // 서빙된 타코야끼 제거
  platesWithTakoyaki.splice(0, result.servedCount);

  // 주문 완료 체크
  const orderCompleted = order.remainingQuantity <= 0;

  if (orderCompleted) {
    // 레벨 업!
    gameLevel.value += 1;
    console.log(`레벨 업! 현재 레벨: ${gameLevel.value}`);

    // 주문 완료 시 통계 업데이트
    gameStats.servedCustomers++;
    if (result.mood === 'happy') gameStats.happyCustomers++;
    if (result.mood === 'angry') gameStats.angryCustomers++;

    // 보너스 메시지 포함
    let bonusMessage = '';
    if (result.bonusScore > 0) {
      bonusMessage = ` (보너스 +${result.bonusScore}점!)`;
    }

    // 손님 제거
    currentCustomer.customer = null;

    return {
      success: true,
      result,
      message: `주문 완료! 레벨 ${gameLevel.value}! ${result.correctCount}개 정확! +${result.score}점${bonusMessage}`,
      orderCompleted: true,
    };
  } else {
    // 부분 서빙 - 보너스 없음
    return {
      success: true,
      result,
      message: `${result.correctCount}개 정확 서빙! (남은 주문: ${order.remainingQuantity}개) +${result.score}점`,
      orderCompleted: false,
    };
  }
}

/**
 * 새로운 손님을 등장시킵니다.
 * 현재 대기 중인 손님이 없을 때만 새 손님을 생성합니다.
 */
export function spawnNewCustomer(): void {
  if (!currentCustomer.customer && gameFlow.isGameActive) {
    currentCustomer.customer = createNewCustomer();
  }
}

// =====================================
// 게임 타이머 및 플로우 관리 함수들
// =====================================

/**
 * 게임을 시작합니다.
 * 타이머를 초기화하고 게임 상태를 활성화합니다.
 */
export function startGame(): void {
  gameTimer.startTime = Date.now();
  gameTimer.remainingTime = gameTimer.totalTime;
  gameTimer.isRunning = true;

  gameFlow.isGameActive = true;
  gameFlow.isGameStarted = true;
  gameFlow.isGameEnded = false;

  // 게임 시작 시 점수와 통계 초기화
  gameScore.value = 0;
  gameStats.servedCustomers = 0;
  gameStats.happyCustomers = 0;
  gameStats.angryCustomers = 0;

  // 캐시 초기화
  moodCache.clear();

  console.log('게임 시작! 3분 타이머 가동');
}

/**
 * 게임을 종료합니다.
 * 타이머를 정지하고 게임 상태를 비활성화합니다.
 */
export function endGame(): void {
  gameTimer.isRunning = false;
  gameFlow.isGameActive = false;
  gameFlow.isGameEnded = true;

  // 현재 손님 제거
  currentCustomer.customer = null;

  console.log('게임 종료!');
  console.log(`최종 점수: ${gameScore.value}점`);
  console.log(`서빙한 손님: ${gameStats.servedCustomers}명`);
}

/**
 * 게임 타이머를 업데이트합니다.
 * 매 프레임마다 호출되어 남은 시간을 계산합니다.
 *
 * @param currentTime - 현재 시간 (밀리초)
 * @returns 게임이 끝났는지 여부
 */
export function updateGameTimer(currentTime: number): boolean {
  if (!gameTimer.isRunning) return false;

  const elapsedTime = currentTime - gameTimer.startTime;
  gameTimer.remainingTime = Math.max(0, gameTimer.totalTime - elapsedTime);

  // 시간이 다 되면 게임 종료
  if (gameTimer.remainingTime <= 0) {
    endGame();
    return true; // 게임 종료됨
  }

  return false; // 게임 계속
}

/**
 * 남은 시간을 MM:SS 형식의 문자열로 반환합니다.
 *
 * @returns 포맷된 시간 문자열 (예: "02:30")
 */
export function getFormattedTime(): string {
  const totalSeconds = Math.ceil(gameTimer.remainingTime / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 게임 상태를 초기화합니다.
 * 새 게임을 시작하기 전에 호출됩니다.
 */
export function resetGameState(): void {
  // 타이머 초기화
  gameTimer.remainingTime = gameTimer.totalTime;
  gameTimer.isRunning = false;
  gameTimer.startTime = 0;

  // 게임 플로우 초기화
  gameFlow.isGameActive = false;
  gameFlow.isGameStarted = false;
  gameFlow.isGameEnded = false;

  // 점수 및 통계 초기화
  gameLevel.value = 1; // 레벨 초기화 추가
  gameScore.value = 0;
  gameStats.servedCustomers = 0;
  gameStats.happyCustomers = 0;
  gameStats.angryCustomers = 0;

  // 손님 초기화
  currentCustomer.customer = null;

  // 접시 초기화
  platesWithTakoyaki.length = 0;

  // 캐시 초기화
  moodCache.clear();

  // 철판 초기화
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (ironPanCells[row] && ironPanCells[row][col]) {
        Object.assign(ironPanCells[row][col], {
          hasBatter: false,
          hasOctopus: false,
          isFlipped: false,
          cookingStartTime: null,
          cookingLevel: 'raw',
          isMovedToPlate: false,
        });
      }
    }
  }

  console.log('게임 상태 초기화 완료');
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
