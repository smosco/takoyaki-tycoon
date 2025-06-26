import type { TakoyakiOnPlate, IronPanCellState, Customer } from '../domain/types';

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

export const ironPanCells: IronPanCellState[][] = [];
export const platesWithTakoyaki: TakoyakiOnPlate[] = [];
export const currentSelectedTool = { current: 'batter' as Tool };

// 손님 시스템 상태
export const currentCustomer: { customer: Customer | null } = { customer: null };
export const gameLevel = { value: 1 };
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
