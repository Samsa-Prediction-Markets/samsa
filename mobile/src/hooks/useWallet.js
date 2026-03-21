import { useState, useEffect, useCallback } from 'react';
import Storage from '../services/storage';

const DEFAULT_WALLET = {
  balance: 1000.00,
  positions: [],
  watchlist: [],
  following: [],
};

export function useWallet() {
  const [wallet, setWallet] = useState(DEFAULT_WALLET);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const saved = await Storage.load('wallet', DEFAULT_WALLET);
      setWallet(saved);
    } catch (e) {
      console.error('Failed to load wallet:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveWallet = async (newWallet) => {
    setWallet(newWallet);
    await Storage.save('wallet', newWallet);
  };

  const addPosition = useCallback(async (position) => {
    const newWallet = {
      ...wallet,
      balance: wallet.balance - position.amount,
      positions: [...wallet.positions, {
        ...position,
        id: `pos_${Date.now()}`,
        createdAt: new Date().toISOString(),
      }],
    };
    await saveWallet(newWallet);
  }, [wallet]);

  const toggleWatchlist = useCallback(async (marketId, marketTitle, category) => {
    const index = wallet.watchlist.findIndex(w => w.id === marketId);
    let newWatchlist;

    if (index >= 0) {
      newWatchlist = wallet.watchlist.filter(w => w.id !== marketId);
    } else {
      newWatchlist = [...wallet.watchlist, {
        id: marketId,
        title: marketTitle,
        category,
        addedAt: new Date().toISOString(),
      }];
    }

    await saveWallet({ ...wallet, watchlist: newWatchlist });
    return index < 0;
  }, [wallet]);

  const toggleFollowing = useCallback(async (interestId, interestName, category) => {
    const index = wallet.following.findIndex(f => f.id === interestId);
    let newFollowing;

    if (index >= 0) {
      newFollowing = wallet.following.filter(f => f.id !== interestId);
    } else {
      newFollowing = [...wallet.following, {
        id: interestId,
        name: interestName,
        category,
        addedAt: new Date().toISOString(),
      }];
    }

    await saveWallet({ ...wallet, following: newFollowing });
    return index < 0;
  }, [wallet]);

  const isWatchlisted = useCallback((marketId) => {
    return wallet.watchlist.some(w => w.id === marketId);
  }, [wallet.watchlist]);

  const isFollowing = useCallback((interestId) => {
    return wallet.following.some(f => f.id === interestId);
  }, [wallet.following]);

  return {
    wallet,
    loading,
    addPosition,
    toggleWatchlist,
    toggleFollowing,
    isWatchlisted,
    isFollowing,
    refresh: loadWallet,
  };
}

export default useWallet;
