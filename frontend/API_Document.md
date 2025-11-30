# API 명세 및 연동 가이드 (MVP)

본 문서는 프론트엔드와 백엔드 간의 API 규격을 정의합니다.
Spin(Wasm) 기반의 FaaS 아키텍처 특성상 **비동기 배포 프로세스**와 **Kubernetes 리소스 라이프사이클**을 반영하여 설계되었습니다.

> **Status**: Draft (2025-11-30)
> **Base URL**: `/api/v1` (개발 환경: `http://localhost:8000/api/v1` or Proxy)

## 1. 공통 사항

### 인증 및 헤더
별도의 복잡한 인증 절차 없이, 워크스페이스 컨텍스트를 헤더로 전달하여 구분합니다.
*   `Content-Type`: `application/json`
*   `X-Workspace-ID`: `{workspaceId}` (선택, 멀티테넌시 대비용)

### 에러 응답 포맷
```json
{
  "error": {
    "code": "BUILD_FAILED",
    "message": "Wasm compilation failed at line 14",
    "details": {
      "file": "app.py",
      "line": 14
    }
  }
}
```

---


## 2. 핵심 데이터 모델

### Function (함수)
```typescript
interface Function {
  id: string;
  name: string;
  description?: string;
  runtime: "python" | "go" | "rust"; // MVP는 python 주력
  code: string; // Base64 or Raw String
  
  // 상태 관리 (Kubernetes Lifecycle 반영)
  status: "pending" | "building" | "deploying" | "ready" | "failed" | "disabled";
  statusMessage?: string; // 예: "Building Wasm image..." or 에러 메시지
  
  // 배포 정보
  endpoint?: string; // AWS LB Endpoint (Ready 상태일 때만 존재)
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

### Runtime (Python 3.12)
**MVP 시연 목적**: Hello World 및 간단한 JSON 처리 수준의 함수 실행
*   ✅ 기본 Python 문법 (조건문, 반복문, 함수 정의)
*   ✅ 표준 라이브러리 (json, datetime, math 등)

---


## 3. API 엔드포인트

### 3.1. 함수 관리 (Functions)

#### 함수 생성 (비동기 배포 시작)
새로운 함수를 생성하고 배포 파이프라인(Build -> Push -> Deploy)을 트리거합니다.

*   **POST** `/functions`
*   **Request Body**:
    ```json
    {
      "name": "my-inference-fn",
      "description": "Simple logic",
      "runtime": "python",
      "code": "def handle(req): return {\"status\": 200, \"body\": \"Hello\"}"
    }
    ```
*   **Response** (`202 Accepted`):
    ```json
    {
      "id": "fn-12345",
      "status": "building",
      "message": "Deployment started. Check status periodically."
    }
    ```

#### 함수 목록 조회
*   **GET** `/functions`
*   **Query Parameters**: `?workspaceId=...`
*   **Response**: `Function[]`

#### 함수 상세 조회 (Polling 대상)
배포 진행 상황을 확인하기 위해 프론트엔드에서 3~5초 간격으로 폴링(Polling)합니다.
*   **GET** `/functions/{functionId}`
*   **Response**:
    ```json
    {
      "id": "fn-12345",
      "status": "deploying", // building -> deploying -> ready 순으로 변경
      "statusMessage": "Waiting for Load Balancer...",
      "endpoint": null // ready 상태가 되면 URL 반환
    }
    ```

#### 함수 코드 수정 및 재배포
*   **PATCH** `/functions/{functionId}`
*   **Request Body**:
    ```json
    {
      "code": "updated code...",
      "description": "bug fix"
    }
    ```
*   **Response**: 함수 상세 정보 (status가 다시 `building`으로 변경됨)

#### 함수 삭제
*   **DELETE** `/functions/{functionId}`
*   **Response**: `204 No Content`

---


### 3.2. 함수 실행 (Invocation)

클라이언트가 AWS LB(Function Endpoint)를 직접 호출할 수도 있으나, CORS 문제 및 테스트 편의성을 위해 **백엔드 프록시 API**를 제공합니다.

*   **POST** `/functions/{functionId}/invoke`
*   **Request Body**: 함수에 전달할 Payload (JSON)
*   **Response**:
    ```json
    {
      "statusCode": 200,
      "body": "Result from Wasm function",
      "headers": { ... },
      "executionTimeMs": 45
    }
    ```

---


### 3.3. 로그 조회 (Logs)

함수 실행 로그를 조회합니다.

*   **GET** `/functions/{functionId}/logs`
*   **Query Parameters**:
    *   `limit`: 조회할 로그 수 (기본 100)
*   **Response**:
    ```json
    {
      "logs": [
        {
          "timestamp": "2025-11-30T10:00:01Z",
          "level": "INFO",
          "message": "Function invoked"
        }
      ]
    }
    ```

---


### 3.4. 워크스페이스 (Workspaces) - Mock/Local
MVP 단계에서는 백엔드 DB 구현 부담을 줄이기 위해 프론트엔드 자체적으로 관리하거나, 간단한 Mock API로 대체합니다.

*   **GET** `/workspaces`
*   **POST** `/workspaces`
*   **DELETE** `/workspaces/{id}`

---


## 4. 프론트엔드 구현 전략

### Polling 로직 (MVP 간소화)
1.  **함수 생성/수정 직후**: `status`가 `ready` 또는 `failed`가 될 때까지 2~3초 간격으로 `GET /functions/{id}` 요청
2.  **UI 피드백**:
    *   `building` / `deploying`: 스피너 표시 ("배포 중...")
    *   `ready`: 엔드포인트 표시 및 "Invoke" 버튼 활성화
    *   `failed`: 에러 메시지 표시

### Mocking (개발 모드)
`VITE_USE_MOCK_API=true` 환경 변수를 통해, 실제 백엔드 없이도 브라우저 메모리(`AppContext`) 상에서 위 API 동작을 시뮬레이션합니다. (현재 구현 완료됨)