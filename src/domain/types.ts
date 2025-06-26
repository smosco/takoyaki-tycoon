/**
 * 익힘 상태
 */
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

export type CustomerMood = 'happy' | 'neutral' | 'angry';

export interface CustomerOrder {
  totalQuantity: number;
  remainingQuantity: number;
  sauceRequired: true;
  toppingBreakdown: {
    negi: number;
    katsuobushi: number;
    nori: number;
    none: number;
  };
  remainingToppingBreakdown: {
    negi: number;
    katsuobushi: number;
    nori: number;
    none: number;
  };
  preferredCookingLevel: 'perfect';
}

/**
 * 접시에 담긴 완성된 타코야끼의 상태
 * 소스/토핑 추가 및 서빙을 위한 정적 상태 관리
 */
export interface TakoyakiOnPlate {
  cookingLevel: 'raw' | 'perfect' | 'burnt';
  sauce: 'okonomiyaki' | null;
  topping: 'negi' | 'katsuobushi' | 'nori' | null;
}
