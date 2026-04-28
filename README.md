# Equation3D

Equation3Dは、数学的な関数や方程式をブラウザ上で視覚化するためのWebアプリケーションです。HTML5のCanvasを利用して、座標軸や関数のグラフなどを描画します。

## 使用技術

- **フロントエンドフレームワーク**: React (v19)
- **言語**: TypeScript
- **ビルドツール**: Vite
- **デプロイ**: Cloudflare (wrangler)

## 開発の始め方

プロジェクトをローカル環境で実行するには、以下の手順に従ってください。

### 1. パッケージのインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

サーバー起動後、ブラウザで `http://localhost:5173` にアクセスするとアプリケーションを確認できます。

## スクリプト

- `npm run dev`: 開発サーバーを起動します。
- `npm run build`: 本番環境用にTypeScriptのコンパイルとビルドを行います。
- `npm run lint`: ESLintを使用してコードの静的解析を行います。
- `npm run preview`: ローカルで本番環境のビルド結果をプレビューします。
- `npm run deploy`: Cloudflareへアプリケーションをデプロイします。
