📅 작업 태스크: MVP 클라우드 인프라 & FaaS 구현
1. MVP Cloud Infrastructure
담당자: @조현민 (チョ ヒョンミン)_076_final_blue

상태: ✅ 11/30 완료

[x] K3s용 EC2 Terraform 세팅 및 생성

[x] SG(Security Group) 그룹 생성

[x] 적합한 노드 IAM 구성 (Control-plane)

[x] 컨테이너 IAM 권한 설정을 위한 Hop Limit 설정 (http-put-response-hop-limit : 2)

[x] EC2 인스턴스 5개 생성

[x] 디버깅 및 안정화

[x] K3s IAM 권한 관련 디버깅 (특히 AWS LB 연동 시 발생 이슈 해결)

2. K3s Setup & Network
담당자: @조영빈 (チョ ヨンビン)_092_final_blue

참조: @required k3s.1

[ ] K3s 초기 세팅

⚠️ 주의사항: CNI는 Calico 대신 amazon-vpc-cni를 설치해야 함.

참고 링크: Amazon VPC CNI k8s

[ ] K3s Server 설치 (Master Node 1대)

[ ] K3s Worker Node 설치 (4대)

worker-wasm, worker-observability, worker-infra, worker-build

[ ] CNI 설치 (amazon-vpc-cni-k8s)

[ ] 외부(집 컴퓨터)에서 kubectl 명령어 작동 확인

[ ] 노드 스케줄링 설정

[ ] Taints 및 Tolerance 설정 (Control-plane에 일반 파드 스케줄링 방지)

[ ] 적정 Label 설정 (일반 워크로드 허용 등)

3. Container Runtime & Wasm Support
담당자: @조현민 (チョ ヒョンミン)_076_final_blue

선행 작업: @required k3s.1

[ ] Containerd 추가 플러그인 설치 및 설정

[ ] 추가 플러그인 설치

[ ] config.toml 설정 변경

[ ] Spin Wasm 작동 확인

[ ] 테스트 워크로드 배포 및 확인

4. AWS Load Balancer Controller
선행 작업: @required k3s.1

참고 자료: Helm Chart, Installation Guide

[ ] AWS LB Helm Chart 설치

[ ] LoadBalancer 생성 확인

[ ] Service 타입 LoadBalancer 생성 시 ALB/NLB 프로비저닝 확인

[ ] 기존 ALB 연결 확인

[ ] LoadBalancer Config 적용 시 기 배포된 ALB에 정상적으로 붙는지 테스트

5. Observability
선행 작업: @required k3s.1

[ ] 기본 k8s Observability 구성

[ ] Kubernetes Dashboard Helm Chart 설치

[ ] Grafana Helm Chart 설치

6. Function as a Service (FaaS) Logic
[ ] K8s Spin 기본 설정

[ ] cert-manager 설치

[ ] spin-operator 설치

7. Application & CI/CD
Application Design:

[ ] Application 설계 (DB 포함)

CI/CD Pipeline: 각 파트별 Dockerfile 작성 → ECR 배포 확인 → GitHub Actions 작성 및 테스트

[ ] FrontEnd CI/CD

[ ] Dockerfile 작성

[ ] OCI 이미지 ECR 배포 확인

[ ] Github Action 작성 및 테스트

[ ] BackEnd CI/CD

[ ] Dockerfile 작성

[ ] OCI 이미지 ECR 배포 확인

[ ] Github Action 작성 및 테스트

[ ] FaaS Logic App CI/CD

[ ] Dockerfile 작성

[ ] OCI 이미지 ECR 배포 확인

[ ] Github Action 작성 및 테스트