# Union Arena TDD Development Makefile

.PHONY: help build up down logs test test-frontend test-backend test-e2e clean restart status

# デフォルトコマンド
help: ## このヘルプを表示
	@echo "Union Arena TDD Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Docker Compose 管理
build: ## 全サービスをビルド
	docker-compose build

up: ## 全サービスを起動（デタッチモード）
	docker-compose up -d

up-logs: ## 全サービスを起動（ログ表示）
	docker-compose up

down: ## 全サービスを停止
	docker-compose down

restart: ## 全サービスを再起動
	docker-compose restart

status: ## サービスの状態を確認
	docker-compose ps

logs: ## 全サービスのログを表示
	docker-compose logs -f

# 個別サービス管理
backend-logs: ## バックエンドのログを表示
	docker-compose logs -f backend

frontend-logs: ## フロントエンドのログを表示
	docker-compose logs -f frontend

test-logs: ## テストサービスのログを表示
	docker-compose logs -f tests

# テスト実行
test: ## 全テストを実行
	@echo "🧪 Running all tests..."
	docker-compose exec frontend npm test -- --coverage --watchAll=false
	docker-compose exec tests npm run test:docker

test-frontend: ## フロントエンド単体テストを実行
	@echo "⚛️ Running frontend unit tests..."
	docker-compose exec frontend npm test -- --coverage --watchAll=false

test-backend: ## バックエンド API テストを実行
	@echo "🐍 Running backend tests..."
	docker-compose exec backend python -m pytest tests/ -v

test-e2e: ## E2Eテストを実行
	@echo "🎯 Running E2E tests..."
	docker-compose exec tests npm run test:docker

test-watch: ## テストをwatch モードで実行
	@echo "👀 Running tests in watch mode..."
	docker-compose exec frontend npm test

# 開発用コマンド
dev-setup: ## 開発環境をセットアップ
	@echo "🚀 Setting up development environment..."
	docker-compose build
	docker-compose up -d backend frontend
	@echo "✅ Waiting for services to be ready..."
	sleep 10
	@echo "🎉 Development environment is ready!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:8000"
	@echo "📊 API Docs: http://localhost:8000/docs"

tdd-cycle: ## TDDサイクルを実行（テスト→実装→リファクタ）
	@echo "🔄 Starting TDD cycle..."
	@echo "1️⃣ Running tests (Red phase)..."
	-docker-compose exec frontend npm test -- --coverage --watchAll=false
	@echo "2️⃣ Ready for implementation (Green phase)..."
	@echo "3️⃣ Ready for refactoring (Refactor phase)..."

# デバッグ
debug-frontend: ## フロントエンドコンテナにアクセス
	docker-compose exec frontend sh

debug-backend: ## バックエンドコンテナにアクセス
	docker-compose exec backend bash

debug-tests: ## テストコンテナにアクセス
	docker-compose exec tests sh

# クリーンアップ
clean: ## コンテナとボリュームを削除
	docker-compose down -v
	docker system prune -f

clean-all: ## 全て削除（イメージも含む）
	docker-compose down -v --rmi all
	docker system prune -af

# ヘルスチェック
health: ## 全サービスのヘルスチェック
	@echo "🏥 Checking service health..."
	@echo "Backend API:"
	@curl -s http://localhost:8000/health | grep -o '"status":"[^"]*"' || echo "❌ Backend unreachable"
	@echo "\nFrontend:"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend unreachable"
	@echo "\nLLM API:"
	@curl -s http://localhost:11434/api/tags > /dev/null && echo "✅ LLM API OK" || echo "❌ LLM API unreachable"

# モニタリング
monitor: ## リアルタイムでログをモニタリング
	docker-compose logs -f --tail=100

monitor-tests: ## テスト実行をリアルタイムモニタリング
	@echo "🔍 Starting TDD test monitoring..."
	@echo "📊 Dashboard: file://$(PWD)/test-dashboard.html"
	docker-compose logs -f tests frontend-tests

monitor-performance: ## パフォーマンスモニタリング
	@echo "⚡ Performance monitoring..."
	watch -n 2 'docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"'

monitor-errors: ## エラーログのみをモニタリング
	@echo "🚨 Error monitoring..."
	docker-compose logs -f | grep -i "error\|exception\|failed\|warning"

monitor-tdd-cycle: ## TDDサイクル全体をモニタリング
	@echo "🔄 TDD Cycle monitoring started..."
	@echo "Red Phase: Running tests..."
	-docker-compose exec frontend npm test -- --watchAll=false --verbose
	@echo "Green Phase: Ready for implementation..."
	@echo "Refactor Phase: Ready for code improvement..."
	@echo "📊 Opening monitoring dashboard..."
	@if command -v start >/dev/null 2>&1; then \
		start test-dashboard.html; \
	elif command -v open >/dev/null 2>&1; then \
		open test-dashboard.html; \
	else \
		echo "Open test-dashboard.html in your browser"; \
	fi

# 依存関係管理
install-deps: ## 依存関係を再インストール
	docker-compose exec frontend npm install
	docker-compose exec tests npm install

update-deps: ## 依存関係を更新
	docker-compose exec frontend npm update
	docker-compose exec tests npm update

# TDD自動化
tdd-auto: ## TDD自動化サイクルを開始
	@echo "🤖 Starting TDD Automation..."
	cd scripts && npm install
	cd scripts && node tdd-cycle-automation.js

generate-prompt: ## テスト結果からClaude Code CLIプロンプトを生成
	@echo "📝 Generating Claude Code CLI prompt..."
	cd scripts && node prompt-generator.js ../test-results.txt

run-tdd-cycle: ## 完全なTDDサイクルを実行
	@echo "🔄 Running complete TDD cycle..."
	make test-frontend > test-results.txt 2>&1
	make generate-prompt
	@echo "📋 Check the generated prompt and implement improvements"

# プロンプトテンプレート
templates: ## 利用可能なプロンプトテンプレートを表示
	@echo "📋 Available prompt templates:"
	@ls -la prompts/templates/

# ポート情報
ports: ## 使用ポート一覧を表示
	@echo "📡 Service Ports:"
	@echo "Frontend:    http://localhost:3000"
	@echo "Backend API: http://localhost:8000"
	@echo "API Docs:    http://localhost:8000/docs"
	@echo "LLM API:     http://localhost:11434"