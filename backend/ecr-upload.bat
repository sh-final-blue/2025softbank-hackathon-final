@echo off
REM ECR에 백엔드 이미지 업로드 스크립트 (Windows용)

echo === FaaS Backend ECR Upload ===
echo.

REM 1. AWS Account ID 확인
echo [1/6] AWS Account ID 확인 중...
for /f "delims=" %%i in ('aws sts get-caller-identity --query Account --output text 2^>nul') do set AWS_ACCOUNT_ID=%%i

if "%AWS_ACCOUNT_ID%"=="" (
    echo [ERROR] AWS CLI 설정이 필요합니다.
    echo aws configure를 먼저 실행하세요.
    exit /b 1
)

echo [OK] AWS Account ID: %AWS_ACCOUNT_ID%
echo.

REM 변수 설정
set AWS_REGION=ap-northeast-2
set REPO_NAME=faas-backend
set IMAGE_NAME=faas-backend
set ECR_URL=%AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com

REM 2. ECR 로그인
echo [2/6] ECR 로그인 중...
aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %ECR_URL%

if %ERRORLEVEL% neq 0 (
    echo [ERROR] ECR 로그인 실패
    exit /b 1
)

echo [OK] ECR 로그인 성공
echo.

REM 3. ECR 리포지토리 확인 및 생성
echo [3/6] ECR 리포지토리 확인 중...
aws ecr describe-repositories --repository-names %REPO_NAME% --region %AWS_REGION% >nul 2>&1

if %ERRORLEVEL% neq 0 (
    echo 리포지토리가 없습니다. 생성 중...
    aws ecr create-repository --repository-name %REPO_NAME% --region %AWS_REGION% --image-scanning-configuration scanOnPush=true
    echo [OK] 리포지토리 생성 완료
) else (
    echo [OK] 리포지토리가 이미 존재합니다
)
echo.

REM 4. Docker 이미지 빌드
echo [4/6] Docker 이미지 빌드 중...
cd /d %~dp0
docker build -t %IMAGE_NAME%:latest .

if %ERRORLEVEL% neq 0 (
    echo [ERROR] 이미지 빌드 실패
    exit /b 1
)

echo [OK] 이미지 빌드 성공
echo.

REM 5. 이미지 태그
echo [5/6] 이미지 태그 지정 중...
docker tag %IMAGE_NAME%:latest %ECR_URL%/%REPO_NAME%:latest
echo [OK] 태그 지정 완료
echo.

REM 6. ECR에 푸시
echo [6/6] ECR에 푸시 중...
docker push %ECR_URL%/%REPO_NAME%:latest

if %ERRORLEVEL% neq 0 (
    echo [ERROR] ECR 푸시 실패
    exit /b 1
)

echo.
echo ================================
echo [OK] ECR 업로드 완료!
echo ================================
echo.
echo 이미지 URL:
echo %ECR_URL%/%REPO_NAME%:latest
echo.
echo 인프라 엔지니어에게 위 URL을 전달하세요.

pause
