import type { CustomerMood } from './types';

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
  if (patience >= 60) {
    return { mood: 'happy', message: '히히 완전 맛나겠다옹~' };
  } else if (patience >= 30) {
    return { mood: 'neutral', message: '언제 나오냐옹ㅜ' };
  } else {
    return { mood: 'angry', message: '캬악! 빨리 주라옹!' };
  }
}
