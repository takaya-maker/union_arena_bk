#!/usr/bin/env node

/**
 * Union Arena Auto TDD Controller
 * 完全自動化TDDループシステム - 8割品質達成まで継続実行
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class AutoTDDController {
  constructor() {
    this.targetScore = 80; // 目標スコア8割
    this.maxIterations = 20; // 最大反復回数
    this.currentIteration = 0;
    this.currentScore = 0;
    this.sessionId = Date.now();
    this.resultsDir = path.join(__dirname, '..', 'auto-tdd-results', this.sessionId.toString());
    this.logFile = path.join(this.resultsDir, 'auto-tdd.log');
    
    this.testCategories = {
      gameSystem: { weight: 30, score: 0 },
      integration: { weight: 25, score: 0 },
      layout: { weight: 20, score: 0 },
      performance: { weight: 15, score: 0 },
      accessibility: { weight: 10, score: 0 }
    };

    this.ensureDirectories();
  }

  // 必要ディレクトリ作成
  ensureDirectories() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  // ログ出力
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
    
    if (data) {
      const dataEntry = JSON.stringify(data, null, 2);
      console.log(dataEntry);
      fs.appendFileSync(this.logFile, dataEntry + '\n');
    }
  }

  // Docker Compose 操作
  async dockerOperation(operation) {
    return new Promise((resolve, reject) => {
      this.log('info', `Docker operation: ${operation}`);
      
      const process = spawn('docker-compose', operation.split(' '), {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          this.log('success', `Docker ${operation} completed`);
          resolve({ success: true, output });
        } else {
          this.log('error', `Docker ${operation} failed with code ${code}`, errorOutput);
          reject(new Error(`Docker operation failed: ${errorOutput}`));
        }
      });
    });
  }

  // サービス起動
  async startServices() {
    this.log('info', '🚀 Starting Docker services...');
    await this.dockerOperation('up -d');
    
    // サービス起動待機
    this.log('info', 'Waiting for services to be ready...');
    await this.waitForServices();
  }

  // サービス停止・クリーンアップ
  async stopServices() {
    this.log('info', '🛑 Stopping Docker services...');
    await this.dockerOperation('down -v');
  }

  // サービス準備完了待機
  async waitForServices() {
    const maxWait = 60000; // 60秒
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        // フロントエンドとバックエンドの健全性チェック
        const frontendCheck = await this.httpCheck('http://localhost:3000');
        const backendCheck = await this.httpCheck('http://localhost:8000/health');
        
        if (frontendCheck && backendCheck) {
          this.log('success', '✅ All services are ready');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error('Services failed to start within timeout');
  }

  // HTTP健全性チェック
  httpCheck(url) {
    return new Promise((resolve) => {
      const http = require('http');
      const request = http.get(url, (res) => {
        resolve(res.statusCode === 200);
      });
      
      request.on('error', () => resolve(false));
      request.setTimeout(5000, () => {
        request.destroy();
        resolve(false);
      });
    });
  }

  // テスト実行
  async runTests() {
    this.log('info', '🧪 Running comprehensive test suite...');
    
    const testResults = {};
    
    // 各カテゴリのテスト実行
    for (const [category, config] of Object.entries(this.testCategories)) {
      this.log('info', `Running ${category} tests...`);
      
      try {
        const result = await this.runTestCategory(category);
        testResults[category] = result;
        this.testCategories[category].score = result.score;
        
        this.log('info', `${category} test score: ${result.score}%`);
      } catch (error) {
        this.log('error', `${category} tests failed:`, error.message);
        testResults[category] = { score: 0, error: error.message };
        this.testCategories[category].score = 0;
      }
    }

    // 総合スコア計算
    this.currentScore = this.calculateOverallScore();
    this.log('info', `📊 Overall test score: ${this.currentScore}%`);
    
    // 結果保存
    const resultPath = path.join(this.resultsDir, `iteration-${this.currentIteration}-results.json`);
    fs.writeFileSync(resultPath, JSON.stringify({
      iteration: this.currentIteration,
      overallScore: this.currentScore,
      categoryResults: testResults,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    return {
      overallScore: this.currentScore,
      categoryResults: testResults,
      passed: this.currentScore >= this.targetScore
    };
  }

  // カテゴリ別テスト実行
  async runTestCategory(category) {
    const testCommands = {
      gameSystem: 'npm test BattleField.game-system.test.js -- --json',
      integration: 'npm test BattleField.integration.test.js -- --json',
      layout: 'npm test BattleField.layout.test.js -- --json',
      performance: 'npm test -- --testNamePattern="パフォーマンス|performance" --json',
      accessibility: 'npm test -- --testNamePattern="アクセシビリティ|accessibility" --json'
    };

    return new Promise((resolve, reject) => {
      const testProcess = spawn('docker-compose', [
        'exec', '-T', 'frontend'
      ].concat(testCommands[category].split(' ')), {
        shell: true,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      testProcess.on('close', (code) => {
        try {
          // Jest JSON出力を解析
          const lines = output.split('\n');
          const jsonLine = lines.find(line => line.trim().startsWith('{'));
          
          if (jsonLine) {
            const testResult = JSON.parse(jsonLine);
            const passedTests = testResult.numPassedTests || 0;
            const totalTests = testResult.numTotalTests || 1;
            const score = Math.round((passedTests / totalTests) * 100);
            
            resolve({
              score: score,
              passed: passedTests,
              total: totalTests,
              details: testResult
            });
          } else {
            // JSON出力がない場合のフォールバック
            const score = code === 0 ? 100 : 0;
            resolve({ score, passed: score === 100 ? 1 : 0, total: 1 });
          }
        } catch (error) {
          reject(new Error(`Failed to parse test results: ${error.message}`));
        }
      });
    });
  }

  // 総合スコア計算
  calculateOverallScore() {
    let weightedScore = 0;
    let totalWeight = 0;

    for (const [category, config] of Object.entries(this.testCategories)) {
      weightedScore += config.score * config.weight;
      totalWeight += config.weight;
    }

    return Math.round(weightedScore / totalWeight);
  }

  // プロンプト生成
  async generatePrompt() {
    this.log('info', '📝 Generating improvement prompt...');
    
    const PromptGenerator = require('./prompt-generator');
    const generator = new PromptGenerator();
    
    // テスト結果をテキストファイルに出力
    const testResultPath = path.join(this.resultsDir, `iteration-${this.currentIteration}-test-output.txt`);
    const testSummary = this.generateTestSummary();
    fs.writeFileSync(testResultPath, testSummary);
    
    try {
      const result = await generator.run(testResultPath);
      
      if (result) {
        const promptPath = path.join(this.resultsDir, `iteration-${this.currentIteration}-prompt.md`);
        fs.copyFileSync(result.savedPath, promptPath);
        
        this.log('success', '✅ Improvement prompt generated');
        return result;
      } else {
        this.log('error', '❌ Failed to generate prompt');
        return null;
      }
    } catch (error) {
      this.log('error', 'Prompt generation failed:', error.message);
      return null;
    }
  }

  // テストサマリー生成
  generateTestSummary() {
    let summary = `Union Arena Auto TDD Test Results - Iteration ${this.currentIteration}\n`;
    summary += `Overall Score: ${this.currentScore}% (Target: ${this.targetScore}%)\n\n`;
    
    for (const [category, config] of Object.entries(this.testCategories)) {
      summary += `${category}: ${config.score}% (Weight: ${config.weight}%)\n`;
    }
    
    summary += '\nFailed Tests:\n';
    
    // 失敗したテストの詳細を追加
    for (const [category, config] of Object.entries(this.testCategories)) {
      if (config.score < 100) {
        summary += `FAIL ${category} - Score: ${config.score}%\n`;
      }
    }
    
    return summary;
  }

  // Cursor統合プロンプト生成
  async generateCursorPrompt(promptResult) {
    if (!promptResult) {
      return null;
    }

    const cursorPrompt = `# Union Arena Auto TDD Improvement - Iteration ${this.currentIteration}

## 📊 Current Status
- Overall Score: ${this.currentScore}% / Target: ${this.targetScore}%
- Iteration: ${this.currentIteration}/${this.maxIterations}

## 🎯 Priority Issues
${this.generatePriorityIssuesList()}

## 💻 Implementation Instructions

${promptResult.prompt.prompt}

## 🧪 Verification Steps
1. Save all changes
2. Run: \`docker-compose down -v && docker-compose up -d\`
3. Wait for services to start
4. Auto TDD Controller will automatically re-run tests
5. Check if score improves toward ${this.targetScore}%

## 📝 Implementation Notes
- Focus on highest impact improvements first
- Ensure Union Arena game rules compliance
- Maintain existing functionality while fixing issues
- Add comprehensive error handling

---
Generated by Union Arena Auto TDD Controller
Session: ${this.sessionId}
Timestamp: ${new Date().toISOString()}`;

    const cursorPromptPath = path.join(this.resultsDir, `iteration-${this.currentIteration}-cursor-prompt.md`);
    fs.writeFileSync(cursorPromptPath, cursorPrompt);
    
    return cursorPromptPath;
  }

  // 優先課題リスト生成
  generatePriorityIssuesList() {
    const issues = [];
    
    for (const [category, config] of Object.entries(this.testCategories)) {
      if (config.score < 80) {
        const impact = config.weight;
        const urgency = 100 - config.score;
        const priority = impact * urgency;
        
        issues.push({
          category,
          score: config.score,
          weight: config.weight,
          priority
        });
      }
    }
    
    issues.sort((a, b) => b.priority - a.priority);
    
    return issues.map(issue => 
      `- **${issue.category}**: ${issue.score}% (Weight: ${issue.weight}%, Priority: ${Math.round(issue.priority)})`
    ).join('\n');
  }

  // ユーザー入力待機
  async waitForUserInput(promptPath) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 CURSOR TERMINAL PROMPT READY');
    console.log('='.repeat(80));
    console.log(`📁 Prompt file: ${promptPath}`);
    console.log('📋 Please copy the prompt content to Cursor terminal');
    console.log('⚡ Implement the suggested improvements');
    console.log('💾 Save all changes when complete');
    console.log('='.repeat(80));
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\n✅ Implementation completed? Press Enter to continue with Docker restart... ', () => {
        rl.close();
        resolve();
      });
    });
  }

  // テストケース改善システム
  async improveTestCases() {
    this.log('info', '🔧 Analyzing test case improvements...');
    
    const testImprovements = await this.analyzeTestGaps();
    
    if (testImprovements.length > 0) {
      this.log('info', `Found ${testImprovements.length} test improvement opportunities`);
      
      const testPrompt = this.generateTestImprovementPrompt(testImprovements);
      const testPromptPath = path.join(this.resultsDir, `iteration-${this.currentIteration}-test-improvements.md`);
      fs.writeFileSync(testPromptPath, testPrompt);
      
      console.log('\n' + '='.repeat(80));
      console.log('🧪 TEST CASE IMPROVEMENT PROMPT');
      console.log('='.repeat(80));
      console.log(`📁 Test improvement file: ${testPromptPath}`);
      console.log('📋 Consider implementing these test improvements');
      console.log('='.repeat(80));
      
      return testPromptPath;
    }
    
    return null;
  }

  // テストギャップ分析
  async analyzeTestGaps() {
    const improvements = [];
    
    // 低スコアカテゴリの分析
    for (const [category, config] of Object.entries(this.testCategories)) {
      if (config.score < 70) {
        improvements.push({
          category,
          type: 'coverage',
          issue: `Low test coverage in ${category}`,
          suggestion: `Add more comprehensive test cases for ${category}`
        });
      }
    }
    
    // Union Arena特有のテストケース分析
    if (this.testCategories.gameSystem.score < 90) {
      improvements.push({
        category: 'gameSystem',
        type: 'union-arena-rules',
        issue: 'Union Arena game rule compliance testing insufficient',
        suggestion: 'Add detailed phase management, energy system, and card effect tests'
      });
    }
    
    return improvements;
  }

  // テスト改善プロンプト生成
  generateTestImprovementPrompt(improvements) {
    let prompt = `# Union Arena Test Case Improvement - Iteration ${this.currentIteration}

## 🎯 Test Quality Enhancement

Current overall score: ${this.currentScore}%
Target score: ${this.targetScore}%

## 🧪 Identified Test Gaps

`;

    improvements.forEach((improvement, index) => {
      prompt += `### ${index + 1}. ${improvement.category} - ${improvement.type}
**Issue**: ${improvement.issue}
**Suggestion**: ${improvement.suggestion}

`;
    });

    prompt += `## 🎮 Union Arena Specific Test Enhancements

### Game System Tests
- Add more edge cases for phase transitions
- Test invalid action prevention
- Verify energy cost calculations
- Test card effect interactions

### Integration Tests  
- Add complete game flow scenarios
- Test AI decision making quality
- Verify rule compliance in complex situations
- Test error recovery mechanisms

### Performance Tests
- Add stress tests with large card collections
- Test memory usage during extended gameplay
- Verify UI responsiveness under load

## 📝 Implementation Priority
1. Fix failing tests first
2. Add missing coverage for core game mechanics
3. Enhance Union Arena rule compliance tests
4. Add edge case and error handling tests

---
Generated by Union Arena Auto TDD Controller`;

    return prompt;
  }

  // メインTDDループ実行
  async runTDDLoop() {
    this.log('info', `🚀 Starting Auto TDD Loop - Target: ${this.targetScore}%`);
    
    try {
      while (this.currentIteration < this.maxIterations && this.currentScore < this.targetScore) {
        this.currentIteration++;
        this.log('info', `\n🔄 === TDD Iteration ${this.currentIteration}/${this.maxIterations} ===`);
        
        // 1. Docker サービス起動
        await this.startServices();
        
        // 2. テスト実行
        const testResults = await this.runTests();
        
        if (testResults.passed) {
          this.log('success', `🎉 Target score achieved! Score: ${this.currentScore}%`);
          break;
        }
        
        // 3. プロンプト生成
        const promptResult = await this.generatePrompt();
        
        if (promptResult) {
          // 4. Cursor統合プロンプト生成
          const cursorPromptPath = await this.generateCursorPrompt(promptResult);
          
          // 5. テストケース改善提案
          const testImprovementPath = await this.improveTestCases();
          
          // 6. ユーザー実装待機
          await this.waitForUserInput(cursorPromptPath);
          
          // 7. Docker サービス再起動
          await this.stopServices();
          this.log('info', '⏳ Waiting 5 seconds before restart...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          this.log('error', '❌ Failed to generate improvement prompt');
          break;
        }
      }
      
      // 最終結果
      await this.generateFinalReport();
      
    } catch (error) {
      this.log('error', 'TDD Loop failed:', error.message);
      throw error;
    }
  }

  // 最終レポート生成
  async generateFinalReport() {
    const finalScore = this.currentScore;
    const success = finalScore >= this.targetScore;
    
    const report = `# Union Arena Auto TDD Final Report

## 📊 Results Summary
- **Final Score**: ${finalScore}% / ${this.targetScore}%
- **Status**: ${success ? '✅ SUCCESS' : '❌ INCOMPLETE'}
- **Iterations**: ${this.currentIteration}/${this.maxIterations}
- **Session Duration**: ${Date.now() - this.sessionId}ms

## 📈 Category Breakdown
${Object.entries(this.testCategories).map(([category, config]) => 
  `- **${category}**: ${config.score}% (Weight: ${config.weight}%)`
).join('\n')}

## 🎯 Achievement Summary
${success ? 
  '🎉 Congratulations! Union Arena TDD automation successfully achieved the target quality score.' :
  '⚠️ Target score not reached. Consider manual review or additional iterations.'
}

## 📁 Generated Files
- Session Directory: ${this.resultsDir}
- Iteration Results: ${this.currentIteration} files
- Final Log: ${this.logFile}

---
Generated: ${new Date().toISOString()}
Session ID: ${this.sessionId}`;

    const reportPath = path.join(this.resultsDir, 'final-report.md');
    fs.writeFileSync(reportPath, report);
    
    this.log('info', `📊 Final report generated: ${reportPath}`);
    this.log(success ? 'success' : 'warning', 
      `🏁 Auto TDD Loop completed with score: ${finalScore}%`);
    
    return {
      success,
      finalScore,
      iterations: this.currentIteration,
      reportPath
    };
  }
}

// CLI実行
if (require.main === module) {
  const controller = new AutoTDDController();
  
  console.log(`
🤖 Union Arena Auto TDD Controller
====================================

This system will:
1. 🚀 Start Docker services
2. 🧪 Run comprehensive tests  
3. 📝 Generate improvement prompts
4. ⏳ Wait for Cursor implementation
5. 🔄 Restart services and repeat

Target: ${controller.targetScore}% test score
Max iterations: ${controller.maxIterations}

Press Ctrl+C to stop at any time.
`);

  controller.runTDDLoop()
    .then((result) => {
      console.log('\n✅ Auto TDD Controller completed successfully!');
      console.log(`📊 Final Score: ${result.finalScore}%`);
      console.log(`📁 Report: ${result.reportPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Auto TDD Controller failed:', error.message);
      process.exit(1);
    });
}

module.exports = AutoTDDController;