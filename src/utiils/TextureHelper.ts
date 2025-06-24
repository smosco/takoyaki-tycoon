import { type IronPanCellState, type CookingLevel } from '../state/gameState';

export class TextureHelper {
  /**
   * 반죽/타코야끼의 텍스처를 결정합니다 (레이어 시스템용)
   * 문어가 반죽 안에 들어간 상태를 하나의 텍스처로 표현
   */
  static getBatterTexture(
    cookingLevel: CookingLevel,
    hasOctopus: boolean = false,
    isFlipped: boolean = false
  ): string {
    // 반죽만 있는 경우
    if (!hasOctopus) {
      return `batter-${cookingLevel}`;
    }

    // 문어가 들어간 상태에서 뒤집힌 경우
    if (isFlipped) {
      return `takoyaki-${cookingLevel}-flipped`;
    }

    // 문어가 들어갔지만 뒤집지 않은 경우 (문어가 반죽 안에 들어간 모습)
    return `takoyaki-${cookingLevel}-with-octopus`;
  }

  /**
   * 문어 조각의 텍스처를 결정합니다
   */
  static getOctopusTexture(): string {
    return 'octopus-piece';
  }

  /**
   * 접시 배경 텍스처를 반환합니다 (항상 고정)
   */
  static getPlateBackgroundTexture(): string {
    return 'plate-cell';
  }

  /**
   * 레거시: 기존 셀 텍스처 방식 (호환성을 위해 유지)
   * @deprecated 새로운 레이어 시스템에서는 getBatterTexture 사용 권장
   */
  static getCellTexture(
    cellState: IronPanCellState,
    cookingLevel: CookingLevel
  ): string {
    // 반죽이 없으면 빈 셀
    if (!cellState.hasBatter) {
      return 'plate-cell';
    }

    // 반죽만 있는 경우
    if (!cellState.hasOctopus) {
      return `plate-cell-batter-${cookingLevel}`;
    }

    // 문어가 있고 뒤집힌 경우
    if (cellState.isFlipped) {
      return `plate-cell-batter-${cookingLevel}-flipped`;
    }

    // 문어가 있지만 뒤집지 않은 경우
    return `plate-cell-batter-${cookingLevel}-octopus`;
  }

  /**
   * 접시 타코야끼 텍스처를 결정합니다.
   */
  static getPlateTexture(takoyaki: any): string {
    let plateImage = 'tako-position';

    if (takoyaki.sauce && takoyaki.topping) {
      // 소스 + 토핑 완성품
      plateImage = `tako-${takoyaki.cookingLevel}-sauce-${takoyaki.topping}`;
    } else if (takoyaki.sauce) {
      // 소스만 있음
      plateImage = `tako-${takoyaki.cookingLevel}-sauce`;
    } else {
      // 기본 상태
      plateImage = `tako-${takoyaki.cookingLevel}`;
    }

    return plateImage;
  }

  /**
   * 익힘 정도에 따른 색상 필터를 반환합니다 (애니메이션용)
   */
  static getCookingTint(cookingLevel: CookingLevel): number {
    switch (cookingLevel) {
      case 'raw':
        return 0xffffff; // 원본 색상
      case 'perfect':
        return 0xffd700; // 황금색 틴트
      case 'burnt':
        return 0x8b4513; // 갈색 틴트
    }
  }

  /**
   * 애니메이션 효과를 위한 파티클 텍스처
   */
  static getEffectTexture(effectType: 'steam' | 'bubble' | 'sparkle'): string {
    switch (effectType) {
      case 'steam':
        return 'steam-particle';
      case 'bubble':
        return 'bubble-particle';
      case 'sparkle':
        return 'sparkle-particle';
    }
  }
}
