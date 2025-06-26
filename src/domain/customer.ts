import type { Customer } from './types';
import { generateRandomOrder } from './order';

/**
 * 새로운 손님을 생성합니다.
 *
 * @returns 생성된 새 손님 객체
 */
export function createNewCustomer(level: number): Customer {
  return {
    id: `customer_${Date.now()}`,
    order: generateRandomOrder(level),
    isWaiting: true,
    patience: 100,
  };
}
