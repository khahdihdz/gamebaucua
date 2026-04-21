export const SYMBOLS = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'] as const;
export type Symbol = typeof SYMBOLS[number];

export const SYMBOL_CONFIG: Record<Symbol, { emoji: string; label: string; color: string }> = {
  bau: { emoji: '🎃', label: 'Bầu',  color: 'from-orange-600 to-orange-800' },
  cua: { emoji: '🦀', label: 'Cua',  color: 'from-red-600 to-red-800' },
  tom: { emoji: '🦐', label: 'Tôm',  color: 'from-pink-600 to-pink-800' },
  ca:  { emoji: '🐟', label: 'Cá',   color: 'from-blue-600 to-blue-800' },
  ga:  { emoji: '🐓', label: 'Gà',   color: 'from-yellow-600 to-yellow-800' },
  nai: { emoji: '🦌', label: 'Nai',  color: 'from-amber-700 to-amber-900' },
};

export function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}
