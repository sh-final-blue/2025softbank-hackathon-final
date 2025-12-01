# AWS Credentials 간단 가이드 (로컬 개발용)

## 당신의 상황

- ✅ AWS 계정 있음 (로그인 가능)
- ✅ DynamoDB & S3 생성 완료
- ❌ 로컬에서 Docker로 백엔드 테스트하려면 **AWS 키 필요**
- ❌ EC2는 접근 불가 (인프라 엔지니어 담당)

---

## 왜 필요한가?

**로컬 Docker 컨테이너**가 AWS DynamoDB/S3에 접근하려면 **권한 증명**이 필요합니다.

### 환경별 차이:

| 환경 | AWS 인증 방식 |
|------|-------------|
| **로컬 개발** (지금) | `.env` 파일에 키 입력 |
| **EC2/K3s** (배포 후) | IAM Role 자동 인증 |

---

## 로컬에서 AWS 키 얻는 방법

### 1. AWS Console 로그인

https://console.aws.amazon.com/

### 2. IAM으로 이동

검색창에 "IAM" 입력 → IAM 클릭

### 3. 액세스 키 생성

**방법 A: 본인 사용자 계정**
1. 왼쪽 메뉴: "사용자" 클릭
2. 본인 사용자 이름 클릭
3. "보안 자격 증명" 탭
4. "액세스 키 만들기" 버튼
5. 용도: "로컬 코드" 선택
6. **액세스 키 & 시크릿 키 복사** (이 화면에서만 보임!)

**방법 B: 이미 생성했다면**
1. AWS CLI 설정 파일 확인:
   ```bash
   cat ~/.aws/credentials
   ```
2. 출력 예시:
   ```ini
   [default]
   aws_access_key_id = AKIA...
   aws_secret_access_key = wJalrXUtn...
   ```

### 4. `.env` 파일에 입력

```bash
# backend 디렉토리로 이동
cd C:\Users\bluew\Desktop\codehome\2025softbank-hackathon-final\backend

# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (VSCode 등으로)
```

**.env 파일 내용**:
```env
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=AKIA여기에실제키입력
AWS_SECRET_ACCESS_KEY=wJalrXUtn여기에실제시크릿입력

DYNAMODB_TABLE_NAME=sfbank-blue-FaaSData
S3_BUCKET_NAME=sfbank-blue-functions-code-bucket

ENVIRONMENT=development
LOG_LEVEL=INFO
```

### 5. Docker 재시작

```bash
# 루트 디렉토리에서
cd C:\Users\bluew\Desktop\codehome\2025softbank-hackathon-final

# 재시작
docker-compose restart
```

---

## 테스트

### 1. 로그 확인
```bash
docker-compose logs backend
```

에러 없으면 성공!

### 2. API 테스트
```bash
# 워크스페이스 생성
curl -X POST http://localhost:8000/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "description": "Test workspace"}'
```

DynamoDB에 데이터가 저장되면 성공!

---

## ECR에 이미지 업로드 (인프라 엔지니어 전달용)

### AWS Account ID 확인

```bash
aws sts get-caller-identity --query Account --output text
```

출력 예시: `217350599014`

### ECR 업로드 스크립트

```bash
# 1. 변수 설정
AWS_ACCOUNT_ID=217350599014  # 실제 Account ID로 변경
AWS_REGION=ap-northeast-2

# 2. ECR 로그인
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 3. ECR 리포지토리 생성 (최초 1회)
aws ecr create-repository \
  --repository-name faas-backend \
  --region $AWS_REGION

# 4. 이미지 빌드
cd C:\Users\bluew\Desktop\codehome\2025softbank-hackathon-final
docker build -t faas-backend:latest ./backend

# 5. 태그
docker tag faas-backend:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/faas-backend:latest

# 6. 푸시
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/faas-backend:latest
```

### 완료 후

인프라 엔지니어에게 전달:
```
ECR 이미지 URL:
217350599014.dkr.ecr.ap-northeast-2.amazonaws.com/faas-backend:latest
```

---

## Gemini CLI용 Docker 이미지

Gemini CLI도 같은 이미지를 사용하면 됩니다.

```bash
# Gemini CLI에서 실행
docker pull 217350599014.dkr.ecr.ap-northeast-2.amazonaws.com/faas-backend:latest

# 또는 로컬 이미지 사용
docker run -p 8000:8000 faas-backend:latest
```

---

## 보안 주의사항

⚠️ **절대 Git에 커밋하지 마세요!**

`.gitignore`에 이미 포함되어 있음:
```
.env
.env.local
```

⚠️ **키 유출 시 즉시 삭제**:
1. AWS Console → IAM → 사용자 → 보안 자격 증명
2. 해당 액세스 키 "비활성화" 또는 "삭제"
3. 새 키 생성

---

## 요약

1. **로컬 개발**: `.env` 파일에 AWS 키 입력 → Docker 재시작
2. **ECR 업로드**: 위 스크립트 실행 → 인프라 엔지니어에게 이미지 URL 전달
3. **EC2/K3s 배포**: 인프라 엔지니어가 IAM Role 설정 → `.env` 불필요

완료!
