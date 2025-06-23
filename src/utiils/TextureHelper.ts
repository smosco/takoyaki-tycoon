import { type IronPanCellState, type CookingLevel } from '../state/gameState';

export class TextureHelper {
  /**
   * 셀 상태에 따른 텍스처를 결정합니다.
   */
  static getCellTexture(cellState: IronPanCellState, cookingLevel: CookingLevel): string {
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
}
