# S3 버킷 생성 가이드

## 📋 버킷 정보

- **버킷 이름**: `sfbank-blue-functions-code-bucket`
- **용도**: Python 함수 코드 파일 저장
- **리전**: `ap-northeast-2` (서울)

---

## 🚀 AWS Console에서 생성하기

### 1. S3 콘솔 이동

1. AWS Management Console 로그인
2. 검색창에 "S3" 입력 → S3 선택
3. "버킷 만들기" 버튼 클릭

### 2. 일반 구성

**버킷 이름**:
```
sfbank-blue-functions-code-bucket
```

**AWS 리전**:
```
아시아 태평양(서울) ap-northeast-2
```

### 3. 객체 소유권

- `ACL 비활성화됨 (권장)` 선택

### 4. 퍼블릭 액세스 차단 설정

⚠️ **보안 중요**: 모든 퍼블릭 액세스 차단

- ✅ `모든 퍼블릭 액세스 차단` 체크
  - 새 ACL을 통해 부여된 퍼블릭 액세스 차단
  - 임의의 ACL을 통해 부여된 퍼블릭 액세스 차단
  - 새 퍼블릭 버킷 또는 액세스 포인트 정책을 통해 부여된 퍼블릭 액세스 차단
  - 임의의 퍼블릭 버킷 또는 액세스 포인트 정책을 통해 부여된 퍼블릭 액세스 차단

### 5. 버킷 버전 관리

- **개발용**: `비활성화` (기본값)
- **프로덕션용**: `활성화` (코드 변경 이력 관리)

### 6. 기본 암호화

**암호화 유형**:
- `SSE-S3` 선택 (Amazon S3 관리형 키, 무료)

**버킷 키**:
- ✅ `버킷 키 활성화` (비용 절감)

### 7. 생성 완료

"버킷 만들기" 버튼 클릭 → 즉시 버킷 생성 완료

---

## 🖥️ AWS CLI로 생성하기 (선택)

```bash
# 1. 버킷 생성
aws s3 mb s3://sfbank-blue-functions-code-bucket \
  --region ap-northeast-2

# 2. 퍼블릭 액세스 차단 설정
aws s3api put-public-access-block \
  --bucket sfbank-blue-functions-code-bucket \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --region ap-northeast-2

# 3. 암호화 설정
aws s3api put-bucket-encryption \
  --bucket sfbank-blue-functions-code-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }]
  }' \
  --region ap-northeast-2
```

---

## 📁 버킷 구조

### 디렉토리 구조:

```
s3://sfbank-blue-functions-code-bucket/
├── ws-abc123/                    # Workspace ID
│   ├── fn-xyz001.py             # Function ID
│   ├── fn-xyz002.py
│   └── fn-xyz003.py
├── ws-def456/
│   ├── fn-uvw001.py
│   └── fn-uvw002.py
└── ...
```

### 파일 경로 형식:

```
s3://sfbank-blue-functions-code-bucket/{workspace_id}/{function_id}.py
```

### 예시:

```
s3://sfbank-blue-functions-code-bucket/ws-abc123/fn-xyz789.py
```

---

## 📝 코드 저장 방식

### 1. 프론트엔드에서 전송:

```javascript
// Base64 인코딩
const pythonCode = `
def handler(event, context):
    return {'statusCode': 200, 'body': 'Hello'}
`;
const encoded = btoa(pythonCode);

// API 요청
fetch('/api/workspaces/ws-123/functions', {
  method: 'POST',
  body: JSON.stringify({
    name: 'my-function',
    code: encoded  // Base64 인코딩된 코드
  })
});
```

### 2. 백엔드에서 저장:

```python
# Base64 디코딩
decoded_code = base64.b64decode(request_data['code']).decode('utf-8')

# S3에 Python 파일로 저장
s3_client.put_object(
    Bucket='sfbank-blue-functions-code-bucket',
    Key=f'{workspace_id}/{function_id}.py',
    Body=decoded_code,
    ContentType='text/plain'
)
```

### 3. 백엔드에서 조회:

```python
# S3에서 읽기
response = s3_client.get_object(
    Bucket='sfbank-blue-functions-code-bucket',
    Key=f'{workspace_id}/{function_id}.py'
)
code = response['Body'].read().decode('utf-8')

# Base64 인코딩하여 반환
encoded_code = base64.b64encode(code.encode('utf-8')).decode('utf-8')
```

---

## ✅ 버킷 생성 확인

### AWS Console:

1. S3 → 버킷
2. `sfbank-blue-functions-code-bucket` 버킷 확인

### AWS CLI:

```bash
# 버킷 존재 확인
aws s3 ls | grep sfbank-blue-functions-code-bucket

# 버킷 설정 확인
aws s3api get-bucket-location \
  --bucket sfbank-blue-functions-code-bucket
```

출력:
```json
{
  "LocationConstraint": "ap-northeast-2"
}
```

---

## 🔐 IAM 권한 설정

백엔드가 S3에 접근하려면 다음 권한이 필요합니다:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::sfbank-blue-functions-code-bucket",
        "arn:aws:s3:::sfbank-blue-functions-code-bucket/*"
      ]
    }
  ]
}
```

---

## 🧪 테스트 파일 업로드

### AWS Console에서:

1. S3 → `sfbank-blue-functions-code-bucket` 클릭
2. "업로드" 버튼 클릭
3. 테스트 파일 선택 후 업로드

### AWS CLI로:

```bash
# 테스트 파일 생성
echo 'def handler(event, context):
    return {"statusCode": 200, "body": "Hello from S3"}' > test-function.py

# 업로드
aws s3 cp test-function.py \
  s3://sfbank-blue-functions-code-bucket/test-ws/test-fn.py \
  --region ap-northeast-2

# 다운로드 테스트
aws s3 cp \
  s3://sfbank-blue-functions-code-bucket/test-ws/test-fn.py \
  downloaded.py \
  --region ap-northeast-2

# 내용 확인
cat downloaded.py

# 삭제
aws s3 rm \
  s3://sfbank-blue-functions-code-bucket/test-ws/test-fn.py
```

---

## 💰 비용 예상

### S3 Standard 스토리지:
- **저장**: $0.025 per GB/월
- **PUT 요청**: $0.005 per 1,000 requests
- **GET 요청**: $0.0004 per 1,000 requests
- **예상**: 함수 100개 (각 10KB) → 월 $0.01 미만

### 프리 티어 (12개월):
- 5 GB 스토리지
- 20,000 GET 요청
- 2,000 PUT 요청

---

## 🔄 수명 주기 정책 (선택)

오래된 함수 코드를 자동 삭제하려면:

### AWS Console:
1. 버킷 → "관리" 탭 → "수명 주기 규칙 만들기"
2. 규칙 이름: `delete-old-versions`
3. 필터: 모든 객체
4. 작업: "현재 버전 만료" → 90일 후

### AWS CLI:
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket sfbank-blue-functions-code-bucket \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "delete-old-versions",
      "Status": "Enabled",
      "Expiration": {
        "Days": 90
      }
    }]
  }'
```

---

## ⚠️ 주의사항

1. **버킷 이름**: 반드시 `sfbank-blue-functions-code-bucket` 사용
2. **리전**: `ap-northeast-2` (서울) 사용
3. **퍼블릭 액세스**: 절대 허용하지 않음 (보안)
4. **삭제 주의**: 버킷 삭제 시 모든 코드 손실
5. **암호화**: 기본 암호화 활성화 필수

---

## 🛡️ 보안 Best Practices

1. **버킷 정책**: 최소 권한 원칙 적용
2. **액세스 로깅**: 감사를 위해 활성화 권장
3. **버전 관리**: 프로덕션에서 활성화
4. **MFA 삭제**: 중요 데이터의 경우 활성화
5. **암호화**: 항상 활성화 상태 유지

---

완료! 버킷 생성 후 백엔드 서버를 재시작하세요:
```bash
docker-compose restart
```
