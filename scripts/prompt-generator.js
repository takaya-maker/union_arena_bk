#!/usr/bin/env node

/**
 * Claude Code CLI Prompt Generator for Union Arena TDD
 * テスト結果から改善プロンプトを自動生成
 */

const fs = require('fs');
const path = require('path');

class PromptGenerator {
  constructor() {
    this.testResults = {};
    this.codeAnalysis = {};
    this.improvementAreas = [];
    this.promptTemplates = this.loadPromptTemplates();
  }

  // プロンプトテンプレート読み込み
  loadPromptTemplates() {
    return {
      // UI/レイアウト改善
      uiLayout: {
        priority: 'high',
        template: `Union ArenaのBattleFieldコンポーネントのレイアウト問題を修正してください。

【現在の問題】
{issues}

【失敗しているテスト】
{failedTests}

【期待される改善】
{expectations}

【制約条件】
- CSSグリッドレイアウトを使用
- レスポンシブデザイン対応
- 全要素がビューポート内に表示される
- スクロールバーを不要にする

【関連ファイル】
- frontend/src/components/BattleField/BattleField.jsx
- frontend/src/components/BattleField/BattleField.css

TDD手法で段階的に修正し、テストが通るようにしてください。`
      },

      // 機能実装
      functionality: {
        priority: 'high',
        template: `Union Arenaゲームの{feature}機能を実装してください。

【要件】
{requirements}

【失敗しているテスト】
{failedTests}

【実装すべき機能】
{implementations}

【Union Arenaルール準拠】
- 正式ルールに基づく実装
- フェーズ管理の正確性
- カード効果の適切な処理
- エナジーシステムの実装

【期待される動作】
{expectedBehavior}

TDD手法で実装し、すべてのテストが通るようにしてください。`
      },

      // パフォーマンス改善
      performance: {
        priority: 'medium',
        template: `Union Arenaアプリケーションのパフォーマンスを改善してください。

【パフォーマンス問題】
{performanceIssues}

【メトリクス】
{metrics}

【改善対象】
{targets}

【最適化方針】
- React.memoの活用
- useCallbackによる関数メモ化
- 仮想化による大量データ表示最適化
- 画像遅延読み込み
- バンドルサイズ最適化

期待される改善結果をテストで検証してください。`
      },

      // テストカバレッジ向上
      testCoverage: {
        priority: 'medium',
        template: `Union Arenaアプリケーションのテストカバレッジを向上させてください。

【カバレッジ不足領域】
{uncoveredAreas}

【追加すべきテスト】
{missingTests}

【テスト戦略】
- 単体テスト: コンポーネント・ユーティリティ関数
- 統合テスト: API連携・状態管理
- E2Eテスト: ユーザーワークフロー
- スナップショットテスト: UI回帰防止

【目標カバレッジ】
- 行カバレッジ: 90%以上
- 分岐カバレッジ: 85%以上
- 関数カバレッジ: 95%以上

包括的なテストスイートを構築してください。`
      },

      // エラーハンドリング
      errorHandling: {
        priority: 'high',
        template: `Union Arenaアプリケーションのエラーハンドリングを改善してください。

【検出されたエラー】
{errors}

【エラー発生箇所】
{errorLocations}

【改善すべき点】
{improvements}

【実装すべきエラーハンドリング】
- APIエラーの適切な処理
- ネットワークエラー対応
- ユーザーフレンドリーなエラーメッセージ
- フォールバック機能
- ログ記録と監視

【エラー境界の実装】
- React Error Boundaryの設置
- 部分的な機能停止への対応
- 復旧可能なエラーの自動リトライ

堅牢なエラーハンドリングシステムを構築してください。`
      },

      // アクセシビリティ改善
      accessibility: {
        priority: 'medium',
        template: `Union Arenaアプリケーションのアクセシビリティを改善してください。

【アクセシビリティ問題】
{a11yIssues}

【改善項目】
{improvements}

【WCAG 2.1 AA準拠】
- キーボードナビゲーション
- スクリーンリーダー対応
- 色彩コントラスト比
- フォーカス管理
- ARIA属性の適切な設定

【カードゲーム特有の配慮】
- カード情報の音声読み上げ
- ゲーム状況の明確な伝達
- アクション可能要素の識別
- タイムアウト警告

誰もが利用できるアプリケーションにしてください。`
      },

      // セキュリティ強化
      security: {
        priority: 'high',
        template: `Union Arenaアプリケーションのセキュリティを強化してください。

【セキュリティ課題】
{securityIssues}

【脆弱性対策】
{vulnerabilities}

【実装すべきセキュリティ対策】
- 入力値検証とサニタイゼーション
- XSS攻撃対策
- CSRF攻撃対策
- Content Security Policy設定
- APIレート制限

【データ保護】
- ローカルストレージの暗号化
- センシティブ情報の適切な処理
- セッション管理の強化

セキュアなアプリケーションを構築してください。`
      },

      // Union Arena ゲームフェーズシステム
      gamePhases: {
        priority: 'high',
        template: `Union Arenaのゲームフェーズシステムを修正してください。

【フェーズ管理の問題】
{phaseIssues}

【失敗しているテスト】
{failedTests}

【Union Arena正式フェーズ順序】
1. スタートフェーズ - カードドロー、ターン開始処理
2. ムーブメントフェーズ - カード移動、位置調整
3. メインフェーズ - カード配置、効果使用、攻撃宣言
4. エンドフェーズ - ターン終了処理

【実装要件】
- 正確なフェーズ順序の実装
- フェーズ固有のアクション制限
- 適切なフェーズ遷移処理
- ユーザーインターフェースでの明確な表示

【検証項目】
- 無効なフェーズ遷移の防止
- フェーズ固有アクションの制限
- AI対戦時のフェーズ管理

Union Arena正式ルールに準拠したフェーズシステムを実装してください。`
      },

      // エナジーシステム
      energySystem: {
        priority: 'high',
        template: `Union Arenaのエナジーシステムを修正してください。

【エナジーシステムの問題】
{energyIssues}

【失敗しているテスト】
{failedTests}

【Union Arenaエナジールール】
- エナジー色: 赤、青、緑、黄、紫の5色
- エナジーライン: 最大4枚まで配置可能
- エナジー生成: カード配置時に発生エナジー分を追加
- エナジーコスト: カード使用時に必要エナジーを消費

【実装要件】
- 正確なエナジー色管理
- エナジーコスト計算の正確性
- エナジー不足時の適切な制限
- エナジー表示の分かりやすさ

【修正対象】
- エナジー生成処理
- コスト計算アルゴリズム
- UI表示の改善
- エラーハンドリング

Union Arena正式ルールに準拠したエナジーシステムを実装してください。`
      },

      // カード効果システム
      cardEffects: {
        priority: 'high',
        template: `Union Arenaのカード効果システムを修正してください。

【カード効果の問題】
{effectIssues}

【失敗しているテスト】
{failedTests}

【Union Arenaカード効果タイプ】
- 【登場時】: カード配置時に発動
- [Activate: Main]: メインフェーズで任意発動
- [Auto]: 常時効果
- [Trigger]: 特定条件で発動
- ▼Final▼: 特定状況で発動

【実装要件】
- 効果タイプ別の正確な処理
- 効果発動タイミングの制御
- 効果の対象選択システム
- 効果解決順序の管理

【修正対象】
- 効果処理エンジンの改善
- 効果発動UI/UXの向上
- 効果間の相互作用処理
- エラーハンドリング強化

Union Arena正式ルールに準拠したカード効果システムを実装してください。`
      },

      // 勝利条件システム
      victoryConditions: {
        priority: 'high',
        template: `Union Arenaの勝利条件システムを修正してください。

【勝利条件の問題】
{victoryIssues}

【失敗しているテスト】
{failedTests}

【Union Arena勝利条件】
1. ライフ0: 相手のライフを0にする
2. デッキアウト: 相手のデッキを0枚にする
3. 特殊勝利: カード効果による即座勝利

【実装要件】
- ライフダメージ処理の正確性
- デッキアウト判定の実装
- 勝利判定タイミングの制御
- 勝利演出とゲーム終了処理

【修正対象】
- ライフ管理システム
- デッキカウント監視
- 勝利判定アルゴリズム
- ゲーム終了UI

Union Arena正式ルールに準拠した勝利条件システムを実装してください。`
      },

      // AIシステム
      aiSystem: {
        priority: 'medium',
        template: `Union ArenaのAI対戦システムを改善してください。

【AI システムの問題】
{aiIssues}

【失敗しているテスト】
{failedTests}

【AI実装要件】
- 戦略的なカード選択
- 適切なフェーズ管理
- エナジー効率の考慮
- 状況に応じた判断

【改善項目】
- AI思考アルゴリズムの最適化
- 難易度設定の実装
- 思考時間の調整
- AI行動の多様性向上

【実装対象】
- 意思決定エンジン
- 戦略パターン
- パフォーマンス最適化
- ユーザー体験向上

自然で戦略的なAI対戦相手を実装してください。`
      },

      // ルール検証システム
      ruleValidation: {
        priority: 'high',
        template: `Union Arenaのルール検証システムを強化してください。

【ルール検証の問題】
{ruleIssues}

【失敗しているテスト】
{failedTests}

【検証すべきルール】
- ゲーム初期化の正確性
- フェーズ遷移の妥当性
- カード配置制限の実装
- エナジーコスト検証
- 勝利条件判定

【実装要件】
- リアルタイムルール検証
- 不正アクションの防止
- 適切なエラーメッセージ
- デバッグ機能の提供

【修正対象】
- ルール検証エンジン
- バリデーション機能
- エラーハンドリング
- ログ出力機能

堅牢なルール検証システムを構築してください。`
      }
    };
  }

  // テスト結果解析
  analyzeTestResults(testOutputPath) {
    try {
      const testOutput = fs.readFileSync(testOutputPath, 'utf8');
      return this.parseTestOutput(testOutput);
    } catch (error) {
      console.error('Test results analysis failed:', error);
      return null;
    }
  }

  // テスト出力解析
  parseTestOutput(output) {
    const results = {
      passed: 0,
      failed: 0,
      coverage: 0,
      failedTests: [],
      errors: [],
      warnings: []
    };

    const lines = output.split('\n');
    
    lines.forEach(line => {
      // Jest出力解析
      if (line.includes('✓') || line.includes('PASS')) {
        results.passed++;
      } else if (line.includes('✗') || line.includes('FAIL')) {
        results.failed++;
        results.failedTests.push(line.trim());
      } else if (line.includes('Error:')) {
        results.errors.push(line.trim());
      } else if (line.includes('Warning:')) {
        results.warnings.push(line.trim());
      }

      // カバレッジ情報
      const coverageMatch = line.match(/All files\s+\|\s+([0-9.]+)/);
      if (coverageMatch) {
        results.coverage = parseFloat(coverageMatch[1]);
      }
    });

    return results;
  }

  // 問題領域特定
  identifyIssueAreas(testResults, codeMetrics) {
    const issues = [];

    // テスト失敗による問題特定
    if (testResults.failed > 0) {
      testResults.failedTests.forEach(test => {
        if (test.includes('layout') || test.includes('viewport') || test.includes('responsive')) {
          issues.push({
            type: 'uiLayout',
            severity: 'high',
            description: 'UI layout and responsive design issues',
            details: test
          });
        } else if (test.includes('drag') || test.includes('card') || test.includes('battle')) {
          issues.push({
            type: 'functionality',
            severity: 'high',
            description: 'Core game functionality issues',
            details: test
          });
        } else if (test.includes('フェーズ') || test.includes('phase') || test.includes('turn')) {
          issues.push({
            type: 'gamePhases',
            severity: 'high',
            description: 'Union Arena phase management issues',
            details: test
          });
        } else if (test.includes('エナジー') || test.includes('energy') || test.includes('cost')) {
          issues.push({
            type: 'energySystem',
            severity: 'high',
            description: 'Energy system and cost calculation issues',
            details: test
          });
        } else if (test.includes('効果') || test.includes('effect') || test.includes('ability')) {
          issues.push({
            type: 'cardEffects',
            severity: 'high',
            description: 'Card effect processing issues',
            details: test
          });
        } else if (test.includes('勝利') || test.includes('victory') || test.includes('ライフ') || test.includes('life')) {
          issues.push({
            type: 'victoryConditions',
            severity: 'high',
            description: 'Victory condition and life management issues',
            details: test
          });
        } else if (test.includes('AI') || test.includes('opponent') || test.includes('思考')) {
          issues.push({
            type: 'aiSystem',
            severity: 'medium',
            description: 'AI opponent system issues',
            details: test
          });
        } else if (test.includes('ルール') || test.includes('rule') || test.includes('validation')) {
          issues.push({
            type: 'ruleValidation',
            severity: 'high',
            description: 'Union Arena rule compliance issues',
            details: test
          });
        } else if (test.includes('performance') || test.includes('memory')) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            description: 'Performance optimization needed',
            details: test
          });
        } else if (test.includes('accessibility') || test.includes('a11y')) {
          issues.push({
            type: 'accessibility',
            severity: 'medium',
            description: 'Accessibility improvements needed',
            details: test
          });
        }
      });
    }

    // カバレッジ不足
    if (testResults.coverage < 80) {
      issues.push({
        type: 'testCoverage',
        severity: 'medium',
        description: `Test coverage is low: ${testResults.coverage}%`,
        details: 'Need to add more comprehensive tests'
      });
    }

    // エラー検出
    if (testResults.errors.length > 0) {
      issues.push({
        type: 'errorHandling',
        severity: 'high',
        description: 'Error handling improvements needed',
        details: testResults.errors.join('\n')
      });
    }

    return issues;
  }

  // プロンプト生成
  generatePrompt(issueType, context) {
    const template = this.promptTemplates[issueType];
    if (!template) {
      return null;
    }

    let prompt = template.template;

    // テンプレート変数を実際の値で置換
    prompt = prompt.replace('{issues}', context.issues || '特定の問題情報なし');
    prompt = prompt.replace('{failedTests}', context.failedTests || '失敗テスト情報なし');
    prompt = prompt.replace('{expectations}', context.expectations || '期待値情報なし');
    prompt = prompt.replace('{feature}', context.feature || '指定機能');
    prompt = prompt.replace('{requirements}', context.requirements || '要件情報なし');
    prompt = prompt.replace('{implementations}', context.implementations || '実装詳細なし');
    prompt = prompt.replace('{expectedBehavior}', context.expectedBehavior || '期待動作なし');
    prompt = prompt.replace('{performanceIssues}', context.performanceIssues || 'パフォーマンス問題なし');
    prompt = prompt.replace('{metrics}', context.metrics || 'メトリクス情報なし');
    prompt = prompt.replace('{targets}', context.targets || '最適化対象なし');
    prompt = prompt.replace('{uncoveredAreas}', context.uncoveredAreas || 'カバレッジ不足領域なし');
    prompt = prompt.replace('{missingTests}', context.missingTests || '不足テストなし');
    prompt = prompt.replace('{errors}', context.errors || 'エラー情報なし');
    prompt = prompt.replace('{errorLocations}', context.errorLocations || 'エラー箇所不明');
    prompt = prompt.replace('{improvements}', context.improvements || '改善点なし');
    prompt = prompt.replace('{a11yIssues}', context.a11yIssues || 'アクセシビリティ問題なし');
    prompt = prompt.replace('{securityIssues}', context.securityIssues || 'セキュリティ問題なし');
    prompt = prompt.replace('{vulnerabilities}', context.vulnerabilities || '脆弱性なし');

    return {
      priority: template.priority,
      type: issueType,
      prompt: prompt,
      timestamp: new Date().toISOString()
    };
  }

  // 複数問題の統合プロンプト生成
  generateComprehensivePrompt(issues) {
    if (issues.length === 0) {
      return this.generateSuccessPrompt();
    }

    // 優先度でソート
    issues.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.severity] - priorityOrder[a.severity];
    });

    const highPriorityIssues = issues.filter(issue => issue.severity === 'high');
    const mediumPriorityIssues = issues.filter(issue => issue.severity === 'medium');

    let prompt = `Union ArenaカードゲームWebアプリケーションの包括的改善を実施してください。

## 🚨 高優先度の問題
${highPriorityIssues.map(issue => `- **${issue.type}**: ${issue.description}\n  詳細: ${issue.details}`).join('\n')}

## ⚠️ 中優先度の問題
${mediumPriorityIssues.map(issue => `- **${issue.type}**: ${issue.description}\n  詳細: ${issue.details}`).join('\n')}

## 📋 改善アプローチ
1. **TDD手法での段階的改善**
   - 失敗テストの特定と理解
   - 最小実装でテスト通過
   - リファクタリングによる品質向上

2. **Union Arena正式ルール準拠**
   - ゲームフェーズの正確な実装
   - カード効果システムの完全性
   - エナジーシステムの正確性

3. **ユーザー体験の最適化**
   - 直感的なUI/UX設計
   - レスポンシブデザイン
   - アクセシビリティ対応

## 🎯 成功基準
- すべてのテストが通る
- テストカバレッジ90%以上
- パフォーマンス指標の改善
- エラーゼロの安定動作

段階的に実装し、各ステップでテスト結果を確認してください。`;

    return {
      priority: 'high',
      type: 'comprehensive',
      prompt: prompt,
      timestamp: new Date().toISOString(),
      issueCount: issues.length
    };
  }

  // 成功時プロンプト
  generateSuccessPrompt() {
    return {
      priority: 'low',
      type: 'enhancement',
      prompt: `🎉 Union ArenaアプリケーションのTDDサイクルが完了しました！

## ✅ 現在の状況
- すべてのテストが通過
- 品質基準を満たしている
- 主要機能が正常動作

## 🚀 次のステップ
以下の拡張機能の実装を検討してください：

1. **ゲーム機能拡張**
   - AI対戦レベル調整
   - マルチプレイヤー対応
   - トーナメントモード

2. **UI/UX改善**
   - アニメーション効果
   - サウンドエフェクト
   - カスタムテーマ

3. **分析機能**
   - プレイ統計
   - デッキ分析
   - 勝率トラッキング

4. **パフォーマンス最適化**
   - PWA対応
   - オフライン機能
   - キャッシュ戦略

どの拡張機能から実装を開始しますか？`,
      timestamp: new Date().toISOString()
    };
  }

  // プロンプト保存
  savePrompt(prompt, filename) {
    const promptsDir = path.join(__dirname, '..', 'prompts');
    if (!fs.existsSync(promptsDir)) {
      fs.mkdirSync(promptsDir, { recursive: true });
    }

    const filepath = path.join(promptsDir, filename || `prompt-${Date.now()}.md`);
    
    const content = `# Union Arena TDD Improvement Prompt

**Generated:** ${prompt.timestamp}
**Priority:** ${prompt.priority}
**Type:** ${prompt.type}

---

${prompt.prompt}

---

*Generated by Union Arena TDD Prompt Generator*
`;

    fs.writeFileSync(filepath, content);
    return filepath;
  }

  // メイン実行
  async run(testResultsPath) {
    console.log('🔍 Analyzing test results...');
    
    // テスト結果解析
    const testResults = this.analyzeTestResults(testResultsPath);
    if (!testResults) {
      console.error('❌ Failed to analyze test results');
      return null;
    }

    console.log(`📊 Test Summary: ${testResults.passed} passed, ${testResults.failed} failed`);
    console.log(`📈 Coverage: ${testResults.coverage}%`);

    // 問題領域特定
    const issues = this.identifyIssueAreas(testResults, {});
    console.log(`🔍 Identified ${issues.length} issue areas`);

    // プロンプト生成
    const prompt = this.generateComprehensivePrompt(issues);
    
    // プロンプト保存
    const savedPath = this.savePrompt(prompt, `improvement-prompt-${Date.now()}.md`);
    console.log(`💾 Prompt saved to: ${savedPath}`);

    // Claude Code CLI向けの出力
    console.log('\n' + '='.repeat(80));
    console.log('📝 CLAUDE CODE CLI PROMPT:');
    console.log('='.repeat(80));
    console.log(prompt.prompt);
    console.log('='.repeat(80));

    return {
      prompt: prompt,
      savedPath: savedPath,
      issues: issues,
      testResults: testResults
    };
  }
}

// CLI実行
if (require.main === module) {
  const generator = new PromptGenerator();
  
  const testResultsPath = process.argv[2] || path.join(__dirname, '..', 'test-results.txt');
  
  if (!fs.existsSync(testResultsPath)) {
    console.error(`❌ Test results file not found: ${testResultsPath}`);
    console.log('Usage: node prompt-generator.js <test-results-file>');
    process.exit(1);
  }

  generator.run(testResultsPath)
    .then(result => {
      if (result) {
        console.log('\n✅ Prompt generation completed successfully!');
        console.log(`📁 Saved to: ${result.savedPath}`);
      }
    })
    .catch(error => {
      console.error('❌ Prompt generation failed:', error);
      process.exit(1);
    });
}

module.exports = PromptGenerator;