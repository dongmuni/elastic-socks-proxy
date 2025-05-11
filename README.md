# elastic-socks-proxy

nodejs-text-net을 기반으로 한 워커 지원 분산 SOCKS 프록시입니다.

## 개요

elastic-socks-proxy는 여러 워커 프로세스에 연결을 분산할 수 있는 확장 가능한 SOCKS 프록시 구현체입니다. 이 워커들은 잠재적으로 다른 머신에서 실행될 수 있습니다. 서버와 워커 간의 통신을 관리하기 위해 nodejs-text-net의 텍스트 기반 네트워킹 기능을 사용합니다.

이 아키텍처는 elastic-http-proxy와 유사하지만 SOCKS 프로토콜에 특화되어 설계되었습니다.

## 기능

- 분산 워커를 지원하는 SOCKS 프록시 서버
- 자동 워커 등록 및 관리
- 가용한 워커들 간의 연결 로드 밸런싱
- 워커가 없을 때 직접 처리로 폴백
- 환경별 설정 지원
- 워커의 자동 재연결 기능

## 설치

```bash
npm install @dongmuni/elastic-socks-proxy
```

## 사용법

### 서버 시작

```bash
node index.js server
```

이 명령은 클라이언트 연결을 수신하고 가용한 워커에게 분배하는 SOCKS 프록시 서버를 시작합니다.

### 워커 시작

```bash
node index.js worker
```

이 명령은 서버에 연결하고 할당된 SOCKS 연결을 처리하는 워커 프로세스를 시작합니다.

## 설정

설정은 호스트명을 기반으로 적절한 설정 파일을 로드하는 환경 인식 방식입니다:

- `config-local.js` - 로컬 개발 환경용
- `config-dev.js` - 개발 환경용
- `config-live.js` - 프로덕션 환경용

### 서버 설정 옵션

```javascript
serverOptions: {
    // 워커 통신을 위한 TextNet 서버 옵션
    textNetOptions: {
        port: 8081,          // 워커 통신용 포트
        host: '0.0.0.0',     // 모든 인터페이스에서 수신
        backlog: 1024,       // 연결 백로그
        logConnection: true, // 연결 이벤트 로깅
        logSession: false,   // 세션 이벤트 로깅
        idleCloseTimeout: 60000 // 60초 후 유휴 연결 종료
    },
    // SOCKS 프록시 옵션
    proxyOptions: {
        socksPort: 1080,     // SOCKS 프록시 포트
        logEvent: false,     // 일반 이벤트 로깅
        logError: false,     // 오류 로깅
        logAccess: true      // 접근 로깅
    }
}
```

### 워커 설정 옵션

```javascript
workerOptions: {
    // 서버 통신을 위한 TextNet 클라이언트 옵션
    textNetOptions: {
        serverAddresses: [
            { host: 'localhost', port: 8081 }
        ],
        autoRegister: true,       // 서버에 자동 등록
        idlePingTimeout: 30000,   // 30초마다 핑 전송
        reconnectInterval: 3000,  // 연결 해제 시 3초마다 재연결
        logConnection: true,      // 연결 이벤트 로깅
        logSession: false         // 세션 이벤트 로깅
    },
    // SOCKS 프록시 옵션
    proxyOptions: {
        logEvent: false,          // 일반 이벤트 로깅
        logError: false,          // 오류 로깅
        logAccess: true           // 접근 로깅
    }
}
```

## 아키텍처

elastic-socks-proxy는 두 가지 주요 구성 요소로 이루어져 있습니다:

1. **서버**: SOCKS 클라이언트 연결을 수신하고 가용한 워커에게 분배합니다. 워커가 없으면 직접 연결을 처리합니다.

2. **워커**: 서버에 연결하여 할당된 SOCKS 연결을 처리합니다. 요청된 대상에 연결을 설정하고 클라이언트와 대상 간의 데이터를 프록시합니다.

서버와 워커 간의 통신은 nodejs-text-net을 사용하여 처리되며, 이는 메시지 교환 및 세션 관리를 위한 신뢰할 수 있는 텍스트 기반 프로토콜을 제공합니다.

## 의존성

- [@dongmuni/nodejs-util](https://github.com/dongmuni/nodejs-util): 유틸리티 함수
- [@dongmuni/nodejs-text-net](https://github.com/dongmuni/nodejs-text-net): 텍스트 기반 네트워킹 라이브러리
- [socks](https://www.npmjs.com/package/socks): SOCKS 프로토콜 구현체

## 라이센스

ISC
