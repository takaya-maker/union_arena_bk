import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/config';
import './DeckSelector.css';

const DeckSelector = ({ duelMode, onDeckSelect, onBackToMenu }) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/decks`);
      if (!response.ok) {
        throw new Error('デッキの取得に失敗しました');
      }
      const data = await response.json();
      
      // APIレスポンスの形式に合わせて修正
      if (data.success && data.data && Array.isArray(data.data)) {
        setDecks(data.data);
      } else {
        setDecks([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeckSelect = (deck) => {
    onDeckSelect(deck, duelMode);
  };

  const getModeDisplayName = (mode) => {
    switch (mode) {
      case 'online': return 'オンライン対戦';
      case 'computer': return 'コンピュータ対戦';
      case 'test': return 'テストモード';
      default: return '対戦';
    }
  };

  if (loading) {
    return (
      <div className="deck-selector-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>デッキを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deck-selector-container">
        <div className="error-message">
          <h3>エラーが発生しました</h3>
          <p>{error}</p>
          <button onClick={fetchDecks} className="retry-button">
            再試行
          </button>
          <button onClick={onBackToMenu} className="back-button">
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-selector-container">
      <div className="deck-selector-content">
        <div className="deck-selector-header">
          <h2 className="deck-selector-title">デッキ選択</h2>
          <p className="deck-selector-subtitle">
            {getModeDisplayName(duelMode)}用のデッキを選択してください
          </p>
        </div>

        {decks.length === 0 ? (
          <div className="no-decks-message">
            <div className="no-decks-icon">📚</div>
            <h3>デッキがありません</h3>
            <p>デッキ構築画面でデッキを作成してください</p>
            <button onClick={onBackToMenu} className="back-button">
              メニューに戻る
            </button>
          </div>
        ) : (
          <div className="deck-grid">
            {decks.map((deck) => (
              <div 
                key={deck.id} 
                className="deck-card"
                onClick={() => handleDeckSelect(deck)}
              >
                <div className="deck-header">
                  <h3 className="deck-name">{deck.name}</h3>
                  <span className="deck-count">{deck.cards?.length || 0}枚</span>
                </div>
                
                <div className="deck-preview">
                  {deck.cards && deck.cards.slice(0, 3).map((card, index) => (
                    <div key={index} className="preview-card">
                      <img 
                        src={`${API_BASE_URL}/api/v1/images/cards/${card.card_id}`}
                        alt={card.name}
                        className="preview-card-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="preview-card-fallback" style={{display: 'none'}}>
                        {card.name}
                      </div>
                    </div>
                  ))}
                  {deck.cards && deck.cards.length > 3 && (
                    <div className="more-cards">
                      +{deck.cards.length - 3}
                    </div>
                  )}
                </div>

                <div className="deck-info">
                  <p className="deck-description">
                    {deck.description || 'デッキの説明がありません'}
                  </p>
                </div>

                <button className="select-deck-button">
                  このデッキで対戦
                </button>
              </div>
            ))}
          </div>
        )}

        <button 
          className="back-button"
          onClick={onBackToMenu}
        >
          戻る
        </button>
      </div>
    </div>
  );
};

export default DeckSelector; 