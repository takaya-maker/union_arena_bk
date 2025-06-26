// frontend/src/hooks/useCardSearch.js
import { useState, useEffect, useCallback } from 'react';
import { cardAPI } from '../services/api';

// デバウンス用フック
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// カード検索用フック
export const useCardSearch = () => {
  const [searchParams, setSearchParams] = useState({
    name: '',
    card_type: '',
    energy: '',
    card_term: '',
    card_rank: '',
    card_term_name: '',
    card_rank_name: ''
  });
  
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState(new Map());

  // デバウンス処理（500ms遅延）
  const debouncedSearchParams = useDebounce(searchParams, 500);

  // キャッシュキー生成
  const generateCacheKey = useCallback((params) => {
    return JSON.stringify(params);
  }, []);

  // 検索実行
  const executeSearch = useCallback(async (params) => {
    const cacheKey = generateCacheKey(params);
    
    // キャッシュから取得を試行
    if (cache.has(cacheKey)) {
      console.log('Cache hit for:', cacheKey);
      setCards(cache.get(cacheKey));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 空の検索パラメータは除外
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] && params[key].toString().trim()) {
          cleanParams[key] = params[key].toString().trim();
        }
      });

      const response = await cardAPI.searchCards(cleanParams);
      
      if (response.success) {
        const resultCards = response.data || [];
        setCards(resultCards);
        
        // 結果をキャッシュに保存（最大100件まで）
        const newCache = new Map(cache);
        if (newCache.size >= 100) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        newCache.set(cacheKey, resultCards);
        setCache(newCache);
        
        console.log('API call made for:', cacheKey, 'Results:', resultCards.length);
      } else {
        setError('検索に失敗しました');
      }
    } catch (err) {
      setError('検索中にエラーが発生しました');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [cache, generateCacheKey]);

  // デバウンスされた検索パラメータが変更されたら検索実行
  useEffect(() => {
    // 初期状態（全て空）の場合は検索しない
    const hasSearchTerm = Object.values(debouncedSearchParams).some(value => 
      value && value.toString().trim()
    );
    
    if (hasSearchTerm) {
      executeSearch(debouncedSearchParams);
    }
  }, [debouncedSearchParams, executeSearch]);

  // 検索パラメータ更新
  const updateSearchParam = useCallback((field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // キャッシュクリア
  const clearCache = useCallback(() => {
    setCache(new Map());
    console.log('Cache cleared');
  }, []);

  return {
    searchParams,
    cards,
    loading,
    error,
    updateSearchParam,
    executeSearch,
    clearCache,
    cacheSize: cache.size
  };
};