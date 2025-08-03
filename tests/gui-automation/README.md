# Union Arena BattleField Duel GUI Test Suite

Union Arena WebアプリケーションのBattleField Duel機能を自動化テストで検証するGUIテストスイートです。

## 🎯 テスト対象

### 1. 基本機能テスト
- **ナビゲーション**: メインメニュー → DuelMode → デッキ選択
- **UI表示**: BattleField の各UI要素の表示確認
- **カード配置**: 手札からフィールドへのカード配置
- **フェーズ進行**: ゲームフェーズの正しい遷移

### 2. 戦闘システムテスト
- **攻撃宣言**: フロントラインカードでの攻撃実行
- **バトル解決**: ダメージ計算とライフ減少
- **ブロック機構**: 防御カードによるブロック
- **トリガーシステム**: ライフダメージ時のトリガー効果

### 3. AI動作テスト
- **AI思考表示**: AI処理中のインジケーター
- **AI行動実行**: カード配置、攻撃、フェーズ進行
- **AI応答性**: プレイヤー行動への適切な反応

### 4. UX機能テスト
- **カードプレビュー**: ホバー時の詳細表示
- **チュートリアル**: ヘルプシステムの動作
- **レスポンシブ**: 各画面サイズでの表示
- **ハイライト**: 配置可能スロットの表示

## 🚀 セットアップ

### 前提条件
1. Node.js 16+ がインストール済み
2. Union Arena Webアプリが localhost:3000 で動作中
3. バックエンドAPI が localhost:8000 で動作中

### インストール
```bash
cd tests/gui-automation
npm install
```

### 依存関係
- **Playwright**: ブラウザ自動化
- **Puppeteer**: Chrome制御（バックアップ）
- **Selenium**: WebDriver（代替オプション）
- **Jest**: テストランナー
- **Chalk**: カラー表示

## 🧪 テスト実行

### 全テスト実行
```bash
npm run test:gui
```

### 個別テストスイート
```bash
# BattleField 基本機能テスト
npm run test:battlefield

# 戦闘システムテスト
npm run test:combat

# AIテスト
npm run test:ai
```

### 開発モード（変更監視）
```bash
npm run dev
```

## 📊 テスト結果とレポート

### 自動生成される成果物
- **スクリーンショット**: `screenshots/` ディレクトリ
- **JSONレポート**: `reports/*.json`
- **HTMLレポート**: `reports/*.html`

### レポート内容
- テスト実行サマリー
- 個別テスト結果詳細
- エラー時のスクリーンショット
- パフォーマンス情報

## 🎮 テストシナリオ詳細

### シナリオ1: 基本ゲームフロー
1. メインページアクセス
2. DuelModeボタンクリック
3. デッキ選択
4. BattleField画面遷移
5. 手札からカード配置
6. フェーズ進行
7. ターン終了

### シナリオ2: 戦闘実行
1. フロントラインにカード配置
2. メインフェーズまで進行
3. 攻撃宣言
4. バトル解決
5. ダメージ確認
6. ライフ変動検証

### シナリオ3: AI対戦
1. プレイヤーターン完了
2. AI思考開始確認
3. AI行動実行待機
4. AI行動結果検証
5. ゲーム状態整合性確認

## 🔧 設定オプション

### テスト設定 (duelTestRunner.js)
```javascript
this.config = {
  headless: false,     // ブラウザ表示モード
  slowMo: 1000,       // 操作間隔（ms）
  timeout: 30000,     // タイムアウト時間
  screenshotDir: 'screenshots',
  reportDir: 'reports'
};
```

### カスタマイズ可能項目
- **実行速度**: slowMo設定で調整
- **待機時間**: 各テストの waitForTimeout
- **対象URL**: baseUrl と apiUrl
- **スクリーンショット頻度**: takeScreenshot呼び出し

## 🐛 トラブルシューティング

### よくある問題

**1. アプリケーションが起動していない**
```
Error: net::ERR_CONNECTION_REFUSED at http://localhost:3000
```
→ `npm start` でアプリを起動してください

**2. Playwright のインストールエラー**
```bash
npx playwright install
```

**3. テスト要素が見つからない**
- セレクタが変更されている可能性
- 待機時間が不足している可能性
- アプリのロード完了を待つ

**4. AI行動のタイミング問題**
- AI思考時間の設定確認
- 非同期処理の待機調整

## 📝 テスト追加方法

### 新しいテストケース追加
1. 適切なテストスイートファイルを選択
2. 新しいテストメソッドを追加
3. テスト結果オブジェクトを作成
4. 結果を testResults に追加

### 例: 新しいテスト追加
```javascript
async testNewFeature() {
  console.log(chalk.yellow('🆕 新機能テスト'));
  
  const result = { 
    name: 'New Feature Test', 
    passed: false, 
    details: [] 
  };
  
  try {
    // テストロジック
    const element = await this.page.$('.new-feature');
    result.passed = !!element;
    result.details.push(`Feature element found: ${!!element}`);
    
  } catch (error) {
    result.details.push(`Error: ${error.message}`);
  }
  
  this.testResults.push(result);
  return result;
}
```

## 🤝 貢献

テストケースの改善や新機能テストの追加は歓迎します：

1. 既存テストの実行と確認
2. 新しいテストケースの実装
3. レポート機能の改善
4. パフォーマンス最適化

---

**注意**: このテストスイートは実際のブラウザを制御します。テスト実行中は他の作業を避けることをお勧めします。