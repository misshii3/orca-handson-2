# Orca ハンズオン 続編（ジュニアエンジニア向け・自習用）

[第1弾](https://github.com/misshii3/orca-handson) では、同じバグ修正を Claude Code と Codex に競わせ、良い方を PR にするところまでを体験しました。
続編のテーマは **日常業務の流れ** です。Issue を起点に **別々のタスクを 3 本同時に** 進め、PR のチェックを見てマージし、
途中で起きる **コンフリクト（競合）** を Orca の中で解消して、後片付けまでを一人で通します。

## 前提

- [第1弾](https://github.com/misshii3/orca-handson) を終えていること（Orca のインストール、GitHub 連携、ワークツリー・差分・PR の基本操作を知っている前提で書いています）
- macOS、Orca、Claude Code、Codex CLI、`gh`、Node.js 20 以上

## 何を体験するか

![並列タスクの流れ。3 つの Issue を 3 本のワークツリーで進め、PR を 3 本作り、順にマージする。3 本目で競合が起き、解消してマージする](images/diagrams/10_parallel-tasks-flow.svg)

| | 第1弾 | 続編 |
|---|---|---|
| タスク | 同じバグ修正を 2 つのエージェントで競争 | 別々の機能追加を 3 本並列 |
| ワークツリーの作り方 | 「名前」を打って作る | **GitHub の Issue から作る** |
| 権限 | 手動（毎回確認） | **Yolo**（練習リポなので解禁。終わったら戻す） |
| ゴール | PR を作るまで | **チェック確認 → マージ → コンフリクト解消 → Issue クローズ** まで |

## 進め方（合計 約 90 分）

[01_handson.md](./01_handson.md) を上から順に進めてください。準備（1〜3 章）→ 本編（4〜11 章）→ 付録の順です。
Orca の概念（worktree、ADE、権限の 3 層）は第1弾の [01_overview.md](https://github.com/misshii3/orca-handson/blob/main/01_overview.md) を参照します。

## このリポジトリの使い方（参加者向け）

このリポジトリは **テンプレートリポジトリ** です。自分のアカウントに複製し、同梱のスクリプトでタスク用の Issue を作ってから使います。
詳しい手順は `01_handson.md` の 2 章にありますが、要点だけ書くと次のコマンドです。

```bash
gh repo create orca-handson-2 --template misshii3/orca-handson-2 --private --clone
cd orca-handson-2
npm test                      # 9 件すべて成功するのが正常です
bash scripts/seed-issues.sh   # 自分のリポジトリに Issue #1〜#3 を作ります
```

## ファイル構成

```
orca-handson-2/
├── README.md                    # このファイル
├── 01_handson.md                # ハンズオン手順（約 90 分）
├── images/                      # 実機のスクリーンショット（01 から参照）
│   └── diagrams/                # 図解（SVG）
├── issues/                      # タスクの Issue 本文（seed-issues.sh が読む）
│   ├── 01-format-date-ja.md
│   ├── 02-calc-shipping.md
│   └── 03-apply-coupon.md
├── scripts/
│   └── seed-issues.sh           # gh issue create で Issue を 3 件作る（何度実行しても増えない）
├── .github/workflows/test.yml   # PR と main への push で npm test を実行（GitHub Actions）
├── package.json                 # npm test の定義。依存パッケージなし
├── src/
│   ├── price.js                 # 税込計算と割引計算（第1弾のバグは直してあります）
│   └── date.js                  # 日付フォーマット（同上）
└── test/
    ├── price.test.js
    └── date.test.js
```

## サンプルアプリについて

第1弾のサンプルから **バグを直した状態** が初期状態です。`npm test` は 9 件すべて成功します。
続編では、この上に Issue #1〜#3 の機能（`formatDateJa`、`calcShipping`、`applyCoupon`）をエージェントに追加させます。
`src/price.js` の冒頭には「定数ブロック」があり、#2 と #3 の両方がここに定数を足すため、後からマージする側で **意図的にコンフリクトが起きる** 設計です。

依存パッケージはありません。Node.js 20 以上で `npm test` が動きます。

## 動作確認環境

- macOS（Apple Silicon）
- Orca 1.4.200（日本語 UI）
- Claude Code 2.1.x / Codex CLI 0.15x
- gh 2.8x / Node.js 22

Orca は更新頻度が高く、画面の表記が変わることがあります。手順と画面が合わないときは
[公式ドキュメント](https://www.onorca.dev/docs) を確認してください。

## ライセンス

MIT
