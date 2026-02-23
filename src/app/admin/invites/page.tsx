'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface GeneratedInvite {
  code: string;
  expiresAt: string;
  createdAt: string;
}

export default function AdminInvitesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [days, setDays] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [invites, setInvites] = useState<GeneratedInvite[]>([]);
  const [copiedCode, setCopiedCode] = useState('');

  // 관리자가 아니면 리다이렉트
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);

    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });

      const data = await res.json();
      if (data.success) {
        const newInvite: GeneratedInvite = {
          code: data.data.code,
          expiresAt: data.data.expiresAt,
          createdAt: new Date().toISOString(),
        };
        setInvites((prev) => [newInvite, ...prev]);
      } else {
        setError(data.error?.message ?? '초대 코드 생성에 실패했습니다');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null; // useEffect가 리다이렉트 처리
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">초대 코드 관리</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          가족/친구에게 초대 코드를 공유하면, 그들이 직접 회원가입할 수 있습니다.
        </p>
      </div>

      {/* 코드 생성 카드 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">새 초대 코드 생성</h2>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              유효 기간 (일)
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
              min={1}
              max={365}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? '생성 중...' : '코드 생성'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* 생성된 코드 목록 */}
      {invites.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            생성된 초대 코드
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {invites.length}
            </span>
          </h2>

          <div className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.code}
                className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  {/* 초대 코드 */}
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white">
                      {invite.code}
                    </code>
                    <button
                      onClick={() => handleCopy(invite.code)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      {copiedCode === invite.code ? (
                        <>
                          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600">복사됨</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          복사
                        </>
                      )}
                    </button>
                  </div>

                  {/* 메타 정보 */}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>생성: {formatDate(invite.createdAt)}</span>
                    <span>만료: {formatDate(invite.expiresAt)}</span>
                  </div>
                </div>

                {/* 공유 안내 */}
                <div className="text-xs text-gray-500 dark:text-gray-400 sm:text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    1회용 코드
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            * 이 페이지에서 나가면 코드가 사라집니다. 사용 전에 복사해두세요.
            <br />
            * 각 코드는 1명만 사용 가능합니다. 여러 명을 초대하려면 각각 코드를 생성하세요.
          </p>
        </div>
      )}

      {/* 가이드 */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          초대 방법
        </h3>
        <ol className="space-y-1.5 text-sm text-blue-800 dark:text-blue-300">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>위에서 초대 코드를 생성하고 복사합니다.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>초대할 사람에게 이 앱의 URL과 코드를 공유합니다.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>상대방이 <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">/register</code> 페이지에서 코드를 입력하고 본인의 KIS API Key로 가입합니다.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>각 사용자의 데이터는 완전히 분리되어 서로 볼 수 없습니다.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
