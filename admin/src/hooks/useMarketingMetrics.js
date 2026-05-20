import { useState, useEffect, useCallback } from 'react';
import aiService from '../services/aiService';

export function useMarketingMetrics(days = 30) {
  const [overview,   setOverview]   = useState(null);
  const [campaigns,  setCampaigns]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [lastFetch,  setLastFetch]  = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, campaignsData] = await Promise.all([
        aiService.getOverviewMetrics(days),
        aiService.getCampaigns(),
      ]);
      setOverview(overviewData);
      setCampaigns(campaignsData || []);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { overview, campaigns, loading, error, lastFetch, refresh: fetch };
}

export default useMarketingMetrics;
