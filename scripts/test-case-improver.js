#!/usr/bin/env node

/**
 * Union Arena Test Case Improver
 * テストケース自体の品質向上とUX改善のための分析・提案システム
 */

const fs = require('fs');
const path = require('path');

class TestCaseImprover {
  constructor() {
    this.testFilePaths = [
      'frontend/src/components/BattleField/BattleField.test.js',
      'frontend/src/components/BattleField/BattleField.layout.test.js',
      'frontend/src/components/BattleField/BattleField.game-system.test.js',
      'frontend/src/components/BattleField/BattleField.integration.test.js'
    ];
    
    this.unionArenaRules = {
      phases: ['start', 'movement', 'main', 'end'],
      energyColors: ['red', 'blue', 'green', 'yellow', 'purple'],
      cardTypes: ['キャラクター', 'イベント', 'ブロッカー'],
      effectTypes: ['登場時', 'Activate: Main', 'Auto', 'Trigger', 'Final'],
      maxFrontLine: 4,
      maxEnergyLine: 4,
      initialHandSize: 7,
      initialLife: 7
    };
    
    this.uxPrinciples = [
      'direct_manipulation',
      'visual_feedback', 
      'error_prevention',
      'user_control',
      'consistency',
      'accessibility',
      'performance'
    ];
  }

  // テストケース分析
  async analyzeTestCases() {
    const analysis = {
      coverage: await this.analyzeCoverage(),
      unionArenaCompliance: await this.analyzeUnionArenaCompliance(),
      uxCoverage: await this.analyzeUXCoverage(),
      testQuality: await this.analyzeTestQuality(),
      gaps: await this.identifyTestGaps()
    };

    return analysis;
  }

  // カバレッジ分析
  async analyzeCoverage() {
    const coverage = {
      gameSystem: { covered: [], missing: [] },
      ui: { covered: [], missing: [] },
      integration: { covered: [], missing: [] },
      performance: { covered: [], missing: [] }
    };

    for (const testPath of this.testFilePaths) {
      const fullPath = path.join(__dirname, '..', testPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        this.analyzeTestFileContent(content, coverage);
      }
    }

    return coverage;
  }

  // テストファイル内容分析
  analyzeTestFileContent(content, coverage) {
    // ゲームシステムテストの検出
    const gameSystemPatterns = [
      /フェーズ|phase/gi,
      /エナジー|energy/gi,
      /効果|effect/gi,
      /バトル|battle/gi,
      /勝利|victory/gi
    ];

    gameSystemPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        coverage.gameSystem.covered.push(pattern.source);
      }
    });

    // UIテストの検出
    const uiPatterns = [
      /layout|レイアウト/gi,
      /responsive|レスポンシブ/gi,
      /drag.*drop|ドラッグ/gi,
      /click|クリック/gi,
      /hover|ホバー/gi
    ];

    uiPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        coverage.ui.covered.push(pattern.source);
      }
    });

    // 統合テストの検出
    const integrationPatterns = [
      /complete.*flow|完全.*フロー/gi,
      /end.*to.*end|e2e/gi,
      /workflow|ワークフロー/gi
    ];

    integrationPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        coverage.integration.covered.push(pattern.source);
      }
    });
  }

  // Union Arena ルール準拠分析
  async analyzeUnionArenaCompliance() {
    const compliance = {
      phases: { tested: false, coverage: 0 },
      energySystem: { tested: false, coverage: 0 },
      cardEffects: { tested: false, coverage: 0 },
      battleSystem: { tested: false, coverage: 0 },
      victoryConditions: { tested: false, coverage: 0 }
    };

    for (const testPath of this.testFilePaths) {
      const fullPath = path.join(__dirname, '..', testPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // フェーズ管理テスト
        if (this.unionArenaRules.phases.some(phase => content.includes(phase))) {
          compliance.phases.tested = true;
          compliance.phases.coverage = this.calculatePhaseTestCoverage(content);
        }

        // エナジーシステムテスト
        if (this.unionArenaRules.energyColors.some(color => content.includes(color))) {
          compliance.energySystem.tested = true;
          compliance.energySystem.coverage = this.calculateEnergyTestCoverage(content);
        }

        // カード効果テスト
        if (this.unionArenaRules.effectTypes.some(effect => content.includes(effect))) {
          compliance.cardEffects.tested = true;
          compliance.cardEffects.coverage = this.calculateEffectTestCoverage(content);
        }

        // バトルシステムテスト
        if (content.includes('BP') || content.includes('battle') || content.includes('バトル')) {
          compliance.battleSystem.tested = true;
          compliance.battleSystem.coverage = this.calculateBattleTestCoverage(content);
        }

        // 勝利条件テスト
        if (content.includes('victory') || content.includes('勝利') || content.includes('life') || content.includes('ライフ')) {
          compliance.victoryConditions.tested = true;
          compliance.victoryConditions.coverage = this.calculateVictoryTestCoverage(content);
        }
      }
    }

    return compliance;
  }

  // UXカバレッジ分析
  async analyzeUXCoverage() {
    const uxCoverage = {};
    
    this.uxPrinciples.forEach(principle => {
      uxCoverage[principle] = {
        tested: false,
        coverage: 0,
        gaps: []
      };
    });

    for (const testPath of this.testFilePaths) {
      const fullPath = path.join(__dirname, '..', testPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // 直接操作テスト
        if (content.includes('drag') || content.includes('click') || content.includes('ドラッグ')) {
          uxCoverage.direct_manipulation.tested = true;
          uxCoverage.direct_manipulation.coverage = 70;
        }

        // 視覚的フィードバックテスト
        if (content.includes('feedback') || content.includes('highlight') || content.includes('フィードバック')) {
          uxCoverage.visual_feedback.tested = true;
          uxCoverage.visual_feedback.coverage = 60;
        }

        // エラー防止テスト
        if (content.includes('error') || content.includes('invalid') || content.includes('エラー')) {
          uxCoverage.error_prevention.tested = true;
          uxCoverage.error_prevention.coverage = 80;
        }

        // ユーザーコントロールテスト
        if (content.includes('control') || content.includes('cancel') || content.includes('制御')) {
          uxCoverage.user_control.tested = true;
          uxCoverage.user_control.coverage = 50;
        }

        // 一貫性テスト
        if (content.includes('consistent') || content.includes('uniform') || content.includes('一貫')) {
          uxCoverage.consistency.tested = true;
          uxCoverage.consistency.coverage = 65;
        }

        // アクセシビリティテスト
        if (content.includes('accessibility') || content.includes('a11y') || content.includes('aria')) {
          uxCoverage.accessibility.tested = true;
          uxCoverage.accessibility.coverage = 40;
        }

        // パフォーマンステスト
        if (content.includes('performance') || content.includes('memory') || content.includes('パフォーマンス')) {
          uxCoverage.performance.tested = true;
          uxCoverage.performance.coverage = 75;
        }
      }
    }

    return uxCoverage;
  }

  // テスト品質分析
  async analyzeTestQuality() {
    const quality = {
      structure: { score: 0, issues: [] },
      assertions: { score: 0, issues: [] },
      coverage: { score: 0, issues: [] },
      maintainability: { score: 0, issues: [] }
    };

    for (const testPath of this.testFilePaths) {
      const fullPath = path.join(__dirname, '..', testPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // テスト構造の評価
        const structureScore = this.evaluateTestStructure(content);
        quality.structure.score += structureScore.score;
        quality.structure.issues.push(...structureScore.issues);

        // アサーション品質の評価
        const assertionScore = this.evaluateAssertions(content);
        quality.assertions.score += assertionScore.score;
        quality.assertions.issues.push(...assertionScore.issues);
      }
    }

    // 平均スコア計算
    const fileCount = this.testFilePaths.length;
    quality.structure.score = Math.round(quality.structure.score / fileCount);
    quality.assertions.score = Math.round(quality.assertions.score / fileCount);

    return quality;
  }

  // テスト構造評価
  evaluateTestStructure(content) {
    const score = { score: 0, issues: [] };
    let points = 0;

    // describe ブロックの使用
    const describeBlocks = (content.match(/describe\(/g) || []).length;
    if (describeBlocks > 0) {
      points += 20;
    } else {
      score.issues.push('Missing describe blocks for test organization');
    }

    // beforeEach/afterEach の使用
    if (content.includes('beforeEach') || content.includes('afterEach')) {
      points += 15;
    } else {
      score.issues.push('Missing setup/teardown methods');
    }

    // テストの分離度
    const testBlocks = (content.match(/test\(|it\(/g) || []).length;
    if (testBlocks > 5) {
      points += 15;
    } else {
      score.issues.push('Insufficient test coverage - add more test cases');
    }

    // 適切なコメント
    const comments = (content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length;
    if (comments > testBlocks * 0.3) {
      points += 10;
    } else {
      score.issues.push('Add more descriptive comments for complex test logic');
    }

    // モック使用の適切性
    if (content.includes('jest.mock') || content.includes('jest.spyOn')) {
      points += 20;
    } else {
      score.issues.push('Consider using mocks for external dependencies');
    }

    // 非同期テスト処理
    if (content.includes('async') && content.includes('await')) {
      points += 20;
    } else if (content.includes('waitFor')) {
      points += 15;
    } else {
      score.issues.push('Add proper async test handling with waitFor/async-await');
    }

    score.score = points;
    return score;
  }

  // アサーション評価
  evaluateAssertions(content) {
    const score = { score: 0, issues: [] };
    let points = 0;

    // 適切なマッチャー使用
    const matchers = [
      'toBeInTheDocument',
      'toHaveLength', 
      'toBeNull',
      'toBe',
      'toEqual',
      'toMatch'
    ];

    let matcherCount = 0;
    matchers.forEach(matcher => {
      if (content.includes(matcher)) {
        matcherCount++;
      }
    });

    if (matcherCount >= 5) {
      points += 30;
    } else if (matcherCount >= 3) {
      points += 20;
    } else {
      score.issues.push('Use more specific Jest matchers for better assertions');
    }

    // テスト特化アサーション
    const domMatchers = ['toBeInTheDocument', 'toHaveClass', 'toHaveStyle'];
    const domMatcherCount = domMatchers.filter(matcher => content.includes(matcher)).length;
    
    if (domMatcherCount >= 2) {
      points += 25;
    } else {
      score.issues.push('Add more DOM-specific assertions using testing-library matchers');
    }

    // エラーハンドリングテスト
    if (content.includes('toThrow') || content.includes('catch')) {
      points += 20;
    } else {
      score.issues.push('Add error handling test cases');
    }

    // 状態変化のテスト
    if (content.includes('expect') && content.includes('change')) {
      points += 15;
    } else {
      score.issues.push('Add tests for state changes and side effects');
    }

    // Union Arena特有のアサーション
    if (content.includes('energy') || content.includes('phase') || content.includes('BP')) {
      points += 10;
    } else {
      score.issues.push('Add Union Arena game rule specific assertions');
    }

    score.score = points;
    return score;
  }

  // テストギャップ特定
  async identifyTestGaps() {
    const gaps = {
      unionArenaRules: [],
      uxPrinciples: [],
      edgeCases: [],
      integration: [],
      performance: []
    };

    // Union Arena ルールギャップ
    if (!(await this.hasPhaseTransitionTests())) {
      gaps.unionArenaRules.push('Missing comprehensive phase transition tests');
    }

    if (!(await this.hasEnergyCalculationTests())) {
      gaps.unionArenaRules.push('Missing energy cost calculation edge cases');
    }

    if (!(await this.hasCardEffectChainTests())) {
      gaps.unionArenaRules.push('Missing card effect chain resolution tests');
    }

    if (!(await this.hasBattleCalculationTests())) {
      gaps.unionArenaRules.push('Missing complex battle calculation scenarios');
    }

    // UXプリンシプルギャップ
    if (!(await this.hasKeyboardNavigationTests())) {
      gaps.uxPrinciples.push('Missing keyboard navigation tests');
    }

    if (!(await this.hasErrorRecoveryTests())) {
      gaps.uxPrinciples.push('Missing error recovery and user guidance tests');
    }

    if (!(await this.hasAccessibilityTests())) {
      gaps.uxPrinciples.push('Missing comprehensive accessibility tests');
    }

    // エッジケースギャップ
    gaps.edgeCases.push('Missing large deck size performance tests');
    gaps.edgeCases.push('Missing network failure recovery tests');
    gaps.edgeCases.push('Missing memory leak tests for extended gameplay');

    // 統合テストギャップ
    gaps.integration.push('Missing complete AI vs Player game scenarios');
    gaps.integration.push('Missing cross-browser compatibility tests');
    gaps.integration.push('Missing mobile device touch interaction tests');

    // パフォーマンスギャップ
    gaps.performance.push('Missing animation performance under load tests');
    gaps.performance.push('Missing memory usage optimization tests');
    gaps.performance.push('Missing startup time optimization tests');

    return gaps;
  }

  // 改善提案生成
  generateImprovementSuggestions(analysis) {
    const suggestions = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };

    // 即座に実装すべき改善
    if (analysis.unionArenaCompliance.phases.coverage < 80) {
      suggestions.immediate.push({
        priority: 'high',
        category: 'Union Arena Rules',
        title: 'Add Comprehensive Phase Management Tests',
        description: 'Implement tests for all phase transitions and phase-specific action restrictions',
        implementation: `
// Example test to add
test('prevents card placement during start phase', async () => {
  // Setup game in start phase
  // Attempt card placement
  // Verify placement is blocked
  // Verify appropriate user feedback
});`
      });
    }

    if (analysis.uxCoverage.accessibility.coverage < 60) {
      suggestions.immediate.push({
        priority: 'high',
        category: 'Accessibility',
        title: 'Add Accessibility Test Suite',
        description: 'Implement comprehensive accessibility tests for Union Arena gameplay',
        implementation: `
// Example accessibility test
test('provides screen reader friendly game state', async () => {
  // Check ARIA labels on game elements
  // Verify game state announcements
  // Test keyboard navigation
});`
      });
    }

    // 短期改善
    if (analysis.testQuality.structure.score < 80) {
      suggestions.shortTerm.push({
        priority: 'medium',
        category: 'Test Quality',
        title: 'Improve Test Structure and Organization',
        description: 'Reorganize tests with better describe blocks and setup methods',
        implementation: 'Add more describe blocks, beforeEach/afterEach methods, and test utilities'
      });
    }

    // 長期改善
    suggestions.longTerm.push({
      priority: 'low',
      category: 'Integration',
      title: 'Add End-to-End Game Scenarios',
      description: 'Implement complete game scenarios from start to victory',
      implementation: 'Create comprehensive E2E tests covering full game workflows'
    });

    return suggestions;
  }

  // 改善プロンプト生成
  async generateTestImprovementPrompt() {
    const analysis = await this.analyzeTestCases();
    const suggestions = this.generateImprovementSuggestions(analysis);

    const prompt = `# Union Arena Test Case Improvement Plan

## 📊 Current Test Analysis

### Union Arena Rule Compliance
${Object.entries(analysis.unionArenaCompliance).map(([rule, data]) => 
  `- **${rule}**: ${data.tested ? '✅' : '❌'} Tested (Coverage: ${data.coverage}%)`
).join('\n')}

### UX Principle Coverage
${Object.entries(analysis.uxCoverage).map(([principle, data]) => 
  `- **${principle}**: ${data.tested ? '✅' : '❌'} Tested (Coverage: ${data.coverage}%)`
).join('\n')}

### Test Quality Scores
- **Structure**: ${analysis.testQuality.structure.score}%
- **Assertions**: ${analysis.testQuality.assertions.score}%

## 🎯 Priority Improvements

### Immediate Actions (High Priority)
${suggestions.immediate.map(suggestion => 
  `#### ${suggestion.title}
**Category**: ${suggestion.category}
**Description**: ${suggestion.description}
\`\`\`javascript
${suggestion.implementation}
\`\`\`
`).join('\n')}

### Short-term Improvements (Medium Priority)  
${suggestions.shortTerm.map(suggestion => 
  `#### ${suggestion.title}
**Category**: ${suggestion.category}
**Description**: ${suggestion.description}
`).join('\n')}

## 🎮 Union Arena Specific Test Enhancements

### Missing Game Rule Tests
${analysis.gaps.unionArenaRules.map(gap => `- ${gap}`).join('\n')}

### Missing UX Tests
${analysis.gaps.uxPrinciples.map(gap => `- ${gap}`).join('\n')}

### Missing Edge Cases
${analysis.gaps.edgeCases.map(gap => `- ${gap}`).join('\n')}

## 📝 Implementation Guidelines

1. **Test Organization**: Use clear describe blocks for each game system
2. **Union Arena Rules**: Verify every rule is tested with edge cases
3. **User Experience**: Test all interaction patterns and feedback
4. **Error Handling**: Test invalid actions and recovery scenarios
5. **Performance**: Test with realistic data volumes
6. **Accessibility**: Ensure all interactions work with assistive technology

## 🧪 Sample Test Templates

### Phase Management Test Template
\`\`\`javascript
describe('Union Arena Phase Management', () => {
  test('enforces phase-specific action restrictions', async () => {
    // Test implementation
  });
  
  test('provides clear phase transition feedback', async () => {
    // Test implementation  
  });
});
\`\`\`

### Energy System Test Template
\`\`\`javascript
describe('Energy System Calculations', () => {
  test('accurately calculates multi-color energy costs', async () => {
    // Test implementation
  });
  
  test('prevents actions with insufficient energy', async () => {
    // Test implementation
  });
});
\`\`\`

---
Generated by Union Arena Test Case Improver
Timestamp: ${new Date().toISOString()}`;

    return prompt;
  }

  // ヘルパーメソッド（実装チェック用）
  async hasPhaseTransitionTests() {
    // 実装に応じて調整
    return false;
  }

  async hasEnergyCalculationTests() {
    return false;
  }

  async hasCardEffectChainTests() {
    return false;
  }

  async hasBattleCalculationTests() {
    return false;
  }

  async hasKeyboardNavigationTests() {
    return false;
  }

  async hasErrorRecoveryTests() {
    return false;
  }

  async hasAccessibilityTests() {
    return false;
  }

  // カバレッジ計算ヘルパー
  calculatePhaseTestCoverage(content) {
    const phases = this.unionArenaRules.phases;
    const testedPhases = phases.filter(phase => content.includes(phase)).length;
    return Math.round((testedPhases / phases.length) * 100);
  }

  calculateEnergyTestCoverage(content) {
    const colors = this.unionArenaRules.energyColors;
    const testedColors = colors.filter(color => content.includes(color)).length;
    return Math.round((testedColors / colors.length) * 100);
  }

  calculateEffectTestCoverage(content) {
    const effects = this.unionArenaRules.effectTypes;
    const testedEffects = effects.filter(effect => content.includes(effect)).length;
    return Math.round((testedEffects / effects.length) * 100);
  }

  calculateBattleTestCoverage(content) {
    const battleKeywords = ['BP', 'battle', 'attack', 'block', 'damage'];
    const testedKeywords = battleKeywords.filter(keyword => content.includes(keyword)).length;
    return Math.round((testedKeywords / battleKeywords.length) * 100);
  }

  calculateVictoryTestCoverage(content) {
    const victoryKeywords = ['victory', 'defeat', 'life', 'deck', 'win', 'lose'];
    const testedKeywords = victoryKeywords.filter(keyword => content.includes(keyword)).length;
    return Math.round((testedKeywords / victoryKeywords.length) * 100);
  }
}

// CLI実行
if (require.main === module) {
  const improver = new TestCaseImprover();
  
  improver.generateTestImprovementPrompt()
    .then(prompt => {
      console.log(prompt);
      
      // ファイルに保存
      const outputPath = path.join(__dirname, '..', 'test-improvement-suggestions.md');
      fs.writeFileSync(outputPath, prompt);
      console.log(`\n📁 Test improvement suggestions saved to: ${outputPath}`);
    })
    .catch(error => {
      console.error('❌ Test case improvement analysis failed:', error);
      process.exit(1);
    });
}

module.exports = TestCaseImprover;