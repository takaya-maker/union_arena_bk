// 環境に応じたAPI設定
const config = {
  // 開発環境
  development: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
    IMG_BASE_URL: process.env.REACT_APP_IMG_BASE_URL || 'http://localhost:8000/static/images',
    EFFECT_IMG_BASE_URL: process.env.REACT_APP_EFFECT_IMG_BASE_URL || 'http://localhost:8000/static/effects',
  },
  // 本番環境
  production: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://union-arena-bk.onrender.com',
    IMG_BASE_URL: process.env.REACT_APP_IMG_BASE_URL || 'https://union-arena-bk.onrender.com/static/images',
    EFFECT_IMG_BASE_URL: process.env.REACT_APP_EFFECT_IMG_BASE_URL || 'https://union-arena-bk.onrender.com/static/effects',
  }
};

// 現在の環境を判定
const environment = process.env.NODE_ENV || 'development';

// 現在の環境の設定を取得
const currentConfig = config[environment];

export const API_BASE_URL = currentConfig.API_BASE_URL;
export const IMG_BASE_URL = currentConfig.IMG_BASE_URL;
export const EFFECT_IMG_BASE_URL = currentConfig.EFFECT_IMG_BASE_URL;
export const GENERATED_ENERGY_IMG_BASE_URL = process.env.REACT_APP_GENERATED_ENERGY_IMG_BASE_URL || `${API_BASE_URL}/static/generated_energy`;
export const TRIGGER_IMG_BASE_URL = process.env.REACT_APP_TRIGGER_IMG_BASE_URL || `${API_BASE_URL}/static/triggers`;

export default currentConfig; 