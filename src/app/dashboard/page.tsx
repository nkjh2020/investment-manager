'use client';

import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import SummaryCards from '@/components/dashboard/SummaryCards';
import HoldingsTable from '@/components/dashboard/HoldingsTable';
import AllocationPieChart from '@/components/charts/AllocationPieChart';
import AssetTypeChart from '@/components/charts/AssetTypeChart';
import ProfitLineChart from '@/components/charts/ProfitLineChart';
import AccountSelector from '@/components/ui/AccountSelector';
import RefreshButton from '@/components/ui/RefreshButton';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorDisplay from '@/components/ui/ErrorBoundary';
import { formatDate, formatCurrency } from '@/lib/format';
import SignalsSection from '@/features/signals/components/SignalsSection';

export default function DashboardPage() {
  const {
    portfolio,
    isLoading,
    error,
    refetch,
    selectedAccountId,
    setSelectedAccountId,
    accountList,
  } = usePortfolio();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <LoadingSkeleton rows={2} />
            </div>
          ))}
        </div>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : 'Failed to load data'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!portfolio) return null;

  const isMultiAccount = accountList.length > 2; // 전체 + 1개 이상

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">대시보드</h1>
          {portfolio.lastUpdated && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              마지막 업데이트: {formatDate(portfolio.lastUpdated)}
            </p>
          )}
        </div>
        <RefreshButton onClick={() => refetch()} isLoading={isLoading} />
      </div>

      {/* 계좌 선택 */}
      {isMultiAccount && (
        <AccountSelector
          accounts={accountList}
          selectedId={selectedAccountId}
          onChange={setSelectedAccountId}
        />
      )}

      <SummaryCards summary={portfolio.summary} />

      {/* 투자 신호 (Layer 1 + Layer 3) */}
      <SignalsSection />

      {/* 자산유형 + 종목별 비중 차트 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {portfolio.assetTypes.length > 1 ? (
          <AssetTypeChart assetTypes={portfolio.assetTypes} />
        ) : (
          <AllocationPieChart allocation={portfolio.allocation} />
        )}
        {portfolio.assetTypes.length > 1 ? (
          <AllocationPieChart allocation={portfolio.allocation} title="종목별 비중" />
        ) : (
          <ProfitLineChart holdings={portfolio.holdings} />
        )}
      </div>

      {portfolio.assetTypes.length > 1 && (
        <ProfitLineChart holdings={portfolio.holdings} />
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">보유 종목</h2>
        <HoldingsTable holdings={portfolio.holdings} showAccount={selectedAccountId === 'all' && isMultiAccount} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-700 dark:text-gray-300">예수금</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(portfolio.summary.totalDeposit)}원
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-700 dark:text-gray-300">D+1 예수금</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(portfolio.summary.d1Deposit)}원
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-700 dark:text-gray-300">금일 매수</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(portfolio.summary.todayBuyAmount)}원
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-700 dark:text-gray-300">금일 매도</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(portfolio.summary.todaySellAmount)}원
          </p>
        </div>
      </div>
    </div>
  );
}
