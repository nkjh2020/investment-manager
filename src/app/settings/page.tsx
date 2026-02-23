'use client';

import { useState, useEffect } from 'react';
import { getRefreshConfig, setRefreshConfig } from '@/lib/storage';
import { useAccounts } from '@/features/account/hooks/useBalance';
import type { RefreshConfig } from '@/types/portfolio';

export default function SettingsPage() {
  const [config, setConfig] = useState<RefreshConfig>({
    autoRefresh: false,
    intervalSeconds: 60,
  });
  const [saved, setSaved] = useState(false);
  const { data: accounts } = useAccounts();

  useEffect(() => {
    setConfig(getRefreshConfig());
  }, []);

  const handleSave = () => {
    setRefreshConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">설정</h1>

      {/* 등록된 계좌 목록 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">등록된 계좌</h2>
        {accounts && accounts.length > 0 ? (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{account.label}</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({account.accountNoMasked})
                  </span>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                  연결됨
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">등록된 계좌가 없습니다.</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">데이터 새로고침</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={config.autoRefresh}
                onChange={(e) => setConfig((c) => ({ ...c, autoRefresh: e.target.checked }))}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700" />
            </label>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">자동 새로고침</span>
          </div>

          {config.autoRefresh && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400">주기 (초):</label>
              <input
                type="number"
                value={config.intervalSeconds}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    intervalSeconds: Math.max(10, parseInt(e.target.value) || 60),
                  }))
                }
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min="10"
                max="3600"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {saved ? '저장됨!' : '저장'}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">KIS API 설정 안내</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          API Key와 Secret은 서버 환경변수로 관리됩니다. <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-700">.env.local</code> 파일에 JSON 배열 형태로 계좌 정보를 설정하세요:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-50 p-4 text-xs dark:bg-gray-900">
{`KIS_ACCOUNTS='[
  {
    "id": "account1",
    "label": "계좌1-위탁",
    "appKey": "your_app_key",
    "appSecret": "your_app_secret",
    "accountNo": "12345678",
    "productCode": "22"
  },
  {
    "id": "account2",
    "label": "계좌2-CMA",
    "appKey": "your_app_key_2",
    "appSecret": "your_app_secret_2",
    "accountNo": "87654321",
    "productCode": "01"
  }
]'
KIS_API_BASE_URL=https://openapi.koreainvestment.com:9443`}
        </pre>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          * 계좌별로 다른 App Key/Secret을 사용할 수 있습니다.<br />
          * 같은 App Key를 사용하는 계좌는 토큰을 공유합니다.<br />
          * 기존 단일 계좌 설정 (KIS_APP_KEY, KIS_ACCOUNT_NO)도 하위 호환됩니다.
        </p>
      </div>
    </div>
  );
}
