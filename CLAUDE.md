# CLAUDE.md

このファイルは、リポジトリで作業する際に Claude Code (claude.ai/code) へ向けたガイダンスを提供します。

## コマンド

```bash
npm run dev       # HMR付き開発サーバーを起動
npm run build     # 型チェック + 本番ビルド (tsc -b && vite build)
npm run lint      # ESLint を実行
npm run preview   # 本番ビルドをローカルでプレビュー
```

テストスイートは未設定。

## アーキテクチャ

React 19 + TypeScript + Vite 製のアプリで、3次元パラメトリック方程式を HTML Canvas に描画する。

**コンポーネント構成:**
- `src/App.tsx` — ルートレイアウト。`<Header>` と `<DrawFunction>` を描画し、数式入力フィールドを持つ（描画ロジックへの接続は未実装）
- `src/components/header.tsx` — アプリタイトルを表示する静的ヘッダー
- `src/canvascomponents/drawfunction.tsx` — 描画ロジックの全てがここに集約されている

**`DrawFunction` の描画パイプライン:**

1. `functionNum` — パラメトリック方程式の定義: `x(t)`、`y(t)`、`z(t)` 関数と反復範囲（`FirstT`、`MaxT`、`dt`）
2. `camera` — 位置オフセット（`x`、`y`、`z`）と回転角（`zx` = xz平面周りの回転、`zy` = yz平面周りの回転）
3. `drawFunction3d(functionNum, camera, ctx)`:
   - カメラ位置で各点を平行移動
   - zx → zy の順に2つの回転行列を適用し、ワールド座標 `x2`、`y2`、`z2` を算出
   - 透視投影: `X = x2 * 380 / z2`、`Y = y2 * 380 / z2`
   - キャンバス中心 `(canvasSize.x/2, canvasSize.y/2)` を原点としてキャンバス座標に変換
4. `drawFunction2d` は存在するが現在未使用（2Dフォールバック）

**設計上の注意:** `canvasSize`、`functionNum`、`camera` はコンポーネント本体内でプレーンオブジェクトとして定義されており（Reactのstateではない）、変更するには再レンダリングのトリガーが必要。`App.tsx` の数式入力は `functionNum` にまだ接続されていない。

## ツール設定

- `babel-plugin-react-compiler` + `@rolldown/plugin-babel` で React Compiler を使用 — Vite の開発・ビルド速度が低下する場合がある
- TypeScript の strict モードは完全には有効化されていない。ソースのコンパイルは `tsconfig.app.json` が管理する
