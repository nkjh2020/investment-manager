'use client';

import { useState, useEffect } from 'react';
import { getRefreshConfig, setRefreshConfig } from '@/lib/storage';
import { useAuth } from '@/providers/AuthProvider';
import type { RefreshConfig } from '@/types/portfolio';

interface KisAccountForm {
  label: string;
  appKey: string;
  appSecret: string;
  accountNo: string;
  productCode: string;
}

const EMPTY_ACCOUNT: KisAccountForm = {
  label: '',
  appKey: '',
  appSecret: '',
  accountNo: '',
  productCode: '22',
};

export default function SettingsPage() {
  const { user, refresh: refreshUser } = useAuth();

  // ── 새로고침 설정 ────────────────────────────────────────
  const [config, setConfig] = useState<RefreshConfig>({ autoRefresh: false, intervalSeconds: 60 });
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    setConfig(getRefreshConfig());
  }, []);

  const handleSaveConfig = () => {
    setRefreshConfig(config);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  // ── KIS 계좌 추가 폼 ─────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState<KisAccountForm>({ ...EMPTY_ACCOUNT });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  // ── KIS 계좌 삭제 ────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      // POST: 새 계좌를 기존 목록에 추가
      const res = await fetch('/api/user/kis-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      });

      const data = await res.json();
      if (data.success) {
        setAddSuccess(true);
        setNewAccount({ ...EMPTY_ACCOUNT });
        setShowAddForm(false);
        await refreshUser();
        setTimeout(() => setAddSuccess(false), 3000);
      } else {
        setAddError(data.error?.message ?? '계좌 추가에 실패했습니다');
      }
    } catch {
      setAddError('네트워크 오류가 발생했습니다');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    setDeleteError('');
    setDeletingId(accountId);

    try {
      const res = await fetch(`/api/user/kis-accounts?id=${encodeURIComponent(accountId)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        await refreshUser();
      } else {
        setDeleteError(data.error?.message ?? '계좌 삭제에 실패했습니다');
      }
    } catch {
      setDeleteError('네트워크 오류가 발생했습니다');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">설정</h1>

      {/* ── KIS 계좌 관리 ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">KIS 계좌</h2>
          <button
            onClick={() => {
              setShowAddForm((v) => !v);
              setAddError('');
              setNewAccount({ ...EMPTY_ACCOUNT });
            }}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {showAddForm ? '취소' : '+ 계좌 추가'}
          </button>
        </div>

        {/* 등록된 계좌 목록 */}
        {user?.kisAccounts && user.kisAccounts.length > 0 ? (
          <div className="space-y-2">
            {user.kisAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{account.label}</span>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    ({account.accountNoMasked})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                    연결됨
                  </span>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    disabled={deletingId === account.id}
                    className="rounded p-1 text-gray-400 hover:text-red-500 disabled:opacity-50 dark:hover:text-red-400"
                    title="계좌 삭제"
                  >
                    {deletingId === account.id ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            등록된 계좌가 없습니다. 계좌를 추가해주세요.
          </p>
        )}

        {deleteError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
        )}

        {addSuccess && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">✓ 계좌가 추가되었습니다</p>
        )}

        {/* 계좌 추가 폼 */}
        {showAddForm && (
          <form onSubmit={handleAddAccount} className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">새 계좌 추가</h3>

            <input
              type="text"
              value={newAccount.label}
              onChange={(e) => setNewAccount((a) => ({ ...a, label: e.target.value }))}
              required
              placeholder="계좌 이름 (예: 위탁계좌)"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
            <input
              type="text"
              value={newAccount.appKey}
              onChange={(e) => setNewAccount((a) => ({ ...a, appKey: e.target.value }))}
              required
              placeholder="App Key"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
            <input
              type="password"
              value={newAccount.appSecret}
              onChange={(e) => setNewAccount((a) => ({ ...a, appSecret: e.target.value }))}
              required
              placeholder="App Secret"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newAccount.accountNo}
                onChange={(e) => setNewAccount((a) => ({ ...a, accountNo: e.target.value }))}
                required
                placeholder="계좌번호 (숫자만)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
              <select
                value={newAccount.productCode}
                onChange={(e) => setNewAccount((a) => ({ ...a, productCode: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="22">22 - 위탁</option>
                <option value="29">29 - 연금</option>
                <option value="21">21 - 기타</option>
                <option value="01">01 - CMA</option>
              </select>
            </div>

            {addError && (
              <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>
            )}

            <button
              type="submit"
              disabled={addLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addLoading ? '추가 중...' : '계좌 추가'}
            </button>
          </form>
        )}
      </div>

      {/* ── 데이터 새로고침 설정 ── */}
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
              <label className="text-sm text-gray-700 dark:text-gray-300">주기 (초):</label>
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
          onClick={handleSaveConfig}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {configSaved ? '저장됨!' : '저장'}
        </button>
      </div>
    </div>
  );
}
