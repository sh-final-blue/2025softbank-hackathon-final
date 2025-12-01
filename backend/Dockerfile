# Python 3.12 베이스 이미지
FROM python:3.12-slim

# 작업 디렉토리
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Gemini CLI 설치 (공식 설치 스크립트 사용)
RUN curl -fsSL https://raw.githubusercontent.com/google-gemini/gemini-cli/main/scripts/install.sh | bash

# Python 의존성 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 8000

# Uvicorn 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
