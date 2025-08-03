# Union Arena TDD + Claude Code CLI Workflow

Union Arenaカードゲーム開発のための、テスト駆動開発とClaude Code CLIを組み合わせた自動化ワークフローです。

## 🎯 概要

このワークフローでは以下のサイクルを繰り返し、高品質なWebアプリケーションを段階的に開発します：

1. **テスト実行** → 問題を特定
2. **プロンプト生成** → Claude Code CLIに最適化されたコード改善指示を作成  
3. **Claude Code CLI実行** → AIによるコード改善
4. **検証・次サイクル** → 改善結果を確認し次の課題へ

## 🚀 クイックスタート

### 1. 環境セットアップ
```bash
# Docker環境の起動
make dev-setup

# TDD自動化の開始
make tdd-auto
```

### 2. 手動でのTDDサイクル実行
```bash
# テスト実行 → プロンプト生成
make run-tdd-cycle

# 生成されたプロンプトをClaude Code CLIにコピー
# 改善実装後、再度テスト実行
```

## 📋 詳細ワークフロー

### Phase 1: 問題検出（Red Phase）
```bash
# 全テストを実行
make test

# 特定のテストのみ実行
make test-frontend
make test-e2e

# リアルタイム監視
make monitor-tests
```

**出力例:**
```
❌ FAIL src/components/BattleField/BattleField.layout.test.js
  ● BattleField Layout Issue Detection
    ● プレイヤーエリア可視性テスト
      ● プレイヤーのフロントラインが画面内に表示される
        expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight)
```

### Phase 2: プロンプト生成
```bash
# テスト結果から自動でプロンプト生成
make generate-prompt
```

**生成されるプロンプト例:**
```markdown
Union ArenaのBattleFieldコンポーネントのレイアウト問題を修正してください。

【現在の問題】
- プレイヤーのフロントラインが画面外に表示される
- main-game-areaのグリッドレイアウトが適切でない

【失敗しているテスト】
- プレイヤーエリア可視性テスト
- レスポンシブレイアウトテスト

【期待される改善】
- CSS Grid の行配分を調整: 25% / 10% / 25% / 40%
- gap と padding の最適化: 2px
- 全要素がビューポート内に表示される

【制約条件】
- CSSグリッドレイアウトを使用
- レスポンシブデザイン対応
- スクロールバーを不要にする

TDD手法で段階的に修正し、テストが通るようにしてください。
```

### Phase 3: Claude Code CLI実行（Green Phase）

1. **生成されたプロンプトをコピー**
   ```bash
   # プロンプトをクリップボードにコピー（Windows）
   type prompts\improvement-prompt-[timestamp].md | clip
   ```

2. **Claude Code CLIでコード改善**
   - 生成されたプロンプトを貼り付け
   - AIが提案する改善を確認
   - 段階的に実装

3. **実装結果の確認**
   ```bash
   # 改善後のテスト実行
   make test-frontend
   ```

### Phase 4: 検証と次サイクル（Refactor Phase）
```bash
# 品質指標の確認
make health

# パフォーマンス測定
make monitor-performance

# 次サイクルの準備
make run-tdd-cycle
```

## 🔄 自動化サイクル

### 完全自動化モード
```bash
# 全自動でTDDサイクルを実行
make tdd-auto
```

このコマンドは以下を自動実行します：
1. テスト実行と結果解析
2. 改善プロンプト生成
3. ユーザーへの改善指示表示
4. 実装完了待機
5. 次サイクルへの移行

### ワークフロー例
```
🔄 Cycle 1: UI Layout Issues
├── ❌ 5 tests failed (layout)
├── 📝 Generated layout improvement prompt
├── ⏳ Waiting for Claude Code CLI implementation
├── ✅ Tests now pass
└── ➡️ Moving to Cycle 2

🔄 Cycle 2: Game Functionality
├── ❌ 3 tests failed (card effects)
├── 📝 Generated functionality prompt
├── ⏳ Waiting for implementation
├── ✅ Tests now pass
└── ➡️ Moving to Cycle 3
```

## 📊 監視とレポート

### リアルタイム監視
```bash
# Web ダッシュボード
start test-dashboard.html

# コマンドライン監視
make monitor-tests

# TDDサイクル監視
monitor-tdd.bat
```

### レポート生成
```bash
# テストカバレッジレポート
make test-frontend

# 最終レポート出力
scripts/tdd-cycle-automation.js
```

## 📝 プロンプトテンプレート

利用可能なテンプレート:
```bash
# テンプレート一覧表示
make templates

# テンプレート種類
- ui-layout-improvement.md    # レイアウト問題
- game-functionality.md       # ゲーム機能実装
- performance-optimization.md # パフォーマンス改善
- error-handling.md          # エラーハンドリング
- accessibility.md           # アクセシビリティ
- security.md               # セキュリティ強化
```

## 🎮 Union Arena特有の考慮事項

### ゲームルール準拠
- フェーズ管理の正確性
- エナジーシステムの実装
- カード効果の適切な処理
- 勝利条件の判定

### UI/UX要件
- カードゲーム特有の操作性
- ドラッグ&ドロップ機能
- リアルタイムな状態表示
- AI対戦の自然な体験

### パフォーマンス要件
- 大量カードデータの効率的処理
- アニメーション処理
- リアルタイム更新
- メモリ使用量の最適化

## 🚀 成功指標

### 品質目標
- テスト通過率: 100%
- コードカバレッジ: 90%以上
- エラー発生率: 0%
- レスポンス時間: 100ms以下

### ユーザビリティ目標
- 直感的な操作性
- エラーゼロの安定動作
- 全デバイスでの最適表示
- アクセシビリティ準拠

## 🔧 トラブルシューティング

### よくある問題

1. **Docker起動失敗**
   ```bash
   # Docker Desktop起動確認
   docker --version
   
   # サービス再起動
   make clean-restart
   ```

2. **テスト実行エラー**
   ```bash
   # 依存関係再インストール
   make install-deps
   
   # キャッシュクリア
   make clean
   ```

3. **プロンプト生成失敗**
   ```bash
   # 手動プロンプト生成
   cd scripts
   node prompt-generator.js ../test-results.txt
   ```

### サポート
- 📖 詳細ドキュメント: `docs/`
- 🐛 Issue報告: GitHub Issues
- 💬 質問・相談: Discussion

---

このワークフローにより、Union Arenaカードゲームの高品質な実装を効率的に達成できます。🎯