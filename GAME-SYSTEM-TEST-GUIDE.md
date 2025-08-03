# Union Arena Game System Test Guide

Union Arenaカードゲームのゲームシステム動作を包括的にテストするためのガイドです。

## 🎯 テスト対象のゲームシステム

### 1. 基本ゲームフロー
- ゲーム初期化（手札7枚、ライフ7、デッキシャッフル）
- フェーズ管理（スタート→ムーブメント→メイン→エンド）
- ターン交代とゲーム進行
- 勝利条件判定

### 2. エナジーシステム
- 5色エナジー管理（赤・青・緑・黄・紫）
- エナジーライン配置とエナジー生成
- エナジーコスト計算と消費
- エナジー不足時の制限

### 3. カード効果システム
- 【登場時】効果の発動
- [Activate: Main]効果の使用
- [Auto]常時効果の適用
- [Trigger]効果の条件発動
- ▼Final▼効果の特殊処理

### 4. バトルシステム
- フロントライン配置
- 攻撃宣言と対象選択
- ブロッカーシステム
- BP比較による勝敗判定
- ダメージ処理

### 5. AI対戦システム
- AI思考アルゴリズム
- 戦略的カード選択
- 難易度設定
- 自然な対戦体験

## 🧪 テストカテゴリ別実行方法

### 基本システムテスト
```bash
# ゲームシステム全般テスト
npm test BattleField.game-system.test.js

# 統合テスト（完全ゲームフロー）
npm test BattleField.integration.test.js

# ルール検証テスト
npm test unionArenaRuleValidator.test.js
```

### UI/レイアウトテスト
```bash
# レイアウト専用テスト
npm test BattleField.layout.test.js

# 基本UIテスト
npm test BattleField.test.js
```

### パフォーマンステスト
```bash
# 大量データ処理テスト
npm test -- --testNamePattern="パフォーマンス"

# メモリリークテスト
npm test -- --testNamePattern="メモリ"
```

### E2Eテスト（実際のゲームプレイ）
```bash
# E2E GUI テスト
cd tests/gui-automation
npm run test:gui

# 特定シナリオテスト
npm run test:battlefield
npm run test:combat
```

## 📊 TDD + Claude Code CLI ワークフロー

### 1. 問題検出フェーズ
```bash
# 全テスト実行でゲームシステムの問題を特定
make test-frontend

# 問題領域の詳細分析
make generate-prompt
```

**期待される出力例:**
```
❌ FAIL src/components/BattleField/BattleField.game-system.test.js
  ● Union Arena Game System Tests
    ● フェーズ管理テスト
      ● Union Arena正式フェーズ順序でフェーズが進行する
        Expected: "ムーブメントフェーズ"
        Received: "メインフェーズ"

❌ FAIL src/components/BattleField/BattleField.integration.test.js
  ● Union Arena Integration Tests
    ● エナジーシステムテスト
      ● エナジーラインへのカード配置でエナジーが生成される
        Expected energy: { red: 1 }
        Received energy: { red: 0 }
```

### 2. プロンプト自動生成
```bash
# ゲームシステム特有の問題から最適化されたプロンプトを生成
node scripts/prompt-generator.js test-results.txt
```

**生成されるプロンプト例:**
```markdown
Union Arenaのゲームフェーズシステムを修正してください。

【フェーズ管理の問題】
- フェーズ順序が正式ルールと異なる
- スタートフェーズからメインフェーズに直接遷移

【Union Arena正式フェーズ順序】
1. スタートフェーズ - カードドロー、ターン開始処理
2. ムーブメントフェーズ - カード移動、位置調整  
3. メインフェーズ - カード配置、効果使用、攻撃宣言
4. エンドフェーズ - ターン終了処理

【実装要件】
- 正確なフェーズ順序の実装
- フェーズ固有のアクション制限
- 適切なフェーズ遷移処理

TDD手法で段階的に修正してください。
```

### 3. Claude Code CLI実行
1. 生成されたプロンプトをClaude Code CLIにコピー
2. AIが提案する改善実装を確認
3. 段階的に修正を適用

### 4. 検証と次サイクル
```bash
# 修正後の再テスト
npm test BattleField.game-system.test.js

# 改善されたかを確認
make health

# 次の問題領域に移行
make run-tdd-cycle
```

## 🎮 Union Arena特有のテストシナリオ

### シナリオ1: 完全ゲームフロー
```javascript
test('1ターン目の正規プレイフロー', async () => {
  // 1. ゲーム開始 - 手札7枚、ライフ7
  // 2. スタートフェーズ - 追加ドロー無し
  // 3. ムーブメントフェーズ - 移動処理
  // 4. メインフェーズ - エナジー生成、カード配置
  // 5. エンドフェーズ - ターン終了処理
  // 6. AI思考開始
});
```

### シナリオ2: エナジーシステム検証
```javascript
test('多色エナジー管理システム', async () => {
  // 1. 赤エナジー生成カードの配置
  // 2. 青エナジー必要カードの配置失敗確認
  // 3. 青エナジー生成後の配置成功確認
  // 4. エナジーコスト計算の正確性
});
```

### シナリオ3: カード効果連鎖
```javascript
test('複数効果の同時発動と解決順序', async () => {
  // 1. 登場時効果持ちキャラクター配置
  // 2. 効果によるドローとエナジー生成
  // 3. 追加カード配置可能性の確認
  // 4. 効果チェーンの正しい解決
});
```

### シナリオ4: AI戦略評価
```javascript
test('AI対戦での戦略的判断', async () => {
  // 1. AIのカード選択の妥当性
  // 2. エナジー効率の考慮
  // 3. 攻撃・防御判断の適切性
  // 4. 長期戦略の実装度
});
```

## 📈 テスト結果の評価基準

### 基本品質指標
- **テスト通過率**: 100%（全テストパス）
- **コードカバレッジ**: 90%以上
- **ルール準拠率**: 100%（Union Arena正式ルール）
- **パフォーマンス**: レスポンス100ms以下

### ゲームシステム品質指標
- **フェーズ管理**: 正確な順序と制限
- **エナジーシステム**: 計算誤差0%
- **カード効果**: 効果発動成功率100%
- **AI品質**: 戦略的判断の妥当性

### ユーザー体験指標
- **操作直感性**: エラー操作0%
- **視認性**: 全要素の明確表示
- **レスポンシブ**: 全デバイス対応
- **アクセシビリティ**: WCAG 2.1 AA準拠

## 🔄 継続的改善サイクル

### 週次サイクル
1. **月曜**: 全テスト実行と問題特定
2. **火曜**: Claude Code CLI実行と改善実装
3. **水曜**: 統合テストと検証
4. **木曜**: パフォーマンステストと最適化
5. **金曜**: E2Eテストとリリース準備

### リリース前チェックリスト
- [ ] 全単体テスト通過
- [ ] 全統合テスト通過  
- [ ] E2Eテスト通過
- [ ] ルール検証テスト通過
- [ ] パフォーマンステスト通過
- [ ] AI対戦テスト通過
- [ ] アクセシビリティテスト通過

## 🚀 実行コマンドサマリー

```bash
# 🎯 基本テスト実行
npm test                                    # 全テスト
npm test BattleField.game-system.test.js   # ゲームシステム
npm test BattleField.integration.test.js   # 統合テスト

# 🔄 TDD自動化サイクル  
make tdd-auto                              # 完全自動化
make run-tdd-cycle                         # 手動サイクル
make generate-prompt                       # プロンプト生成

# 📊 監視とレポート
make monitor-tests                         # リアルタイム監視
start test-dashboard.html                  # Webダッシュボード
make health                               # ヘルスチェック

# 🧪 E2Eテスト
cd tests/gui-automation && npm run test:gui  # GUI自動化テスト
```

## 🎓 トラブルシューティング

### よくある問題と解決方法

1. **フェーズ遷移エラー**
   ```
   Error: Invalid phase transition
   → UnionArenaPhaseManager の実装を確認
   ```

2. **エナジー計算ミス**  
   ```
   Error: Energy cost calculation failed
   → parseEnergyCost関数とenergyManager連携を確認
   ```

3. **AI思考停止**
   ```
   Error: AI decision timeout
   → AIOpponentSystem のタイムアウト設定を調整
   ```

4. **カード効果未発動**
   ```
   Error: Effect not triggered
   → EffectProcessor の効果検出ロジックを確認
   ```

このガイドに従って、Union Arenaゲームシステムの包括的な品質保証を実現できます！ 🎯🎮