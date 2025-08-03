#!/usr/bin/env node

/**
 * Union Arena TDD Test Monitor
 * リアルタイムでテスト実行を監視し、結果を表示
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

class TDDMonitor {
  constructor() {
    this.isRunning = false;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      coverage: 0,
      duration: 0
    };
    this.services = {
      frontend: { status: 'unknown', port: 3000 },
      backend: { status: 'unknown', port: 8000 },
      tests: { status: 'unknown', port: null },
      llm: { status: 'unknown', port: 11434 }
    };
    this.logs = [];
    this.maxLogs = 1000;
  }

  // ログ追加
  addLog(level, message, service = 'monitor') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service,
      message
    };
    
    this.logs.push(logEntry);
    
    // 最大ログ数制限
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // コンソール出力
    const colors = {
      info: '\x1b[36m',    // シアン
      success: '\x1b[32m', // 緑
      warning: '\x1b[33m', // 黄
      error: '\x1b[31m',   // 赤
      reset: '\x1b[0m'
    };
    
    console.log(
      `${colors[level] || colors.info}[${timestamp}] ${service.toUpperCase()}: ${message}${colors.reset}`
    );
  }

  // サービス状態チェック
  async checkServiceHealth() {
    this.addLog('info', 'Checking service health...');
    
    for (const [serviceName, config] of Object.entries(this.services)) {
      if (!config.port) continue;
      
      try {
        const response = await this.httpCheck(`http://localhost:${config.port}`);
        this.services[serviceName].status = response ? 'healthy' : 'unhealthy';
        this.addLog(
          response ? 'success' : 'error', 
          `${serviceName} is ${response ? 'healthy' : 'unhealthy'}`,
          serviceName
        );
      } catch (error) {
        this.services[serviceName].status = 'error';
        this.addLog('error', `${serviceName} check failed: ${error.message}`, serviceName);
      }
    }
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

  // フロントエンドテスト実行監視
  monitorFrontendTests() {
    this.addLog('info', 'Starting frontend test monitoring...');
    
    const testProcess = spawn('docker-compose', [
      'exec', '-T', 'frontend', 
      'npm', 'test', '--', 
      '--watchAll=false', 
      '--verbose', 
      '--json'
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let testOutput = '';

    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      testOutput += output;
      
      // リアルタイムでテスト進行状況を解析
      this.parseTestOutput(output);
    });

    testProcess.stderr.on('data', (data) => {
      this.addLog('error', `Test error: ${data.toString()}`, 'frontend-test');
    });

    testProcess.on('close', (code) => {
      this.addLog('info', `Frontend tests completed with code ${code}`, 'frontend-test');
      
      // 最終結果を解析
      try {
        const results = JSON.parse(testOutput);
        this.updateTestResults(results);
      } catch (error) {
        this.addLog('warning', `Could not parse test results: ${error.message}`, 'frontend-test');
      }
    });

    return testProcess;
  }

  // テスト出力解析
  parseTestOutput(output) {
    // Jest出力からテスト結果を抽出
    const lines = output.split('\n');
    
    lines.forEach(line => {
      if (line.includes('PASS') || line.includes('✓')) {
        this.addLog('success', line.trim(), 'test');
      } else if (line.includes('FAIL') || line.includes('✗')) {
        this.addLog('error', line.trim(), 'test');
      } else if (line.includes('Test Suites:')) {
        this.addLog('info', line.trim(), 'test');
      } else if (line.includes('Tests:')) {
        this.addLog('info', line.trim(), 'test');
      }
    });
  }

  // テスト結果更新
  updateTestResults(results) {
    if (results.numPassedTests !== undefined) {
      this.testResults.passed = results.numPassedTests;
    }
    if (results.numFailedTests !== undefined) {
      this.testResults.failed = results.numFailedTests;
    }
    if (results.numTotalTests !== undefined) {
      this.testResults.total = results.numTotalTests;
    }
    
    this.addLog('info', 
      `Test Summary: ${this.testResults.passed} passed, ${this.testResults.failed} failed`, 
      'test-summary'
    );
  }

  // E2Eテスト監視
  monitorE2ETests() {
    this.addLog('info', 'Starting E2E test monitoring...');
    
    const e2eProcess = spawn('docker-compose', [
      'exec', '-T', 'tests', 
      'npm', 'run', 'test:docker'
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    e2eProcess.stdout.on('data', (data) => {
      this.addLog('info', data.toString().trim(), 'e2e-test');
    });

    e2eProcess.stderr.on('data', (data) => {
      this.addLog('error', data.toString().trim(), 'e2e-test');
    });

    e2eProcess.on('close', (code) => {
      this.addLog('info', `E2E tests completed with code ${code}`, 'e2e-test');
    });

    return e2eProcess;
  }

  // Docker Composeログ監視
  monitorDockerLogs() {
    this.addLog('info', 'Starting Docker logs monitoring...');
    
    const logsProcess = spawn('docker-compose', ['logs', '-f', '--tail=50'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    logsProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const match = line.match(/^(\w+)\s*\|\s*(.+)$/);
          if (match) {
            const [, service, message] = match;
            this.addLog('info', message, service);
          }
        }
      });
    });

    return logsProcess;
  }

  // パフォーマンス監視
  monitorPerformance() {
    this.addLog('info', 'Starting performance monitoring...');
    
    setInterval(() => {
      exec('docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemUsage}}"', 
        (error, stdout) => {
          if (!error) {
            const lines = stdout.trim().split('\n');
            lines.forEach(line => {
              const [container, cpu, memory] = line.split(',');
              if (container && cpu && memory) {
                this.addLog('info', 
                  `${container}: CPU ${cpu}, Memory ${memory}`, 
                  'performance'
                );
              }
            });
          }
        });
    }, 30000); // 30秒間隔
  }

  // TDDサイクル実行
  async runTDDCycle() {
    this.addLog('info', '🔄 Starting TDD cycle...');
    
    // Red Phase: テスト実行
    this.addLog('warning', '🔴 RED PHASE: Running tests...', 'tdd');
    const testProcess = this.monitorFrontendTests();
    
    await new Promise(resolve => {
      testProcess.on('close', resolve);
    });
    
    // Green Phase: 実装フェーズ
    this.addLog('success', '🟢 GREEN PHASE: Ready for implementation', 'tdd');
    this.addLog('info', 'Make minimal changes to pass tests', 'tdd');
    
    // Refactor Phase: リファクタリング
    this.addLog('info', '🔵 REFACTOR PHASE: Ready for code improvement', 'tdd');
    this.addLog('info', 'Improve code while keeping tests green', 'tdd');
  }

  // 監視開始
  async start() {
    if (this.isRunning) {
      this.addLog('warning', 'Monitor is already running');
      return;
    }

    this.isRunning = true;
    this.addLog('info', '🚀 TDD Monitor started');

    // 初期健全性チェック
    await this.checkServiceHealth();

    // 各種監視を開始
    this.monitorDockerLogs();
    this.monitorPerformance();

    // 定期的な健全性チェック
    setInterval(() => {
      this.checkServiceHealth();
    }, 60000); // 1分間隔

    this.addLog('success', '✅ All monitoring systems active');
  }

  // 監視停止
  stop() {
    this.isRunning = false;
    this.addLog('info', '🛑 TDD Monitor stopped');
  }

  // 結果エクスポート
  exportResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, '..', 'reports', `tdd-report-${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      services: this.services,
      logs: this.logs.slice(-100) // 最新100件のログ
    };

    // レポートディレクトリ作成
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.addLog('success', `Report exported to ${reportPath}`);
    
    return reportPath;
  }
}

// CLI実行
if (require.main === module) {
  const monitor = new TDDMonitor();
  
  // コマンドライン引数処理
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      monitor.start();
      break;
    case 'tdd':
      monitor.start().then(() => monitor.runTDDCycle());
      break;
    case 'health':
      monitor.checkServiceHealth();
      break;
    case 'export':
      monitor.exportResults();
      break;
    default:
      console.log(`
Union Arena TDD Monitor

Usage:
  node test-monitor.js <command>

Commands:
  start   - Start continuous monitoring
  tdd     - Run TDD cycle with monitoring
  health  - Check service health
  export  - Export current results

Examples:
  node test-monitor.js start
  node test-monitor.js tdd
      `);
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });
}

module.exports = TDDMonitor;