#!/usr/bin/env node

/**
 * Union Arena TDD Cycle Automation
 * テスト実行 → 結果解析 → Claude Code CLIプロンプト生成 → 改善サイクル
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const PromptGenerator = require('./prompt-generator');

class TDDCycleAutomation {
  constructor() {
    this.cycleCount = 0;
    this.maxCycles = 10;
    this.promptGenerator = new PromptGenerator();
    this.resultsDir = path.join(__dirname, '..', 'tdd-results');
    this.promptsDir = path.join(__dirname, '..', 'prompts');
    this.currentCycleDir = null;
    
    this.ensureDirectories();
  }

  // 必要ディレクトリ作成
  ensureDirectories() {
    [this.resultsDir, this.promptsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // ログ出力
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m', 
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[level]}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  // TDDサイクル開始
  async startTDDCycle() {
    this.log('info', '🔄 Starting TDD Automation Cycle');
    this.log('info', `📊 Max cycles: ${this.maxCycles}`);
    
    while (this.cycleCount < this.maxCycles) {
      this.cycleCount++;
      this.log('info', `🚀 Starting TDD Cycle ${this.cycleCount}/${this.maxCycles}`);
      
      // サイクルディレクトリ作成
      this.currentCycleDir = path.join(this.resultsDir, `cycle-${this.cycleCount}`);
      if (!fs.existsSync(this.currentCycleDir)) {
        fs.mkdirSync(this.currentCycleDir, { recursive: true });
      }

      try {
        // Phase 1: テスト実行 (Red Phase)
        const testResults = await this.runTests();
        
        // Phase 2: 結果解析とプロンプト生成
        const analysisResult = await this.analyzeAndGeneratePrompt(testResults);
        
        // Phase 3: 改善提案の提示
        this.presentImprovementSuggestions(analysisResult);
        
        // Phase 4: 次サイクルの準備
        const shouldContinue = await this.prepareNextCycle(analysisResult);
        
        if (!shouldContinue) {
          this.log('success', '🎉 TDD Cycle completed successfully!');
          break;
        }
        
        // サイクル間の待機
        await this.waitForUserInput();
        
      } catch (error) {
        this.log('error', `❌ TDD Cycle ${this.cycleCount} failed:`, error.message);
        break;
      }
    }
    
    this.generateFinalReport();
  }

  // テスト実行フェーズ
  async runTests() {
    this.log('warning', '🔴 RED PHASE: Running tests...');
    
    const testOutputPath = path.join(this.currentCycleDir, 'test-output.txt');
    const coverageOutputPath = path.join(this.currentCycleDir, 'coverage-report.json');
    
    // フロントエンドテスト実行
    const frontendResults = await this.runFrontendTests(testOutputPath);
    
    // E2Eテスト実行
    const e2eResults = await this.runE2ETests();
    
    // カバレッジレポート生成
    const coverageResults = await this.generateCoverageReport(coverageOutputPath);
    
    const combinedResults = {
      frontend: frontendResults,
      e2e: e2eResults,
      coverage: coverageResults,
      timestamp: new Date().toISOString(),
      cycle: this.cycleCount
    };
    
    // 結果保存
    const resultsPath = path.join(this.currentCycleDir, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(combinedResults, null, 2));
    
    this.log('info', `📊 Test results saved to: ${resultsPath}`);
    return combinedResults;
  }

  // フロントエンドテスト実行
  runFrontendTests(outputPath) {
    return new Promise((resolve, reject) => {
      this.log('info', '⚛️ Running frontend tests...');
      
      const testProcess = spawn('docker-compose', [
        'exec', '-T', 'frontend',
        'npm', 'test', '--',
        '--coverage',
        '--watchAll=false',
        '--verbose',
        '--json'
      ], { shell: true });

      let testOutput = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        testOutput += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      testProcess.on('close', (code) => {
        // 出力をファイルに保存
        fs.writeFileSync(outputPath, testOutput + '\n\n' + errorOutput);
        
        const result = {
          exitCode: code,
          output: testOutput,
          errors: errorOutput,
          success: code === 0
        };
        
        if (code === 0) {
          this.log('success', '✅ Frontend tests completed');
        } else {
          this.log('warning', `⚠️ Frontend tests failed with code ${code}`);
        }
        
        resolve(result);
      });

      testProcess.on('error', (error) => {
        this.log('error', 'Frontend test execution failed:', error.message);
        reject(error);
      });
    });
  }

  // E2Eテスト実行
  runE2ETests() {
    return new Promise((resolve) => {
      this.log('info', '🎯 Running E2E tests...');
      
      const e2eProcess = spawn('docker-compose', [
        'exec', '-T', 'tests',
        'npm', 'run', 'test:docker'
      ], { shell: true });

      let e2eOutput = '';

      e2eProcess.stdout.on('data', (data) => {
        e2eOutput += data.toString();
      });

      e2eProcess.on('close', (code) => {
        const result = {
          exitCode: code,
          output: e2eOutput,
          success: code === 0
        };
        
        const e2eOutputPath = path.join(this.currentCycleDir, 'e2e-output.txt');
        fs.writeFileSync(e2eOutputPath, e2eOutput);
        
        if (code === 0) {
          this.log('success', '✅ E2E tests completed');
        } else {
          this.log('warning', `⚠️ E2E tests failed with code ${code}`);
        }
        
        resolve(result);
      });
    });
  }

  // カバレッジレポート生成
  generateCoverageReport(outputPath) {
    return new Promise((resolve) => {
      this.log('info', '📈 Generating coverage report...');
      
      const coverageProcess = spawn('docker-compose', [
        'exec', '-T', 'frontend',
        'npm', 'test', '--',
        '--coverage',
        '--watchAll=false',
        '--coverageReporters=json'
      ], { shell: true });

      coverageProcess.on('close', (code) => {
        try {
          // カバレッジファイルを取得
          const coveragePath = path.join(__dirname, '..', 'frontend', 'coverage', 'coverage-final.json');
          if (fs.existsSync(coveragePath)) {
            const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
            fs.writeFileSync(outputPath, JSON.stringify(coverageData, null, 2));
            this.log('success', '✅ Coverage report generated');
            resolve({ success: true, data: coverageData });
          } else {
            this.log('warning', '⚠️ Coverage file not found');
            resolve({ success: false, data: null });
          }
        } catch (error) {
          this.log('error', 'Coverage report generation failed:', error.message);
          resolve({ success: false, error: error.message });
        }
      });
    });
  }

  // 結果解析とプロンプト生成
  async analyzeAndGeneratePrompt(testResults) {
    this.log('info', '🔍 Analyzing test results and generating improvement prompt...');
    
    const testOutputPath = path.join(this.currentCycleDir, 'test-output.txt');
    
    try {
      const analysisResult = await this.promptGenerator.run(testOutputPath);
      
      if (analysisResult) {
        // サイクル固有のプロンプト保存
        const cyclePromptPath = path.join(this.currentCycleDir, 'improvement-prompt.md');
        fs.copyFileSync(analysisResult.savedPath, cyclePromptPath);
        
        this.log('success', '✅ Analysis and prompt generation completed');
        return analysisResult;
      } else {
        this.log('error', '❌ Failed to generate improvement prompt');
        return null;
      }
    } catch (error) {
      this.log('error', 'Analysis failed:', error.message);
      return null;
    }
  }

  // 改善提案の提示
  presentImprovementSuggestions(analysisResult) {
    if (!analysisResult) {
      this.log('warning', '⚠️ No improvement suggestions available');
      return;
    }

    this.log('success', '🟢 GREEN PHASE: Improvement suggestions ready');
    
    console.log('\n' + '='.repeat(100));
    console.log('📝 CLAUDE CODE CLI IMPROVEMENT PROMPT');
    console.log('='.repeat(100));
    console.log(`Priority: ${analysisResult.prompt.priority.toUpperCase()}`);
    console.log(`Issues Found: ${analysisResult.issues.length}`);
    console.log(`Test Coverage: ${analysisResult.testResults.coverage}%`);
    console.log('='.repeat(100));
    console.log();
    console.log(analysisResult.prompt.prompt);
    console.log();
    console.log('='.repeat(100));
    
    // Claude Code CLI向けコマンド生成
    const cliCommand = this.generateClaudeCodeCLICommand(analysisResult);
    console.log('\n📋 COPY THIS PROMPT TO CLAUDE CODE CLI:');
    console.log('-'.repeat(60));
    console.log(cliCommand);
    console.log('-'.repeat(60));
  }

  // Claude Code CLI向けコマンド生成
  generateClaudeCodeCLICommand(analysisResult) {
    const prompt = analysisResult.prompt.prompt;
    
    // 長いプロンプトの場合はファイル参照を推奨
    if (prompt.length > 2000) {
      return `# プロンプトが長いため、以下のファイルの内容をClaude Code CLIに入力してください：
# ${analysisResult.savedPath}

# または以下の短縮版を使用：
Union ArenaのTDD改善を実施してください。失敗テスト: ${analysisResult.testResults.failed}件、カバレッジ: ${analysisResult.testResults.coverage}%。主要改善点: ${analysisResult.issues.map(i => i.type).join(', ')}`;
    }
    
    return prompt;
  }

  // 次サイクル準備
  async prepareNextCycle(analysisResult) {
    this.log('info', '🔵 REFACTOR PHASE: Preparing next cycle...');
    
    if (!analysisResult || analysisResult.issues.length === 0) {
      this.log('success', '🎉 No issues found - TDD cycle complete!');
      return false;
    }
    
    if (analysisResult.testResults.failed === 0 && analysisResult.testResults.coverage > 90) {
      this.log('success', '🎉 Quality targets achieved - TDD cycle complete!');
      return false;
    }
    
    this.log('info', `📊 Cycle ${this.cycleCount} Summary:`);
    this.log('info', `  - Issues: ${analysisResult.issues.length}`);
    this.log('info', `  - Failed Tests: ${analysisResult.testResults.failed}`);
    this.log('info', `  - Coverage: ${analysisResult.testResults.coverage}%`);
    
    return true;
  }

  // ユーザー入力待機
  waitForUserInput() {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.log('\n💡 次のステップ:');
      console.log('1. 上記のプロンプトをClaude Code CLIに入力');
      console.log('2. 提案された改善を実装');
      console.log('3. 実装完了後、Enterキーを押して次のサイクルを開始');
      console.log();

      rl.question('改善実装が完了したらEnterキーを押してください... ', () => {
        rl.close();
        resolve();
      });
    });
  }

  // 最終レポート生成
  generateFinalReport() {
    this.log('info', '📊 Generating final TDD report...');
    
    const finalReportPath = path.join(this.resultsDir, 'final-tdd-report.md');
    
    let report = `# Union Arena TDD Cycle Final Report

**Generated:** ${new Date().toISOString()}
**Total Cycles:** ${this.cycleCount}
**Automation Duration:** Started at cycle automation

## 🎯 TDD Cycle Summary

`;

    // 各サイクルの結果を集計
    for (let i = 1; i <= this.cycleCount; i++) {
      const cycleDir = path.join(this.resultsDir, `cycle-${i}`);
      const resultsPath = path.join(cycleDir, 'test-results.json');
      
      if (fs.existsSync(resultsPath)) {
        try {
          const cycleResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          report += `### Cycle ${i}
- **Frontend Tests:** ${cycleResults.frontend.success ? '✅ PASS' : '❌ FAIL'}
- **E2E Tests:** ${cycleResults.e2e.success ? '✅ PASS' : '❌ FAIL'}
- **Coverage:** ${cycleResults.coverage.success ? cycleResults.coverage.data ? 'Available' : 'N/A' : 'Failed'}

`;
        } catch (error) {
          report += `### Cycle ${i}
- **Status:** ❌ Error reading results

`;
        }
      }
    }

    report += `
## 🚀 Next Steps

Based on the TDD cycles completed, consider:

1. **Continuous Integration Setup**
2. **Performance Monitoring**
3. **Production Deployment**
4. **User Acceptance Testing**

---

*Generated by Union Arena TDD Cycle Automation*
`;

    fs.writeFileSync(finalReportPath, report);
    this.log('success', `📁 Final report saved to: ${finalReportPath}`);
  }
}

// CLI実行
if (require.main === module) {
  const automation = new TDDCycleAutomation();
  
  console.log(`
🎯 Union Arena TDD Cycle Automation
=====================================

This tool will:
1. Run tests (Red Phase)
2. Analyze results and generate Claude Code CLI prompts
3. Wait for you to implement improvements (Green Phase)
4. Prepare for next cycle (Refactor Phase)
5. Repeat until quality targets are met

Press Ctrl+C to stop at any time.
`);

  automation.startTDDCycle()
    .then(() => {
      console.log('\n✅ TDD Automation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ TDD Automation failed:', error);
      process.exit(1);
    });
}

module.exports = TDDCycleAutomation;