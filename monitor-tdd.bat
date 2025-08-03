@echo off
REM TDD Test Monitoring Script
REM テスト実行中の動作をリアルタイムでモニタリング

echo =========================================
echo Union Arena TDD Test Monitor
echo =========================================
echo.

:menu
echo Select monitoring mode:
echo 1. Real-time logs (All services)
echo 2. Frontend test logs only
echo 3. E2E test logs only
echo 4. Backend API logs only
echo 5. Test coverage dashboard
echo 6. Performance monitor
echo 7. Error tracking
echo 8. Service health dashboard
echo 9. Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto all_logs
if "%choice%"=="2" goto frontend_logs
if "%choice%"=="3" goto e2e_logs
if "%choice%"=="4" goto backend_logs
if "%choice%"=="5" goto coverage_dashboard
if "%choice%"=="6" goto performance_monitor
if "%choice%"=="7" goto error_tracking
if "%choice%"=="8" goto health_dashboard
if "%choice%"=="9" goto exit
goto menu

:all_logs
echo 📊 Monitoring all services in real-time...
echo Press Ctrl+C to return to menu
docker-compose logs -f --tail=50
goto menu

:frontend_logs
echo ⚛️ Monitoring frontend tests...
echo Press Ctrl+C to return to menu
docker-compose logs -f frontend-tests
goto menu

:e2e_logs
echo 🎯 Monitoring E2E tests...
echo Press Ctrl+C to return to menu
docker-compose logs -f tests
goto menu

:backend_logs
echo 🐍 Monitoring backend API...
echo Press Ctrl+C to return to menu
docker-compose logs -f backend
goto menu

:coverage_dashboard
echo 📈 Test Coverage Dashboard
echo =============================
echo.
echo Running frontend test coverage...
docker-compose exec -T frontend npm test -- --coverage --watchAll=false --verbose
echo.
echo Coverage report generated at: frontend/coverage/
pause
goto menu

:performance_monitor
echo ⚡ Performance Monitor
echo =====================
echo.
echo Frontend build size:
docker-compose exec -T frontend npm run build 2>nul || echo "Build not available"
echo.
echo Memory usage:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo.
echo Service response times:
echo Testing backend API...
curl -w "Response time: %%{time_total}s\n" -s http://localhost:8000/health -o nul 2>nul || echo "Backend unreachable"
echo Testing frontend...
curl -w "Response time: %%{time_total}s\n" -s http://localhost:3000 -o nul 2>nul || echo "Frontend unreachable"
pause
goto menu

:error_tracking
echo 🚨 Error Tracking
echo =================
echo.
echo Recent errors from all services:
docker-compose logs --tail=100 | findstr /i "error\|exception\|failed\|warning"
echo.
echo Frontend test failures:
docker-compose exec -T frontend npm test -- --watchAll=false 2>&1 | findstr /i "fail\|error"
pause
goto menu

:health_dashboard
echo 🏥 Service Health Dashboard
echo ============================
echo.

REM Backend health
echo Checking Backend API...
curl -s http://localhost:8000/health | findstr "healthy" >nul && (
    echo ✅ Backend: Healthy
) || (
    echo ❌ Backend: Unhealthy
)

REM Frontend health
echo Checking Frontend...
curl -s http://localhost:3000 >nul 2>&1 && (
    echo ✅ Frontend: Running
) || (
    echo ❌ Frontend: Not responding
)

REM LLM API health
echo Checking LLM API...
curl -s http://localhost:11434/api/tags >nul 2>&1 && (
    echo ✅ LLM API: Available
) || (
    echo ❌ LLM API: Unavailable
)

REM Container status
echo.
echo Container Status:
docker-compose ps

REM Resource usage
echo.
echo Resource Usage:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

pause
goto menu

:exit
echo 👋 Exiting monitor...
exit /b 0