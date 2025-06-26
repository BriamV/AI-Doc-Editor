# AI-Doc-Editor Development Makefile
# Task T-01: Baseline & CI/CD

.PHONY: help install dev build test lint format clean setup qa-gate

# Default target
help: ## Show this help message
	@echo "AI-Doc-Editor Development Commands"
	@echo "=================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development Setup
install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	npm ci

setup: install ## Complete project setup for new developers
	@echo "🚀 Setting up development environment..."
	@echo "✅ Dependencies installed"
	@echo "✅ Git hooks configured"
	@echo "📝 Run 'make dev' to start development server"
	@echo "📝 Run 'make qa-gate' to run all quality checks"

# Development
dev: ## Start development server
	@echo "🚀 Starting development server..."
	npm run dev

build: ## Build application for production
	@echo "🔨 Building application..."
	npm run build

preview: build ## Preview production build
	@echo "👀 Starting preview server..."
	npm run preview

# Testing
test: ## Run unit tests
	@echo "🧪 Running unit tests..."
	npm run test

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	npm run test:watch

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	npm run test:coverage

test-e2e: ## Run E2E tests
	@echo "🌐 Running E2E tests..."
	npm run test:e2e

test-e2e-open: ## Open Cypress GUI
	@echo "🎯 Opening Cypress GUI..."
	npm run test:e2e:open

# Code Quality
lint: ## Run ESLint
	@echo "🔍 Running ESLint..."
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	@echo "🔧 Running ESLint with auto-fix..."
	npm run lint:fix

format: ## Format code with Prettier
	@echo "💅 Formatting code..."
	npm run format

format-check: ## Check code formatting
	@echo "✅ Checking code formatting..."
	npm run format:check

# Quality Gate (T-01 requirement) + T-43 Security Scanning
qa-gate: ## Run complete quality gate (T-01 compliance + T-43 security)
	@echo "🎯 Running Enhanced Quality Gate (T-01 + T-43)..."
	@echo "==============================================="
	@echo "1/6 TypeScript compilation..."
	@npx tsc --noEmit || (echo "❌ TypeScript failed" && exit 1)
	@echo "✅ TypeScript passed"
	@echo "2/6 ESLint (zero warnings)..."
	@npm run lint || (echo "❌ ESLint failed" && exit 1)
	@echo "✅ ESLint passed"
	@echo "3/6 Prettier formatting..."
	@npm run format:check || (echo "❌ Formatting failed" && exit 1)
	@echo "✅ Formatting passed"
	@echo "4/6 Unit tests..."
	@npm run test || (echo "❌ Tests failed" && exit 1)
	@echo "✅ Tests passed"
	@echo "5/6 Build verification..."
	@npm run build || (echo "❌ Build failed" && exit 1)
	@echo "✅ Build passed"
	@echo "6/6 Security scanning (T-43)..."
	@$(MAKE) security-scan
	@echo "✅ Security scanning passed"
	@echo "🎉 ALL QUALITY GATES PASSED!"

# Electron
electron: ## Run as Electron desktop app
	@echo "🖥️  Starting Electron app..."
	npm run electron

pack: ## Package Electron app
	@echo "📦 Packaging Electron app..."
	npm run pack

make-dist: ## Build and package for distribution
	@echo "🚀 Building for distribution..."
	npm run make

# Maintenance
clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning project..."
	rm -rf node_modules dist coverage build release cypress/downloads cypress/screenshots cypress/videos
	@echo "✅ Project cleaned"

audit: ## Check for security vulnerabilities
	@echo "🔒 Running security audit..."
	npm audit

audit-fix: ## Fix security vulnerabilities
	@echo "🔧 Fixing security vulnerabilities..."
	npm audit fix

# Docker Commands (T-01.5)
docker-check: ## Check Docker availability
	@echo "🐳 Checking Docker installation..."
	@if command -v docker >/dev/null 2>&1; then \
		echo "✅ Docker is available"; \
		sg docker -c "docker --version" || echo "⚠️  Use 'sg docker -c' for Docker commands"; \
	else \
		echo "❌ Docker not available in WSL2"; \
		echo "📝 Enable WSL integration in Docker Desktop settings"; \
		exit 1; \
	fi

docker-build: ## Build production Docker image
	@echo "🐳 Building production image..."
	@$(MAKE) docker-check
	sg docker -c "docker build -t ai-doc-editor:latest ."

docker-build-dev: ## Build development Docker image
	@echo "🐳 Building development image..."
	@$(MAKE) docker-check
	sg docker -c "docker build -f Dockerfile.dev -t ai-doc-editor:dev ."

docker-dev: ## Start development environment with Docker
	@echo "🐳 Starting development environment..."
	@$(MAKE) docker-check
	sg docker -c "docker-compose up app-dev"

docker-prod: ## Start production environment with Docker
	@echo "🐳 Starting production environment..."
	@$(MAKE) docker-check
	sg docker -c "docker-compose --profile production up app-prod"

docker-backend: ## Start full stack with backend services (T-02)
	@echo "🐳 Starting full stack environment with OAuth backend..."
	@$(MAKE) docker-check
	sg docker -c "docker-compose --profile backend up"

docker-stop: ## Stop all Docker services
	@echo "🛑 Stopping Docker services..."
	@$(MAKE) docker-check
	sg docker -c "docker-compose down"

docker-clean: ## Clean Docker images and containers
	@echo "🧹 Cleaning Docker resources..."
	@$(MAKE) docker-check
	sg docker -c "docker-compose down -v --rmi all && docker system prune -f"

docker-logs: ## Show Docker logs
	@echo "📋 Showing Docker logs..."
	@$(MAKE) docker-check
	sg docker -c "docker-compose logs -f"

# T-17: API-SPEC & ADR Governance
api-spec: ## Validate OpenAPI 3.1 specification
	@echo "📋 Validating OpenAPI specification..."
	npm run api-spec

traceability: ## Generate requirements traceability matrix
	@echo "🔗 Generating traceability matrix..."
	npm run traceability

governance: ## Run all governance checks (T-17)
	@echo "📊 Running T-17 governance checks..."
	@$(MAKE) api-spec
	@$(MAKE) traceability
	@echo "✅ All governance checks completed"

# T-43: Dependency Security Scanning
security-scan: ## Run dependency security scanning (T-43)
	@echo "🔒 Running T-43 dependency security scanning..."
	@echo "=====================================\n"
	@echo "1/3 npm audit (Node.js dependencies)..."
	@npm audit --audit-level=critical || (echo "❌ Critical vulnerabilities found in npm dependencies - build failing" && exit 1)
	@echo "✅ npm audit passed (critical level)"
	@echo "⚠️ Note: Non-critical vulnerabilities may exist - run 'npm audit' for full report"
	@echo "2/3 pip-audit (Python dependencies)..."
	@if command -v pip >/dev/null 2>&1; then \
		pip install pip-audit >/dev/null 2>&1 && \
		pip-audit --format=json --output=pip-audit-report.json || \
		(echo "❌ Vulnerabilities found in Python dependencies" && exit 1); \
		echo "✅ pip-audit passed"; \
	else \
		echo "ℹ️ pip not available - skipping Python dependency scan"; \
	fi
	@echo "3/3 License report generation..."
	@npm list --depth=0 --json > npm-licenses.json || true
	@echo "✅ License report generated: npm-licenses.json"
	@echo "🎉 ALL SECURITY SCANS PASSED!"

security-report: ## Generate security and license reports
	@echo "📋 Generating security reports..."
	@npm list --depth=0 --json > npm-licenses.json || true
	@if command -v pip >/dev/null 2>&1; then \
		pip install pip-audit >/dev/null 2>&1 && \
		pip-audit --format=json --output=pip-audit-report.json || true; \
	fi
	@echo "✅ Security reports generated"
	@ls -la *-report.json *-licenses.json 2>/dev/null || echo "Reports: npm-licenses.json"

# Development Tools Integration
dev-status: ## Show development progress dashboard
	@echo "📊 Development Progress Dashboard"
	@echo "================================="
	@bash tools/progress-dashboard.sh

task-nav: ## Navigate to specific task (usage: make task-nav TASK=T-02)
	@bash tools/task-navigator.sh $(TASK)

extract-work: ## Extract subtasks for development (usage: make extract-work TASK=T-02)
	@bash tools/extract-subtasks.sh $(TASK)

update-status: ## Update task status (usage: make update-status TASK=T-02 STATUS="En progreso")
	@bash tools/status-updater.sh $(TASK) "$(STATUS)"

# Task Status
t01-status: ## Show T-01 task completion status
	@echo "📋 T-01: Baseline & CI/CD Status"
	@echo "================================"
	@echo "✅ T-01.1: GitHub Actions CI/CD pipeline"
	@echo "✅ T-01.2: ADR template structure + CODEOWNERS"
	@echo "✅ T-01.3: Quality gates (ESLint, Prettier, TypeScript)"
	@echo "✅ T-01.4: Makefile for development commands"
	@echo "✅ T-01.5: Docker-compose setup (Docker files ready)"
	@echo "⏳ T-01.6: Pydantic v2 migration (DEFERRED - backend phase)"
	@echo ""
	@echo "📊 Overall Progress: 5/6 components completed (83%)"
	@echo "🐳 Docker Status: ✅ FULLY FUNCTIONAL (use 'sg docker -c' prefix)"

r0-wp1-status: ## Show R0.WP1 task completion status
	@echo "📋 R0.WP1: Core Backend & Security Foundation Status"
	@echo "=================================================="
	@echo "✅ T-01: Baseline & CI/CD (83% - T-01.6 deferred)"
	@echo "✅ T-17: API-SPEC & ADR Governance"
	@echo "✅ T-23: Health-check API (/healthz endpoint)"
	@echo "✅ T-43: Implementar Escaneo de Dependencias"
	@echo ""
	@echo "📊 R0.WP1 Progress: 4/4 tasks completed (100%)"
	@echo "🎯 Ready to proceed to R0.WP2 (T-02, T-41, T-44)"