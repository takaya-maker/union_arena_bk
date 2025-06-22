import React from 'react';
import './DuelMode.css';

const DuelMode = ({ onModeSelect, onBackToMenu }) => {
  const handleModeSelect = (mode) => {
    onModeSelect(mode);
  };

  return (
    <div className="duel-mode-container">
      <div className="duel-mode-content">
        <h2 className="duel-mode-title">デュエルモード選択</h2>
        <p className="duel-mode-description">対戦モードを選択してください</p>
        
        <div className="mode-selection">
          <div 
            className="mode-card online-mode"
            onClick={() => handleModeSelect('online')}
          >
            <div className="mode-icon">🌐</div>
            <h3>オンライン対戦</h3>
            <p>他のプレイヤーとリアルタイムで対戦</p>
            <div className="mode-status">
              <span className="status-badge coming-soon">準備中</span>
            </div>
          </div>

          <div 
            className="mode-card computer-mode"
            onClick={() => handleModeSelect('computer')}
          >
            <div className="mode-icon">🤖</div>
            <h3>コンピュータ対戦</h3>
            <p>AI対戦相手と対戦</p>
            <div className="mode-status">
              <span className="status-badge available">利用可能</span>
            </div>
          </div>

          <div 
            className="mode-card test-mode"
            onClick={() => handleModeSelect('test')}
          >
            <div className="mode-icon">🧪</div>
            <h3>テストモード</h3>
            <p>開発者用 - 機能テスト</p>
            <div className="mode-status">
              <span className="status-badge available">利用可能</span>
            </div>
          </div>
        </div>

        <button 
          className="back-button"
          onClick={onBackToMenu}
        >
          メニューに戻る
        </button>
      </div>
    </div>
  );
};

export default DuelMode; 