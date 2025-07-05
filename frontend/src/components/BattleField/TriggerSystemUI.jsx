// 詳細トリガーシステム実装
// src/components/BattleField/TriggerSystemUI.jsx

import React, { useState, useEffect } from 'react';
import './TriggerSystemUI.css';

const TriggerSystemUI = ({ 
  triggerCards, 
  onResolveTrigger, 
  onSkipTrigger,
  isActive,
  damagedPlayer,
  damageAmount 
}) => {
  const [currentTriggerIndex, setCurrentTriggerIndex] = useState(0);
  const [resolvingTrigger, setResolvingTrigger] = useState(false);
  const [triggerResolutions, setTriggerResolutions] = useState([]);

  useEffect(() => {
    if (triggerCards.length > 0) {
      setCurrentTriggerIndex(0);
      setTriggerResolutions([]);
    }
  }, [triggerCards]);

  const currentTrigger = triggerCards[currentTriggerIndex];

  const handleResolveTrigger = async (resolution) => {
    setResolvingTrigger(true);
    
    const triggerResult = {
      card: currentTrigger.card,
      triggerType: currentTrigger.triggerType,
      resolution,
      effects: resolution.effects || []
    };

    setTriggerResolutions(prev => [...prev, triggerResult]);
    
    // トリガー効果を実行
    await onResolveTrigger(triggerResult);
    
    setResolvingTrigger(false);
    
    // 次のトリガーに進む
    if (currentTriggerIndex < triggerCards.length - 1) {
      setCurrentTriggerIndex(prev => prev + 1);
    } else {
      // すべてのトリガーが解決された
      setTimeout(() => {
        onSkipTrigger(); // トリガーシステムを終了
      }, 1000);
    }
  };

  const handleSkipTrigger = () => {
    const skipResult = {
      card: currentTrigger.card,
      triggerType: currentTrigger.triggerType,
      resolution: { action: 'skip', effects: [] }
    };

    setTriggerResolutions(prev => [...prev, skipResult]);
    
    onSkipTrigger();
  };

  // トリガー効果の選択肢を生成
  const generateTriggerOptions = (trigger) => {
    const options = [];
    
    if (trigger.triggerType === 'trigger') {
      // [Trigger]効果の処理
      const effectText = trigger.effect?.description || '';
      
      if (effectText.includes('ドロー') || effectText.includes('引く')) {
        const drawMatch = effectText.match(/(\d+)枚.*引く/);
        const drawCount = drawMatch ? parseInt(drawMatch[1]) : 1;
        options.push({
          action: 'draw',
          description: `カードを${drawCount}枚ドローする`,
          effects: [{ type: 'draw', amount: drawCount }]
        });
      }
      
      if (effectText.includes('BP') && effectText.includes('+')) {
        const bpMatch = effectText.match(/BP\+(\d+)/);
        const bpBonus = bpMatch ? parseInt(bpMatch[1]) : 1000;
        options.push({
          action: 'bp_boost',
          description: `キャラクターのBPを+${bpBonus}する`,
          effects: [{ type: 'bp_modify', amount: bpBonus }]
        });
      }
      
      if (effectText.includes('エナジー')) {
        options.push({
          action: 'energy_add',
          description: 'エナジーを追加する',
          effects: [{ type: 'energy_add', amount: 1 }]
        });
      }
      
      if (effectText.includes('破壊') || effectText.includes('除去')) {
        options.push({
          action: 'destroy',
          description: 'キャラクターを破壊する',
          effects: [{ type: 'destroy_character' }]
        });
      }

      // 汎用的なトリガー効果
      if (options.length === 0) {
        options.push({
          action: 'generic',
          description: 'トリガー効果を発動する',
          effects: [{ type: 'generic_trigger', description: effectText }]
        });
      }
    } else if (trigger.triggerType === 'final') {
      // ▼Final▼効果の処理
      options.push({
        action: 'final_trigger',
        description: '▼Final▼効果を発動する',
        effects: [{ type: 'final_trigger', description: trigger.effect?.description }]
      });
    }
    
    // スキップオプションを常に追加
    options.push({
      action: 'skip',
      description: 'トリガーを発動しない',
      effects: []
    });
    
    return options;
  };

  if (!isActive || triggerCards.length === 0) {
    return null;
  }

  const triggerOptions = generateTriggerOptions(currentTrigger);

  return (
    <div className="trigger-system-ui">
      <div className="trigger-overlay">
        <div className="trigger-modal">
          <div className="trigger-header">
            <h2>トリガーチェック！</h2>
            <div className="damage-info">
              <span className="damage-text">
                {damagedPlayer}に{damageAmount}ダメージ
              </span>
              <span className="trigger-count">
                {currentTriggerIndex + 1} / {triggerCards.length}
              </span>
            </div>
          </div>

          <div className="trigger-card-display">
            <div className="triggered-card">
              <img 
                src={`/api/v1/images/cards/${currentTrigger.card.card_id}`}
                alt={currentTrigger.card.name}
                className="trigger-card-image"
              />
              <div className="trigger-card-info">
                <h3>{currentTrigger.card.name}</h3>
                <div className="trigger-type-badge">
                  {currentTrigger.triggerType === 'trigger' ? '[Trigger]' : '▼Final▼'}
                </div>
                <div className="trigger-effect-text">
                  {currentTrigger.effect?.description || 'トリガー効果'}
                </div>
              </div>
            </div>
          </div>

          <div className="trigger-options">
            <h4>効果の選択</h4>
            <div className="option-buttons">
              {triggerOptions.map((option, index) => (
                <button
                  key={index}
                  className={`trigger-option-button ${option.action}`}
                  onClick={() => handleResolveTrigger(option)}
                  disabled={resolvingTrigger}
                >
                  <div className="option-title">
                    {option.action === 'skip' ? 'スキップ' : '発動'}
                  </div>
                  <div className="option-description">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {triggerResolutions.length > 0 && (
            <div className="trigger-resolution-log">
              <h4>解決済みトリガー</h4>
              <div className="resolution-list">
                {triggerResolutions.map((resolution, index) => (
                  <div key={index} className="resolution-item">
                    <span className="resolved-card">{resolution.card.name}</span>
                    <span className="resolution-action">
                      {resolution.resolution.action === 'skip' ? 'スキップ' : '発動'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="trigger-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentTriggerIndex + 1) / triggerCards.length) * 100}%` }}
              ></div>
            </div>
            <div className="progress-text">
              トリガー解決中... ({currentTriggerIndex + 1}/{triggerCards.length})
            </div>
          </div>

          {resolvingTrigger && (
            <div className="resolving-indicator">
              <div className="spinner"></div>
              <span>効果を解決中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// トリガー効果処理システム
export class TriggerEffectProcessor {
  constructor(gameManager, gameState, setGameState, addBattleLog, soundManager) {
    this.gameManager = gameManager;
    this.gameState = gameState;
    this.setGameState = setGameState;
    this.addBattleLog = addBattleLog;
    this.soundManager = soundManager;
  }

  async processTriggerEffect(triggerResult) {
    const effects = triggerResult.effects || [];
    
    for (const effect of effects) {
      await this.executeEffect(effect, triggerResult);
    }
  }

  async executeEffect(effect, triggerResult) {
    switch (effect.type) {
      case 'draw':
        await this.executeDrawEffect(effect.amount, triggerResult);
        break;
      case 'bp_modify':
        await this.executeBPModifyEffect(effect.amount, triggerResult);
        break;
      case 'energy_add':
        await this.executeEnergyAddEffect(effect.amount, triggerResult);
        break;
      case 'destroy_character':
        await this.executeDestroyEffect(triggerResult);
        break;
      case 'final_trigger':
        await this.executeFinalTriggerEffect(effect, triggerResult);
        break;
      case 'generic_trigger':
        await this.executeGenericTriggerEffect(effect, triggerResult);
        break;
      default:
        this.addBattleLog(`未知の効果タイプ: ${effect.type}`);
    }
  }

  async executeDrawEffect(amount, triggerResult) {
    const player = triggerResult.card.owner || 'player'; // デフォルトはプレイヤー
    
    if (player === 'player') {
      if (this.gameState.playerDeck.length >= amount) {
        const drawnCards = this.gameState.playerDeck.slice(0, amount);
        const newDeck = this.gameState.playerDeck.slice(amount);
        const newHand = [...this.gameState.playerHand, ...drawnCards];
        
        this.setGameState(prev => ({
          ...prev,
          playerHand: newHand,
          playerDeck: newDeck
        }));
        
        this.addBattleLog(`${triggerResult.card.name}の効果で${amount}枚ドロー`);
        this.soundManager.playSFX('draw');
      }
    } else {
      // 相手のドロー処理
      if (this.gameState.opponentDeck.length >= amount) {
        const newOpponentHand = [...this.gameState.opponentHand];
        const newOpponentDeck = this.gameState.opponentDeck.slice(amount);
        
        for (let i = 0; i < amount; i++) {
          newOpponentHand.push({ id: `opponent_draw_${Date.now()}_${i}` });
        }
        
        this.setGameState(prev => ({
          ...prev,
          opponentHand: newOpponentHand,
          opponentDeck: newOpponentDeck
        }));
        
        this.addBattleLog(`対戦相手が${triggerResult.card.name}の効果で${amount}枚ドロー`);
      }
    }
  }

  async executeBPModifyEffect(amount, triggerResult) {
    // BP修正効果の実装
    // 対象キャラクターの選択UIが必要（簡略化版では自動選択）
    const player = triggerResult.card.owner || 'player';
    const frontLine = player === 'player' ? this.gameState.playerFrontLine : this.gameState.opponentFrontLine;
    
    // 最初の有効なキャラクターを対象とする（簡略化）
    const targetIndex = frontLine.findIndex(card => card && !card.isResting);
    
    if (targetIndex !== -1) {
      const newFrontLine = [...frontLine];
      const targetCard = { ...newFrontLine[targetIndex] };
      
      // BP修正を適用
      if (!targetCard.bpModifiers) {
        targetCard.bpModifiers = [];
      }
      
      targetCard.bpModifiers.push({
        source: triggerResult.card.name,
        value: amount,
        duration: 'permanent' // 永続効果
      });
      
      newFrontLine[targetIndex] = targetCard;
      
      if (player === 'player') {
        this.setGameState(prev => ({ ...prev, playerFrontLine: newFrontLine }));
      } else {
        this.setGameState(prev => ({ ...prev, opponentFrontLine: newFrontLine }));
      }
      
      this.addBattleLog(`${targetCard.name}のBPが+${amount}されました`);
      this.soundManager.playSFX('power_up');
    }
  }

  async executeEnergyAddEffect(amount, triggerResult) {
    // エナジー追加効果（簡略化：全色に1ずつ追加）
    const player = triggerResult.card.owner || 'player';
    
    if (player === 'player') {
      this.setGameState(prev => ({
        ...prev,
        playerEnergy: {
          red: prev.playerEnergy.red + amount,
          blue: prev.playerEnergy.blue + amount,
          green: prev.playerEnergy.green + amount,
          yellow: prev.playerEnergy.yellow + amount,
          purple: prev.playerEnergy.purple + amount
        }
      }));
    } else {
      this.setGameState(prev => ({
        ...prev,
        opponentEnergy: {
          red: prev.opponentEnergy.red + amount,
          blue: prev.opponentEnergy.blue + amount,
          green: prev.opponentEnergy.green + amount,
          yellow: prev.opponentEnergy.yellow + amount,
          purple: prev.opponentEnergy.purple + amount
        }
      }));
    }
    
    this.addBattleLog(`${triggerResult.card.name}の効果でエナジーが追加されました`);
    this.soundManager.playSFX('energy_boost');
  }

  async executeDestroyEffect(triggerResult) {
    // キャラクター破壊効果（簡略化：相手の最初のキャラクターを破壊）
    const player = triggerResult.card.owner || 'player';
    const targetLine = player === 'player' ? this.gameState.opponentFrontLine : this.gameState.playerFrontLine;
    
    const targetIndex = targetLine.findIndex(card => card);
    
    if (targetIndex !== -1) {
      const destroyedCard = targetLine[targetIndex];
      const newLine = [...targetLine];
      newLine[targetIndex] = null;
      
      if (player === 'player') {
        this.setGameState(prev => ({ ...prev, opponentFrontLine: newLine }));
      } else {
        this.setGameState(prev => ({ ...prev, playerFrontLine: newLine }));
      }
      
      this.addBattleLog(`${triggerResult.card.name}の効果で${destroyedCard.name}が破壊されました`);
      this.soundManager.playSFX('destroy');
    }
  }

  async executeFinalTriggerEffect(effect, triggerResult) {
    // ▼Final▼効果の処理
    this.addBattleLog(`${triggerResult.card.name}の▼Final▼効果が発動！`);
    this.addBattleLog(effect.description || 'ファイナル効果');
    this.soundManager.playSFX('final_trigger');
    
    // 具体的な▼Final▼効果の実装はカードごとに異なる
    // ここでは汎用的な処理のみ
  }

  async executeGenericTriggerEffect(effect, triggerResult) {
    // 汎用トリガー効果の処理
    this.addBattleLog(`${triggerResult.card.name}のトリガー効果が発動！`);
    this.addBattleLog(effect.description || 'トリガー効果');
    this.soundManager.playSFX('trigger_activate');
  }
}

export default TriggerSystemUI;