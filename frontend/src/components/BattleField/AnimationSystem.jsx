// アニメーションシステム
// src/components/BattleField/AnimationSystem.jsx

import React, { useState, useEffect, useRef } from 'react';
import './AnimationSystem.css';

// アニメーションタイプの定義
export const ANIMATION_TYPES = {
  CARD_PLAY: 'card_play',
  CARD_DRAW: 'card_draw',
  ATTACK: 'attack',
  BLOCK: 'block',
  DAMAGE: 'damage',
  DESTROY: 'destroy',
  HEAL: 'heal',
  ENERGY_BOOST: 'energy_boost',
  TRIGGER: 'trigger',
  MOVE: 'move',
  PHASE_CHANGE: 'phase_change'
};

// アニメーション管理システム
export class AnimationManager {
  constructor() {
    this.activeAnimations = new Map();
    this.animationQueue = [];
    this.isPlaying = false;
    this.callbacks = new Map();
  }

  // アニメーションをキューに追加
  queueAnimation(animation) {
    const id = `anim_${Date.now()}_${Math.random()}`;
    const animationWithId = { ...animation, id };
    
    this.animationQueue.push(animationWithId);
    
    if (!this.isPlaying) {
      this.playNext();
    }
    
    return id;
  }

  // 次のアニメーションを再生
  async playNext() {
    if (this.animationQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const animation = this.animationQueue.shift();
    
    this.activeAnimations.set(animation.id, animation);
    
    // アニメーション開始コールバック
    if (this.callbacks.has('onAnimationStart')) {
      this.callbacks.get('onAnimationStart')(animation);
    }

    // アニメーション実行
    try {
      await this.executeAnimation(animation);
    } catch (error) {
      console.error('Animation error:', error);
    }

    this.activeAnimations.delete(animation.id);
    
    // アニメーション終了コールバック
    if (this.callbacks.has('onAnimationEnd')) {
      this.callbacks.get('onAnimationEnd')(animation);
    }

    // 次のアニメーションを再生
    setTimeout(() => this.playNext(), animation.delay || 100);
  }

  // アニメーション実行
  async executeAnimation(animation) {
    return new Promise((resolve) => {
      const duration = animation.duration || 1000;
      setTimeout(resolve, duration);
    });
  }

  // コールバック設定
  setCallback(event, callback) {
    this.callbacks.set(event, callback);
  }

  // すべてのアニメーションをクリア
  clearAll() {
    this.animationQueue.length = 0;
    this.activeAnimations.clear();
    this.isPlaying = false;
  }

  // アクティブなアニメーション取得
  getActiveAnimations() {
    return Array.from(this.activeAnimations.values());
  }
}

// アニメーション表示コンポーネント
const AnimationSystem = ({ animationManager, gameState }) => {
  const [activeAnimations, setActiveAnimations] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!animationManager) return;

    const updateAnimations = () => {
      setActiveAnimations(animationManager.getActiveAnimations());
    };

    animationManager.setCallback('onAnimationStart', updateAnimations);
    animationManager.setCallback('onAnimationEnd', updateAnimations);

    return () => {
      animationManager.setCallback('onAnimationStart', null);
      animationManager.setCallback('onAnimationEnd', null);
    };
  }, [animationManager]);

  const renderAnimation = (animation) => {
    switch (animation.type) {
      case ANIMATION_TYPES.CARD_PLAY:
        return <CardPlayAnimation key={animation.id} animation={animation} />;
      case ANIMATION_TYPES.ATTACK:
        return <AttackAnimation key={animation.id} animation={animation} />;
      case ANIMATION_TYPES.DAMAGE:
        return <DamageAnimation key={animation.id} animation={animation} />;
      case ANIMATION_TYPES.DESTROY:
        return <DestroyAnimation key={animation.id} animation={animation} />;
      case ANIMATION_TYPES.ENERGY_BOOST:
        return <EnergyBoostAnimation key={animation.id} animation={animation} />;
      case ANIMATION_TYPES.TRIGGER:
        return <TriggerAnimation key={animation.id} animation={animation} />;
      case ANIMATION_TYPES.PHASE_CHANGE:
        return <PhaseChangeAnimation key={animation.id} animation={animation} />;
      default:
        return <GenericAnimation key={animation.id} animation={animation} />;
    }
  };

  return (
    <div className="animation-system" ref={containerRef}>
      {activeAnimations.map(renderAnimation)}
    </div>
  );
};

// カード配置アニメーション
const CardPlayAnimation = ({ animation }) => {
  const { from, to, card } = animation;
  
  return (
    <div className="card-play-animation">
      <div 
        className="flying-card"
        style={{
          '--start-x': `${from.x}px`,
          '--start-y': `${from.y}px`,
          '--end-x': `${to.x}px`,
          '--end-y': `${to.y}px`,
        }}
      >
        <img 
          src={`/api/v1/images/cards/${card.card_id}`}
          alt={card.name}
          className="flying-card-image"
        />
      </div>
      <div className="card-play-effects">
        <div className="energy-particles"></div>
        <div className="magic-circle"></div>
      </div>
    </div>
  );
};

// 攻撃アニメーション
const AttackAnimation = ({ animation }) => {
  const { attacker, target, attackPath } = animation;
  
  return (
    <div className="attack-animation">
      <div className="attack-charge">
        <div className="charge-aura"></div>
        <div className="charge-particles"></div>
      </div>
      <div 
        className="attack-beam"
        style={{
          '--beam-start-x': `${attackPath.start.x}px`,
          '--beam-start-y': `${attackPath.start.y}px`,
          '--beam-end-x': `${attackPath.end.x}px`,
          '--beam-end-y': `${attackPath.end.y}px`,
        }}
      >
        <div className="beam-core"></div>
        <div className="beam-glow"></div>
      </div>
      <div className="impact-effects">
        <div className="impact-burst"></div>
        <div className="impact-rings"></div>
      </div>
    </div>
  );
};

// ダメージアニメーション
const DamageAnimation = ({ animation }) => {
  const { amount, position, color = '#ff4757' } = animation;
  
  return (
    <div 
      className="damage-animation"
      style={{
        '--damage-x': `${position.x}px`,
        '--damage-y': `${position.y}px`,
        '--damage-color': color,
      }}
    >
      <div className="damage-number">
        -{amount}
      </div>
      <div className="damage-splash">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="damage-particle"
            style={{ '--particle-angle': `${i * 45}deg` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// 破壊アニメーション
const DestroyAnimation = ({ animation }) => {
  const { position, card } = animation;
  
  return (
    <div 
      className="destroy-animation"
      style={{
        '--destroy-x': `${position.x}px`,
        '--destroy-y': `${position.y}px`,
      }}
    >
      <div className="destruction-flash"></div>
      <div className="destruction-fragments">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="fragment"
            style={{ 
              '--fragment-angle': `${i * 30}deg`,
              '--fragment-speed': `${Math.random() * 2 + 1}`,
            }}
          ></div>
        ))}
      </div>
      <div className="destruction-smoke"></div>
      <div className="destruction-shockwave"></div>
    </div>
  );
};

// エナジーブーストアニメーション
const EnergyBoostAnimation = ({ animation }) => {
  const { position, color = '#4ecdc4' } = animation;
  
  return (
    <div 
      className="energy-boost-animation"
      style={{
        '--boost-x': `${position.x}px`,
        '--boost-y': `${position.y}px`,
        '--boost-color': color,
      }}
    >
      <div className="energy-spiral">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="spiral-arm"
            style={{ '--arm-delay': `${i * 0.1}s` }}
          ></div>
        ))}
      </div>
      <div className="energy-core"></div>
      <div className="energy-waves">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="energy-wave"
            style={{ '--wave-delay': `${i * 0.2}s` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// トリガーアニメーション
const TriggerAnimation = ({ animation }) => {
  const { position } = animation;
  
  return (
    <div 
      className="trigger-animation"
      style={{
        '--trigger-x': `${position.x}px`,
        '--trigger-y': `${position.y}px`,
      }}
    >
      <div className="trigger-explosion">
        <div className="explosion-core"></div>
        <div className="explosion-rays">
          {[...Array(16)].map((_, i) => (
            <div 
              key={i} 
              className="explosion-ray"
              style={{ '--ray-angle': `${i * 22.5}deg` }}
            ></div>
          ))}
        </div>
      </div>
      <div className="trigger-text">TRIGGER!</div>
      <div className="trigger-sparkles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="sparkle"
            style={{ 
              '--sparkle-x': `${Math.random() * 200 - 100}px`,
              '--sparkle-y': `${Math.random() * 200 - 100}px`,
              '--sparkle-delay': `${Math.random() * 0.5}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// フェーズ変更アニメーション
const PhaseChangeAnimation = ({ animation }) => {
  const { phaseName, phaseColor = '#6c5ce7' } = animation;
  
  return (
    <div className="phase-change-animation">
      <div 
        className="phase-banner"
        style={{ '--phase-color': phaseColor }}
      >
        <div className="banner-glow"></div>
        <div className="phase-text">{phaseName}</div>
        <div className="banner-particles">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i} 
              className="banner-particle"
              style={{ '--particle-delay': `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 汎用アニメーション
const GenericAnimation = ({ animation }) => {
  const { message, position } = animation;
  
  return (
    <div 
      className="generic-animation"
      style={{
        '--anim-x': `${position?.x || 0}px`,
        '--anim-y': `${position?.y || 0}px`,
      }}
    >
      <div className="generic-effect">
        <div className="generic-text">{message}</div>
        <div className="generic-glow"></div>
      </div>
    </div>
  );
};

// アニメーションヘルパー関数
export const createCardPlayAnimation = (card, fromElement, toElement) => {
  const fromRect = fromElement.getBoundingClientRect();
  const toRect = toElement.getBoundingClientRect();
  
  return {
    type: ANIMATION_TYPES.CARD_PLAY,
    card,
    from: { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 },
    to: { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 },
    duration: 800
  };
};

export const createAttackAnimation = (attacker, target, attackerElement, targetElement) => {
  const attackerRect = attackerElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  
  return {
    type: ANIMATION_TYPES.ATTACK,
    attacker,
    target,
    attackPath: {
      start: { x: attackerRect.left + attackerRect.width / 2, y: attackerRect.top + attackerRect.height / 2 },
      end: { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 }
    },
    duration: 1200
  };
};

export const createDamageAnimation = (amount, element, color) => {
  const rect = element.getBoundingClientRect();
  
  return {
    type: ANIMATION_TYPES.DAMAGE,
    amount,
    position: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    color,
    duration: 1000
  };
};

export const createDestroyAnimation = (card, element) => {
  const rect = element.getBoundingClientRect();
  
  return {
    type: ANIMATION_TYPES.DESTROY,
    card,
    position: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    duration: 1500
  };
};

export const createTriggerAnimation = (element) => {
  const rect = element.getBoundingClientRect();
  
  return {
    type: ANIMATION_TYPES.TRIGGER,
    position: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    duration: 2000
  };
};

export const createPhaseChangeAnimation = (phaseName, phaseColor) => {
  return {
    type: ANIMATION_TYPES.PHASE_CHANGE,
    phaseName,
    phaseColor,
    duration: 1500
  };
};

export default AnimationSystem;