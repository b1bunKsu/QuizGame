# GitHub Pages 移植ガイド

このフォルダの中身を新しい GitHub リポジトリのルートに配置し、Settings → Pages → Deploy from a branch → main / (root) を選んでください。

- 画面のスマホ左寄せを廃止し、PC・スマホともに中央配置に変更済み。
- 問題JSONは元の GitHub リポジトリから取得します。
- 全国正解率は既存 Netlify Functions を呼び出します。**既存 Netlify サイトは停止しないでください。**
- 全国正解率を GitHub Pages から使うには、既存 Netlify プロジェクトの `netlify/functions/correct-rate.js` にある CORS の `Access-Control-Allow-Origin` を新しい GitHub Pages の origin に合わせて修正し、Netlify 側を再デプロイしてください。
  例: `https://b1bunksu.github.io`（GitHub Pages のパスは含めない）。
- このZIPに Netlify Functions と Firebase 認証情報は含めていません。バックエンドは元の Netlify プロジェクトで管理してください。
- フォント `assets/NotoSansJP-Bold.ttf` は元ファイルを同梱しています。配布ライセンスを確認し、必要なライセンス文書を追加してください。
