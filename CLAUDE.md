# kusutto-games プロジェクト固有メモ

「くすっと系」ミニゲームバンドル。知識テストでも性格診断でもなく、「はっと気づいてくすっと笑う」体験を提供する軽量コンテンツをまとめたWebアプリ。将来的にCapacitorでiOSアプリ化予定(まずWebで動くようにする方針)。

共通の開発標準は `~/.claude/CLAUDE.md`(postCreateCommandで自動配置)を参照。ここにはこのプロジェクト固有の制約・quirksのみ書く。

## 技術方針

- ビルドツールなしのVanilla HTML/CSS/JS。`www/index.html` 1枚に全画面(ホーム+各ゲーム+結果画面)を内包し、`.hidden` クラスの付け外しで画面を切り替えるSPA(`versant-practice/prototype/` と同じパターン)
- 演出はCSSを基本とし、複雑なタイミング制御が必要な箇所(前髪ゲームのカウントダウン、結果画面のポップイン/シェイク)だけ `www/vendor/gsap.min.js` を使う
- 実行時にLLM APIは呼ばない。全コンテンツは `www/data/*.json` の静的データ+単純な分岐ロジックで完結させる(運用コストをゼロに近づける方針)
- devcontainerはNode.jsベース(`mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye`)。既存の `versant-practice`/`toeic-marksheet-scorer`(Python系)とはベースイメージが異なるため、Obsidian連携フックが依存する `python3` を `postCreate.sh` で明示インストールしている
- `ffmpeg`/`fonts-liberation` は音声・画像の事前生成が発生しないため未導入(他プロジェクトからの機械的コピペはしていない)

## データスキーマ(一次情報源はこのファイル)

- `www/data/lottery-targets.json`: `{ id, label, odds, note }[]`。宝くじ側のターゲット(ジャンボ宝くじ・ロト等)。`odds`は分母の数値(確率1/oddsのoddsの部分)、`note`に出典を明記する
- `www/data/lottery-components.json`: `{ id, mode: "general"|"gambler", label, odds, note }[]`。言い換えに使う事象プール。実在の確率(パチンコ実機の公表スペック、隕石死亡等の統計)のみを使い、出典不明・非公式の数値(例: 「魚群予告」のような演出上の体感確率)は採用しない
- `www/data/lottery-puzzles.json`: `{ id, mode, targetId, componentIds }[]`。一般モードは`componentIds`が1件(単一事象との直接比較)、ギャンブラーモードは2件(掛け算)。**掛け算の積は宝くじの確率と厳密に一致しない**(パチンコ実機odds同士を掛けても最大1/16万程度にしかならず、宝くじの1/1000万規模には届かない)。これは意図的な設計で、「宝くじの方がまだ何倍当たりにくいか」という気づきの演出として扱う(`www/js/games/lottery.js`の`checkAnswer()`内で実行時に算出、JSON側に倍率を持たせない)
- `www/data/proverb-quiz.json`: `{ id, situation, choices: string[4], answerIndex }[]`。4択固定(自由記述の表記ゆれ判定は運用コストに見合わないため採用しない)。選択肢はプールからのランダム抽出ではなく問題ごとに手書き固定
- `www/data/bangs-scenarios.json`: `{ id, beforeLength, afterLength, changed, teaseLine }[]`。前髪の状態は実写画像でなく数値+テキストで表現(画像アセット制作コストをゼロにするため)。次フェーズでSVG自作キャラクター+難易度10段階への刷新を予定

## 検証方法

`index.html` を `file://` で直接開かない(JSONの `fetch` がCORSで失敗する)。必ず `npm run dev`(`serve www -l 3000`)経由で `http://localhost:3000` を確認すること。

## デプロイ(GitHub Pages)

- 公開URL: https://moka0502.github.io/kusutto-games/ 。`.github/workflows/deploy-pages.yml` により `master` へのpushで自動デプロイされる(`actions/upload-pages-artifact` の `path: www` を公開)
- この構成を初めてセットアップする手順(他プロジェクトへ同様の構成を作る際も同じ手順を踏む):
  1. `gh auth login` でGitHub CLIを認証させておく(未認証だとPagesの有効化状況の確認や設定変更を代行できず、ユーザーに都度手動操作を依頼することになる)
  2. 無料枠のGitHub Pagesはpublicリポジトリでないと有効化できない(privateのままだとGitHub Enterpriseが必要)。**リポジトリの秘密情報の有無を確認した上で、publicにするかどうかを必ずユーザーに確認してから**変更する(2026-07-28、確認なしに進めず選択肢を提示して合意を取った)
  3. `.github/workflows/deploy-pages.yml` を追加(`actions/configure-pages` → `actions/upload-pages-artifact`(`path: www`)→ `actions/deploy-pages`)してpush
  4. リポジトリの Settings > Pages > Source を「GitHub Actions」に変更(初回のみ手動、gh CLI認証済みなら`gh api`経由でも可)
