import React, { useState, useEffect } from 'react';
import { fetchDecks, deleteDeck } from '../../services/deckAPI';
import { API_BASE_URL } from '../../config/config';
import './DeckList.css';

const DeckList = ({ onDeckSelect, onDeckEdit }) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDeck, setExpandedDeck] = useState(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const response = await fetchDecks();
      
      // APIレスポンスの構造に合わせて処理
      if (response && response.success && response.data) {
        setDecks(response.data);
      } else {
        setDecks([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading decks:', err);
      setError('デッキの読み込みに失敗しました');
      setDecks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeckSelect = (deck) => {
    if (onDeckSelect) {
      onDeckSelect(deck);
    }
  };

  const handleDeckEdit = (deck) => {
    if (onDeckEdit) {
      onDeckEdit(deck);
    }
  };

  const handleDeckDelete = async (deck) => {
    if (window.confirm(`デッキ「${deck.name}」を削除しますか？`)) {
      try {
        await deleteDeck(deck.id);
        await loadDecks(); // リストを再読み込み
      } catch (err) {
        console.error('Error deleting deck:', err);
        alert('デッキの削除に失敗しました');
      }
    }
  };

  const toggleDeckExpansion = (deckId) => {
    setExpandedDeck(expandedDeck === deckId ? null : deckId);
  };

  const getCardImageUrl = (cardId) => {
    return `${API_BASE_URL}/api/v1/images/cards/${cardId}`;
  };

  if (loading) {
    return <div className="deck-list-loading">デッキを読み込み中...</div>;
  }

  if (error) {
    return <div className="deck-list-error">{error}</div>;
  }

  if (!decks || decks.length === 0) {
    return <div className="deck-list-empty">デッキがありません</div>;
  }

  return (
    <div className="deck-list">
      <h3>デッキ一覧</h3>
      <div className="deck-grid">
        {decks.map((deck) => (
          <div key={deck.id} className="deck-item">
            <div className="deck-info">
              <h4>{deck.name}</h4>
              <p>カード数: {deck.cards ? deck.cards.length : 0}/50</p>
              <p>作成日: {deck.created_at ? new Date(deck.created_at).toLocaleDateString('ja-JP') : '不明'}</p>
            </div>
            
            {/* カード画像プレビュー */}
            {deck.cards && deck.cards.length > 0 && (
              <div className="deck-cards-preview">
                <div className="preview-header">
                  <span className="preview-label">登録カード ({deck.cards.length}枚)</span>
                  <button 
                    className="toggle-preview-btn"
                    onClick={() => toggleDeckExpansion(deck.id)}
                  >
                    {expandedDeck === deck.id ? '折りたたむ' : '展開'}
                  </button>
                </div>
                
                {expandedDeck === deck.id ? (
                  <div className="expanded-cards-section">
                    <div className="cards-grid-expanded">
                      {deck.cards.map((card, index) => (
                        <div key={`${card.card_id}-${index}`} className="card-preview-item">
                          <img 
                            src={getCardImageUrl(card.card_id)} 
                            alt={card.name || `Card ${card.card_id}`}
                            className="card-preview-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div className="card-preview-fallback" style={{display: 'none'}}>
                            {card.name || card.card_id}
                          </div>
                          {card.quantity > 1 && (
                            <div className="card-quantity">{card.quantity}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="cards-preview-summary">
                    {deck.cards.slice(0, 6).map((card, index) => (
                      <div key={`${card.card_id}-${index}`} className="card-preview-item">
                        <img 
                          src={getCardImageUrl(card.card_id)} 
                          alt={card.name || `Card ${card.card_id}`}
                          className="card-preview-image-small"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="card-preview-fallback-small" style={{display: 'none'}}>
                          {card.name || card.card_id}
                        </div>
                      </div>
                    ))}
                    {deck.cards.length > 6 && (
                      <div className="more-cards-indicator">
                        +{deck.cards.length - 6}枚
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="deck-actions">
              <button 
                onClick={() => handleDeckSelect(deck)}
                className="btn btn-primary"
              >
                読み込み
              </button>
              <button 
                onClick={() => handleDeckEdit(deck)}
                className="btn btn-secondary"
              >
                編集
              </button>
              <button 
                onClick={() => handleDeckDelete(deck)}
                className="btn btn-danger"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeckList; 