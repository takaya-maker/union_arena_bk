# Union Arena Game Functionality Implementation Template

Union Arenaゲームの{feature_name}機能を実装してください。

## 🎯 実装する機能

### 機能概要
{feature_description}

### Union Arena正式ルール
{official_rules}

### 失敗しているテスト
```
{failed_tests}
```

## 🔧 実装要件

### 基本機能
- [ ] {requirement_1}
- [ ] {requirement_2}
- [ ] {requirement_3}
- [ ] {requirement_4}

### ゲームロジック
- [ ] フェーズ管理との統合
- [ ] エナジーシステムとの連携
- [ ] カード効果処理の実装
- [ ] 勝利条件への影響

### UI/UX要件
- [ ] 直感的な操作インターフェース
- [ ] 視覚的フィードバック
- [ ] エラーハンドリング
- [ ] アクセシビリティ対応

## 📁 関連ファイル

### 修正・追加対象
- `frontend/src/components/BattleField/BattleField.jsx`
- `frontend/src/utils/{utility_file}.js`
- `frontend/src/components/BattleField/{component_file}.jsx`

### テストファイル
- `frontend/src/components/BattleField/BattleField.test.js`
- `frontend/src/utils/{utility_file}.test.js`

## 🧪 TDD実装手順

### 1. Red Phase（テスト作成・確認）
```javascript
// テストケース例
describe('{feature_name}', () => {
  test('should {expected_behavior}', () => {
    // テスト実装
  });
});
```

### 2. Green Phase（最小実装）
- 基本的な機能を実装
- テストが通る最小限のコード
- エラーハンドリングは後回し

### 3. Refactor Phase（品質向上）
- コードの整理と最適化
- エラーハンドリング追加
- パフォーマンス改善

## 🎮 Union Arena特有の実装

### ゲームフェーズとの統合
```javascript
// フェーズチェック例
if (phaseManager.canPerformAction('action_name')) {
  // 機能実行
}
```

### エナジーシステム連携
```javascript
// エナジーコスト処理例
const requiredEnergy = parseEnergyCost(card.required_energy);
if (energyManager.canPayCost(requiredEnergy)) {
  // アクション実行
}
```

### カード効果処理
```javascript
// 効果処理例
effectProcessor.processOnPlayEffects(card, cardDetails, line, position, player);
```

## ✅ 完了条件

### 機能要件
- [ ] 正式ルール通りの動作
- [ ] すべてのテストケースが通る
- [ ] エラーケースの適切な処理
- [ ] パフォーマンスが許容範囲

### 品質要件
- [ ] コードの可読性が高い
- [ ] 適切なコメント
- [ ] 再利用可能な設計
- [ ] テストカバレッジ90%以上

### ユーザビリティ
- [ ] 直感的な操作
- [ ] 適切なフィードバック
- [ ] エラーメッセージの分かりやすさ
- [ ] アクセシビリティ配慮

## 🚀 実装例

### 基本構造
```javascript
const {feature_name}Handler = (params) => {
  // バリデーション
  if (!validateParams(params)) {
    return { success: false, error: 'Invalid parameters' };
  }
  
  // ゲーム状態チェック
  if (!checkGameState()) {
    return { success: false, error: 'Invalid game state' };
  }
  
  // 機能実行
  const result = execute{feature_name}(params);
  
  // 状態更新
  updateGameState(result);
  
  // ログ記録
  addBattleLog(`{feature_name} executed successfully`);
  
  return { success: true, result };
};
```

### テスト例
```javascript
test('{feature_name} should work correctly', () => {
  const params = { /* テストパラメータ */ };
  const result = {feature_name}Handler(params);
  
  expect(result.success).toBe(true);
  expect(result.result).toMatchObject({
    // 期待される結果
  });
});
```

この実装により、Union Arenaゲームの{feature_name}機能が正確に動作することを確認してください。