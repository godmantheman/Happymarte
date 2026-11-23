/**
 * Seasonal Theme Controller:
 * - Active until the end of 2026 (2026-12-31 23:59:59 local time) -> Christmas Market ("크리스마스 마켓", CM currency)
 * - Starting 2027-01-01 00:00:00 -> Automatically reverts back to Happy Mart ("행복마트", 원 currency)
 */

export const NEXT_YEAR_REVERT_YEAR = 2027;

export function isChristmasSeason(now: Date = new Date()): boolean {
  return now.getFullYear() < NEXT_YEAR_REVERT_YEAR;
}

export function getStoreBrandName(christmas: boolean): string {
  return christmas ? '크리스마스 마켓' : '행복마트';
}

export function getKioskBrandName(christmas: boolean): string {
  return christmas ? '크리스마스 마켓 키오스크' : '행복마트 키오스크';
}

export function getEffectiveCurrencyUnit(
  storedUnit: string | undefined,
  christmas: boolean
): string {
  const trimmed = (storedUnit || '').trim();
  if (christmas) {
    if (!trimmed || trimmed === '원' || trimmed === '행복머니') {
      return 'CM';
    }
    return trimmed;
  } else {
    if (!trimmed || trimmed === 'CM' || trimmed === '크리스마스 머니') {
      return '원';
    }
    return trimmed;
  }
}

export function getSpokenCurrencyUnit(unit: string): string {
  if (unit.trim().toUpperCase() === 'CM') {
    return '크리스마스 머니';
  }
  return unit;
}

export const CHRISTMAS_CONFETTI_COLORS = [
  '#DC2626',
  '#16A34A',
  '#FBBF24',
  '#FFFFFF',
  '#EF4444',
];
