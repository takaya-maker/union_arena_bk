# Union Arena UI Layout Improvement Template

Union ArenaのBattleFieldコンポーネントのレイアウト問題を修正してください。

## 🎯 解決すべき問題

### レイアウト問題
- [ ] プレイヤーエリアが画面外に表示される
- [ ] スクロールバーが表示される
- [ ] レスポンシブデザインが機能しない
- [ ] カードスロットが見切れる
- [ ] 手札エリアが圧縮される

### 具体的な症状
```
{specific_issues}
```

### 失敗しているテスト
```
{failed_tests}
```

## 🔧 実装要件

### CSS Grid Layout
- 4行のグリッドレイアウト（相手・センター・プレイヤー・手札）
- 各行の適切な高さ配分
- gap と padding の最適化
- オーバーフロー制御

### レスポンシブ対応
- デスクトップ: 1920x1080
- タブレット: 1024x768
- モバイル: 768x1024
- 各画面サイズでの最適表示

### 期待される結果
- 全要素がビューポート内に表示
- スクロール不要
- カードの視認性確保
- 操作可能な配置

## 📁 関連ファイル

### 修正対象
- `frontend/src/components/BattleField/BattleField.jsx`
- `frontend/src/components/BattleField/BattleField.css`

### 参考ファイル
- `frontend/src/components/BattleField/BattleField.test.js`
- `frontend/src/components/BattleField/BattleField.layout.test.js`

## 🧪 TDD手順

### 1. Red Phase（テスト確認）
```bash
npm test -- BattleField.layout.test.js
```

### 2. Green Phase（最小実装）
- CSS Grid の行数と配分を調整
- 適切な minmax 値を設定
- gap と padding を最適化

### 3. Refactor Phase（品質向上）
- パフォーマンス最適化
- コードの可読性向上
- 追加テストケース

## ✅ 完了条件

- [ ] すべてのレイアウトテストが通る
- [ ] デスクトップ・タブレット・モバイルで正常表示
- [ ] カードドラッグ&ドロップが機能する
- [ ] パフォーマンスが劣化しない
- [ ] 既存機能に影響しない

## 🎮 Union Arena特有の考慮事項

### ゲーム要素の配置
- フロントライン（戦闘エリア）の視認性
- エナジーライン（リソース管理）の明確な表示
- 手札の操作しやすさ
- 相手エリアの適切な表示

### ユーザビリティ
- カード詳細の確認しやすさ
- アクション可能な要素の明確化
- ゲーム状況の把握しやすさ
- 直感的な操作感

この修正により、Union Arenaゲームが快適にプレイできるレイアウトを実現してください。