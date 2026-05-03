import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './useAuth';

export function useWallet() {
  const { session } = useAuth();
  const userId = session?.user?.id || 'demo';
  const [balance, setBalance] = useState(100000); // Paper trading starting balance
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getBalance(userId);
      setBalance(data.balance || 100000); // Default to $100K for paper trading
    } catch { setBalance(100000); } finally { setLoading(false); }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await api.getTransactions(userId);
      setTransactions(Array.isArray(data) ? data : []);
    } catch { setTransactions([]); }
  }, [userId]);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  return { balance, transactions, loading, refetch: fetchWallet };
}
