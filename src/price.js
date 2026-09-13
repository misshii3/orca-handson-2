/**
 * 金額計算ユーティリティ
 *
 * 仕様は test/price.test.js を正とする。
 */

// ---- 定数 -------------------------------------------------------------
// 金額計算で使う定数はこのブロックにまとめる。
// 新しい定数を追加するときも、ここに 1 つずつ増やす。

/** 消費税率（既定 10%） */
export const TAX_RATE = 0.1;

/** この金額以上で割引を適用する（円） */
export const DISCOUNT_THRESHOLD = 5000;

/** 割引率（10%） */
export const DISCOUNT_RATE = 0.1;

// ---- 関数 -------------------------------------------------------------

/**
 * 税込価格を返す。
 * 端数は切り捨て（1 円未満は切り捨てる）。
 *
 * @param {number} price 税抜価格（円）
 * @param {number} [rate=TAX_RATE] 税率（既定 10%）
 * @returns {number} 税込価格（円）
 */
export function calcTaxIncluded(price, rate = TAX_RATE) {
  return Math.floor(price * (1 + rate));
}

/**
 * 割引後の合計金額を返す。
 * 合計が 5,000 円以上なら 10% オフ、それ未満なら割引なし。
 *
 * @param {number} total 割引前の合計金額（円）
 * @returns {number} 割引後の合計金額（円）
 */
export function applyDiscount(total) {
  if (total >= DISCOUNT_THRESHOLD) {
    return Math.floor(total * (1 - DISCOUNT_RATE));
  }
  return total;
}
