'use client';

import { useQuery } from '@tanstack/react-query';
import type { SignalsResponse } from '@/types/signal';

async function fetchSignals(refresh = false): Promise<SignalsResponse> {
  const url = refresh ? '/api/signals?refresh=true' : '/api/signals';
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`신호 조회 실패: ${response.status}`);
  }

  return response.json();
}

export function useSignals() {
  const query = useQuery<SignalsResponse, Error>({
    queryKey: ['signals'],
    queryFn: () => fetchSignals(false),
    staleTime:       60 * 60 * 1000, // 1시간
    refetchInterval: false,           // 자동 폴링 없음 (수동 새로고침)
    retry: 1,
  });

  // 강제 새로고침 (캐시 무시)
  const refresh = () => {
    return fetchSignals(true).then((data) => {
      query.refetch();
      return data;
    });
  };

  return {
    data:      query.data,
    isLoading: query.isLoading,
    error:     query.error,
    refetch:   query.refetch,
    refresh,
  };
}
