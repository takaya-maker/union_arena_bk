// frontend/src/services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../config/config';

// Axiosインスタンス作成
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// API関数群
export const cardAPI = {
  // 全カード取得
  getAllCards: async () => {
    try {
      const response = await api.get('/api/v1/cards');
      return response.data;
    } catch (error) {
      console.error('Error fetching all cards:', error);
      throw error;
    }
  },

  // IDでカード取得
  getCardById: async (cardId) => {
    try {
      const response = await api.get(`/api/v1/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching card ${cardId}:`, error);
      throw error;
    }
  },

  // カード検索
  searchCards: async (searchParams) => {
    try {
      console.log('Search params:', searchParams); // デバッグ用
      const response = await api.get('/api/v1/cards/search', {
        params: searchParams
      });
      console.log('Search response:', response.data); // デバッグ用
      return response.data;
      
    } catch (error) {
      console.error('Error searching cards:', error);
      console.error('Error details:', error.response?.data); // 詳細エラー情報
      throw error;
    }
  },

  // カード種類取得
  getCardTypes: async () => {
    try {
      const response = await api.get('/api/v1/card-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching card types:', error);
      throw error;
    }
  },

  // カードシリーズ（作品）取得
  getCardTerms: async () => {
    try {
      const response = await api.get('/api/v1/card-terms');
      return response.data;
    } catch (error) {
      console.error('Error fetching card terms:', error);
      throw error;
    }
  },

  // カードセット取得
  getCardRanks: async () => {
    try {
      const response = await api.get('/api/v1/card-ranks');
      return response.data;
    } catch (error) {
      console.error('Error fetching card ranks:', error);
      throw error;
    }
  },

  // カードシリーズ（作品）の日本語名取得
  getCardTermNames: async () => {
    try {
      const response = await api.get('/api/v1/card-term-names');
      return response.data;
    } catch (error) {
      console.error('Error fetching card term names:', error);
      throw error;
    }
  },

  // カードセットの日本語名取得
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

// 画像URL生成関数
export const getImageUrl = {
  // カード画像URL
  cardImage: (cardId) => {
    return `${API_BASE_URL}/api/v1/images/cards/${cardId}`;
  },

  // エナジー画像URL
  energyImage: (energyName) => {
    return `${API_BASE_URL}/api/v1/images/energy/${energyName}`;
  },

  // 効果画像URL
  effectImage: (effectName) => {
    return `${API_BASE_URL}/api/v1/images/effects/${effectName}`;
  }
};

// カード関連のAPI呼び出し
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

export default api;