# applyCoupon を追加する（クーポンコードで割引する）

## 背景

キャンペーンでクーポンコードを配ることになりました。コードに応じて合計金額を割り引く関数を追加します。

## 仕様

- 関数名: `applyCoupon(total, code)`
- 置き場所: `src/price.js` の**末尾**に `export function` で追加する
- 引数: `total` = 割引前の合計金額（円、整数）、`code` = クーポンコードの文字列（省略されることもある）
- 戻り値: 割引後の金額（円、整数）
- クーポンの種類:
  - `"WELCOME10"` … 10% 引き。端数は切り捨て
  - `"SAVE500"` … 500 円引き
  - それ以外の文字列、または `code` が渡されなかったとき … 割引なし（`total` をそのまま返す）
- 割引後の金額は **0 円未満にしない**（500 円引きで合計が 300 円なら `0`）
- 定数: クーポンの定義（コード → 割引内容）を `COUPONS` という名前で **`src/price.js` 冒頭の定数ブロック**に `export const` で追加し、関数からはその定数を参照する

| 入力 | 期待する出力 |
|---|---|
| `applyCoupon(1000, "WELCOME10")` | `900` |
| `applyCoupon(999, "WELCOME10")` | `899`（899.1 の切り捨て） |
| `applyCoupon(1000, "SAVE500")` | `500` |
| `applyCoupon(300, "SAVE500")` | `0`（0 未満にしない） |
| `applyCoupon(1000, "UNKNOWN")` | `1000` |
| `applyCoupon(1000)` | `1000` |

## 受け入れ条件

- [ ] `src/price.js` 冒頭の定数ブロックに `COUPONS` が追加されている
- [ ] `src/price.js` の末尾に `applyCoupon` が追加され、JSDoc（日本語）が付いている
- [ ] `test/price.test.js` の末尾に `describe("applyCoupon", ...)` を追加し、上の表の 6 例をテストしている
- [ ] 既存の関数（`calcTaxIncluded`, `applyDiscount`）とそのテストは変更しない
- [ ] `npm test` がすべて成功する
- [ ] 変更するファイルは `src/price.js` と `test/price.test.js` の 2 つだけ
- [ ] 最後に、何をどう実装したかを日本語で短く報告する
