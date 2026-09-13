# calcShipping を追加する（送料計算。3,000 円以上で送料無料）

## 背景

カートの合計金額から送料を求める関数がまだありません。
送料は一律 500 円、合計が 3,000 円以上なら送料無料、というルールで実装します。

## 仕様

- 関数名: `calcShipping(total)`
- 置き場所: `src/price.js` の**末尾**に `export function` で追加する
- 引数: `total` = 割引後の合計金額（円、整数）
- 戻り値: 送料（円）。`total` が 3,000 円以上なら `0`、それ未満なら `500`
- 定数: 送料 `SHIPPING_FEE = 500` と、無料になる境界 `FREE_SHIPPING_THRESHOLD = 3000` を **`src/price.js` 冒頭の定数ブロック**に `export const` で追加し、関数からはその定数を使う

| 入力 | 期待する出力 |
|---|---|
| `calcShipping(1000)` | `500` |
| `calcShipping(2999)` | `500` |
| `calcShipping(3000)` | `0` |
| `calcShipping(8000)` | `0` |

## 受け入れ条件

- [ ] `src/price.js` 冒頭の定数ブロックに `SHIPPING_FEE` と `FREE_SHIPPING_THRESHOLD` が追加されている
- [ ] `src/price.js` の末尾に `calcShipping` が追加され、JSDoc（日本語）が付いている
- [ ] `test/price.test.js` の末尾に `describe("calcShipping", ...)` を追加し、上の表の 4 例をテストしている
- [ ] 既存の関数（`calcTaxIncluded`, `applyDiscount`）とそのテストは変更しない
- [ ] `npm test` がすべて成功する
- [ ] 変更するファイルは `src/price.js` と `test/price.test.js` の 2 つだけ
- [ ] 最後に、何をどう実装したかを日本語で短く報告する
