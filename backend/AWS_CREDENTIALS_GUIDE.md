# AWS 자격 증명 획득 가이드

## 방법 1: IAM 사용자 액세스 키 생성 (추천)

### 단계:

1. **AWS Console 로그인**
   - https://console.aws.amazon.com/

2. **IAM 서비스로 이동**
   - 검색창에 "IAM" 입력 → IAM 선택

3. **사용자 메뉴 클릭**
   - 왼쪽 메뉴: "사용자" 클릭

4. **본인 사용자 클릭**
   - 현재 로그인한 사용자 이름 클릭

5. **"보안 자격 증명" 탭 클릭**

6. **"액세스 키 만들기" 클릭**
   - 용도 선택: "로컬 코드" 또는 "CLI"
   - 설명 태그: "FaaS Backend Local Development"

7. **액세스 키 다운로드**
   - ⚠️ **중요**: 이 화면에서만 시크릿 키 확인 가능!
   - CSV 다운로드 또는 복사

8. **`.env` 파일에 입력**
   ```env
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=wJalrXUtn...
   ```

---

## 방법 2: AWS CLI 자격 증명 사용 (더 간단)

### AWS CLI가 이미 설정되어 있다면:

Windows 경로:
```
C:\Users\bluew\.aws\credentials
```

이 파일을 열면:
```ini
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = wJalrXUtn...
```

이 값들을 `.env` 파일에 복사하세요.

---

## 방법 3: `.env` 파일 없이 실행 (AWS CLI 자격 증명 자동 사용)

**가장 간단한 방법**:

1. AWS CLI가 설정되어 있으면 `.env` 파일 생성 안 해도 됨
2. Docker Compose가 자동으로 `~/.aws/` 디렉토리를 마운트

### docker-compose.yml 수정:

```yaml
services:
  backend:
    volumes:
      - ~/.aws:/root/.aws:ro  # AWS credentials 자동 마운트
```

---

## 권한 확인

백엔드가 필요한 AWS 권한:

### DynamoDB:
- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`
- `dynamodb:Query`
- `dynamodb:Scan`

### S3:
- `s3:GetObject`
- `s3:PutObject`
- `s3:DeleteObject`

IAM 사용자가 이 권한들이 있는지 확인하세요.

---

## 보안 주의사항

⚠️ **절대 Git에 커밋하지 마세요!**

`.gitignore`에 이미 포함되어 있음:
```
.env
.env.local
```

⚠️ **액세스 키 유출 시**:
1. AWS Console → IAM → 사용자 → 보안 자격 증명
2. 해당 액세스 키 "비활성화" 또는 "삭제"
3. 새 액세스 키 생성
