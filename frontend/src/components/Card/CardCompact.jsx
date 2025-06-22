import React from 'react';
import { getImageUrl } from '../../services/api';
import './CardCompact.css';

const CardCompact = ({ card, onClick, onAddToDeck, isSelected, showAddButton = true }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(card);
    }
  };

  const handleAddToDeck = (e) => {
    e.stopPropagation();
    if (onAddToDeck) {
      onAddToDeck(card);
    }
  };

  // カード画像のURLを生成
  const getCardImageUrl = (cardId) => {
    return getImageUrl.cardImage(cardId);
  };

  const parseTextWithImages = (text, type) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const imageName = part.slice(1, -1).replace(/[:*?"<>|]/g, '');
        let imageUrl = '';
        if (type === 'generated_energy') {
          imageUrl = getImageUrl.energyImage(imageName);
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
    <div 
      className={`card-compact ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <div className="card-image-container">
        <img 
          src={getCardImageUrl(card.id)} 
          alt={card.name}
          className="card-image"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div className="card-image-placeholder" style={{ display: 'none' }}>
          <span>画像なし</span>
        </div>
      </div>

      <div className="card-content">
        <div className="card-header">
          <div className="card-name">{card.name}</div>
          <div className="card-id">{card.id}</div>
        </div>
        
        <div className="card-basic-info">
          <div className="card-type">{card.カード種類}</div>
          {card.コスト && (
            <div className="card-cost">コスト: {card.コスト}</div>
          )}
          {card.BP && (
            <div className="card-bp">BP: {card.BP}</div>
          )}
          {card.AP && (
            <div className="card-ap">AP: {card.AP}</div>
          )}
        </div>

        {card.特徴 && (
          <div className="card-trait">
            <span className="label">特徴:</span>
            <span className="value">{card.特徴}</span>
          </div>
        )}

        {card.発生エナジー && (
          <div className="card-energy">
            <span className="label">発生:</span>
            <span className="value">{parseTextWithImages(card.発生エナジー, 'generated_energy')}</span>
          </div>
        )}

        {showAddButton && (
          <div className="card-actions">
            <button 
              onClick={handleAddToDeck}
              className="add-to-deck-btn"
              title="デッキに追加"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardCompact; 