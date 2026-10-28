@echo off
REM ====================================================================
REM Vendhan Sports Academy - Automated Setup & Launch Script (Windows)
REM Supporting 6 Core Sports Disciplines and Dual Fee Tracking:
REM 1. Roller Skating  2. Archery  3. Football  4. Yoga  5. Physical Fitness  6. Silambam
REM ====================================================================

echo.
echo ====================================================================
echo   [VENDHAN SPORTS ACADEMY] - Multi-Sport Management Platform
echo   6 Core Disciplines: Skating, Archery, Football, Yoga, Fitness, Silambam
echo ====================================================================
echo.

REM 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please download and install Node.js (v18 or higher) from https://nodejs.org/
    pause
    exit /b 1
)

REM 2. Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in PATH!
    pause
    exit /b 1
)

echo [1/4] Node.js and npm verified.
node -v
npm -v
echo.

REM 3. Ensure required directories exist
echo [2/4] Verifying directory structure...
if not exist "models" mkdir models
if not exist "public" mkdir public
if not exist "data" mkdir data
echo Directories [models, public, data] verified.
echo.

REM 4. Install Dependencies
echo [3/4] Installing application dependencies via npm...
call npm install express mongoose jsonwebtoken bcryptjs cors dotenv
call npm install --save-dev tsx typescript @types/node @types/express @types/jsonwebtoken @types/bcryptjs @types/cors
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies returned warnings during installation. Proceeding...
)
echo.

REM 5. Summary & Launch
echo ====================================================================
echo [4/4] Installation Complete!
echo.
echo Three Dedicated Login Portals & Pre-Seeded Default Credentials:
echo   - 1. Admin Portal:       Username: admin    Password: vendhan@123
echo   - 2. Regular Coach:      Username: coach    Password: vendhan@123
echo   - 3. Head Coach:         Username: vendhan  Password: vendhan@123
echo   - 4. Student Portal:     Allocated by Admin (Demo: student1 / vendhan@123)
echo.
echo Disciplines Staff Coaches:
echo   - Skating Coach:   Username: coach_skating
echo   - Archery Coach:   Username: coach_archery
echo   - Football Coach:  Username: coach_football
echo   - Yoga Coach:      Username: coach_yoga
echo   - Fitness Coach:   Username: coach_fitness
echo   - Silambam Coach:  Username: coach_silambam
echo.
echo Features:
echo   * Three Role-Based Login Portals with Strict Authorization (RBAC)
echo   * Head Coach Extended Powers (Coach Attendance Oversight + Student Training)
echo   * Interactive 6-Sport Coach Grid & One-Click Daily Attendance Marking
echo   * Dual Fee Tracking (Academy Tuition + Sports Kit / Uniform Fees)
echo   * Centralized MongoDB Architecture with Instant Synchronization
echo   * Public CMS for Schedules, Achievements, and Tournaments
echo.
echo Application will run on: http://localhost:3000
echo ====================================================================
pause

echo Starting Vendhan Sports Academy Server...
node server.js
