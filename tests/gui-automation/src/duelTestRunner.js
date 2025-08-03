/**
 * Union Arena BattleField Duel GUI Test Runner
 * 自動化されたGUIテストでDuel機能を包括的にテスト
 */

const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class DuelTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.baseUrl = 'http://localhost:3000';
    this.apiUrl = 'http://localhost:8000';
    
    // テスト設定
    this.config = {
      headless: false, // デバッグ用に表示
      slowMo: 1000,    // 操作間の遅延（ms）
      timeout: 30000,  // タイムアウト時間
      screenshotDir: path.join(__dirname, '../screenshots'),
      reportDir: path.join(__dirname, '../reports')
    };
  }

  async initialize() {
    console.log(chalk.blue('🚀 Union Arena Duel Test Runner 初期化中...'));
    
    // ディレクトリ作成
    await fs.ensureDir(this.config.screenshotDir);
    await fs.ensureDir(this.config.reportDir);
    
    // ブラウザ起動
    this.browser = await chromium.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(this.config.timeout);
    
    // エラーリスナー設定
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(chalk.red(`Browser Error: ${msg.text()}`));
      }
    });
    
    console.log(chalk.green('✅ 初期化完了'));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log(chalk.green('✅ ブラウザクローズ完了'));
    }
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(this.config.screenshotDir, filename);
    
    await this.page.screenshot({ 
      path: filepath,
      fullPage: true 
    });
    
    return filename;
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(chalk.red(`Element not found: ${selector}`));
      return false;
    }
  }

  async navigateToDuelMode() {
    console.log(chalk.yellow('📍 DuelMode へナビゲート中...'));
    
    try {
      // メインページにアクセス
      await this.page.goto(this.baseUrl);
      await this.takeScreenshot('01_main_page');
      
      // DuelModeボタンをクリック
      const duelModeButton = await this.page.waitForSelector('text="DuelMode"', { timeout: 5000 });
      await duelModeButton.click();
      await this.takeScreenshot('02_duel_mode_clicked');
      
      // デッキ選択画面の確認
      await this.waitForElement('.deck-selector-container');
      await this.takeScreenshot('03_deck_selector');
      
      return true;
    } catch (error) {
      console.log(chalk.red(`Navigation failed: ${error.message}`));
      await this.takeScreenshot('error_navigation');
      return false;
    }
  }

  async selectDeck() {
    console.log(chalk.yellow('🃏 デッキ選択中...'));
    
    try {
      // 利用可能なデッキを取得
      const deckCards = await this.page.$$('.deck-card');
      if (deckCards.length === 0) {
        throw new Error('No decks available');
      }
      
      // 最初のデッキを選択
      await deckCards[0].click();
      await this.takeScreenshot('04_deck_selected');
      
      // BattleFieldが表示されるまで待機
      await this.waitForElement('.battle-field-container');
      await this.takeScreenshot('05_battlefield_loaded');
      
      return true;
    } catch (error) {
      console.log(chalk.red(`Deck selection failed: ${error.message}`));
      await this.takeScreenshot('error_deck_selection');
      return false;
    }
  }

  async testCardPlacement() {
    console.log(chalk.yellow('🎴 カード配置テスト実行中...'));
    
    const testResult = {
      name: 'Card Placement Test',
      passed: false,
      details: [],
      screenshots: []
    };

    try {
      // 手札のカードを取得
      const handCards = await this.page.$$('.hand-card');
      if (handCards.length === 0) {
        throw new Error('No cards in hand');
      }

      // 最初のカードを選択
      await handCards[0].click();
      await this.page.waitForTimeout(1000);
      testResult.screenshots.push(await this.takeScreenshot('06_card_selected'));
      
      // ハイライトされたスロットの確認
      const highlightedSlots = await this.page.$$('.line-slot.highlighted');
      testResult.details.push(`Highlighted slots found: ${highlightedSlots.length}`);
      
      if (highlightedSlots.length > 0) {
        // 最初のハイライトされたスロットをクリック
        await highlightedSlots[0].click();
        await this.page.waitForTimeout(1000);
        testResult.screenshots.push(await this.takeScreenshot('07_card_placed'));
        
        // カードがフィールドに配置されたことを確認
        const fieldCards = await this.page.$$('.field-card');
        testResult.details.push(`Cards on field after placement: ${fieldCards.length}`);
        
        if (fieldCards.length > 0) {
          testResult.passed = true;
          testResult.details.push('Card placement successful');
        }
      } else {
        testResult.details.push('No highlighted slots found');
      }

    } catch (error) {
      testResult.details.push(`Error: ${error.message}`);
      testResult.screenshots.push(await this.takeScreenshot('error_card_placement'));
    }

    this.testResults.push(testResult);
    return testResult.passed;
  }

  async testPhaseProgression() {
    console.log(chalk.yellow('⚡ フェーズ進行テスト実行中...'));
    
    const testResult = {
      name: 'Phase Progression Test',
      passed: false,
      details: [],
      screenshots: []
    };

    try {
      // 現在のフェーズを取得
      const initialPhase = await this.page.textContent('.phase-name');
      testResult.details.push(`Initial phase: ${initialPhase}`);
      
      // 「次へ」ボタンをクリック
      const nextButton = await this.page.$('.phase-btn:not([disabled])');
      if (nextButton) {
        await nextButton.click();
        await this.page.waitForTimeout(2000);
        testResult.screenshots.push(await this.takeScreenshot('08_phase_advanced'));
        
        // フェーズが変更されたことを確認
        const newPhase = await this.page.textContent('.phase-name');
        testResult.details.push(`New phase: ${newPhase}`);
        
        if (newPhase !== initialPhase) {
          testResult.passed = true;
          testResult.details.push('Phase progression successful');
        } else {
          testResult.details.push('Phase did not change');
        }
      } else {
        testResult.details.push('Next phase button not available');
      }

    } catch (error) {
      testResult.details.push(`Error: ${error.message}`);
      testResult.screenshots.push(await this.takeScreenshot('error_phase_progression'));
    }

    this.testResults.push(testResult);
    return testResult.passed;
  }

  async testAIInteraction() {
    console.log(chalk.yellow('🤖 AI相互作用テスト実行中...'));
    
    const testResult = {
      name: 'AI Interaction Test',
      passed: false,
      details: [],
      screenshots: []
    };

    try {
      // ターン終了ボタンを探す
      const endTurnButton = await this.page.$('.end-btn:not([disabled])');
      if (endTurnButton) {
        await endTurnButton.click();
        await this.page.waitForTimeout(1000);
        testResult.screenshots.push(await this.takeScreenshot('09_turn_ended'));
        
        // AIの思考表示を確認
        const aiThinking = await this.waitForElement('.ai-thinking-indicator', 5000);
        if (aiThinking) {
          testResult.details.push('AI thinking indicator appeared');
          
          // AIの行動完了まで待機
          await this.page.waitForFunction(
            () => !document.querySelector('.ai-thinking-indicator'),
            { timeout: 15000 }
          );
          
          testResult.screenshots.push(await this.takeScreenshot('10_ai_action_completed'));
          testResult.details.push('AI action completed');
          testResult.passed = true;
        } else {
          testResult.details.push('AI thinking indicator not found');
        }
      } else {
        testResult.details.push('End turn button not available');
      }

    } catch (error) {
      testResult.details.push(`Error: ${error.message}`);
      testResult.screenshots.push(await this.takeScreenshot('error_ai_interaction'));
    }

    this.testResults.push(testResult);
    return testResult.passed;
  }

  async testCardPreview() {
    console.log(chalk.yellow('🔍 カードプレビューテスト実行中...'));
    
    const testResult = {
      name: 'Card Preview Test',
      passed: false,
      details: [],
      screenshots: []
    };

    try {
      // 手札のカードにホバー
      const handCards = await this.page.$$('.hand-card');
      if (handCards.length > 0) {
        await handCards[0].hover();
        await this.page.waitForTimeout(1000);
        
        // プレビューパネルの表示確認
        const previewPanel = await this.waitForElement('.enhanced-card-preview', 3000);
        if (previewPanel) {
          testResult.screenshots.push(await this.takeScreenshot('11_card_preview'));
          testResult.details.push('Card preview panel displayed');
          
          // プレビュー内容の確認
          const cardTitle = await this.page.$('.card-title');
          const cardImage = await this.page.$('.preview-card-image');
          const statsGrid = await this.page.$('.stats-grid');
          
          testResult.details.push(`Card title present: ${!!cardTitle}`);
          testResult.details.push(`Card image present: ${!!cardImage}`);
          testResult.details.push(`Stats grid present: ${!!statsGrid}`);
          
          if (cardTitle && cardImage && statsGrid) {
            testResult.passed = true;
            testResult.details.push('Card preview fully functional');
          }
        } else {
          testResult.details.push('Card preview panel not displayed');
        }
      } else {
        testResult.details.push('No cards in hand to test');
      }

    } catch (error) {
      testResult.details.push(`Error: ${error.message}`);
      testResult.screenshots.push(await this.takeScreenshot('error_card_preview'));
    }

    this.testResults.push(testResult);
    return testResult.passed;
  }

  async testTutorialSystem() {
    console.log(chalk.yellow('❓ チュートリアルシステムテスト実行中...'));
    
    const testResult = {
      name: 'Tutorial System Test',
      passed: false,
      details: [],
      screenshots: []
    };

    try {
      // ヘルプボタンをクリック
      const helpButton = await this.page.$('.help-btn');
      if (helpButton) {
        await helpButton.click();
        await this.page.waitForTimeout(1000);
        
        // チュートリアルオーバーレイの表示確認
        const tutorialOverlay = await this.waitForElement('.tutorial-overlay', 3000);
        if (tutorialOverlay) {
          testResult.screenshots.push(await this.takeScreenshot('12_tutorial_opened'));
          testResult.details.push('Tutorial overlay displayed');
          
          // チュートリアルコンテンツの確認
          const tutorialTitle = await this.page.$('.tutorial-title');
          const progressBar = await this.page.$('.progress-bar');
          const nextButton = await this.page.$('.next-btn');
          
          testResult.details.push(`Tutorial title present: ${!!tutorialTitle}`);
          testResult.details.push(`Progress bar present: ${!!progressBar}`);
          testResult.details.push(`Next button present: ${!!nextButton}`);
          
          if (tutorialTitle && progressBar && nextButton) {
            // 次のステップに進む
            await nextButton.click();
            await this.page.waitForTimeout(1000);
            testResult.screenshots.push(await this.takeScreenshot('13_tutorial_next_step'));
            
            testResult.passed = true;
            testResult.details.push('Tutorial system fully functional');
            
            // チュートリアルを閉じる
            const closeButton = await this.page.$('.tutorial-close');
            if (closeButton) {
              await closeButton.click();
            }
          }
        } else {
          testResult.details.push('Tutorial overlay not displayed');
        }
      } else {
        testResult.details.push('Help button not found');
      }

    } catch (error) {
      testResult.details.push(`Error: ${error.message}`);
      testResult.screenshots.push(await this.takeScreenshot('error_tutorial'));
    }

    this.testResults.push(testResult);
    return testResult.passed;
  }

  async generateReport() {
    console.log(chalk.yellow('📊 テストレポート生成中...'));
    
    const timestamp = new Date().toISOString();
    const passedTests = this.testResults.filter(test => test.passed).length;
    const totalTests = this.testResults.length;
    
    const report = {
      timestamp,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        passRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) + '%' : '0%'
      },
      tests: this.testResults,
      environment: {
        baseUrl: this.baseUrl,
        apiUrl: this.apiUrl,
        browser: 'Chromium',
        headless: this.config.headless
      }
    };
    
    // JSON レポート保存
    const reportPath = path.join(this.config.reportDir, `duel_test_report_${timestamp.replace(/[:.]/g, '-')}.json`);
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    // HTML レポート生成
    const htmlReport = this.generateHtmlReport(report);
    const htmlPath = path.join(this.config.reportDir, `duel_test_report_${timestamp.replace(/[:.]/g, '-')}.html`);
    await fs.writeFile(htmlPath, htmlReport);
    
    console.log(chalk.green(`📄 レポート保存完了: ${reportPath}`));
    console.log(chalk.green(`🌐 HTML レポート: ${htmlPath}`));
    
    return report;
  }

  generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Union Arena Duel Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2d3748; color: white; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #f7fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .passed { border-left: 4px solid #48bb78; }
        .failed { border-left: 4px solid #f56565; }
        .test-result { margin: 10px 0; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .screenshots img { max-width: 200px; margin: 5px; border: 1px solid #ccc; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Union Arena Duel GUI Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.total}</div>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #48bb78;">${report.summary.passed}</div>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #f56565;">${report.summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Pass Rate</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.passRate}</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${report.tests.map(test => `
        <div class="test-result ${test.passed ? 'passed' : 'failed'}">
            <h3>${test.passed ? '✅' : '❌'} ${test.name}</h3>
            <ul>
                ${test.details.map(detail => `<li>${detail}</li>`).join('')}
            </ul>
            ${test.screenshots.length > 0 ? `
                <div class="screenshots">
                    <h4>Screenshots:</h4>
                    ${test.screenshots.map(screenshot => `
                        <img src="../screenshots/${screenshot}" alt="Screenshot" />
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`;
  }

  async runAllTests() {
    console.log(chalk.blue('🧪 全テスト実行開始'));
    
    try {
      await this.initialize();
      
      // ナビゲーション
      const navSuccess = await this.navigateToDuelMode();
      if (!navSuccess) {
        throw new Error('Failed to navigate to DuelMode');
      }
      
      const deckSuccess = await this.selectDeck();
      if (!deckSuccess) {
        throw new Error('Failed to select deck');
      }
      
      // 各テストを実行
      await this.testCardPlacement();
      await this.testPhaseProgression();
      await this.testAIInteraction();
      await this.testCardPreview();
      await this.testTutorialSystem();
      
      // レポート生成
      const report = await this.generateReport();
      
      // 結果表示
      console.log(chalk.blue('\n' + '='.repeat(50)));
      console.log(chalk.blue('📊 TEST SUMMARY'));
      console.log(chalk.blue('='.repeat(50)));
      console.log(chalk.white(`Total Tests: ${report.summary.total}`));
      console.log(chalk.green(`Passed: ${report.summary.passed}`));
      console.log(chalk.red(`Failed: ${report.summary.failed}`));
      console.log(chalk.yellow(`Pass Rate: ${report.summary.passRate}`));
      
      if (report.summary.failed > 0) {
        console.log(chalk.red('\n❌ Some tests failed. Check the report for details.'));
      } else {
        console.log(chalk.green('\n🎉 All tests passed!'));
      }
      
    } catch (error) {
      console.log(chalk.red(`\n💥 Test execution failed: ${error.message}`));
    } finally {
      await this.cleanup();
    }
  }
}

// 実行
if (require.main === module) {
  const runner = new DuelTestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = DuelTestRunner;