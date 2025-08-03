# E2E tests Dockerfile
FROM node:18-alpine

WORKDIR /app

# Playwright用のシステム依存関係
RUN apk add --no-cache \
    chromium \
    firefox \
    webkit2gtk \
    gstreamer \
    gst-plugins-base \
    gst-plugins-good \
    gst-plugins-bad \
    gst-plugins-ugly \
    gst-libav \
    libxss1 \
    libgconf-2-4 \
    libasound2

# package.jsonとpackage-lock.jsonをコピー
COPY gui-automation/package*.json ./

# 依存関係をインストール
RUN npm ci

# Playwrightブラウザをインストール
RUN npx playwright install

# テストコードをコピー
COPY gui-automation/ .

# スクリーンショットとレポートディレクトリを作成
RUN mkdir -p screenshots reports

# テスト実行用のスクリプト
CMD ["npm", "run", "test:gui"]