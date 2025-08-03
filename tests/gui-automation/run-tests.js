#!/usr/bin/env node

/**
 * Union Arena GUI Test Runner
 * 全テストスイートを統合実行するメインスクリプト
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const DuelTestRunner = require('./src/duelTestRunner');
const BattlefieldTestSuite = require('./src/battlefieldTests');
const CombatTestSuite = require('./src/combatTests');

class TestOrchestrator {
  constructor() {
    this.results = {
      comprehensive: null,
      battlefield: null,
      combat: null,
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        executionTime: 0
      }
    };
  }

  async showWelcome() {
    console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🎮 Union Arena BattleField Duel GUI Test Suite        ║
║                                                              ║
║              自動化GUI操作テストシステム                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `));
    
    console.log(chalk.cyan('📋 このテストスイートでは以下を検証します:'));
    console.log(chalk.white('   • BattleField UI の基本操作'));
    console.log(chalk.white('   • カード配置とフィールド管理'));
    console.log(chalk.white('   • 戦闘システムとダメージ計算'));
    console.log(chalk.white('   • AI対戦相手の動作'));
    console.log(chalk.white('   • UX改善機能（プレビュー、チュートリアル等）'));
    console.log(chalk.white('   • レスポンシブデザイン\n'));
  }

  async selectTestSuite() {
    const choices = [
      {
        name: '🧪 全テスト実行 (推奨) - 包括的な動作検証',
        value: 'all'
      },
      {
        name: '⚔️ 包括テスト - メインDuelフロー全体',
        value: 'comprehensive'
      },
      {
        name: '🎯 BattleFieldテスト - UI操作とフィールド管理',
        value: 'battlefield'
      },
      {
        name: '⚔️ 戦闘システムテスト - バトル機能詳細',
        value: 'combat'
      },
      {
        name: '🛠️ カスタム選択 - 個別テスト組み合わせ',
        value: 'custom'
      }
    ];

    const { testSuite } = await inquirer.prompt([
      {
        type: 'list',
        name: 'testSuite',
        message: 'どのテストスイートを実行しますか？',
        choices,
        pageSize: 10
      }
    ]);

    return testSuite;
  }

  async selectCustomTests() {
    const { customTests } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'customTests',
        message: '実行するテストを選択してください:',
        choices: [
          { name: 'Comprehensive Duel Test', value: 'comprehensive', checked: true },
          { name: 'BattleField UI Test', value: 'battlefield', checked: true },
          { name: 'Combat System Test', value: 'combat', checked: true }
        ]
      }
    ]);

    return customTests;
  }

  async confirmExecution(selectedTests) {
    console.log(chalk.yellow('\n📋 実行予定のテスト:'));
    
    if (selectedTests.includes('comprehensive')) {
      console.log(chalk.white('   ✓ 包括的Duelテスト'));
    }
    if (selectedTests.includes('battlefield')) {
      console.log(chalk.white('   ✓ BattlefieldUIテスト'));
    }
    if (selectedTests.includes('combat')) {
      console.log(chalk.white('   ✓ 戦闘システムテスト'));
    }

    console.log(chalk.cyan('\n⚠️  注意事項:'));
    console.log(chalk.white('   • ブラウザが自動制御されます'));
    console.log(chalk.white('   • Union Arena Webアプリが http://localhost:3000 で稼働している必要があります'));
    console.log(chalk.white('   • テスト中は他の作業を控えてください'));
    console.log(chalk.white('   • 実行時間: 約5-10分程度\n'));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'テストを実行しますか？',
        default: true
      }
    ]);

    return confirm;
  }

  async checkPrerequisites() {
    console.log(chalk.cyan('🔍 前提条件をチェック中...'));
    
    const axios = require('axios');
    const checks = [];

    // フロントエンド接続確認
    try {
      await axios.get('http://localhost:3000');
      checks.push({ name: 'フロントエンド (localhost:3000)', status: true });
    } catch (error) {
      checks.push({ name: 'フロントエンド (localhost:3000)', status: false, error: error.message });
    }

    // バックエンド接続確認
    try {
      await axios.get('http://localhost:8000/api/v1/decks');
      checks.push({ name: 'バックエンドAPI (localhost:8000)', status: true });
    } catch (error) {
      checks.push({ name: 'バックエンドAPI (localhost:8000)', status: false, error: error.message });
    }

    // 結果表示
    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      const color = check.status ? chalk.green : chalk.red;
      console.log(color(`   ${icon} ${check.name}`));
      
      if (!check.status) {
        console.log(chalk.red(`      Error: ${check.error}`));
      }
    });

    const allPassed = checks.every(check => check.status);
    
    if (!allPassed) {
      console.log(chalk.red('\n❌ 前提条件が満たされていません。'));
      console.log(chalk.yellow('Union Arena Webアプリを起動してから再実行してください。'));
      return false;
    }

    console.log(chalk.green('\n✅ 前提条件OK - テスト実行準備完了\n'));
    return true;
  }

  async runComprehensiveTest() {
    console.log(chalk.blue('🧪 包括的Duelテスト実行中...'));
    const startTime = Date.now();
    
    try {
      const runner = new DuelTestRunner();
      await runner.runAllTests();
      
      this.results.comprehensive = {
        executed: true,
        duration: Date.now() - startTime,
        results: runner.testResults
      };
      
      return true;
    } catch (error) {
      console.log(chalk.red(`包括テスト失敗: ${error.message}`));
      return false;
    }
  }

  async runBattlefieldTest() {
    console.log(chalk.blue('🎯 BattlefieldUIテスト実行中...'));
    const startTime = Date.now();
    
    try {
      const suite = new BattlefieldTestSuite();
      await suite.runAllTests();
      
      this.results.battlefield = {
        executed: true,
        duration: Date.now() - startTime,
        results: suite.testResults
      };
      
      return true;
    } catch (error) {
      console.log(chalk.red(`Battlefieldテスト失敗: ${error.message}`));
      return false;
    }
  }

  async runCombatTest() {
    console.log(chalk.blue('⚔️ 戦闘システムテスト実行中...'));
    const startTime = Date.now();
    
    try {
      const suite = new CombatTestSuite();
      await suite.runAllTests();
      
      this.results.combat = {
        executed: true,
        duration: Date.now() - startTime,
        results: suite.testResults
      };
      
      return true;
    } catch (error) {
      console.log(chalk.red(`戦闘テスト失敗: ${error.message}`));
      return false;
    }
  }

  calculateSummary() {
    let totalTests = 0;
    let passedTests = 0;
    let totalDuration = 0;

    ['comprehensive', 'battlefield', 'combat'].forEach(testType => {
      const result = this.results[testType];
      if (result && result.executed) {
        totalTests += result.results.length;
        passedTests += result.results.filter(test => test.passed).length;
        totalDuration += result.duration;
      }
    });

    this.results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      executionTime: totalDuration,
      passRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0
    };
  }

  async generateConsolidatedReport() {
    await fs.ensureDir(path.join(__dirname, 'reports'));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, 'reports', `consolidated_report_${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      testSuites: {
        comprehensive: this.results.comprehensive,
        battlefield: this.results.battlefield,
        combat: this.results.combat
      }
    };

    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    // HTML レポートも生成
    const htmlReport = this.generateHtmlSummary(report);
    const htmlPath = path.join(__dirname, 'reports', `consolidated_report_${timestamp}.html`);
    await fs.writeFile(htmlPath, htmlReport);

    console.log(chalk.green(`\n📄 統合レポート保存: ${reportPath}`));
    console.log(chalk.green(`🌐 HTML レポート: ${htmlPath}`));
    
    return reportPath;
  }

  generateHtmlSummary(report) {
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Union Arena GUI Test Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .pass-rate { color: #27ae60; }
        .fail-count { color: #e74c3c; }
        .test-suite { background: white; margin: 20px 0; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .suite-header { font-size: 1.5em; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ecf0f1; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 6px; border-left: 4px solid #bdc3c7; }
        .test-passed { border-left-color: #27ae60; background: #d5f4e6; }
        .test-failed { border-left-color: #e74c3c; background: #fdeaea; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Union Arena GUI Test Summary</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary-grid">
        <div class="metric-card">
            <h3>Total Tests</h3>
            <div class="metric-value">${report.summary.totalTests}</div>
        </div>
        <div class="metric-card">
            <h3>Passed</h3>
            <div class="metric-value pass-rate">${report.summary.passedTests}</div>
        </div>
        <div class="metric-card">
            <h3>Failed</h3>
            <div class="metric-value fail-count">${report.summary.failedTests}</div>
        </div>
        <div class="metric-card">
            <h3>Pass Rate</h3>
            <div class="metric-value pass-rate">${report.summary.passRate}%</div>
        </div>
    </div>

    ${Object.entries(report.testSuites).map(([suiteName, suite]) => {
      if (!suite || !suite.executed) return '';
      
      return `
        <div class="test-suite">
            <div class="suite-header">
                ${suiteName.charAt(0).toUpperCase() + suiteName.slice(1)} Test Suite
                <small>(${(suite.duration / 1000).toFixed(1)}s)</small>
            </div>
            ${suite.results.map(test => `
                <div class="test-result ${test.passed ? 'test-passed' : 'test-failed'}">
                    <strong>${test.passed ? '✅' : '❌'} ${test.name}</strong>
                    ${test.details.length > 0 ? `
                        <ul>
                            ${test.details.slice(0, 3).map(detail => `<li>${detail}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}
        </div>
      `;
    }).join('')}
    
    <div style="text-align: center; margin-top: 40px; color: #7f8c8d;">
        <p>🤖 Automated GUI Testing for Union Arena BattleField</p>
    </div>
</body>
</html>`;
  }

  displayFinalSummary() {
    console.log(chalk.blue('\n' + '='.repeat(60)));
    console.log(chalk.blue.bold('                🎯 FINAL TEST SUMMARY'));
    console.log(chalk.blue('='.repeat(60)));
    
    const { summary } = this.results;
    
    console.log(chalk.white(`📊 Total Tests Executed: ${summary.totalTests}`));
    console.log(chalk.green(`✅ Tests Passed: ${summary.passedTests}`));
    console.log(chalk.red(`❌ Tests Failed: ${summary.failedTests}`));
    console.log(chalk.yellow(`📈 Pass Rate: ${summary.passRate}%`));
    console.log(chalk.cyan(`⏱️ Total Execution Time: ${(summary.executionTime / 1000).toFixed(1)} seconds`));
    
    if (summary.failedTests === 0) {
      console.log(chalk.green.bold('\n🎉 ALL TESTS PASSED! Union Arena Duel system is working perfectly!'));
    } else if (summary.passRate >= 80) {
      console.log(chalk.yellow.bold('\n⚠️ Most tests passed, but some issues detected. Check the detailed report.'));
    } else {
      console.log(chalk.red.bold('\n💥 Significant issues detected. Please review the failed tests.'));
    }
    
    console.log(chalk.blue('='.repeat(60)));
  }

  async run() {
    await this.showWelcome();
    
    // 前提条件チェック
    const prereqsOk = await this.checkPrerequisites();
    if (!prereqsOk) {
      process.exit(1);
    }

    // テストスイート選択
    const selectedSuite = await this.selectTestSuite();
    let testsToRun = [];
    
    if (selectedSuite === 'all') {
      testsToRun = ['comprehensive', 'battlefield', 'combat'];
    } else if (selectedSuite === 'custom') {
      testsToRun = await this.selectCustomTests();
    } else {
      testsToRun = [selectedSuite];
    }

    // 実行確認
    const confirmed = await this.confirmExecution(testsToRun);
    if (!confirmed) {
      console.log(chalk.yellow('テスト実行をキャンセルしました。'));
      process.exit(0);
    }

    // テスト実行
    console.log(chalk.blue('\n🚀 テスト実行開始...\n'));
    const overallStartTime = Date.now();

    for (const testType of testsToRun) {
      switch (testType) {
        case 'comprehensive':
          await this.runComprehensiveTest();
          break;
        case 'battlefield':
          await this.runBattlefieldTest();
          break;
        case 'combat':
          await this.runCombatTest();
          break;
      }
    }

    // 結果集計とレポート生成
    this.calculateSummary();
    await this.generateConsolidatedReport();
    this.displayFinalSummary();
    
    console.log(chalk.cyan(`\n⏱️ Total execution time: ${((Date.now() - overallStartTime) / 1000).toFixed(1)} seconds`));
    console.log(chalk.blue('テスト完了！レポートを確認してください。\n'));
  }
}

// メイン実行
if (require.main === module) {
  const orchestrator = new TestOrchestrator();
  orchestrator.run().catch(error => {
    console.error(chalk.red('テスト実行エラー:', error.message));
    process.exit(1);
  });
}

module.exports = TestOrchestrator;