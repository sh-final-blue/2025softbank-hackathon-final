# DynamoDB 테이블 생성 가이드

## 📋 테이블 정보

- **테이블 이름**: `sfbank-blue-FaaSData`
- **용도**: Workspace, Function, Logs 데이터 저장
- **설계**: 단일 테이블 설계 (Single Table Design)

---

## 🚀 AWS Console에서 생성하기

### 1. DynamoDB 콘솔 이동

1. AWS Management Console 로그인
2. 검색창에 "DynamoDB" 입력 → DynamoDB 선택
3. 왼쪽 메뉴 "테이블" 클릭
4. "테이블 생성" 버튼 클릭

### 2. 기본 설정

**테이블 이름**:
```
sfbank-blue-FaaSData
```

**파티션 키 (Partition Key)**:
```
PK (문자열/String)
```

**정렬 키 (Sort Key)**:
```
SK (문자열/String)
```

### 3. 테이블 설정

**테이블 클래스**:
- `DynamoDB Standard` 선택 (기본값)

**용량 모드**:
- **개발/테스트용**: `온디맨드 (On-demand)` 추천
- **프로덕션용**: `프로비저닝됨 (Provisioned)` (읽기 5 RCU, 쓰기 5 WCU)

**암호화**:
- `AWS 소유 키` 선택 (기본값, 무료)

### 4. 생성 완료

"테이블 생성" 버튼 클릭 → 약 10초 후 테이블 생성 완료

---

## 🖥️ AWS CLI로 생성하기 (선택)

### 온디맨드 모드:

```bash
aws dynamodb create-table \
  --table-name sfbank-blue-FaaSData \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-2
```

### 프로비저닝 모드:

```bash
aws dynamodb create-table \
  --table-name sfbank-blue-FaaSData \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PROVISIONED \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region ap-northeast-2
```

---

## 📊 데이터 구조 예시

### 1. Workspace 레코드

```json
{
  "PK": "WS#ws-abc123",
  "SK": "METADATA",
  "id": "ws-abc123",
  "name": "Production",
  "description": "Production environment",
  "createdAt": "2025-12-01T12:00:00Z",
  "functionCount": 5,
  "invocations24h": 1000,
  "errorRate": 0.2
}
```

### 2. Function 레코드

```json
{
  "PK": "WS#ws-abc123",
  "SK": "FN#fn-xyz789",
  "id": "fn-xyz789",
  "workspaceId": "ws-abc123",
  "name": "user-authentication",
  "runtime": "Python 3.12",
  "memory": 256,
  "timeout": 30,
  "code": "ZGVmIGhhbmRsZXI...",
  "status": "active",
  "lastModified": "2025-12-01T12:00:00Z"
}
```

### 3. Log 레코드

```json
{
  "PK": "FN#fn-xyz789",
  "SK": "LOG#2025-12-01T12:00:00Z#log-123",
  "id": "log-123",
  "functionId": "fn-xyz789",
  "timestamp": "2025-12-01T12:00:00Z",
  "status": "success",
  "duration": 145,
  "statusCode": 200
}
```

---

## 🔍 쿼리 패턴

### 워크스페이스 조회
```python
# PK = "WS#ws-abc123", SK = "METADATA"
```

### 워크스페이스의 모든 함수 조회
```python
# PK = "WS#ws-abc123", SK begins_with "FN#"
```

### 함수의 모든 로그 조회
```python
# PK = "FN#fn-xyz789", SK begins_with "LOG#"
```

---

## ✅ 테이블 생성 확인

### AWS Console:
1. DynamoDB → 테이블
2. `sfbank-blue-FaaSData` 테이블이 "활성" 상태인지 확인

### AWS CLI:
```bash
aws dynamodb describe-table \
  --table-name sfbank-blue-FaaSData \
  --region ap-northeast-2 \
  --query "Table.[TableName,TableStatus,KeySchema]"
```

출력 예시:
```json
[
  "sfbank-blue-FaaSData",
  "ACTIVE",
  [
    { "AttributeName": "PK", "KeyType": "HASH" },
    { "AttributeName": "SK", "KeyType": "RANGE" }
  ]
]
```

---

## 💰 비용 예상

### 온디맨드 모드 (개발/테스트 추천):
- **읽기**: $0.25 per million read request units
- **쓰기**: $1.25 per million write request units
- **저장**: $0.25 per GB-month
- **예상**: 개발 단계에서 월 $1 미만

### 프로비저닝 모드:
- **5 RCU + 5 WCU**: 월 약 $2.50
- 트래픽이 예측 가능한 프로덕션에 적합

---

## 🔐 IAM 권한 설정

백엔드가 DynamoDB에 접근하려면 다음 권한이 필요합니다:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:ap-northeast-2:*:table/sfbank-blue-FaaSData"
    }
  ]
}
```

---

## 🧪 테스트 데이터 삽입

### AWS CLI로 테스트:

```bash
# Workspace 생성 테스트
aws dynamodb put-item \
  --table-name sfbank-blue-FaaSData \
  --item '{
    "PK": {"S": "WS#test-001"},
    "SK": {"S": "METADATA"},
    "id": {"S": "test-001"},
    "name": {"S": "Test Workspace"},
    "createdAt": {"S": "2025-12-01T00:00:00Z"},
    "functionCount": {"N": "0"}
  }' \
  --region ap-northeast-2

# 조회 확인
aws dynamodb get-item \
  --table-name sfbank-blue-FaaSData \
  --key '{
    "PK": {"S": "WS#test-001"},
    "SK": {"S": "METADATA"}
  }' \
  --region ap-northeast-2
```

---

## ⚠️ 주의사항

1. **테이블 이름**: 반드시 `sfbank-blue-FaaSData` 사용
2. **리전**: `ap-northeast-2` (서울) 사용
3. **키 타입**: PK와 SK 모두 **문자열(String)** 타입
4. **삭제 주의**: 테이블 삭제 시 모든 데이터 손실
5. **백업**: 프로덕션 환경에서는 PITR(Point-in-Time Recovery) 활성화 권장

---

## 🔄 기존 데이터 마이그레이션

만약 이전에 `FaaSData` 테이블을 사용했다면:

```bash
# 1. 기존 데이터 백업
aws dynamodb scan --table-name FaaSData > backup.json

# 2. 새 테이블 생성 (위 가이드 참조)

# 3. 데이터 마이그레이션 (필요 시)
```

---

완료! 테이블 생성 후 백엔드 서버를 재시작하세요:
```bash
docker-compose restart
```
