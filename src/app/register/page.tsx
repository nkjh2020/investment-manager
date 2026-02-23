'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface KisAccountInput {
  label: string;
  appKey: string;
  appSecret: string;
  accountNo: string;
  productCode: string;
}

const EMPTY_ACCOUNT: KisAccountInput = {
  label: '',
  appKey: '',
  appSecret: '',
  accountNo: '',
  productCode: '22',
};

export default function RegisterPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [kisAccounts, setKisAccounts] = useState<KisAccountInput[]>([{ ...EMPTY_ACCOUNT }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateAccount = (index: number, field: keyof KisAccountInput, value: string) => {
    setKisAccounts((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const addAccount = () => setKisAccounts((prev) => [...prev, { ...EMPTY_ACCOUNT }]);
  const removeAccount = (index: number) =>
    setKisAccounts((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    // 빈 계좌 항목 필터링 (모든 필드가 비어있으면 제외)
    const validAccounts = kisAccounts.filter(
      (a) => a.appKey || a.appSecret || a.accountNo,
    );

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode,
          nickname,
          password,
          kisAccounts: validAccounts,
        }),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error?.message ?? '가입에 실패했습니다');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-950">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">투자매니저</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">회원가입</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── 기본 정보 ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">기본 정보</h3>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  초대 코드
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  placeholder="초대 코드 입력"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  닉네임
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  minLength={2}
                  maxLength={20}
                  placeholder="2~20자"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="8자 이상"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    placeholder="동일하게 입력"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* ── KIS 계좌 ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  KIS 계좌 정보
                  <span className="ml-1.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                    (가입 후 설정에서도 추가 가능)
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={addAccount}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  + 계좌 추가
                </button>
              </div>

              {kisAccounts.map((account, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      계좌 {index + 1}
                    </span>
                    {kisAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAccount(index)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={account.label}
                    onChange={(e) => updateAccount(index, 'label', e.target.value)}
                    placeholder="계좌 이름 (예: 위탁계좌)"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                  <input
                    type="text"
                    value={account.appKey}
                    onChange={(e) => updateAccount(index, 'appKey', e.target.value)}
                    placeholder="App Key (KIS Developers)"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                  <input
                    type="password"
                    value={account.appSecret}
                    onChange={(e) => updateAccount(index, 'appSecret', e.target.value)}
                    placeholder="App Secret"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={account.accountNo}
                      onChange={(e) => updateAccount(index, 'accountNo', e.target.value)}
                      placeholder="계좌번호 (숫자만)"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                    />
                    <select
                      value={account.productCode}
                      onChange={(e) => updateAccount(index, 'productCode', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="22">22 - 위탁</option>
                      <option value="29">29 - 연금</option>
                      <option value="21">21 - 기타</option>
                      <option value="01">01 - CMA</option>
                    </select>
                  </div>
                </div>
              ))}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 KIS Developers ({""}
                <a
                  href="https://apiportal.koreainvestment.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  apiportal.koreainvestment.com
                </a>
                {""})에서 App Key/Secret을 발급받으세요.
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
