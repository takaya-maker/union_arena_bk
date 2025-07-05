// 設定・オプション画面システム
// src/components/Settings/SettingsModal.jsx

import React, { useState, useEffect } from 'react';
import './SettingsModal.css';

// 設定のデフォルト値
const DEFAULT_SETTINGS = {
  audio: {
    masterVolume: 0.7,
    bgmVolume: 0.6,
    sfxVolume: 0.8,
    muteAll: false,
    muteBGM: false,
    muteSFX: false
  },
  graphics: {
    animationSpeed: 1.0,
    enableAnimations: true,
    enableParticles: true,
    enableScreenShake: true,
    qualityLevel: 'high', // low, medium, high
    showFPS: false
  },
  gameplay: {
    autoPhase: false,
    quickActions: true,
    showHints: true,
    autoSave: true,
    confirmActions: true,
    skipAnimations: false
  },
  interface: {
    theme: 'dark', // dark, light, auto
    language: 'ja', // ja, en
    showTooltips: true,
    compactMode: false,
    showKeyboardShortcuts: true,
    cardSize: 'normal' // small, normal, large
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    colorBlind: 'none' // none, protanopia, deuteranopia, tritanopia
  },
  advanced: {
    debugMode: false,
    logLevel: 'warn', // error, warn, info, debug
    enableConsole: false,
    fpsLimit: 60,
    memoryLimit: 512
  }
};

// ローカルストレージのキー
const SETTINGS_STORAGE_KEY = 'union_arena_settings';

// 設定管理クラス
export class SettingsManager {
  constructor() {
    this.settings = this.loadSettings();
    this.callbacks = new Map();
  }

  // 設定の読み込み
  loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.mergeSettings(DEFAULT_SETTINGS, parsed);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  // 設定の保存
  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyCallbacks('settingsSaved', this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  // 設定の取得
  getSetting(category, key) {
    return this.settings[category]?.[key];
  }

  // 設定の更新
  setSetting(category, key, value) {
    if (!this.settings[category]) {
      this.settings[category] = {};
    }
    
    const oldValue = this.settings[category][key];
    this.settings[category][key] = value;
    
    this.notifyCallbacks('settingChanged', {
      category,
      key,
      oldValue,
      newValue: value
    });
    
    this.saveSettings();
  }

  // カテゴリ全体の設定を更新
  setCategory(category, values) {
    const oldValues = { ...this.settings[category] };
    this.settings[category] = { ...this.settings[category], ...values };
    
    this.notifyCallbacks('categoryChanged', {
      category,
      oldValues,
      newValues: this.settings[category]
    });
    
    this.saveSettings();
  }

  // 設定のリセット
  resetSettings(category = null) {
    if (category) {
      this.settings[category] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS[category]));
    } else {
      this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
    
    this.notifyCallbacks('settingsReset', { category });
    this.saveSettings();
  }

  // 設定の統合
  mergeSettings(defaults, user) {
    const merged = { ...defaults };
    
    Object.keys(user).forEach(category => {
      if (typeof user[category] === 'object' && user[category] !== null) {
        merged[category] = { ...defaults[category], ...user[category] };
      }
    });
    
    return merged;
  }

  // コールバック登録
  onSettingsChange(callback) {
    const id = `callback_${Date.now()}_${Math.random()}`;
    this.callbacks.set(id, callback);
    return id;
  }

  // コールバック削除
  removeCallback(id) {
    this.callbacks.delete(id);
  }

  // コールバック通知
  notifyCallbacks(event, data) {
    this.callbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Settings callback error:', error);
      }
    });
  }

  // 全設定の取得
  getAllSettings() {
    return JSON.parse(JSON.stringify(this.settings));
  }
}

// 設定モーダルコンポーネント
const SettingsModal = ({ 
  isOpen, 
  onClose, 
  settingsManager,
  onApplySettings 
}) => {
  const [activeTab, setActiveTab] = useState('audio');
  const [settings, setSettings] = useState(settingsManager?.getAllSettings() || DEFAULT_SETTINGS);
  const [pendingChanges, setPendingChanges] = useState(false);

  useEffect(() => {
    if (settingsManager) {
      setSettings(settingsManager.getAllSettings());
    }
  }, [settingsManager, isOpen]);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setPendingChanges(true);
  };

  const handleApply = () => {
    if (settingsManager) {
      Object.keys(settings).forEach(category => {
        settingsManager.setCategory(category, settings[category]);
      });
    }
    
    if (onApplySettings) {
      onApplySettings(settings);
    }
    
    setPendingChanges(false);
  };

  const handleReset = (category = null) => {
    if (settingsManager) {
      settingsManager.resetSettings(category);
      setSettings(settingsManager.getAllSettings());
    }
    setPendingChanges(false);
  };

  const handleClose = () => {
    if (pendingChanges) {
      if (window.confirm('未保存の変更があります。破棄しますか？')) {
        setSettings(settingsManager?.getAllSettings() || DEFAULT_SETTINGS);
        setPendingChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'audio', name: '音声', icon: '🔊' },
    { id: 'graphics', name: 'グラフィック', icon: '🎨' },
    { id: 'gameplay', name: 'ゲームプレイ', icon: '🎮' },
    { id: 'interface', name: 'インターフェース', icon: '💻' },
    { id: 'accessibility', name: 'アクセシビリティ', icon: '♿' },
    { id: 'advanced', name: '高度な設定', icon: '⚙️' }
  ];

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>設定</h2>
          <button className="settings-close-button" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-name">{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="settings-panel">
            {activeTab === 'audio' && (
              <AudioSettings 
                settings={settings.audio} 
                onChange={(key, value) => handleSettingChange('audio', key, value)}
              />
            )}
            {activeTab === 'graphics' && (
              <GraphicsSettings 
                settings={settings.graphics} 
                onChange={(key, value) => handleSettingChange('graphics', key, value)}
              />
            )}
            {activeTab === 'gameplay' && (
              <GameplaySettings 
                settings={settings.gameplay} 
                onChange={(key, value) => handleSettingChange('gameplay', key, value)}
              />
            )}
            {activeTab === 'interface' && (
              <InterfaceSettings 
                settings={settings.interface} 
                onChange={(key, value) => handleSettingChange('interface', key, value)}
              />
            )}
            {activeTab === 'accessibility' && (
              <AccessibilitySettings 
                settings={settings.accessibility} 
                onChange={(key, value) => handleSettingChange('accessibility', key, value)}
              />
            )}
            {activeTab === 'advanced' && (
              <AdvancedSettings 
                settings={settings.advanced} 
                onChange={(key, value) => handleSettingChange('advanced', key, value)}
              />
            )}
          </div>
        </div>

        <div className="settings-footer">
          <div className="settings-actions">
            <button 
              className="settings-button reset-button"
              onClick={() => handleReset(activeTab)}
            >
              このタブをリセット
            </button>
            <button 
              className="settings-button reset-all-button"
              onClick={() => handleReset()}
            >
              すべてリセット
            </button>
          </div>
          <div className="settings-actions">
            <button 
              className="settings-button cancel-button"
              onClick={handleClose}
            >
              キャンセル
            </button>
            <button 
              className={`settings-button apply-button ${pendingChanges ? 'has-changes' : ''}`}
              onClick={handleApply}
              disabled={!pendingChanges}
            >
              適用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 音声設定パネル
const AudioSettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>音量設定</h3>
    <SettingSlider
      label="マスター音量"
      value={settings.masterVolume}
      min={0}
      max={1}
      step={0.1}
      onChange={(value) => onChange('masterVolume', value)}
      disabled={settings.muteAll}
    />
    <SettingSlider
      label="BGM音量"
      value={settings.bgmVolume}
      min={0}
      max={1}
      step={0.1}
      onChange={(value) => onChange('bgmVolume', value)}
      disabled={settings.muteAll || settings.muteBGM}
    />
    <SettingSlider
      label="効果音音量"
      value={settings.sfxVolume}
      min={0}
      max={1}
      step={0.1}
      onChange={(value) => onChange('sfxVolume', value)}
      disabled={settings.muteAll || settings.muteSFX}
    />
    
    <h3>ミュート設定</h3>
    <SettingCheckbox
      label="すべてミュート"
      checked={settings.muteAll}
      onChange={(value) => onChange('muteAll', value)}
    />
    <SettingCheckbox
      label="BGMをミュート"
      checked={settings.muteBGM}
      onChange={(value) => onChange('muteBGM', value)}
      disabled={settings.muteAll}
    />
    <SettingCheckbox
      label="効果音をミュート"
      checked={settings.muteSFX}
      onChange={(value) => onChange('muteSFX', value)}
      disabled={settings.muteAll}
    />
  </div>
);

// グラフィック設定パネル
const GraphicsSettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>アニメーション設定</h3>
    <SettingCheckbox
      label="アニメーションを有効にする"
      checked={settings.enableAnimations}
      onChange={(value) => onChange('enableAnimations', value)}
    />
    <SettingCheckbox
      label="パーティクル効果を有効にする"
      checked={settings.enableParticles}
      onChange={(value) => onChange('enableParticles', value)}
      disabled={!settings.enableAnimations}
    />
    <SettingCheckbox
      label="画面振動を有効にする"
      checked={settings.enableScreenShake}
      onChange={(value) => onChange('enableScreenShake', value)}
    />
    <SettingSlider
      label="アニメーション速度"
      value={settings.animationSpeed}
      min={0.5}
      max={2.0}
      step={0.1}
      onChange={(value) => onChange('animationSpeed', value)}
      disabled={!settings.enableAnimations}
    />
    
    <h3>品質設定</h3>
    <SettingSelect
      label="グラフィック品質"
      value={settings.qualityLevel}
      options={[
        { value: 'low', label: '低' },
        { value: 'medium', label: '中' },
        { value: 'high', label: '高' }
      ]}
      onChange={(value) => onChange('qualityLevel', value)}
    />
    <SettingCheckbox
      label="FPS表示"
      checked={settings.showFPS}
      onChange={(value) => onChange('showFPS', value)}
    />
  </div>
);

// ゲームプレイ設定パネル
const GameplaySettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>自動化設定</h3>
    <SettingCheckbox
      label="自動フェーズ進行"
      checked={settings.autoPhase}
      onChange={(value) => onChange('autoPhase', value)}
    />
    <SettingCheckbox
      label="クイックアクション"
      checked={settings.quickActions}
      onChange={(value) => onChange('quickActions', value)}
    />
    <SettingCheckbox
      label="アニメーションスキップ"
      checked={settings.skipAnimations}
      onChange={(value) => onChange('skipAnimations', value)}
    />
    
    <h3>ヘルプ設定</h3>
    <SettingCheckbox
      label="ヒント表示"
      checked={settings.showHints}
      onChange={(value) => onChange('showHints', value)}
    />
    <SettingCheckbox
      label="アクション確認"
      checked={settings.confirmActions}
      onChange={(value) => onChange('confirmActions', value)}
    />
    
    <h3>保存設定</h3>
    <SettingCheckbox
      label="自動保存"
      checked={settings.autoSave}
      onChange={(value) => onChange('autoSave', value)}
    />
  </div>
);

// インターフェース設定パネル
const InterfaceSettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>表示設定</h3>
    <SettingSelect
      label="テーマ"
      value={settings.theme}
      options={[
        { value: 'dark', label: 'ダーク' },
        { value: 'light', label: 'ライト' },
        { value: 'auto', label: '自動' }
      ]}
      onChange={(value) => onChange('theme', value)}
    />
    <SettingSelect
      label="言語"
      value={settings.language}
      options={[
        { value: 'ja', label: '日本語' },
        { value: 'en', label: 'English' }
      ]}
      onChange={(value) => onChange('language', value)}
    />
    <SettingSelect
      label="カードサイズ"
      value={settings.cardSize}
      options={[
        { value: 'small', label: '小' },
        { value: 'normal', label: '普通' },
        { value: 'large', label: '大' }
      ]}
      onChange={(value) => onChange('cardSize', value)}
    />
    
    <h3>UI設定</h3>
    <SettingCheckbox
      label="ツールチップ表示"
      checked={settings.showTooltips}
      onChange={(value) => onChange('showTooltips', value)}
    />
    <SettingCheckbox
      label="コンパクトモード"
      checked={settings.compactMode}
      onChange={(value) => onChange('compactMode', value)}
    />
    <SettingCheckbox
      label="キーボードショートカット表示"
      checked={settings.showKeyboardShortcuts}
      onChange={(value) => onChange('showKeyboardShortcuts', value)}
    />
  </div>
);

// アクセシビリティ設定パネル
const AccessibilitySettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>視覚設定</h3>
    <SettingCheckbox
      label="アニメーション軽減"
      checked={settings.reducedMotion}
      onChange={(value) => onChange('reducedMotion', value)}
    />
    <SettingCheckbox
      label="高コントラスト"
      checked={settings.highContrast}
      onChange={(value) => onChange('highContrast', value)}
    />
    <SettingCheckbox
      label="大きな文字"
      checked={settings.largeText}
      onChange={(value) => onChange('largeText', value)}
    />
    <SettingSelect
      label="色覚サポート"
      value={settings.colorBlind}
      options={[
        { value: 'none', label: 'なし' },
        { value: 'protanopia', label: '1型色覚' },
        { value: 'deuteranopia', label: '2型色覚' },
        { value: 'tritanopia', label: '3型色覚' }
      ]}
      onChange={(value) => onChange('colorBlind', value)}
    />
    
    <h3>その他</h3>
    <SettingCheckbox
      label="スクリーンリーダー対応"
      checked={settings.screenReader}
      onChange={(value) => onChange('screenReader', value)}
    />
  </div>
);

// 高度な設定パネル
const AdvancedSettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>開発者設定</h3>
    <SettingCheckbox
      label="デバッグモード"
      checked={settings.debugMode}
      onChange={(value) => onChange('debugMode', value)}
    />
    <SettingCheckbox
      label="コンソール有効"
      checked={settings.enableConsole}
      onChange={(value) => onChange('enableConsole', value)}
    />
    <SettingSelect
      label="ログレベル"
      value={settings.logLevel}
      options={[
        { value: 'error', label: 'エラーのみ' },
        { value: 'warn', label: '警告以上' },
        { value: 'info', label: '情報以上' },
        { value: 'debug', label: 'すべて' }
      ]}
      onChange={(value) => onChange('logLevel', value)}
    />
    
    <h3>パフォーマンス設定</h3>
    <SettingSlider
      label="FPS制限"
      value={settings.fpsLimit}
      min={30}
      max={120}
      step={10}
      onChange={(value) => onChange('fpsLimit', value)}
    />
    <SettingSlider
      label="メモリ制限 (MB)"
      value={settings.memoryLimit}
      min={256}
      max={2048}
      step={256}
      onChange={(value) => onChange('memoryLimit', value)}
    />
  </div>
);

// 設定コンポーネント群
const SettingSlider = ({ label, value, min, max, step, onChange, disabled = false }) => (
  <div className="setting-item">
    <label className="setting-label">{label}</label>
    <div className="setting-control slider-control">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="setting-slider"
      />
      <span className="setting-value">{Math.round(value * 100)}%</span>
    </div>
  </div>
);

const SettingCheckbox = ({ label, checked, onChange, disabled = false }) => (
  <div className="setting-item">
    <label className="setting-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="setting-checkbox"
      />
      <span className="checkbox-custom"></span>
      {label}
    </label>
  </div>
);

const SettingSelect = ({ label, value, options, onChange, disabled = false }) => (
  <div className="setting-item">
    <label className="setting-label">{label}</label>
    <div className="setting-control">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="setting-select"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default SettingsModal;
export { SettingsManager };