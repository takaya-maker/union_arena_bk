// frontend/src/services/api.js (既存コードと統合版)
import axios from 'axios';
import { API_BASE_URL } from '../config/config';

// Axiosインスタンス作成
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 大量データ対応のため30秒に延長
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json'
  }
});

// リクエスト/レスポンスインターセプター（ログ用）
api.interceptors.request.use(
  (config) => {
    const startTime = Date.now();
    config.metadata = { startTime };
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`✅ API Response: ${response.status} (${duration}ms)`);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - error.config?.metadata?.startTime;
      console.error(`❌ API Error: ${error.response?.status || 'Network Error'} (${duration}ms)`);
    }
    return Promise.reject(error);
  }
);

// API関数群
export const cardAPI = {
  // 全カード取得（ページング対応版に更新）
  getAllCards: async (page = 1, limit = 100, minimal = false) => {
    try {
      const params = { page, limit };
      if (minimal) params.minimal = minimal;
      
      const response = await api.get('/api/v1/cards', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all cards:', error);
      throw error;
    }
  },

  // IDでカード取得（既存のまま）
  getCardById: async (cardId) => {
    try {
      const response = await api.get(`/api/v1/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching card ${cardId}:`, error);
      throw error;
    }
  },

  // カード検索（拡張版）
  searchCards: async (searchParams, page = 1, limit = 500, minimal = false) => {
    try {
      console.log('Search params:', searchParams); // デバッグ用（既存）
      
      const params = {
        ...searchParams,
        page,
        limit
      };
      if (minimal) params.minimal = minimal;
      
      // 空のパラメータを除去
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.get('/api/v1/cards/search', { params });
      console.log('Search response:', response.data); // デバッグ用（既存）
      return response.data;
      
    } catch (error) {
      console.error('Error searching cards:', error);
      console.error('Error details:', error.response?.data); // 詳細エラー情報（既存）
      throw error;
    }
  },

  // カード統計情報取得（新規追加）
  getCardStats: async () => {
    try {
      const response = await api.get('/api/v1/cards/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching card stats:', error);
      throw error;
    }
  },

  // カード種類取得（既存のまま）
  getCardTypes: async () => {
    try {
      const response = await api.get('/api/v1/card-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching card types:', error);
      throw error;
    }
  },

  // カードシリーズ（作品）取得（既存のまま）
  getCardTerms: async () => {
    try {
      const response = await api.get('/api/v1/card-terms');
      return response.data;
    } catch (error) {
      console.error('Error fetching card terms:', error);
      throw error;
    }
  },

  // カードセット取得（既存のまま）
  getCardRanks: async () => {
    try {
      const response = await api.get('/api/v1/card-ranks');
      return response.data;
    } catch (error) {
      console.error('Error fetching card ranks:', error);
      throw error;
    }
  },

  // カードシリーズ（作品）の日本語名取得（既存のまま）
  getCardTermNames: async () => {
    try {
      const response = await api.get('/api/v1/card-term-names');
      return response.data;
    } catch (error) {
      console.error('Error fetching card term names:', error);
      throw error;
    }
  },

  // カードセットの日本語名取得（既存のまま）
  getCardRankNames: async () => {
    try {
      const response = await api.get('/api/v1/card-rank-names');
      return response.data;
    } catch (error) {
      console.error('Error fetching card rank names:', error);
      throw error;
    }
  }
};

// 画像URL生成関数（既存のまま）
export const getImageUrl = {
  // カード画像URL
  cardImage: (cardId) => {
    return `${API_BASE_URL}/api/v1/images/cards/${cardId}`;
  },

  // エナジー画像URL
  energyImage: (energyName) => {
    return `${API_BASE_URL}/api/v1/images/energy/${energyName}`;
  },

  // 発生エナジー画像URL
  generatedEnergyImage: (energyName) => {
    return `${API_BASE_URL}/api/v1/images/generated-energy/${energyName}`;
  },

  // 効果画像URL
  effectImage: (effectName) => {
    return `${API_BASE_URL}/api/v1/images/effects/${effectName}`;
  }
};

// カード関連のAPI呼び出し（既存のfetch版も保持）
export const fetchCards = async (searchParams = {}) => {
  try {
    const queryString = new URLSearchParams(searchParams).toString();
    const url = `${API_BASE_URL}/api/v1/cards${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
};

export const fetchCardById = async (cardId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/cards/${cardId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching card:', error);
    throw error;
  }
};

// バッチ処理用のユーティリティ（新規追加）
export const batchAPI = {
  // 複数カードを並行取得
  getMultipleCards: async (cardIds) => {
    try {
      const promises = cardIds.map(id => cardAPI.getCardById(id));
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => ({
        cardId: cardIds[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      console.error('Error in batch card fetch:', error);
      throw error;
    }
  },

  // 段階的データ読み込み（最初は軽量版、後で詳細版）
  loadCardsProgressive: async (page = 1, limit = 100) => {
    try {
      // 最初に軽量版を取得
      const minimalResult = await cardAPI.getAllCards(page, limit, true);
      
      // 軽量版データを即座に返す
      const progressiveLoader = {
        initialData: minimalResult,
        loadFullData: async () => {
          // 詳細データを後で取得
          return await cardAPI.getAllCards(page, limit, false);
        }
      };
      
      return progressiveLoader;
    } catch (error) {
      console.error('Error in progressive loading:', error);
      throw error;
    }
  }
};

// キャッシュ管理クラス（新規追加）
export class APICache {
  constructor(maxSize = 200, ttl = 5 * 60 * 1000) { // 5分間のTTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  generateKey(method, params) {
    return `${method}:${JSON.stringify(params)}`;
  }

  set(method, params, data) {
    const key = this.generateKey(method, params);
    
    // キャッシュサイズ制限
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(method, params) {
    const key = this.generateKey(method, params);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // TTL チェック
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

// グローバルキャッシュインスタンス（新規追加）
export const globalCache = new APICache();

// キャッシュ付きAPI呼び出し（新規追加）
export const cachedAPI = {
  searchCards: async (searchParams, page = 1, limit = 500, minimal = false) => {
    const cacheKey = { searchParams, page, limit, minimal };
    const cached = globalCache.get('searchCards', cacheKey);
    
    if (cached) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Cache hit for searchCards');
      }
      return cached;
    }
    
    const result = await cardAPI.searchCards(searchParams, page, limit, minimal);
    globalCache.set('searchCards', cacheKey, result);
    
    return result;
  },

  getAllCards: async (page = 1, limit = 100, minimal = false) => {
    const cacheKey = { page, limit, minimal };
    const cached = globalCache.get('getAllCards', cacheKey);
    
    if (cached) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Cache hit for getAllCards');
      }
      return cached;
    }
    
    const result = await cardAPI.getAllCards(page, limit, minimal);
    globalCache.set('getAllCards', cacheKey, result);
    
    return result;
  }
};

export default api;