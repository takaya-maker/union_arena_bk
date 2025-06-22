import React, { useState, useEffect } from 'react';
import { fetchDecks, deleteDeck } from '../../services/deckAPI';
import './DeckList.css';

const DeckList = ({ onDeckSelect, onDeckEdit }) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const response = await fetchDecks();
      setDecks(response);
      setError(null);
    } catch (err) {
      console.error('Error loading decks:', err);
      setError('デッキの読み込みに失敗しました');
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

  if (loading) {
    return <div className="deck-list-loading">デッキを読み込み中...</div>;
  }

  if (error) {
    return <div className="deck-list-error">{error}</div>;
  }

  if (decks.length === 0) {
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
              <p>カード数: {deck.cards.length}/50</p>
              <p>作成日: {new Date(deck.created_at).toLocaleDateString('ja-JP')}</p>
            </div>
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