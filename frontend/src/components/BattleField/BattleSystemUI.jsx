        // 完全なバトルシステム実装
// src/components/BattleField/BattleSystemUI.jsx

import React, { useState, useEffect } from 'react';
import './BattleSystemUI.css';

const BattleSystemUI = ({ 
  gameState, 
  onAttack, 
  onBlock, 
  onResolveBattle, 
  onCancelBattle,
  battleState,
  isPlayerTurn,
  currentPhase 
}) => {
  const [selectedAttacker, setSelectedAttacker] = useState(null);
  const [selectedBlocker, setSelectedBlocker] = useState(null);
  const [battleStep, setBattleStep] = useState('none'); // none, declare_attack, declare_block, resolve

  useEffect(() => {
    if (battleState.battleInProgress) {
      if (battleState.attackingCharacter && !battleState.blockingCharacter) {
        setBattleStep('declare_block');
      } else if (battleState.attackingCharacter && battleState.blockingCharacter) {
        setBattleStep('resolve');
      }
    } else {
      setBattleStep('none');
      setSelectedAttacker(null);
      setSelectedBlocker(null);
    }
  }, [battleState]);

  // 攻撃可能なキャラクターかチェック
  const canAttack = (character) => {
    return character && 
           !character.isResting && 
           !character.isSummoningSick &&
           isPlayerTurn && 
           currentPhase === 'main' &&
           battleStep === 'none';
  };

  // ブロック可能なキャラクターかチェック
  const canBlock = (character) => {
    return character && 
           !character.isResting && 
           battleStep === 'declare_block';
  };

  // 攻撃宣言
  const handleAttackClick = (character, position) => {
    if (!canAttack(character)) return;
    
    setSelectedAttacker({ character, position });
    setBattleStep('declare_attack');
  };

  // 攻撃確定
  const confirmAttack = () => {
    if (!selectedAttacker) return;
    
    onAttack(selectedAttacker.character, selectedAttacker.position);
    setSelectedAttacker(null);
  };

  // ブロック宣言
  const handleBlockClick = (character, position) => {
    if (!canBlock(character)) return;
    
    setSelectedBlocker({ character, position });
  };

  // ブロック確定
  const confirmBlock = () => {
    if (!selectedBlocker) return;
    
    onBlock(selectedBlocker.character, selectedBlocker.position, battleState.attackingCharacter);
    setSelectedBlocker(null);
  };

  // ブロックしない
  const skipBlock = () => {
    setBattleStep('resolve');
  };

  // バトル解決
  const resolveBattle = () => {
    onResolveBattle();
  };

  // バトルキャンセル
  const cancelBattle = () => {
    onCancelBattle();
    setBattleStep('none');
    setSelectedAttacker(null);
    setSelectedBlocker(null);
  };

  return (
    <div className="battle-system-ui">
      {/* 攻撃宣言フェーズ */}
      {battleStep === 'declare_attack' && (
        <div className="battle-modal">
          <div className="battle-modal-content">
            <h3>攻撃宣言</h3>
            <div className="attacker-info">
              <img 
                src={`/api/v1/images/cards/${selectedAttacker.character.card_id}`}
                alt={selectedAttacker.character.name}
                className="battle-card-image"
              />
              <div className="card-stats">
                <p><strong>{selectedAttacker.character.name}</strong></p>
                <p>BP: {selectedAttacker.character.bp}</p>
                <p>AP: {selectedAttacker.character.ap || 0}</p>
              </div>
            </div>
            <div className="battle-buttons">
              <button 
                className="confirm-button attack-button" 
                onClick={confirmAttack}
              >
                攻撃する
              </button>
              <button 
                className="cancel-button" 
                onClick={cancelBattle}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ブロック宣言フェーズ */}
      {battleStep === 'declare_block' && (
        <div className="battle-modal">
          <div className="battle-modal-content">
            <h3>ブロック宣言</h3>
            <div className="battle-info">
              <div className="attacker-display">
                <h4>攻撃キャラクター</h4>
                <img 
                  src={`/api/v1/images/cards/${battleState.attackingCharacter.card_id}`}
                  alt={battleState.attackingCharacter.name}
                  className="battle-card-image"
                />
                <p>{battleState.attackingCharacter.name}</p>
                <p>BP: {battleState.attackingCharacter.bp}</p>
              </div>
              {selectedBlocker && (
                <div className="blocker-display">
                  <h4>ブロックキャラクター</h4>
                  <img 
                    src={`/api/v1/images/cards/${selectedBlocker.character.card_id}`}
                    alt={selectedBlocker.character.name}
                    className="battle-card-image"
                  />
                  <p>{selectedBlocker.character.name}</p>
                  <p>BP: {selectedBlocker.character.bp}</p>
                </div>
              )}
            </div>
            <div className="battle-instruction">
              <p>{selectedBlocker ? 
                'ブロックするキャラクターを選択しました' : 
                'ブロックするキャラクターを選択してください'
              }</p>
            </div>
            <div className="battle-buttons">
              {selectedBlocker ? (
                <button 
                  className="confirm-button block-button" 
                  onClick={confirmBlock}
                >
                  ブロック確定
                </button>
              ) : (
                <button 
                  className="skip-button" 
                  onClick={skipBlock}
                >
                  ブロックしない
                </button>
              )}
              <button 
                className="cancel-button" 
                onClick={cancelBattle}
              >
                攻撃キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* バトル解決フェーズ */}
      {battleStep === 'resolve' && (
        <div className="battle-modal">
          <div className="battle-modal-content">
            <h3>バトル解決</h3>
            <div className="battle-resolution">
              <div className="battle-participants">
                <div className="attacker-final">
                  <h4>攻撃側</h4>
                  <img 
                    src={`/api/v1/images/cards/${battleState.attackingCharacter.card_id}`}
                    alt={battleState.attackingCharacter.name}
                    className="battle-card-image"
                  />
                  <p>{battleState.attackingCharacter.name}</p>
                  <p className="bp-display">BP: {battleState.attackingCharacter.bp}</p>
                </div>
                
                <div className="vs-indicator">VS</div>
                
                {battleState.blockingCharacter ? (
                  <div className="blocker-final">
                    <h4>ブロック側</h4>
                    <img 
                      src={`/api/v1/images/cards/${battleState.blockingCharacter.card_id}`}
                      alt={battleState.blockingCharacter.name}
                      className="battle-card-image"
                    />
                    <p>{battleState.blockingCharacter.name}</p>
                    <p className="bp-display">BP: {battleState.blockingCharacter.bp}</p>
                  </div>
                ) : (
                  <div className="no-blocker">
                    <h4>ブロックなし</h4>
                    <div className="player-damage-preview">
                      <p>プレイヤーに1ダメージ</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="battle-prediction">
                {battleState.blockingCharacter ? (
                  <div className="battle-result-preview">
                    {parseInt(battleState.attackingCharacter.bp) > parseInt(battleState.blockingCharacter.bp) ? (
                      <p className="attacker-wins">攻撃側勝利 - ブロックキャラクターが破壊されます</p>
                    ) : parseInt(battleState.attackingCharacter.bp) < parseInt(battleState.blockingCharacter.bp) ? (
                      <p className="blocker-wins">ブロック側勝利 - 攻撃キャラクターが破壊されます</p>
                    ) : (
                      <p className="tie-result">BP同値 - 攻撃側勝利でブロックキャラクターが破壊されます</p>
                    )}
                  </div>
                ) : (
                  <p className="direct-damage">ダイレクトアタック - プレイヤーに1ダメージ</p>
                )}
              </div>
            </div>
            
            <div className="battle-buttons">
              <button 
                className="confirm-button resolve-button" 
                onClick={resolveBattle}
              >
                バトル解決
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フィールドキャラクターのバトル状態表示 */}
      <div className="battle-field-overlay">
        {/* プレイヤーフロントライン */}
        <div className="player-front-battle">
          {gameState.playerFrontLine.map((character, index) => (
            character && (
              <div 
                key={index}
                className={`battle-character ${
                  canAttack(character) ? 'can-attack' : ''
                } ${
                  selectedAttacker?.position === index ? 'selected-attacker' : ''
                } ${
                  battleState.attackingCharacter?.uniqueId === character.uniqueId ? 'attacking' : ''
                }`}
                onClick={() => handleAttackClick(character, index)}
              >
                {canAttack(character) && (
                  <div className="attack-indicator">⚔️</div>
                )}
                {character.isResting && (
                  <div className="rest-indicator">💤</div>
                )}
              </div>
            )
          ))}
        </div>

        {/* 相手フロントライン */}
        <div className="opponent-front-battle">
          {gameState.opponentFrontLine.map((character, index) => (
            character && (
              <div 
                key={index}
                className={`battle-character ${
                  canBlock(character) ? 'can-block' : ''
                } ${
                  selectedBlocker?.position === index ? 'selected-blocker' : ''
                } ${
                  battleState.blockingCharacter?.uniqueId === character.uniqueId ? 'blocking' : ''
                }`}
                onClick={() => handleBlockClick(character, index)}
              >
                {canBlock(character) && (
                  <div className="block-indicator">🛡️</div>
                )}
                {character.isResting && (
                  <div className="rest-indicator">💤</div>
                )}
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default BattleSystemUI;