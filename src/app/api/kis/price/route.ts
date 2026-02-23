import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/token-manager';
import { getAccountConfigs } from '@/lib/account-config';

const KIS_API_BASE_URL = process.env.KIS_API_BASE_URL || 'https://openapi.koreainvestment.com:9443';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Stock code is required' } },
        { status: 400 }
      );
    }

    // 첫 번째 계좌의 토큰/키를 사용하여 시세 조회
    const accounts = getAccountConfigs();
    const account = accounts[0];
    const token = await getToken(account);

    const url = new URL(`${KIS_API_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price`);
    url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J');
    url.searchParams.set('FID_INPUT_ISCD', code);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token.accessToken}`,
        appkey: account.appKey,
        appsecret: account.appSecret,
        tr_id: 'FHKST01010100',
      },
    });

    if (!response.ok) {
      throw new Error(`KIS API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        stockCode: code,
        currentPrice: parseInt(data.output?.stck_prpr || '0', 10),
        changePrice: parseInt(data.output?.prdy_vrss || '0', 10),
        changeRate: parseFloat(data.output?.prdy_ctrt || '0'),
        volume: parseInt(data.output?.acml_vol || '0', 10),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Price inquiry failed';
    return NextResponse.json(
      { success: false, error: { code: 'KIS_API_ERROR', message } },
      { status: 500 }
    );
  }
}
