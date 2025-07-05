// Movement Phase実装
// src/components/BattleField/MovementPhaseUI.jsx

import React, { useState, useEffect } from 'react';
import './MovementPhaseUI.css';

const MovementPhaseUI = ({ 
  gameState, 
  onMoveCharacter, 
  cardDetails,
  isPlayerTurn,
  currentPhase,
  onNextPhase
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [draggedCharacter, setDraggedCharacter] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  useEffect(() => {
    if (selectedCharacter) {
      calculateAvailableDestinations();
    } else {
      setAvailableDestinations([]);
    }
  }, [selectedCharacter, gameState]);

  // 移動可能な場所を計算
  const calculateAvailableDestinations = () => {
    if (!selectedCharacter) return;

    const destinations = [];
    const { character, line: fromLine, position: fromPos } = selectedCharacter;
    
    // Front LineからEnergy Lineへの移動は▼Step▼能力が必要
    if (fromLine === 'front') {
      const cardDetail = cardDetails[character.card_id]?.data;
      const hasStepAbility = cardDetail?.能力?.includes('▼Step▼');
      
      if (hasStepAbility) {
        // Energy Lineの空きスロットをチェック
        gameState.playerEnergyLine.forEach((slot, index) => {
          if (slot === null) {
            destinations.push({ line: 'energy', position: index });
          }
        });
      }
    }
    
    // Energy LineからFront Lineへの移動は常に可能
    if (fromLine === 'energy') {
      gameState.playerFrontLine.forEach((slot, index) => {
        if (slot === null) {
          destinations.push({ line: 'front', position: index });
        }
      });
    }
    
    // 同じライン内での位置変更
    const currentLine = fromLine === 'front' ? gameState.playerFrontLine : gameState.playerEnergyLine;
    currentLine.forEach((slot, index) => {
      if (slot === null && index !== fromPos) {
        destinations.push({ line: fromLine, position: index });
      }
    });

    setAvailableDestinations(destinations);
  };

  // キャラクター移動可能チェック
  const canMoveCharacter = (character, fromLine) => {
    return character && 
           isPlayerTurn && 
           currentPhase === 'movement' &&
           !character.isResting; // レスト状態のキャラクターは移動不可
  };

  // キャラクター選択
  const handleCharacterClick = (character, line, position) => {
    if (!canMoveCharacter(character, line)) return;

    setSelectedCharacter({ character, line, position });
  };

  // 移動先クリック
  const handleDestinationClick = (toLine, toPosition) => {
    if (!selectedCharacter) return;
    
    const isValidDestination = availableDestinations.some(
      dest => dest.line === toLine && dest.position === toPosition
    );
    
    if (!isValidDestination) return;

    const { character, line: fromLine, position: fromPosition } = selectedCharacter;
    
    onMoveCharacter(fromLine, fromPosition, toLine, toPosition);
    setSelectedCharacter(null);
  };

  // ドラッグ開始
  const handleDragStart = (e, character, line, position) => {
    if (!canMoveCharacter(character, line)) {
      e.preventDefault();
      return;
    }

    setDraggedCharacter({ character, line, position });
    e.dataTransfer.setData('text/plain', ''); // Firefox対応
  };

  // ドラッグオーバー
  const handleDragOver = (e, toLine, toPosition) => {
    e.preventDefault();
    
    if (!draggedCharacter) return;

    // 移動可能かチェック
    const { character, line: fromLine, position: fromPosition } = draggedCharacter;
    
    if (fromLine === fromLine && fromPosition === toPosition) {
      // 同じ位置
      setDragOverSlot(null);
      return;
    }

    // Front LineからEnergy Lineへの移動チェック
    if (fromLine === 'front' && toLine === 'energy') {
      const cardDetail = cardDetails[character.card_id]?.data;
      const hasStepAbility = cardDetail?.能力?.includes('▼Step▼');
      
      if (!hasStepAbility) {
        setDragOverSlot(null);
        return;
      }
    }

    // 移動先が空いているかチェック
    const toLineArray = toLine === 'front' ? gameState.playerFrontLine : gameState.playerEnergyLine;
    if (toLineArray[toPosition] !== null) {
      setDragOverSlot(null);
      return;
    }

    setDragOverSlot({ line: toLine, position: toPosition });
  };

  // ドラッグリーブ
  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  // ドロップ
  const handleDrop = (e, toLine, toPosition) => {
    e.preventDefault();
    
    if (!draggedCharacter || !dragOverSlot) return;

    const { line: fromLine, position: fromPosition } = draggedCharacter;
    onMoveCharacter(fromLine, fromPosition, toLine, toPosition);
    
    setDraggedCharacter(null);
    setDragOverSlot(null);
  };

  // ドラッグ終了
  const handleDragEnd = () => {
    setDraggedCharacter(null);
    setDragOverSlot(null);
  };

  // 移動キャンセル
  const cancelMovement = () => {
    setSelectedCharacter(null);
    setAvailableDestinations([]);
  };

  // ▼Step▼能力チェック
  const hasStepAbility = (character) => {
    const cardDetail = cardDetails[character.card_id]?.data;
    return cardDetail?.能力?.includes('▼Step▼');
  };

  if (currentPhase !== 'movement' || !isPlayerTurn) {
    return null;
  }

  return (
    <div className="movement-phase-ui">
      {/* Movement Phase説明 */}
      <div className="movement-instructions">
        <div className="movement-header">
          <h3>ムーブメントフェーズ</h3>
          <p>キャラクターを移動できます</p>
        </div>
        <div className="movement-rules">
          <ul>
            <li>エナジーライン ⇄ フロントライン: 自由に移動可能</li>
            <li>フロントライン → エナジーライン: ▼Step▼能力が必要</li>
            <li>レスト状態のキャラクターは移動不可</li>
            <li>移動先は空いているスロットのみ</li>
          </ul>
        </div>
      </div>

      {/* 選択状態の表示 */}
      {selectedCharacter && (
        <div className="selected-character-info">
          <div className="selected-card-display">
            <img 
              src={`/api/v1/images/cards/${selectedCharacter.character.card_id}`}
              alt={selectedCharacter.character.name}
              className="selected-card-image"
            />
            <div className="selected-card-details">
              <h4>{selectedCharacter.character.name}</h4>
              <p>移動元: {selectedCharacter.line === 'front' ? 'フロントライン' : 'エナジーライン'} {selectedCharacter.position + 1}</p>
              {selectedCharacter.line === 'front' && (
                <p className={hasStepAbility(selectedCharacter.character) ? 'has-step' : 'no-step'}>
                  ▼Step▼能力: {hasStepAbility(selectedCharacter.character) ? 'あり' : 'なし'}
                </p>
              )}
              <p>移動可能先: {availableDestinations.length}箇所</p>
            </div>
          </div>
          <button 
            className="cancel-movement-button"
            onClick={cancelMovement}
          >
            移動キャンセル
          </button>
          <button 
            className="next-phase-button"
            onClick={onNextPhase}
            style={{
              marginLeft: '10px',
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            次のフェーズへ
          </button>
        </div>
      )}

      {/* フィールドオーバーレイ */}
      <div className="movement-field-overlay">
        {/* プレイヤーフロントライン */}
        <div className="movement-front-line">
          <h4>フロントライン</h4>
          <div className="movement-line-slots">
            {gameState.playerFrontLine.map((character, index) => (
              <div 
                key={index}
                className={`movement-slot front-slot ${
                  character ? 'occupied' : 'empty'
                } ${
                  selectedCharacter?.line === 'front' && selectedCharacter?.position === index ? 'selected-source' : ''
                } ${
                  availableDestinations.some(dest => dest.line === 'front' && dest.position === index) ? 'available-destination' : ''
                } ${
                  dragOverSlot?.line === 'front' && dragOverSlot?.position === index ? 'drag-over' : ''
                } ${
                  draggedCharacter?.line === 'front' && draggedCharacter?.position === index ? 'being-dragged' : ''
                }`}
                onClick={() => character ? 
                  handleCharacterClick(character, 'front', index) : 
                  handleDestinationClick('front', index)
                }
                onDragOver={(e) => handleDragOver(e, 'front', index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'front', index)}
              >
                {character ? (
                  <div 
                    className={`movement-character ${
                      canMoveCharacter(character, 'front') ? 'moveable' : 'immovable'
                    }`}
                    draggable={canMoveCharacter(character, 'front')}
                    onDragStart={(e) => handleDragStart(e, character, 'front', index)}
                    onDragEnd={handleDragEnd}
                  >
                    <img 
                      src={`/api/v1/images/cards/${character.card_id}`}
                      alt={character.name}
                      className="movement-card-image"
                    />
                    {character.isResting && (
                      <div className="rest-overlay">💤</div>
                    )}
                    {canMoveCharacter(character, 'front') && (
                      <div className="move-indicator">📱</div>
                    )}
                    {hasStepAbility(character) && (
                      <div className="step-indicator">▼Step▼</div>
                    )}
                  </div>
                ) : (
                  <div className="empty-slot-content">
                    {availableDestinations.some(dest => dest.line === 'front' && dest.position === index) && (
                      <div className="destination-indicator">
                        <span>移動先</span>
                        <div className="destination-arrow">↓</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* プレイヤーエナジーライン */}
        <div className="movement-energy-line">
          <h4>エナジーライン</h4>
          <div className="movement-line-slots">
            {gameState.playerEnergyLine.map((character, index) => (
              <div 
                key={index}
                className={`movement-slot energy-slot ${
                  character ? 'occupied' : 'empty'
                } ${
                  selectedCharacter?.line === 'energy' && selectedCharacter?.position === index ? 'selected-source' : ''
                } ${
                  availableDestinations.some(dest => dest.line === 'energy' && dest.position === index) ? 'available-destination' : ''
                } ${
                  dragOverSlot?.line === 'energy' && dragOverSlot?.position === index ? 'drag-over' : ''
                } ${
                  draggedCharacter?.line === 'energy' && draggedCharacter?.position === index ? 'being-dragged' : ''
                }`}
                onClick={() => character ? 
                  handleCharacterClick(character, 'energy', index) : 
                  handleDestinationClick('energy', index)
                }
                onDragOver={(e) => handleDragOver(e, 'energy', index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'energy', index)}
              >
                {character ? (
                  <div 
                    className={`movement-character ${
                      canMoveCharacter(character, 'energy') ? 'moveable' : 'immovable'
                    }`}
                    draggable={canMoveCharacter(character, 'energy')}
                    onDragStart={(e) => handleDragStart(e, character, 'energy', index)}
                    onDragEnd={handleDragEnd}
                  >
                    <img 
                      src={`/api/v1/images/cards/${character.card_id}`}
                      alt={character.name}
                      className="movement-card-image"
                    />
                    {character.isResting && (
                      <div className="rest-overlay">💤</div>
                    )}
                    {canMoveCharacter(character, 'energy') && (
                      <div className="move-indicator">📱</div>
                    )}
                    <div className="energy-indicator">⚡</div>
                  </div>
                ) : (
                  <div className="empty-slot-content">
                    {availableDestinations.some(dest => dest.line === 'energy' && dest.position === index) && (
                      <div className="destination-indicator">
                        <span>移動先</span>
                        <div className="destination-arrow">↓</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 移動中の説明 */}
      {draggedCharacter && (
        <div className="drag-instructions">
          <div className="drag-info">
            <h4>キャラクター移動中</h4>
            <p>{draggedCharacter.character.name}を移動先にドロップしてください</p>
            {draggedCharacter.line === 'front' && !hasStepAbility(draggedCharacter.character) && (
              <p className="step-warning">
                ⚠️ このキャラクターは▼Step▼能力がないため、エナジーラインに移動できません
              </p>
            )}
          </div>
        </div>
      )}

      {/* 常に表示される次のフェーズボタン */}
      <div className="movement-controls" style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <button 
          className="next-phase-button"
          onClick={onNextPhase}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
        >
          次のフェーズへ
        </button>
      </div>
    </div>
  );
};

export default MovementPhaseUI;