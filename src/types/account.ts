// 계좌 설정 (서버 전용 - env에서 로드)
export interface AccountConfig {
  id: string;
  label: string;
  appKey: string;
  appSecret: string;
  accountNo: string;
  productCode: string;
}

// 클라이언트에 노출되는 계좌 정보 (민감 정보 제외)
export interface AccountInfo {
  id: string;
  label: string;
  accountNoMasked: string; // 예: ****0181-22
}
