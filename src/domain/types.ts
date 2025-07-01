/**
 * 익힘 상태
 */
export type CookingLevel = 'raw' | 'perfect' | 'burnt';

/**
 * 철판에서 조리 중인 타코야끼 상태
 * 시간에 따라 동적으로 변하는 요리 과정을 관리
 */
export interface IronPanCellState {
  /**
   * 반죽 들어있는지 확인
   */
  hasBatter: boolean;
  /**
   * 문어 들어있는지 확인
   */
  hasOctopus: boolean;
  /**
   * 뒤집은 적이 있는지 확인
   */
  isFlipped: boolean;
  /**
   * 조리 시작 타임
   */
  cookingStartTime: number | null;
  /**
   * 익힘 정도
   */
  cookingLevel: CookingLevel;
  /**
   * 그릇으로 옮겨졌는지 확인
   */
  isMovedToPlate: boolean;
}

export type CustomerMood = 'happy' | 'neutral' | 'angry';

/**
 * 토핑 구성 정보
 */
export interface ToppingBreakdown {
  negi: number;
  katsuobushi: number;
  nori: number;
  none: number;
}

/**
 * 주문 상태
 */
export interface CustomerOrder {
  /**
   * 전체 주문 개수
   */
  totalQuantity: number;
  /**
   * 남은 주문 개수
   */
  remainingQuantity: number;
  /**
   * 전체 주문의 각 토핑 별 개수
   */
  toppingBreakdown: ToppingBreakdown;
  /**
   * 남은 주문의 각 토핑 별 개수
   */
  remainingToppingBreakdown: ToppingBreakdown;
}

/**
 * 접시에 담긴 완성된 타코야끼의 상태
 * 소스/토핑 추가 및 서빙을 위한 정적 상태 관리
 */
export interface TakoyakiOnPlate {
  /**
   * 접시 위 타코야끼의 익힘 정도
   */
  cookingLevel: CookingLevel;
  /**
   * 접시 위 타코야끼의 소스 여부
   */
  sauce: boolean;
  /**
   * 접시 위 타코야끼의 토핑 종류
   */
  topping: 'negi' | 'katsuobushi' | 'nori' | null;
}

export interface Customer {
  id: string;
  order: CustomerOrder;
  // TODO: 삭제
  isWaiting: boolean;
  /**
   * 손님의 남은 인내심 시간 (0-60, 시간이 지나면 감소)
   */
  patience: number;
}
