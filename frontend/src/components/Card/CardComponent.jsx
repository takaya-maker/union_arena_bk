// frontend/src/components/Card/CardComponent.jsx
import React, { useState } from 'react';
import { getImageUrl } from '../../services/api';
import './CardComponent.css';

const CardComponent = ({ card, onClick, isSelected = false }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(card);
    }
  };

  // エナジーコストの表示用処理
  const renderEnergyText = (energyText) => {
    if (!energyText) return '';
    
    // *で囲まれた部分を特別な表示にする
    return energyText.split('*').map((part, index) => {
      if (index % 2 === 1) {
        // *で囲まれた部分
        return <span key={index} className="energy-symbol">{part}</span>;
      }
      return part;
    });
  };

  // 発生エナジーの表示用処理（画像表示）
  const renderGeneratedEnergyText = (energyText) => {
    if (!energyText) return '';
    
    return energyText.split('*').map((part, index) => {
      if (index % 2 === 1) {
        // *で囲まれた部分（発生エナジー画像）
        const imageName = part.replace(/[:*?"<>|]/g, '');
        return (
          <img
            key={index}
            src={getImageUrl.generatedEnergyImage(imageName)}
            alt={imageName}
            className="inline-energy-icon"
          />
        );
      }
      return part;
    });
  };

  // 効果テキストの表示用処理
  const renderEffectText = (effectText) => {
    if (!effectText) return '';
    
    return effectText.split('*').map((part, index) => {
      if (index % 2 === 1) {
        // *で囲まれた部分（効果アイコン）
        return <span key={index} className="effect-symbol">[{part}]</span>;
      }
      return part;
    });
  };

  return (
    <div 
      className={`card-component ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      {/* カード画像 */}
      <div className="card-image-container">
        {!imageError ? (
          <img
            src={getImageUrl.cardImage(card.id)}
            alt={card.name}
            className="card-image"
            onError={handleImageError}
          />
        ) : (
          <div className="card-image-placeholder">
            <span>画像なし</span>
            <small>{card.id}</small>
          </div>
        )}
      </div>

      {/* カード情報 */}
      <div className="card-info">
        <div className="card-header">
          <h3 className="card-name">{card.name}</h3>
          <span className="card-id">{card.id}</span>
        </div>

        <div className="card-details">
          {card.card_term_name && (
            <div className="card-detail">
              <span className="label">作品:</span>
              <span className="value">{card.card_term_name}</span>
            </div>
          )}

          {card.card_rank_name && (
            <div className="card-detail">
              <span className="label">セット:</span>
              <span className="value">{card.card_rank_name}</span>
            </div>
          )}

          {card.カード種類 && (
            <div className="card-detail">
              <span className="label">種類:</span>
              <span className="value">{card.カード種類}</span>
            </div>
          )}

          {card.必要エナジー && (
            <div className="card-detail">
              <span className="label">コスト:</span>
              <span className="value energy-cost">
                {renderEnergyText(card.必要エナジー)}
              </span>
            </div>
          )}

          {card.BP && (
            <div className="card-detail">
              <span className="label">BP:</span>
              <span className="value bp">{card.BP}</span>
            </div>
          )}

          {card.消費AP && (
            <div className="card-detail">
              <span className="label">AP:</span>
              <span className="value">{card.消費AP}</span>
            </div>
          )}

          {card.特徴 && (
            <div className="card-detail">
              <span className="label">特徴:</span>
              <span className="value">{card.特徴}</span>
            </div>
          )}

          {card.発生エナジー && (
            <div className="card-detail">
              <span className="label">発生エナジー:</span>
              <span className="value energy-generate">
                {renderGeneratedEnergyText(card.発生エナジー)}
              </span>
            </div>
          )}

          {card.効果 && (
            <div className="card-detail effect">
              <span className="label">効果:</span>
              <div className="value effect-text">
                {renderEffectText(card.効果)}
              </div>
            </div>
          )}

          {card.トリガー && (
            <div className="card-detail trigger">
              <span className="label">トリガー:</span>
              <div className="value trigger-text">
                {renderEffectText(card.トリガー)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardComponent;