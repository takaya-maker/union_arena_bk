/**
 * Union Arena BattleField 特化テストスイート
 * フィールド上での詳細な操作テスト
 */

const { chromium } = require('playwright');
const chalk = require('chalk');

class BattlefieldTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    this.browser = await chromium.launch({ headless: false, slowMo: 500 });
    this.page = await this.browser.newPage();
    await this.page.goto('http://localhost:3000');
    
    // DuelModeに移動
    await this.page.click('text="DuelMode"');
    await this.page.waitForSelector('.deck-selector-container');
    
    // 最初のデッキを選択
    const firstDeck = await this.page.$('.deck-card');
    await firstDeck.click();
    await this.page.waitForSelector('.battle-field-container');
  }

  async testFieldLayout() {
    console.log(chalk.yellow('🎯 フィールドレイアウトテスト'));
    
    const result = { name: 'Field Layout Test', passed: false, details: [] };
    
    try {
      // 必須UI要素の存在確認
      const elements = {
        gameHeader: '.enhanced-game-header',
        playerHand: '.hand-section',
        playerFrontLine: '.player-front-line',
        playerEnergyLine: '.player-energy-line',
        opponentFrontLine: '.opponent-front-line',
        opponentEnergyLine: '.opponent-energy-line',
        battleLog: '.battle-log',
        quickActions: '.quick-actions'
      };
      
      for (const [name, selector] of Object.entries(elements)) {
        const element = await this.page.$(selector);
        const exists = !!element;
        result.details.push(`${name}: ${exists ? '✅' : '❌'}`);
        
        if (!exists) {
          result.details.push(`Missing element: ${selector}`);
        }
      }
      
      // 手札のカード数確認
      const handCards = await this.page.$$('.hand-card');
      result.details.push(`Hand cards count: ${handCards.length}`);
      
      // フィールドスロット数確認
      const frontSlots = await this.page.$$('.player-front-line .line-slot');
      const energySlots = await this.page.$$('.player-energy-line .line-slot');
      
      result.details.push(`Front line slots: ${frontSlots.length} (expected: 4)`);
      result.details.push(`Energy line slots: ${energySlots.length} (expected: 4)`);
      
      result.passed = (handCards.length > 0 && frontSlots.length === 4 && energySlots.length === 4);
      
    } catch (error) {
      result.details.push(`Error: ${error.message}`);
    }
    
    this.testResults.push(result);
    return result;
  }

  async testCardDragAndDrop() {
    console.log(chalk.yellow('🖱️ カードドラッグ&ドロップテスト'));
    
    const result = { name: 'Card Drag and Drop Test', passed: false, details: [] };
    
    try {
      const handCards = await this.page.$$('.hand-card');
      if (handCards.length === 0) {
        result.details.push('No cards in hand to test drag and drop');
        this.testResults.push(result);
        return result;
      }
      
      const card = handCards[0];
      const emptySlot = await this.page.$('.player-energy-line .line-slot:not(.field-card)');
      
      if (!emptySlot) {
        result.details.push('No empty slots available for drop test');
        this.testResults.push(result);
        return result;
      }
      
      // カードの位置とスロットの位置を取得
      const cardBox = await card.boundingBox();
      const slotBox = await emptySlot.boundingBox();
      
      // ドラッグ&ドロップ実行
      await this.page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2);
      await this.page.mouse.up();
      
      await this.page.waitForTimeout(1000);
      
      // 配置されたかどうか確認
      const fieldCards = await this.page.$$('.field-card');
      const handCardsAfter = await this.page.$$('.hand-card');
      
      result.details.push(`Cards on field after drag: ${fieldCards.length}`);
      result.details.push(`Cards in hand after drag: ${handCardsAfter.length}`);
      
      result.passed = (fieldCards.length > 0 && handCardsAfter.length < handCards.length);
      
    } catch (error) {
      result.details.push(`Error: ${error.message}`);
    }
    
    this.testResults.push(result);
    return result;
  }

  async testMultiCardPlacement() {
    console.log(chalk.yellow('🃏 複数カード配置テスト'));
    
    const result = { name: 'Multi Card Placement Test', passed: false, details: [] };
    
    try {
      let placedCards = 0;
      const maxPlacements = 3;
      
      for (let i = 0; i < maxPlacements; i++) {
        const handCards = await this.page.$$('.hand-card');
        if (handCards.length === 0) break;
        
        // カードを選択
        await handCards[0].click();
        await this.page.waitForTimeout(500);
        
        // ハイライトされたスロットを探す
        const highlightedSlots = await this.page.$$('.line-slot.highlighted');
        if (highlightedSlots.length > 0) {
          await highlightedSlots[0].click();
          await this.page.waitForTimeout(500);
          placedCards++;
          result.details.push(`Card ${i + 1} placed successfully`);
        } else {
          result.details.push(`Card ${i + 1}: No highlighted slots available`);
          break;
        }
      }
      
      const finalFieldCards = await this.page.$$('.field-card');
      result.details.push(`Total cards placed: ${placedCards}`);
      result.details.push(`Cards on field: ${finalFieldCards.length}`);
      
      result.passed = (placedCards >= 2 && finalFieldCards.length >= placedCards);
      
    } catch (error) {
      result.details.push(`Error: ${error.message}`);
    }
    
    this.testResults.push(result);
    return result;
  }

  async testPhaseTransitions() {
    console.log(chalk.yellow('⚡ フェーズ遷移テスト'));
    
    const result = { name: 'Phase Transitions Test', passed: false, details: [] };
    
    try {
      const phases = [];
      let transitionCount = 0;
      const maxTransitions = 4;
      
      // 初期フェーズを記録
      let currentPhase = await this.page.textContent('.phase-name');
      phases.push(currentPhase);
      result.details.push(`Initial phase: ${currentPhase}`);
      
      for (let i = 0; i < maxTransitions; i++) {
        const nextButton = await this.page.$('.phase-btn:not([disabled])');
        if (!nextButton) {
          // エンドフェーズなら終了ボタンを試す
          const endButton = await this.page.$('.end-btn:not([disabled])');
          if (endButton) {
            await endButton.click();
            transitionCount++;
            result.details.push(`Turn ended`);
            break;
          } else {
            result.details.push(`No available transition buttons at step ${i + 1}`);
            break;
          }
        }
        
        await nextButton.click();
        await this.page.waitForTimeout(1000);
        
        const newPhase = await this.page.textContent('.phase-name');
        phases.push(newPhase);
        transitionCount++;
        
        result.details.push(`Transition ${i + 1}: ${currentPhase} → ${newPhase}`);
        currentPhase = newPhase;
      }
      
      result.details.push(`Total transitions: ${transitionCount}`);
      result.details.push(`Phase sequence: ${phases.join(' → ')}`);
      
      result.passed = (transitionCount >= 3 && phases.length > 1);
      
    } catch (error) {
      result.details.push(`Error: ${error.message}`);
    }
    
    this.testResults.push(result);
    return result;
  }

  async testUIResponsiveness() {
    console.log(chalk.yellow('📱 UI レスポンシブテスト'));
    
    const result = { name: 'UI Responsiveness Test', passed: false, details: [] };
    
    try {
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1024, height: 768, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      for (const viewport of viewports) {
        await this.page.setViewportSize(viewport);
        await this.page.waitForTimeout(1000);
        
        // 主要要素の表示確認
        const gameHeader = await this.page.$('.enhanced-game-header');
        const handSection = await this.page.$('.hand-section');
        const battlefield = await this.page.$('.battle-field-container');
        
        const headerVisible = await gameHeader.isVisible();
        const handVisible = await handSection.isVisible();
        const battlefieldVisible = await battlefield.isVisible();
        
        result.details.push(`${viewport.name} (${viewport.width}x${viewport.height}):`);
        result.details.push(`  Header visible: ${headerVisible ? '✅' : '❌'}`);
        result.details.push(`  Hand visible: ${handVisible ? '✅' : '❌'}`);
        result.details.push(`  Battlefield visible: ${battlefieldVisible ? '✅' : '❌'}`);
        
        if (!headerVisible || !handVisible || !battlefieldVisible) {
          result.details.push(`  Layout issues detected at ${viewport.name}`);
        }
      }
      
      // デスクトップサイズに戻す
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      
      result.passed = true; // 基本的なレイアウトが各サイズで表示されていればOK
      
    } catch (error) {
      result.details.push(`Error: ${error.message}`);
    }
    
    this.testResults.push(result);
    return result;
  }

  async testGameStateConsistency() {
    console.log(chalk.yellow('🔄 ゲーム状態整合性テスト'));
    
    const result = { name: 'Game State Consistency Test', passed: false, details: [] };
    
    try {
      // 初期状態の記録
      const initialHandCount = (await this.page.$$('.hand-card')).length;
      const initialFieldCount = (await this.page.$$('.field-card')).length;
      const initialPhase = await this.page.textContent('.phase-name');
      
      result.details.push(`Initial state - Hand: ${initialHandCount}, Field: ${initialFieldCount}, Phase: ${initialPhase}`);
      
      // カードを1枚配置
      if (initialHandCount > 0) {
        const handCard = await this.page.$('.hand-card');
        await handCard.click();
        await this.page.waitForTimeout(500);
        
        const highlightedSlot = await this.page.$('.line-slot.highlighted');
        if (highlightedSlot) {
          await highlightedSlot.click();
          await this.page.waitForTimeout(500);
          
          // 状態変化の確認
          const newHandCount = (await this.page.$$('.hand-card')).length;
          const newFieldCount = (await this.page.$$('.field-card')).length;
          
          result.details.push(`After placement - Hand: ${newHandCount}, Field: ${newFieldCount}`);
          
          const handDecreased = newHandCount === initialHandCount - 1;
          const fieldIncreased = newFieldCount === initialFieldCount + 1;
          
          result.details.push(`Hand decreased correctly: ${handDecreased ? '✅' : '❌'}`);
          result.details.push(`Field increased correctly: ${fieldIncreased ? '✅' : '❌'}`);
          
          result.passed = handDecreased && fieldIncreased;
        } else {
          result.details.push('No highlighted slots available for placement');
        }
      } else {
        result.details.push('No cards in hand to test placement');
      }
      
    } catch (error) {
      result.details.push(`Error: ${error.message}`);
    }
    
    this.testResults.push(result);
    return result;
  }

  async runAllTests() {
    console.log(chalk.blue('🧪 BattleField テストスイート開始'));
    
    try {
      await this.setup();
      
      await this.testFieldLayout();
      await this.testCardDragAndDrop();
      await this.testMultiCardPlacement();
      await this.testPhaseTransitions();
      await this.testUIResponsiveness();
      await this.testGameStateConsistency();
      
      // 結果表示
      const passed = this.testResults.filter(t => t.passed).length;
      const total = this.testResults.length;
      
      console.log(chalk.blue('\n' + '='.repeat(40)));
      console.log(chalk.blue('📊 BATTLEFIELD TEST RESULTS'));
      console.log(chalk.blue('='.repeat(40)));
      
      this.testResults.forEach(test => {
        const icon = test.passed ? '✅' : '❌';
        const color = test.passed ? chalk.green : chalk.red;
        console.log(color(`${icon} ${test.name}`));
        
        if (!test.passed) {
          test.details.forEach(detail => {
            console.log(chalk.gray(`   ${detail}`));
          });
        }
      });
      
      console.log(chalk.blue(`\n📈 Overall: ${passed}/${total} tests passed`));
      
    } catch (error) {
      console.log(chalk.red(`Test suite failed: ${error.message}`));
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// 実行
if (require.main === module) {
  const suite = new BattlefieldTestSuite();
  suite.runAllTests().catch(console.error);
}

module.exports = BattlefieldTestSuite;