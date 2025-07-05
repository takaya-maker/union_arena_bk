// AI対戦相手システム
// src/utils/aiOpponentSystem.js

import { 
    UNION_ARENA_PHASES, 
    UnionArenaEnergyManager, 
    GAME_CONSTANTS 
  } from './unionArenaConstants';
  
  // AI難易度レベル
  export const AI_DIFFICULTY = {
    EASY: 'easy',
    NORMAL: 'normal',
    HARD: 'hard'
  };
  
  // AI戦略タイプ
  export const AI_STRATEGY = {
    AGGRESSIVE: 'aggressive',    // 攻撃重視
    DEFENSIVE: 'defensive',      // 守備重視
    BALANCED: 'balanced',        // バランス型
    CONTROL: 'control'           // コントロール型
  };
  
  export class AIOpponent {
    constructor(difficulty = AI_DIFFICULTY.NORMAL, strategy = AI_STRATEGY.BALANCED) {
      this.difficulty = difficulty;
      this.strategy = strategy;
      this.energyManager = new UnionArenaEnergyManager();
      
      // AI思考パラメータ
      this.thinkingTime = this.getThinkingTime();
      this.decisionWeights = this.getDecisionWeights();
      this.riskTolerance = this.getRiskTolerance();
      
      // AIの記憶（ゲーム状況の追跡）
      this.memory = {
        playerActions: [],
        threatAssessment: {},
        fieldControl: 0,
        lastPlayerPlay: null
      };
    }
  
    // 難易度に基づく思考時間
    getThinkingTime() {
      switch (this.difficulty) {
        case AI_DIFFICULTY.EASY: return { min: 500, max: 1500 };
        case AI_DIFFICULTY.NORMAL: return { min: 1000, max: 2500 };
        case AI_DIFFICULTY.HARD: return { min: 1500, max: 3000 };
        default: return { min: 1000, max: 2500 };
      }
    }
  
    // 難易度に基づく判断重み
    getDecisionWeights() {
      const base = {
        cardAdvantage: 1.0,
        fieldPresence: 1.0,
        lifeProtection: 1.0,
        energyEfficiency: 1.0,
        tempo: 1.0
      };
  
      switch (this.difficulty) {
        case AI_DIFFICULTY.EASY:
          return {
            ...base,
            cardAdvantage: 0.7,
            fieldPresence: 0.8,
            lifeProtection: 0.6,
            energyEfficiency: 0.5,
            tempo: 0.6
          };
        case AI_DIFFICULTY.HARD:
          return {
            ...base,
            cardAdvantage: 1.3,
            fieldPresence: 1.2,
            lifeProtection: 1.4,
            energyEfficiency: 1.3,
            tempo: 1.2
          };
        default:
          return base;
      }
    }
  
    // 戦略に基づくリスク許容度
    getRiskTolerance() {
      switch (this.strategy) {
        case AI_STRATEGY.AGGRESSIVE: return 0.8;
        case AI_STRATEGY.DEFENSIVE: return 0.3;
        case AI_STRATEGY.CONTROL: return 0.4;
        case AI_STRATEGY.BALANCED: return 0.6;
        default: return 0.6;
      }
    }
  
    // メインのAI思考プロセス
    async makeDecision(gameState, phase, cardDetails) {
      // 思考時間のシミュレーション
      await this.simulateThinking();
      
      // ゲーム状況の分析
      const situation = this.analyzeGameSituation(gameState, cardDetails);
      
      // フェーズに応じた行動決定
      switch (phase) {
        case UNION_ARENA_PHASES.START:
          return this.makeStartPhaseDecision(gameState, situation);
        case UNION_ARENA_PHASES.MOVEMENT:
          return this.makeMovementPhaseDecision(gameState, situation, cardDetails);
        case UNION_ARENA_PHASES.MAIN:
          return this.makeMainPhaseDecision(gameState, situation, cardDetails);
        case UNION_ARENA_PHASES.END:
          return this.makeEndPhaseDecision(gameState, situation);
        default:
          return { action: 'pass' };
      }
    }
  
    // 思考時間のシミュレーション
    async simulateThinking() {
      const delay = Math.random() * (this.thinkingTime.max - this.thinkingTime.min) + this.thinkingTime.min;
      return new Promise(resolve => setTimeout(resolve, delay));
    }
  
    // ゲーム状況の分析
    analyzeGameSituation(gameState, cardDetails) {
      const playerFieldStrength = this.calculateFieldStrength(gameState.playerFrontLine, cardDetails);
      const aiFieldStrength = this.calculateFieldStrength(gameState.opponentFrontLine, cardDetails);
      const playerEnergyTotal = Object.values(gameState.playerEnergy).reduce((a, b) => a + b, 0);
      const aiEnergyTotal = Object.values(gameState.opponentEnergy).reduce((a, b) => a + b, 0);
  
      return {
        fieldAdvantage: aiFieldStrength - playerFieldStrength,
        energyAdvantage: aiEnergyTotal - playerEnergyTotal,
        handAdvantage: gameState.opponentHand.length - gameState.playerHand.length,
        playerThreat: playerFieldStrength,
        aiThreat: aiFieldStrength,
        turnNumber: gameState.turnNumber,
        phase: gameState.gamePhase
      };
    }
  
    // フィールド戦力計算
    calculateFieldStrength(frontLine, cardDetails) {
      return frontLine.reduce((total, card) => {
        if (!card) return total;
        const cardDetail = cardDetails[card.card_id]?.data;
        const bp = parseInt(cardDetail?.BP || card.bp || 0);
        return total + bp;
      }, 0);
    }
  
    // スタートフェーズの決定
    makeStartPhaseDecision(gameState, situation) {
      // 基本的にはカードドローを実行
      if (gameState.opponentDeck.length > 0) {
        return {
          action: 'draw',
          priority: 1.0,
          reasoning: 'ターン開始時のドロー'
        };
      }
      
      return { action: 'pass' };
    }
  
    // ムーブメントフェーズの決定
    makeMovementPhaseDecision(gameState, situation, cardDetails) {
      const movements = this.findOptimalMovements(gameState, cardDetails);
      
      if (movements.length > 0) {
        // 最も価値の高い移動を選択
        const bestMovement = movements.sort((a, b) => b.value - a.value)[0];
        
        return {
          action: 'move',
          from: { line: bestMovement.fromLine, position: bestMovement.fromPos },
          to: { line: bestMovement.toLine, position: bestMovement.toPos },
          priority: bestMovement.value,
          reasoning: bestMovement.reasoning
        };
      }
      
      return { action: 'pass' };
    }
  
    // 最適な移動を探す
    findOptimalMovements(gameState, cardDetails) {
      const movements = [];
      
      // フロントラインからエナジーラインへの移動を評価
      gameState.opponentFrontLine.forEach((card, fromPos) => {
        if (!card) return;
        
        const cardDetail = cardDetails[card.card_id]?.data;
        const hasStep = cardDetail?.能力?.includes('▼Step▼');
        
        if (hasStep) {
          gameState.opponentEnergyLine.forEach((slot, toPos) => {
            if (slot === null) {
              const value = this.evaluateMovement(card, 'front', fromPos, 'energy', toPos, gameState, cardDetails);
              if (value > 0) {
                movements.push({
                  fromLine: 'front',
                  fromPos,
                  toLine: 'energy',
                  toPos,
                  value,
                  reasoning: `${card.name}をエナジーラインに移動`
                });
              }
            }
          });
        }
      });
      
      // エナジーラインからフロントラインへの移動を評価
      gameState.opponentEnergyLine.forEach((card, fromPos) => {
        if (!card) return;
        
        gameState.opponentFrontLine.forEach((slot, toPos) => {
          if (slot === null) {
            const value = this.evaluateMovement(card, 'energy', fromPos, 'front', toPos, gameState, cardDetails);
            if (value > 0) {
              movements.push({
                fromLine: 'energy',
                fromPos,
                toLine: 'front',
                toPos,
                value,
                reasoning: `${card.name}をフロントラインに移動`
              });
            }
          }
        });
      });
      
      return movements;
    }
  
    // 移動の価値評価
    evaluateMovement(card, fromLine, fromPos, toLine, toPos, gameState, cardDetails) {
      let value = 0;
      
      const cardDetail = cardDetails[card.card_id]?.data;
      const bp = parseInt(cardDetail?.BP || card.bp || 0);
      
      if (fromLine === 'energy' && toLine === 'front') {
        // エナジーからフロントへ：攻撃力増強
        value += bp * this.decisionWeights.fieldPresence;
        
        // 戦略的価値
        if (this.strategy === AI_STRATEGY.AGGRESSIVE) {
          value *= 1.5;
        }
      } else if (fromLine === 'front' && toLine === 'energy') {
        // フロントからエナジーへ：エナジー確保
        const energyValue = this.calculateEnergyValue(cardDetail);
        value += energyValue * this.decisionWeights.energyEfficiency;
        
        // 防御的戦略なら価値高
        if (this.strategy === AI_STRATEGY.DEFENSIVE) {
          value *= 1.3;
        }
      }
      
      return value;
    }
  
    // エナジー価値の計算
    calculateEnergyValue(cardDetail) {
      if (!cardDetail?.発生エナジー) return 0;
      
      const energyGenerated = this.energyManager.parseGeneratedEnergy(cardDetail.発生エナジー);
      return Object.values(energyGenerated).reduce((a, b) => a + b, 0) * 10;
    }
  
    // メインフェーズの決定
    makeMainPhaseDecision(gameState, situation, cardDetails) {
      const decisions = [];
      
      // カード配置の評価
      const playOptions = this.evaluateCardPlays(gameState, cardDetails);
      decisions.push(...playOptions);
      
      // 攻撃の評価
      const attackOptions = this.evaluateAttacks(gameState, cardDetails);
      decisions.push(...attackOptions);
      
      // 効果使用の評価
      const effectOptions = this.evaluateEffectActivations(gameState, cardDetails);
      decisions.push(...effectOptions);
      
      if (decisions.length > 0) {
        // 最も価値の高い行動を選択
        const bestDecision = decisions.sort((a, b) => b.priority - a.priority)[0];
        return bestDecision;
      }
      
      return { action: 'pass' };
    }
  
    // カード配置の評価
    evaluateCardPlays(gameState, cardDetails) {
      const plays = [];
      
      // 仮想的な手札（実際のAI実装では適切な手札管理が必要）
      const availableCards = this.generateAIHand(gameState, cardDetails);
      
      availableCards.forEach(card => {
        const cardDetail = cardDetails[card.card_id]?.data;
        const requiredEnergy = this.energyManager.parseRequiredEnergy(cardDetail?.必要エナジー || '');
        
        if (this.energyManager.canPayCost(requiredEnergy, gameState.opponentEnergy)) {
          // フロントライン配置の評価
          gameState.opponentFrontLine.forEach((slot, index) => {
            if (slot === null) {
              const value = this.evaluateCardPlay(card, 'front', index, gameState, cardDetails);
              plays.push({
                action: 'play_card',
                card,
                line: 'front',
                position: index,
                priority: value,
                reasoning: `${card.name}をフロントラインに配置`
              });
            }
          });
          
          // エナジーライン配置の評価
          gameState.opponentEnergyLine.forEach((slot, index) => {
            if (slot === null) {
              const value = this.evaluateCardPlay(card, 'energy', index, gameState, cardDetails);
              plays.push({
                action: 'play_card',
                card,
                line: 'energy',
                position: index,
                priority: value,
                reasoning: `${card.name}をエナジーラインに配置`
              });
            }
          });
        }
      });
      
      return plays;
    }
  
    // 攻撃の評価
    evaluateAttacks(gameState, cardDetails) {
      const attacks = [];
      
      gameState.opponentFrontLine.forEach((attacker, index) => {
        if (!attacker || attacker.isResting) return;
        
        const attackValue = this.evaluateAttack(attacker, gameState, cardDetails);
        if (attackValue > 0) {
          attacks.push({
            action: 'attack',
            attacker,
            attackerPosition: index,
            priority: attackValue,
            reasoning: `${attacker.name}で攻撃`
          });
        }
      });
      
      return attacks;
    }
  
    // 攻撃価値の評価
    evaluateAttack(attacker, gameState, cardDetails) {
      const cardDetail = cardDetails[attacker.card_id]?.data;
      const attackerBP = parseInt(cardDetail?.BP || attacker.bp || 0);
      
      let value = attackerBP; // 基本攻撃力
      
      // プレイヤーのブロッカーを考慮
      const potentialBlockers = gameState.playerFrontLine.filter(card => 
        card && !card.isResting
      );
      
      if (potentialBlockers.length === 0) {
        // ダイレクトアタックの価値
        value *= 2;
      } else {
        // ブロッカーとのBP比較
        const strongestBlocker = Math.max(
          ...potentialBlockers.map(blocker => {
            const blockerDetail = cardDetails[blocker.card_id]?.data;
            return parseInt(blockerDetail?.BP || blocker.bp || 0);
          })
        );
        
        if (attackerBP > strongestBlocker) {
          value *= 1.5; // 勝てる攻撃
        } else if (attackerBP === strongestBlocker) {
          value *= 1.2; // 同値でも攻撃側有利
        } else {
          value *= 0.5; // 不利な攻撃
        }
      }
      
      // 戦略による調整
      if (this.strategy === AI_STRATEGY.AGGRESSIVE) {
        value *= 1.3;
      } else if (this.strategy === AI_STRATEGY.DEFENSIVE) {
        value *= 0.7;
      }
      
      return value;
    }
  
    // カード配置価値の評価
    evaluateCardPlay(card, line, position, gameState, cardDetails) {
      const cardDetail = cardDetails[card.card_id]?.data;
      const bp = parseInt(cardDetail?.BP || card.bp || 0);
      let value = 0;
      
      if (line === 'front') {
        // フロントライン配置：戦闘力重視
        value += bp * this.decisionWeights.fieldPresence;
        
        // 特殊能力の価値
        if (cardDetail?.能力) {
          value += this.evaluateAbilities(cardDetail.能力) * this.decisionWeights.cardAdvantage;
        }
      } else if (line === 'energy') {
        // エナジーライン配置：エナジー生成重視
        const energyValue = this.calculateEnergyValue(cardDetail);
        value += energyValue * this.decisionWeights.energyEfficiency;
      }
      
      return value;
    }
  
    // 能力の価値評価
    evaluateAbilities(abilityText) {
      let value = 0;
      
      if (abilityText.includes('[Trigger]')) value += 20;
      if (abilityText.includes('▼Final▼')) value += 30;
      if (abilityText.includes('[Auto]')) value += 15;
      if (abilityText.includes('[Activate: Main]')) value += 10;
      if (abilityText.includes('▼Step▼')) value += 5;
      
      return value;
    }
  
    // 効果使用の評価
    evaluateEffectActivations(gameState, cardDetails) {
      const effects = [];
      
      // フィールド上のカードの[Activate: Main]効果をチェック
      [...gameState.opponentFrontLine, ...gameState.opponentEnergyLine].forEach((card, index) => {
        if (!card) return;
        
        const cardDetail = cardDetails[card.card_id]?.data;
        if (cardDetail?.能力?.includes('[Activate: Main]')) {
          const value = this.evaluateEffectActivation(card, gameState, cardDetails);
          if (value > 0) {
            effects.push({
              action: 'activate_effect',
              card,
              priority: value,
              reasoning: `${card.name}の効果を使用`
            });
          }
        }
      });
      
      return effects;
    }
  
    // 効果使用価値の評価
    evaluateEffectActivation(card, gameState, cardDetails) {
      // 簡単な効果価値評価（実際の実装ではより詳細な解析が必要）
      return 25 * this.decisionWeights.cardAdvantage;
    }
  
    // AIの仮想手札生成（テスト用）
    generateAIHand(gameState, cardDetails) {
      // 実際の実装では、AIの手札を適切に管理する
      // ここではテスト用の簡単な実装
      const sampleCards = [
        { card_id: 'sample_1', name: 'AIキャラクター1', bp: 3000 },
        { card_id: 'sample_2', name: 'AIキャラクター2', bp: 4000 },
        { card_id: 'sample_3', name: 'AIイベント', type: 'event' }
      ];
      
      return sampleCards.slice(0, Math.min(3, gameState.opponentHand.length));
    }
  
    // エンドフェーズの決定
    makeEndPhaseDecision(gameState, situation) {
      // 手札調整の必要性をチェック
      if (gameState.opponentHand.length > GAME_CONSTANTS.MAX_HAND_SIZE) {
        return {
          action: 'discard',
          cards: this.selectCardsToDiscard(gameState, gameState.opponentHand.length - GAME_CONSTANTS.MAX_HAND_SIZE),
          priority: 1.0,
          reasoning: '手札上限による調整'
        };
      }
      
      return { action: 'pass' };
    }
  
    // 捨てるカードの選択
    selectCardsToDiscard(gameState, discardCount) {
      // 簡単な実装：価値の低いカードから捨てる
      // 実際の実装ではより高度な評価が必要
      return gameState.opponentHand.slice(0, discardCount);
    }
  
    // メモリ更新
    updateMemory(gameState, playerAction) {
      this.memory.playerActions.push({
        action: playerAction,
        turn: gameState.turnNumber,
        phase: gameState.gamePhase
      });
      
      // 直近10アクションのみ保持
      if (this.memory.playerActions.length > 10) {
        this.memory.playerActions.shift();
      }
      
      this.memory.lastPlayerPlay = playerAction;
    }
  
    // 脅威レベルの評価
    assessThreatLevel(gameState, cardDetails) {
      const playerThreats = gameState.playerFrontLine.filter(card => card && !card.isResting);
      let threatLevel = 0;
      
      playerThreats.forEach(threat => {
        const cardDetail = cardDetails[threat.card_id]?.data;
        const bp = parseInt(cardDetail?.BP || threat.bp || 0);
        threatLevel += bp;
      });
      
      return threatLevel;
    }
  
    // AIの個性設定
    setPersonality(aggressiveness, intelligence, adaptability) {
      this.personality = {
        aggressiveness: Math.max(0, Math.min(1, aggressiveness)),
        intelligence: Math.max(0, Math.min(1, intelligence)),
        adaptability: Math.max(0, Math.min(1, adaptability))
      };
      
      // 個性に基づいて決定重みを調整
      this.decisionWeights.tempo *= (1 + this.personality.aggressiveness * 0.5);
      this.decisionWeights.cardAdvantage *= (1 + this.personality.intelligence * 0.5);
      this.riskTolerance = this.personality.aggressiveness * 0.8 + 0.2;
    }
  }
  
  export default AIOpponent;