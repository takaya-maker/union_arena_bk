import React from 'react';
import { getImageUrl } from '../../services/api';
import './CardDetailModal.css';

const CardDetailModal = ({ card, isOpen, onClose, onAddToDeck, showAddButton = true }) => {
  if (!isOpen || !card) return null;

  // カード画像のURLを生成
  const getCardImageUrl = (cardId) => {
    return getImageUrl.cardImage(cardId);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleAddToDeck = () => {
    if (onAddToDeck) {
      onAddToDeck(card);
    }
    onClose();
  };

  const parseTextWithImages = (text, type) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const imageName = part.slice(1, -1).replace(/[:*?"<>|]/g, '');
        let imageUrl = '';
        if (type === 'generated_energy') {
          imageUrl = getImageUrl.generatedEnergyImage(imageName);
        } else if (type === 'effect') {
          imageUrl = getImageUrl.effectImage(imageName);
        } else if (type === 'trigger') {
          imageUrl = getImageUrl.effectImage(imageName); // トリガーも効果画像と同じAPIを使用
        }
        return (
          <img
            key={index}
            src={imageUrl}
            alt={imageName}
            className="inline-effect-icon"
          />
        );
      }
      return part;
    });
  };

  return (
    <div className="card-detail-modal-backdrop" onClick={handleBackdropClick}>
      <div className="card-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{card.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="card-detail-content">
            <div className="card-detail-image-container">
              <img
                src={getCardImageUrl(card.id)}
                alt={card.name}
                className="card-detail-image"
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="card-image-placeholder" style={{ display: 'none' }}>
                <span>画像なし</span>
              </div>
            </div>
            <div className="card-detail-info">
              <div className="card-id">{card.id}</div>
              <div className="card-type">{card.カード種類}</div>
              {card.コスト && <div className="card-cost">コスト: {card.コスト}</div>}
              {card.BP && <div className="card-bp">BP: {card.BP}</div>}
              {card.AP && <div className="card-ap">AP: {card.AP}</div>}
              {card.特徴 && (
                <div className="card-trait info-group">
                  <span className="label">特徴:</span>
                  <span className="value">{card.特徴}</span>
                </div>
              )}
              {card.発生エナジー && (
                <div className="card-energy info-group">
                  <span className="label">発生:</span>
                  <span className="value">{parseTextWithImages(card.発生エナジー, 'generated_energy')}</span>
                </div>
              )}
              {card.効果 && (
                <div className="card-effect info-group">
                  <span className="label">効果:</span>
                  <span className="value">{parseTextWithImages(card.効果, 'effect')}</span>
                </div>
              )}
              {card.トリガー && (
                <div className="card-trigger info-group">
                  <span className="label">トリガー:</span>
                  <span className="value">{parseTextWithImages(card.トリガー, 'trigger')}</span>
                </div>
              )}
              {card.フレイバーテキスト && (
                <div className="card-flavor info-group">
                  <span className="label">フレイバー:</span>
                  <span className="value">{card.フレイバーテキスト}</span>
                </div>
              )}
              {card.card_term_name && (
                <div className="info-item">
                  <span className="label">作品:</span>
                  <span className="value">{card.card_term_name}</span>
                </div>
              )}
              {card.card_rank_name && (
                <div className="info-item">
                  <span className="label">セット:</span>
                  <span className="value">{card.card_rank_name}</span>
                </div>
              )}
              {/* {showAddButton && onAddToDeck && (
                <div className="card-actions">
                  <button onClick={handleAddToDeck} className="add-to-deck-btn">デッキに追加</button>
                </div>
              )} */}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          {showAddButton && onAddToDeck && (
            <button 
              onClick={handleAddToDeck}
              className="add-to-deck-btn"
            >
              デッキに追加
            </button>
          )}
          <button 
            onClick={onClose}
            className="close-modal-btn"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal; 