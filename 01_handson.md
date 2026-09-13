# Orca ハンズオン 続編 — Issue から 3 本のタスクを並列で進めて、マージとコンフリクト解消まで

所要時間の目安: 約 90 分（エージェントと GitHub Actions の待ち時間を含む）
確認環境: macOS（Apple Silicon）、Orca 1.4.200（日本語 UI）、Claude Code 2.1.x、Codex CLI 0.15x、gh 2.8x、Node.js 22

[第1弾](https://github.com/misshii3/orca-handson) を終えている前提で書いています。ワークツリーの作り方、差分の読み方、Source Control の使い方は第1弾の該当章へのリンクで済ませ、続編で初めて出てくる操作だけを丁寧に書きます。

Orca は更新が速く、ボタンの文言や配置が変わることがあります。本書の表記は上記バージョンの実機で確認したものです。
画面と食い違ったら、主要な用語に（ ）で併記した英語ドキュメントの呼び方を手がかりに [公式ドキュメント](https://www.onorca.dev/docs) を探してください。

> **キー表記**: ⌘ = command、⇧ = shift、↩ = Enter（return）、⌫ = delete

---

## 0. このハンズオンのゴール

終わったときに、次のことが一人でできるようになっているのがゴールです。

- GitHub の **Issue からワークツリーを作り**、Issue をエージェントに実装させられる
- **別々のタスクを 3 本同時に** 走らせ、それぞれを PR にできる
- PR パネルで **チェック（CI）の結果を見てマージ** し、Issue を自動で閉じられる
- 後からマージする PR で起きた **コンフリクトを、Orca の競合 UI とエージェントで解消** できる
- **Yolo モード** を「使ってよい場面」を判断して使い、終わったら手動に戻せる

### 全体の流れ

![続編のロードマップ。準備（1〜3 章）、本編（4〜11 章）、付録の順に進む](images/diagrams/13_handson2-roadmap.svg)

本編で体験する流れを 1 枚にすると次のようになります。**3 つの Issue を 3 本のワークツリーで進め、PR を 3 本作り、順にマージします。3 本目で競合が起きます。**

![並列タスクの流れ。3 つの Issue → 3 本のワークツリー → 3 本の PR → #1、#2 は順にすんなりマージ、#3 は競合を解消してマージ](images/diagrams/10_parallel-tasks-flow.svg)

### 第1弾との違い

| | 第1弾 | 続編 |
|---|---|---|
| タスク | 同じバグ修正を Claude Code と Codex で競争 | 別々の機能追加を 3 本並列（#1 Claude Code、#2 Codex、#3 Claude Code） |
| ワークツリーの作り方 | 「名前」タブに名前を打つ | 「GitHub」タブで **Issue を選ぶ** |
| 権限 | 手動（毎回確認する） | **Yolo**（確認なし。練習リポなので解禁し、終わったら戻す） |
| PR | 作るまで | チェック確認 → **マージ** → **コンフリクト解消** → Issue が閉じるまで |

### 用語（先に押さえておく）

| 用語 | 意味 |
|---|---|
| Issue | GitHub 上のタスク票。今回はこれが「仕様書」です。`#1` のように番号で呼びます |
| チェック（Checks） | PR に対して自動で走るテストなど。今回は GitHub Actions が `npm test` を実行し、結果が PR に ✓ / ✗ で付きます |
| マージ（Merge） | PR のブランチの変更を `main` に取り込むこと。今回は Orca の PR パネルから行います |
| コンフリクト（競合、Conflict） | 2 つのブランチが **同じファイルの同じ場所** を別々に変えたため、git が自動で合成できない状態 |
| 分岐元（base、`origin/main`） | ワークツリーを切ったときの元。他の PR がマージされると `origin/main` が先に進み、自分のブランチが「古く」なります |

---

## 1. 前提チェック（5 分）

第1弾の 1〜3 章が済んでいる（Orca がインストール済みで、「連携」の GitHub が Connected）ことを前提にします。ターミナルで次を確認してください。

```bash
claude --version      # 2.x
codex --version       # codex-cli 0.15x
node --version        # v20 以上
gh auth status        # "Logged in to github.com account <あなたのID>" が出れば OK
```

Orca のバージョンは、メニューバーの **Orca → Orca について**（About Orca）で確認できます。1.4.200 前後なら本書の表記と合うはずです。

✅ **ここまでできたら**: 4 つのコマンドが全部エラーなく終わり、Orca が起動している。

---

## 2. サンプルリポジトリを複製して、Issue を作る（10 分）

### 2-1. テンプレートから複製する

第1弾と同じ要領で、続編のテンプレートリポジトリから **自分のアカウントに** 複製を作ります。

```bash
cd ~/Documents            # 第1弾と同じ場所に置く前提で書きます
gh repo create orca-handson-2 --template misshii3/orca-handson-2 --private --clone
cd orca-handson-2
npm test
```

今回は **9 件すべて成功** するのが正常です（第1弾のバグは直してあります）。

```
ℹ tests 9
ℹ suites 3
ℹ pass 9
ℹ fail 0
```

### 2-2. タスク用の Issue を 3 件作る

テンプレートを複製しても **Issue はコピーされません**。同梱のスクリプトで、自分のリポジトリに Issue を作ります。

```bash
bash scripts/seed-issues.sh
```

次のように 3 件作られ、最後に一覧が出ます。

```
対象リポジトリ: <あなたのID>/orca-handson-2

作成しました: formatDateJa を追加する（日付を「2026年9月13日」形式にする）
  https://github.com/<あなたのID>/orca-handson-2/issues/1
作成しました: calcShipping を追加する（送料計算。3,000 円以上で送料無料）
  https://github.com/<あなたのID>/orca-handson-2/issues/2
作成しました: applyCoupon を追加する（クーポンコードで割引する）
  https://github.com/<あなたのID>/orca-handson-2/issues/3
```

スクリプトの中身は `issues/*.md` を番号順に読み、1 行目をタイトル、2 行目以降を本文にして `gh issue create` を呼んでいるだけです。同じタイトルの Issue があれば作らないので、何度実行しても増えません。

### 2-3. Issue を読む（3 分）

ブラウザで `https://github.com/<あなたのID>/orca-handson-2/issues` を開き、3 つの Issue を **自分で一度読んでください**。それぞれ「背景 / 仕様 / 受け入れ条件」の形で書かれています。

| # | 追加する関数 | 触るファイル | 担当させるエージェント |
|---|---|---|---|
| 1 | `formatDateJa` … 日付を「2026年9月13日」形式に | `src/date.js`, `test/date.test.js` | Claude Code |
| 2 | `calcShipping` … 送料。3,000 円以上で無料 | `src/price.js`, `test/price.test.js` | Codex |
| 3 | `applyCoupon` … クーポンコードで割引 | `src/price.js`, `test/price.test.js` | Claude Code |

#2 と #3 が **同じ 2 ファイル** を触ることに注目してください。どちらも `src/price.js` 冒頭の「定数ブロック」に定数を足し、末尾に関数を足し、`test/price.test.js` の末尾にテストを足します。これが 9〜10 章のコンフリクトの種です。

> `.github/workflows/test.yml` も一緒に複製されています。これは GitHub Actions の設定で、PR を作ると `npm test` が GitHub 上で実行され、結果が PR に付きます（8 章で見ます）。

✅ **ここまでできたら**: 自分の GitHub に `orca-handson-2` があり、Issue が #1〜#3 の 3 件 open、ローカルで `npm test` が 9 件成功。

---

## 3. Orca にプロジェクトを追加して、Yolo に切り替える（5 分）

### 3-1. プロジェクトを追加する

Orca で、サイドバーの「プロジェクト」右側の **＋**（または「作成」メニュー → 「プロジェクトを追加」）→ 「**フォルダーを参照**」で `~/Documents/orca-handson-2` を選びます（第1弾 5 章と同じ操作です）。
サイドバーに `orca-handson-2` → `main ［プライマリ］` が出ます。

### 3-2. 「Agent の権限」を Yolo にする

第1弾では「Agent の権限」を **手動** にして、エージェントの確認プロンプトを読む練習をしました。続編では **3 本のエージェントを同時に走らせる** ので、手動だと確認プロンプトの応対で手一杯になります。
そこで今回は、第1弾の付録 C に書いた「Yolo を使ってよい条件」を **この練習リポジトリが満たしていることを確認した上で**、Yolo を使います。

- [ ] 業務リポジトリではなく、**練習用の使い捨て** リポジトリである（`orca-handson-2` は自分のアカウントの private リポ）
- [ ] このリポジトリから届く範囲に、本番の認証情報や `.env` が **ない**（サンプルには何も入っていません。`~/Documents` 直下などに秘密情報を置いていないかは自分で確認）
- [ ] `git push --force` や `rm -rf` のような取り消せない操作をエージェントがしても **困らない**（壊れたら複製し直せばよい）
- [ ] 終わったら **差分を全部読む**（Yolo の代償です。6〜7 章で必ず読みます）

4 つとも ✓ なら、設定（⌘,）→ 「**Agent**」→ 「**Agent の権限**」を **Yolo** にします。「インストール済み」の欄が `claude --dangerously-skip-permissions`、`codex --dangerously-bypass-approvals-and-sandbox` に変わります（第1弾 3 章の逆の操作です）。

権限の 3 層の図を再掲します。今変えたのは 1 層目だけで、Yolo にすると 2 層目（エージェント自身の確認）も **フラグで丸ごとスキップ** されます。3 層目（macOS のフォルダアクセス）はそのままです。

![権限の 3 つの層。1 層目 Orca の「Agent の権限」は起動コマンドにフラグを付けるかだけを決める。2 層目はエージェント自身の権限モード。3 層目は macOS のフォルダアクセス許可](images/diagrams/02_permission-layers.svg)

> **11 章で必ず手動に戻します。** 業務で Orca を使うときの既定は手動、と考えてください。

✅ **ここまでできたら**: サイドバーに `orca-handson-2` → `main ［プライマリ］`、「Agent の権限」が **Yolo**。

---

## 4. Issue からワークツリーを 3 本作る（10 分）

> 4〜7 章が本編の前半です。第1弾では「名前」タブで名前を打ってワークツリーを作りましたが、今回は **Issue から** 作ります。

### 4-1. #1 のワークツリー（Claude Code）

サイドバーで `orca-handson-2` を選び **⌘N** を押します。「ワークツリーを作成する」ダイアログで、名前欄の上のタブを「**GitHub**」に切り替えると、このリポジトリの Issue と PR の一覧が出ます。

| 項目 | 入れる値 |
|---|---|
| プロジェクト | `orca-handson-2`（右の灰色の文字が `<あなたのID>/orca-handson-2` であること） |
| 実行先 | `Local Mac` のまま |
| タブ | 「**GitHub**」→ 一覧から **#1 formatDateJa を追加する** を選ぶ |
| Agent | **Claude** |
| 詳細設定 | 触らない |

Issue を選ぶと、タスク名が Issue から自動で入り、Issue が **このワークツリーにリンク** されます。「ワークツリーを作成する ⌘↩」を押します。

> 「**スマート**」タブでも同じことができます。入力欄に `#1` や Issue の URL を貼ると候補が出ます。「GitHub」タブは一覧から選ぶ、「スマート」タブは検索して選ぶ、という違いです。

作成直後にサイドバーに新しいワークツリーが出て、ブランチ名は Issue から自動で付きます。ワークツリーの行（カード）にリンクされた Issue が表示されます。

### 4-2. Yolo での Claude Code 起動画面

中央のターミナルで `claude --dangerously-skip-permissions` が起動します。フラグ付きで起動した Claude Code は、初回に **「Bypass Permissions mode」の警告画面** を出します。内容（このモードは信頼できる隔離環境でだけ使うこと、など）を読み、「**Yes, I accept**」を選んで ↩ を押します。
第1弾と同じ「Quick safety check（フォルダを信頼するか）」が先に出ることもあります。その場合は「Yes, I trust this folder」→ 続けて上の警告画面、の順です。

`❯` のプロンプトが出たら準備完了です。**まだ指示は貼りません**（5 章で 3 本まとめて貼ります）。

### 4-3. #2（Codex）と #3（Claude Code）のワークツリー

同じ操作を 2 回繰り返します。

| | タブ「GitHub」で選ぶ Issue | Agent |
|---|---|---|
| 2 本目 | **#2 calcShipping を追加する** | **Codex** |
| 3 本目 | **#3 applyCoupon を追加する** | **Claude** |

Codex は `codex --dangerously-bypass-approvals-and-sandbox` で起動し、承諾画面なしでプロンプト（`» Ask Codex to do anything`）が出ます。3 本目の Claude Code では、4-2 の承諾画面はもう出ません。

サイドバーに 3 本のワークツリーが並び、それぞれにリンクされた Issue 番号が見えているはずです。

> **なぜ #1, #2 が先に Codex/Claude ではないのか**: 担当の割り振りは「どのエージェントが得意か」ではなく **タスクごとに好きに選べる** ことを見せるためのものです。#3 を Claude Code にしたのは、10 章のコンフリクト解消という重めの作業を任せるためです。

✅ **ここまでできたら**: サイドバーに 3 本のワークツリー（#1 Claude、#2 Codex、#3 Claude）が並び、3 つのターミナルでエージェントのプロンプトが待っている。

---

## 5. 3 本を並列で走らせる（15 分）

### 5-1. 同じ指示を 3 本に貼る（Issue 番号だけ変える）

各ワークツリーのターミナルに、次の指示を貼って ↩ します。`N` はそのワークツリーの Issue 番号（1、2、3）に置き換えてください。

```
gh issue view N を実行して Issue #N を読み、受け入れ条件をすべて満たすように実装してください。実装が終わったら npm test を実行してすべて成功することを確認し、何をどう実装したかを日本語で簡潔に報告してください。
```

Yolo なので、エージェントが `gh` を叩いても、ファイルを書き換えても、`npm test` を走らせても **確認は出ません**。第1弾で読んでいた確認プロンプトの中身を、今回は **差分で後から読む** ことになります。

> ワークツリーの切り替えは **⌘J** でワークツリー名の一部を打つのが速いです（第1弾 8 章）。3 本並べて眺めたいときは ⌘J → Shift+↩ で分割ペインに開けます（第1弾 7-3）。

### 5-2. 待っている間に見るもの

- サイドバーのアイコンで進み具合が分かります（スピナー = 作業中、ベル = あなたの番、緑のチェック = 完了。一覧は第1弾 7-4）
- Codex のワークツリーの下に `default` の子行が出るのは、Codex のサブエージェントです
- 参考値: 今回の実測では 3 本とも 1〜3 分で完走しました。順番は毎回変わります

### 5-3. 完了したら報告を読む

3 本とも緑のチェックになったら、各ターミナルの日本語の報告を読みます。見るのは次の 2 点です。

- Issue の **受け入れ条件を 1 つずつ満たしたと言っているか**（定数を定数ブロックに置いたか、テストを末尾に足したか、既存を触っていないか）
- `npm test` の結果に **fail 0** と書いてあるか

報告を読んだだけで信じないでください。次の章で差分を自分の目で読みます。

✅ **ここまでできたら**: 3 本のワークツリーに緑のチェックが付き、各ターミナルに日本語の報告がある。

---

## 6. #1 を PR にする（10 分）

ここは第1弾 9〜11 章の復習です。違いは **コミットメッセージに `Closes #1` を書く** ことだけです。

### 6-1. 差分を読む

サイドバー（または ⌘J）で **#1 のワークツリー** を選び、右パネルの **Source Control**（ブランチアイコン）→ 「変更点」の「**すべて見る**」で Changes を開きます。

見る観点は第1弾と同じ 3 つです。

- [ ] **仕様どおりか**: Issue の表の 3 例（`2026年9月13日`、`2026年1月5日`、`2026年12月25日`）がテストに入っているか。ゼロ埋めしていないか
- [ ] **余計なことをしていないか**: 変更ファイルが `src/date.js` と `test/date.test.js` の 2 つだけか。既存の `formatDate` とそのテストは触っていないか
- [ ] **読めるか**: JSDoc が日本語で付いているか

気になる行があれば、第1弾 10 章の **Annotate**（行の ＋ → メモ → Send）でエージェントに直させてから先へ進んでください。問題なければ次へ。

### 6-2. コミットする（`Closes #1` を付ける）

Source Control で「**＋ ステージオール**」→ メッセージ欄の **AI アイコン** でコミットメッセージを生成します。**生成された文を読んで、事実と違えば直してください**。そのうえで、メッセージの **末尾に 1 行空けて** 次を追記します。

```
Closes #1
```

`Closes #N`（`Fixes #N`、`Resolves #N` でも同じ）は GitHub のキーワードで、**このコミットが `main` に入った時点で Issue #N が自動的に閉じます**。PR の本文に書いても同じ効果があります。今回は Orca が PR の本文を空で作るので、コミットメッセージに書くのが確実です。

「**Commit**」（⌘↩）を押します。

### 6-3. push して PR を作る

ボタンが「**ブランチを公開**」（Publish Branch）に変わるので押します。push が終わったら、パネル上部の「**PR を作成**」を押します。第1弾と同じく、確認ダイアログなしで PR ができ、パネル上部が「PR #4」のような表示に変わります（**Issue と PR は番号を共有する** ので、PR の番号は 4 から始まります）。

> PR 作成時にタイトル・説明のダイアログが出るバージョンでは、「AI で PR の説明を生成」して内容を確認してから作成してください。

右パネルの **4 番目のアイコン（PR）** を押すと、PR の状態が OPEN で、「チェック」の欄に `test` が **実行中**（黄色）で出ているはずです。GitHub Actions が動き始めた印です。結果は 8 章で見ます。

✅ **ここまでできたら**: #1 の PR が OPEN で、PR パネルにチェック `test` が出ている。

---

## 7. #2 と #3 も PR にする（10 分）

#2（Codex）と #3（Claude Code）のワークツリーで、6 章と同じ手順を繰り返します。

| | 差分で特に見る点 | コミットメッセージの末尾 |
|---|---|---|
| #2 | 定数ブロックに `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD` が **`export const` で** 足されているか。`calcShipping(3000)` が `0` になるテストがあるか（境界値） | `Closes #2` |
| #3 | 定数ブロックに `COUPONS` が足されているか。`applyCoupon(300, "SAVE500")` が `0` になるテスト（0 未満にしない）と、`code` 省略時のテストがあるか | `Closes #3` |

第1弾で見たように、Codex は最小差分、Claude Code はコメント多め、と **書き方に差** が出ます。今回は 2 本を比べて選ぶのではなく、**両方をマージします**。だからこそ、次の章で「同じ場所を別々に書いた」ことがコンフリクトになります。

3 本の PR ができたら、ターミナルで確認します。

```bash
cd ~/Documents/orca-handson-2
gh pr list
```

3 行出れば OK です。この時点では **どの PR も競合していません**。3 本とも同じ `main` から分岐していて、`main` はまだ動いていないからです。

✅ **ここまでできたら**: `gh pr list` に PR が 3 本、サイドバーの 3 本のワークツリーに PR アイコンが付いている。

---

## 8. #1 をマージする（5 分）

> 8〜10 章が本編の後半です。ここから **`main` が動き始めます**。

![PR の流れ。作成 → チェック実行中 → チェック成功 → マージ → Issue が閉じる。失敗したら直して push](images/diagrams/12_pr-panel-flow.svg)

### 8-1. チェックが緑になるのを待つ

#1 のワークツリーを選び、右パネルの **PR** を開きます。「チェック」の `test` が **成功（緑の ✓）** になっているのを確認します。まだ黄色なら数十秒待ちます（参考値: `npm test` だけなので 30〜60 秒）。

赤い ✗ になったら、チェック名をクリックすると失敗したジョブのログがその場で読めます。ワークツリーのカードにも赤いチップが付き、PR ビューの「**Fix broken checks**」を押すと、失敗したチェック名とリンクをエージェントに渡して直させることができます（付録 B）。

### 8-2. マージする

PR パネルの **マージボタン** を押します。ボタンの文言は **リポジトリの既定のマージ方式** に従い、`Create merge commit` / `Squash and merge` / `Rebase and merge` のどれかです。複製直後のリポジトリは `Create merge commit` になっているはずです。

数秒で PR の状態が **MERGED** に変わります。

### 8-3. Issue が閉じたことを確認する

```bash
gh issue view 1
```

`state: CLOSED` と出ます。6-2 で書いた `Closes #1` が効いた結果です。ブラウザで Issue #1 を開くと、「このコミットで閉じられた」というリンクが付いています。

✅ **ここまでできたら**: #1 の PR が MERGED、Issue #1 が CLOSED。

---

## 9. #2 をマージすると、#3 が競合する（5 分）

### 9-1. #2 をマージする

#2 のワークツリーを選び、8 章と同じ手順でマージします（チェックが緑 → マージボタン）。#1 は `date.js` だけ、#2 は `price.js` だけを触っているので、**すんなり** 入ります。`gh issue view 2` が CLOSED になります。

### 9-2. #3 の PR を見る

**マージ直後に #3 のワークツリーに切り替えて、PR パネルを見てください。** さっきまで問題なかった #3 の PR に、**競合している（This branch has conflicts that must be resolved）** という表示が出ます。GitHub が `main` の新しい状態と #3 のブランチを合成しようとして、できなかったのです。

何が起きたのかを図にします。

![コンフリクトの仕組み。main、#2 のブランチ、#3 のブランチが src/price.js の同じ場所（定数ブロックと末尾）を別々に変えた。#2 を main に入れた後で #3 を merge すると、git はどちらを残すか決められない](images/diagrams/11_merge-conflict.svg)

- #2 と #3 は同じ `main` から分岐し、どちらも `src/price.js` の **定数ブロック** に定数を足し、**末尾** に関数を足し、`test/price.test.js` の **末尾** にテストを足した
- #2 が `main` に入った
- #3 のブランチを `main` に合成しようとすると、同じ場所に **違う行** が足されている。git は「両方残す」のか「片方だけ」なのか判断できないので、人に決めさせる

これが **コンフリクト（競合）** です。日常業務では、複数人・複数エージェントが並列で動いている限り必ず起きます。次の章で解消します。

✅ **ここまでできたら**: #2 の PR が MERGED、Issue #2 が CLOSED、#3 の PR パネルに競合の表示。

---

## 10. #3 の競合を解消してマージする（15 分）

競合の解消は、**#3 のワークツリーの中で `main` を取り込み、ぶつかった箇所を直して、コミットして push する** 作業です。取り込みには `merge` と `rebase` の 2 通りがあり、今回は **`merge`** を使います（`rebase` は付録 A）。`merge` なら force push が要らないからです。

### 10-1. ターミナルで `origin/main` を取り込む

#3 のワークツリーで、エージェントのターミナルとは別に **ブランクターミナル** を開きます（中央のタブバーの ＋ から。ワークツリーのディレクトリで開きます）。次を実行します。

```bash
git fetch origin
git merge origin/main
```

次のような出力が出ます。

```
Auto-merging src/price.js
CONFLICT (content): Merge conflict in src/price.js
Auto-merging test/price.test.js
CONFLICT (content): Merge conflict in test/price.test.js
Automatic merge failed; fix conflicts and then commit the result.
```

`CONFLICT` が 2 ファイルに出ました。この状態でファイルを開くと、ぶつかった箇所が `<<<<<<<`、`=======`、`>>>>>>>` の印（コンフリクトマーカー）で囲まれています。ここを人が直すのが本来の作業ですが、今回はエージェントにやらせて、結果を検品します。

> ここでやめたくなったら `git merge --abort` で取り込み前に戻れます。Source Control のメニューにも「Abort merge」があります。

### 10-2. 「Resolve with AI」でエージェントに解消させる

Source Control パネルを見ると、競合中は「**Review conflicts**」と「**Resolve with AI**」が出ています。「**Resolve with AI**」を押し、送り先にこのワークツリーの **Claude Code** を選びます。

Claude Code のターミナルに競合ファイルの一覧を含む指示が届き、Claude Code が 2 つのファイルのマーカーを解消します。今回の正解は **「両方残す」** です。定数ブロックには `SHIPPING_FEE` / `FREE_SHIPPING_THRESHOLD` と `COUPONS` の両方、末尾には `calcShipping` と `applyCoupon` の両方、テストにも両方の `describe` が並ぶ形になります。

### 10-3. 解消結果を検品する

「**Review conflicts**」を押すと、競合箇所を **分岐元 / #2（origin/main）/ #3（自分）** の 3 列で見比べる 3-way ビューが開きます。次を確認します。

- [ ] 定数ブロックに **5 つの定数**（元の 3 つ + `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD` + `COUPONS`）が並んでいるか
- [ ] `calcShipping` と `applyCoupon` の **両方** が残っているか
- [ ] `test/price.test.js` に `calcShipping` と `applyCoupon` の **両方** の `describe` があるか
- [ ] コンフリクトマーカー（`<<<<<<<` など）が **1 つも残っていない** か

ブランクターミナルでテストも回します。

```bash
npm test
```

`fail 0` で、テスト数が増えていること（参考値: 9 + #1 の 3 + #2 の 4 + #3 の 6 = 22 件。エージェントの書き方で多少変わります）を確認します。

### 10-4. コミットして push する

Source Control で「**＋ ステージオール**」→ コミットメッセージはマージコミットなので `Merge origin/main into <ブランチ名>` のような 1 行で構いません（AI 生成でも可）→ 「**Commit**」。
ボタンが「**Push**」に変わるので押します。`merge` で取り込んだので **force push は不要** です。

push すると #3 の PR でチェックが再実行されます。PR パネルで競合の表示が消え、チェックが緑になったら **マージボタン** を押します。

```bash
gh issue view 3      # CLOSED
gh pr list           # 何も出ない（3 本ともマージ済み）
```

✅ **ここまでできたら**: #3 の PR が MERGED、Issue #1〜#3 がすべて CLOSED、`gh pr list` が空。

---

## 11. 後片付けと、手動に戻す（10 分）

### 11-1. プライマリで結果を確かめる

3 本の PR が `main` に入りました。プライマリの `main` を最新にして、全部そろった状態のテストを回します。

```bash
cd ~/Documents/orca-handson-2
git pull
npm test
```

`fail 0` で、テスト数は 10-3 で見た数と同じになります。`src/price.js` を開いて、定数ブロックに 5 つの定数、末尾に 2 つの関数が並んでいるのを見てください。

### 11-2. ワークツリーを 3 本削除する

サイドバーでワークツリーを右クリック → 「**削除 ⌘⇧⌫**」。3 本とも消します（⌘ を押しながらクリックで複数選択してからまとめて削除もできます）。

![ワークツリー削除で消えるもの・残るもの。フォルダと未コミットの変更とローカルブランチは消える。プライマリ、push 済みブランチ、PR は残る](images/diagrams/06_worktree-cleanup.svg)

今回は 3 本とも **マージ済み** なので、ローカルブランチは黙って消えます。第1弾 12 章で触れた「コミット済みで未マージのブランチを退避する」動き（「Review N Branches」のトースト）は、**未マージのコミットがあるときだけ** 出ます。

```bash
git worktree list    # プライマリの 1 行だけ
git branch           # main だけ
```

### 11-3. 「Agent の権限」を手動に戻す

設定（⌘,）→ 「**Agent**」→ 「**Agent の権限**」を **手動** に戻します。「インストール済み」が `claude`、`codex` だけになれば OK です。

Yolo を使った今回のリポジトリは使い捨てでした。業務のリポジトリでは、**手動を既定にし、Yolo にするなら 3-2 の 4 条件を毎回確かめる** のが続編で持ち帰ってほしい判断基準です（付録 C）。

### 11-4. Issue を確認する

```bash
gh issue list                    # 何も出ない
gh issue list --state closed     # 3 件
```

✅ **ここまでできたら**: サイドバーに `main` だけ、「Agent の権限」が **手動**、Issue が 3 件とも CLOSED。

ここまでで本編は終わりです。お疲れさまでした。

---

## 付録 A（任意）: `rebase` で取り込む場合と「Force push with lease」

10 章では `merge` で `origin/main` を取り込みました。チームによっては、履歴を一直線に保つために **`rebase`** を使うルールのところもあります。

```bash
git fetch origin
git rebase origin/main
# CONFLICT が出たら 10-2 と同じく Resolve with AI で解消し、
git add -A
git rebase --continue
```

`rebase` は **自分のブランチの履歴を書き換える** ので、すでに push 済みのブランチには普通の `push` ができません。このとき Orca の Source Control には「**Force push with lease**」が **別のボタンとして** 出ます。`--force-with-lease` は「リモートが自分の知っている状態のままなら上書きする」という安全弁付きの force push で、Orca は普通の Push の代わりに黙って force push することはありません。

ジュニアのうちは **`merge` を既定** にし、`rebase` + force push はチームのルールで求められたときだけ、意味を理解してから使ってください。

---

## 付録 B: トラブルシューティング

第1弾の付録 B（Orca 一般、`gh`、macOS の許可、PATH）も合わせて参照してください。ここには続編で新しく出る症状だけを載せます。

| 症状 | 見るところ・直し方 |
|---|---|
| `seed-issues.sh` が `gh にログインしていません` と言う | `gh auth login` を実行してから再実行 |
| `seed-issues.sh` が `not a git repository` や `no git remotes` と言う | `orca-handson-2` の中で実行しているか確認。`gh repo view` が自分のリポジトリを指しているか |
| Issue が重複して作られた | スクリプトはタイトル一致でスキップする。手で作った Issue とタイトルが違うと重複する。不要な方を `gh issue close N` で閉じる |
| 作成ダイアログの「GitHub」タブに Issue が出ない | 設定 → 「連携」の GitHub が Connected か。`gh auth status` を確認。少し待って再表示。「スマート」タブに Issue の URL を貼る方法でも作れる |
| Claude Code が `--dangerously-skip-permissions` の警告で止まっている | 「Yes, I accept」を選んで ↩。「No, exit」で終了したらそのターミナルで `claude --dangerously-skip-permissions` と打って再起動 |
| エージェントが `gh issue view` に失敗する | ワークツリーのターミナルで `gh auth status`。`GITHUB_TOKEN` / `GH_TOKEN` 環境変数が古い値なら `unset` する（第1弾 付録 B） |
| PR パネルの「チェック」に何も出ない | リポジトリの Actions が無効になっていないか（GitHub の Settings → Actions → General）。`.github/workflows/test.yml` が `main` にあるか。PR を作った直後は数十秒かかる |
| チェックが赤（失敗）になった | チェック名をクリックしてログを読む。PR ビューの「Fix broken checks」でエージェントに渡す。直して push すると再実行される |
| #2 をマージしても #3 が競合しなかった | エージェントの書き方によっては同じ場所に足さないことがある。その場合は #3 をそのままマージして構いません。「衝突しないことも比較の材料」です。付録 A の手順を空振りで試しておくと感覚がつかめます |
| Source Control に「Resolve with AI」が出ない | `git status` で `Unmerged paths` があるか確認。出ていなければ競合が残っていない。出ているのにボタンがなければ、Claude Code のターミナルに「`git status` で競合しているファイルを確認して、両方の変更を残す形でコンフリクトを解消し、npm test を通してください」と直接指示する |
| `git merge origin/main` が `Already up to date` と言う | `main` が動いていない。#2 がマージ済みか `gh pr list --state merged` で確認 |
| マージコミット後に「Force push with lease」が出た | `merge` ではなく `rebase` をした、または `--amend` をした。付録 A を読み、意図どおりなら押す。意図しなければ `git reflog` で戻す |
| Yolo を戻し忘れた | 設定 → Agent → 「Agent の権限」を手動に。「インストール済み」の欄でフラグが消えたことを確認 |

---

## 付録 C: 続編で Yolo を使った理由と、業務での判断基準

第1弾では、エージェントが何をしようとしているかを **確認プロンプトで読む** ために手動を使いました。続編で Yolo を使ったのは、次の 2 つがそろっていたからです。

1. **リポジトリが使い捨て** で、認証情報もなく、壊れても複製し直せる
2. **差分を全部読む** 工程（6〜7 章、10-3）が手順に組み込まれている

Orca の設計思想は「ワークツリーは使い捨てだから、エージェントには自由にやらせて差分で検品する」です。Yolo はその思想の表れで、確認を読む代わりに **差分を読む** ことで安全を担保します。読まないなら Yolo を使う資格はまだない、というのは第1弾と同じです。

業務リポジトリで判断するときのチェックリストを再掲します。1 つでも ✗ なら手動です。

- [ ] 業務リポではない、または業務リポでも **本番の認証情報・`.env`・個人情報** がワークツリーから届く範囲にない
- [ ] `git push --force`、`rm -rf`、外部 API の呼び出しなど **取り消せない操作** をエージェントが行っても困らない
- [ ] 社内コードやプロンプトを外部 LLM に送ることが **組織のルールで許可** されている（Orca ではなく Claude Code / Codex 側の話）
- [ ] 出てきた **差分を全部読む** 時間を確保している

---

## 参考リンク

- GitHub 連携（Issue からのワークツリー、PR パネル、チェック、マージ）: https://www.onorca.dev/docs/review/github
- Commit & push（Resolve with AI、Force push with lease）: https://www.onorca.dev/docs/review/commit-push
- Diff viewer（3-way の競合解消ビュー）: https://www.onorca.dev/docs/review/diff-viewer
- Worktrees（Issue / PR からの作成、ブランチ名）: https://www.onorca.dev/docs/model/worktrees
- Troubleshooting GitHub errors: https://www.onorca.dev/docs/github-errors
- GitHub Docs「キーワードを使用して Issue を PR にリンクする」: https://docs.github.com/ja/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue
