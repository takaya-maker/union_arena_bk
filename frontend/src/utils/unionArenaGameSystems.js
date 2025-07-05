// Union Arena正式ルール対応ゲームシステム
// utils/unionArenaGameSystems.js

// バトルシステムクラス
export class UnionArenaBattleSystem {
    constructor() {
      this.attackingCharacter = null;
      this.blockingCharacter = null;
      this.battleInProgress = false;
    }
  
    // 攻撃宣言
    declareAttack(attacker, targetPlayer) {
      if (!attacker || attacker.isResting) {
        throw new Error('このキャラクターは攻撃できません');
      }
  
      this.attackingCharacter = attacker;
      this.battleInProgress = true;
      
      // キャラクターをレスト状態にする
      attacker.isResting = true;
      
      return {
        success: true,
        message: `${attacker.name}が攻撃を宣言しました`,
        attacker,
        targetPlayer
      };
    }
  
    // ブロック宣言
    declareBlock(blocker, attacker) {
      if (!blocker || blocker.isResting) {
        throw new Error('このキャラクターはブロックできません');
      }
  
      if (!this.battleInProgress || this.attackingCharacter !== attacker) {
        throw new Error('有効な攻撃がありません');
      }
  
      this.blockingCharacter = blocker;
      
      // キャラクターをレスト状態にする
      blocker.isResting = true;
      
      return {
        success: true,
        message: `${blocker.name}が${attacker.name}の攻撃をブロックしました`,
        blocker,
        attacker
      };
    }
  
    // バトル解決
    resolveBattle() {
      if (!this.battleInProgress || !this.attackingCharacter) {
        throw new Error('解決するバトルがありません');
      }
  
      const attacker = this.attackingCharacter;
      const blocker = this.blockingCharacter;
      
      let result = {
        battleResolved: true,
        attackerDestroyed: false,
        blockerDestroyed: false,
        damageToPlayer: 0,
        message: ''
      };
  
      if (blocker) {
        // ブロックされた場合のバトル
        const attackerBP = this.calculateBP(attacker);
        const blockerBP = this.calculateBP(blocker);
        
        if (attackerBP > blockerBP) {
          // 攻撃側勝利
          result.blockerDestroyed = true;
          result.message = `${attacker.name}(BP:${attackerBP})が${blocker.name}(BP:${blockerBP})を破壊しました`;
        } else if (blockerBP > attackerBP) {
          // ブロック側勝利
          result.attackerDestroyed = true;
          result.message = `${blocker.name}(BP:${blockerBP})が${attacker.name}(BP:${attackerBP})を破壊しました`;
        } else {
          // 同じBPの場合、攻撃側勝利（Union Arenaルール）
          result.blockerDestroyed = true;
          result.message = `BP同値のため${attacker.name}が勝利し、${blocker.name}を破壊しました`;
        }
      } else {
        // ブロックされなかった場合、プレイヤーにダメージ
        result.damageToPlayer = 1; // Union Arenaでは通常1ダメージ
        result.message = `${attacker.name}の攻撃が通り、1ダメージ`;
      }
  
      // バトル状態をリセット
      this.resetBattle();
      
      return result;
    }
  
    // BP計算（効果による修正も含む）
    calculateBP(character) {
      let baseBP = parseInt(character.bp) || 0;
      let totalBP = baseBP;
      
      // 効果による修正を適用
      if (character.bpModifiers) {
        character.bpModifiers.forEach(modifier => {
          totalBP += modifier.value;
        });
      }
      
      return Math.max(0, totalBP);
    }
  
    // バトル状態リセット
    resetBattle() {
      this.attackingCharacter = null;
      this.blockingCharacter = null;
      this.battleInProgress = false;
    }
  
    // 攻撃可能チェック
    canAttack(character) {
      return character && !character.isResting && !character.isSummoningSick;
    }
  
    // ブロック可能チェック
    canBlock(character) {
      return character && !character.isResting;
    }
  }
  
  // トリガーチェックシステム
  export class UnionArenaTriggerSystem {
    constructor() {
      this.triggerQueue = [];
      this.processingTriggers = false;
    }
  
    // ライフダメージ時のトリガーチェック
    checkDamageTriggers(damagedPlayer, damageAmount, deck) {
      const triggeredCards = [];
      
      for (let i = 0; i < damageAmount; i++) {
        if (deck.length === 0) break;
        
        const topCard = deck[0];
        const cardDetail = this.getCardDetail(topCard);
        
        // トリガー効果があるかチェック
        if (this.hasTriggerEffect(cardDetail)) {
          triggeredCards.push({
            card: topCard,
            triggerType: this.getTriggerType(cardDetail),
            effect: this.getTriggerEffect(cardDetail)
          });
        }
        
        // カードをライフエリアに移動
        deck.shift();
        damagedPlayer.lifeArea.push(topCard);
      }
      
      return triggeredCards;
    }
  
    // トリガー効果チェック
    hasTriggerEffect(cardDetail) {
      if (!cardDetail || !cardDetail.能力) return false;
      
      return cardDetail.能力.includes('[Trigger]') || 
             cardDetail.能力.includes('▼Final▼');
    }
  
    // トリガータイプ取得
    getTriggerType(cardDetail) {
      if (!cardDetail || !cardDetail.能力) return null;
      
      if (cardDetail.能力.includes('▼Final▼')) {
        return 'final';
      } else if (cardDetail.能力.includes('[Trigger]')) {
        return 'trigger';
      }
      
      return null;
    }
  
    // トリガー効果取得
    getTriggerEffect(cardDetail) {
      if (!cardDetail || !cardDetail.能力) return null;
      
      // トリガー効果のテキストを解析
      const abilityText = cardDetail.能力;
      
      // [Trigger]または▼Final▼の効果部分を抽出
      const triggerMatch = abilityText.match(/\[(Trigger|Final)\]\s*(.+)/);
      if (triggerMatch) {
        return {
          type: triggerMatch[1].toLowerCase(),
          description: triggerMatch[2].trim()
        };
      }
      
      return null;
    }
  
    // カード詳細取得（実装は外部から注入）
    getCardDetail(card) {
      // この関数は外部から設定される
      return this.cardDetailProvider ? this.cardDetailProvider(card) : null;
    }
  
    // カード詳細プロバイダー設定
    setCardDetailProvider(provider) {
      this.cardDetailProvider = provider;
    }
  
    // トリガー効果処理
    processTriggerEffect(triggerCard, gameState) {
      const effect = triggerCard.effect;
      if (!effect) return null;
      
      // 基本的なトリガー効果パターンを処理
      const results = [];
      
      // ドロー効果
      if (effect.description.includes('カード') && effect.description.includes('引く')) {
        const drawMatch = effect.description.match(/(\d+)枚.*引く/);
        if (drawMatch) {
          const drawCount = parseInt(drawMatch[1]);
          results.push({
            type: 'draw',
            amount: drawCount,
            message: `${triggerCard.card.name}の効果で${drawCount}枚ドロー`
          });
        }
      }
      
      // エナジー追加効果
      if (effect.description.includes('エナジー')) {
        results.push({
          type: 'energy',
          message: `${triggerCard.card.name}の効果でエナジー追加`
        });
      }
      
      // BP修正効果
      if (effect.description.includes('BP')) {
        const bpMatch = effect.description.match(/BP\+(\d+)/);
        if (bpMatch) {
          const bpBonus = parseInt(bpMatch[1]);
          results.push({
            type: 'bp_modify',
            amount: bpBonus,
            message: `${triggerCard.card.name}の効果でBP+${bpBonus}`
          });
        }
      }
      
      return results;
    }
  }
  
  // アクションポイント（AP）システム
  export class UnionArenaAPSystem {
    constructor(initialAP = 1) {
      this.currentAP = initialAP;
      this.maxAP = initialAP;
      this.usedThisTurn = 0;
    }
  
    // APの使用
    useAP(amount = 1) {
      if (this.currentAP < amount) {
        throw new Error('APが不足しています');
      }
      
      this.currentAP -= amount;
      this.usedThisTurn += amount;
      
      return {
        success: true,
        remainingAP: this.currentAP,
        usedAmount: amount
      };
    }
  
    // ターン開始時のAP回復
    refreshAP() {
      this.currentAP = this.maxAP;
      this.usedThisTurn = 0;
    }
  
    // AP増加（ゲーム進行に応じて）
    increaseMaxAP(amount = 1) {
      this.maxAP += amount;
      this.currentAP = this.maxAP;
    }
  
    // 現在のAP状況
    getAPStatus() {
      return {
        current: this.currentAP,
        max: this.maxAP,
        usedThisTurn: this.usedThisTurn,
        canUse: this.currentAP > 0
      };
    }
  
    // アクション実行可能チェック
    canPerformAction(apCost = 1) {
      return this.currentAP >= apCost;
    }
  }
  
  // カード効果処理システム
  export class UnionArenaEffectSystem {
    constructor() {
      this.activeEffects = [];
      this.pendingEffects = [];
    }
  
    // [Activate: Main]効果の処理
    processActivateMainEffect(card, gameState) {
      const cardDetail = this.getCardDetail(card);
      if (!cardDetail || !cardDetail.能力) return null;
      
      // [Activate: Main]効果を検索
      const activateMatch = cardDetail.能力.match(/\[Activate:\s*Main\]\s*(.+)/);
      if (!activateMatch) {
        throw new Error('このカードは[Activate: Main]効果を持ちません');
      }
      
      const effectDescription = activateMatch[1];
      
      // 効果の解析と実行
      return this.parseAndExecuteEffect(effectDescription, card, gameState);
    }
  
    // [Auto]効果の処理
    processAutoEffect(card, trigger, gameState) {
      const cardDetail = this.getCardDetail(card);
      if (!cardDetail || !cardDetail.能力) return null;
      
      // [Auto]効果を検索
      const autoEffects = cardDetail.能力.match(/\[Auto\]\s*(.+?)(?=\[|$)/g);
      if (!autoEffects) return null;
      
      const results = [];
      autoEffects.forEach(effect => {
        const effectMatch = effect.match(/\[Auto\]\s*(.+)/);
        if (effectMatch) {
          const result = this.parseAndExecuteEffect(effectMatch[1], card, gameState);
          if (result) results.push(result);
        }
      });
      
      return results.length > 0 ? results : null;
    }
  
    // 効果の解析と実行
    parseAndExecuteEffect(effectDescription, sourceCard, gameState) {
      const effects = [];
      
      // ドロー効果
      if (effectDescription.includes('引く')) {
        const drawMatch = effectDescription.match(/(\d+)枚.*引く/);
        if (drawMatch) {
          effects.push({
            type: 'draw',
            amount: parseInt(drawMatch[1]),
            source: sourceCard
          });
        }
      }
      
      // BP修正効果
      if (effectDescription.includes('BP')) {
        const bpMatch = effectDescription.match(/BP([+-])(\d+)/);
        if (bpMatch) {
          const modifier = bpMatch[1] === '+' ? parseInt(bpMatch[2]) : -parseInt(bpMatch[2]);
          effects.push({
            type: 'bp_modify',
            modifier,
            source: sourceCard
          });
        }
      }
      
      // エナジー追加効果
      if (effectDescription.includes('エナジー')) {
        effects.push({
          type: 'energy_add',
          source: sourceCard
        });
      }
      
      // レスト/アクティブ効果
      if (effectDescription.includes('レスト') || effectDescription.includes('アクティブ')) {
        const isRest = effectDescription.includes('レスト');
        effects.push({
          type: 'rest_active',
          rest: isRest,
          source: sourceCard
        });
      }
      
      return effects.length > 0 ? effects : null;
    }
  
    // 継続効果の管理
    addContinuousEffect(effect) {
      this.activeEffects.push({
        ...effect,
        id: Date.now() + Math.random(),
        startTurn: effect.currentTurn || 1
      });
    }
  
    // ターン終了時の効果クリーンアップ
    cleanupTurnEffects(currentTurn) {
      this.activeEffects = this.activeEffects.filter(effect => {
        if (effect.duration === 'turn') {
          return effect.startTurn === currentTurn;
        }
        return true;
      });
    }
  
    // カード詳細取得（実装は外部から注入）
    getCardDetail(card) {
      return this.cardDetailProvider ? this.cardDetailProvider(card) : null;
    }
  
    // カード詳細プロバイダー設定
    setCardDetailProvider(provider) {
      this.cardDetailProvider = provider;
    }
  }
  
  // 統合ゲームマネージャー
  export class UnionArenaGameManager {
    constructor() {
      this.battleSystem = new UnionArenaBattleSystem();
      this.triggerSystem = new UnionArenaTriggerSystem();
      this.apSystem = new UnionArenaAPSystem();
      this.effectSystem = new UnionArenaEffectSystem();
      
      this.gameLog = [];
      this.gameState = null;
    }
  
    // ゲーム状態設定
    setGameState(gameState) {
      this.gameState = gameState;
    }
  
    // カード詳細プロバイダー設定
    setCardDetailProvider(provider) {
      this.triggerSystem.setCardDetailProvider(provider);
      this.effectSystem.setCardDetailProvider(provider);
    }
  
    // ターン開始処理
    startTurn(player) {
      this.apSystem.refreshAP();
      this.log(`${player}のターン開始`);
      
      // [Auto]効果のチェック（ターン開始時）
      if (this.gameState) {
        this.checkAutoEffects('turn_start');
      }
    }
  
    // ターン終了処理
    endTurn(player) {
      this.effectSystem.cleanupTurnEffects(this.gameState?.turnNumber || 1);
      this.log(`${player}のターン終了`);
      
      // [Auto]効果のチェック（ターン終了時）
      if (this.gameState) {
        this.checkAutoEffects('turn_end');
      }
    }
  
    // ダメージ処理
    processDamage(targetPlayer, amount, deck) {
      const triggerCards = this.triggerSystem.checkDamageTriggers(targetPlayer, amount, deck);
      
      if (triggerCards.length > 0) {
        this.log(`トリガーチェック: ${triggerCards.length}枚のトリガーが発動`);
        
        // トリガー効果を順番に処理
        triggerCards.forEach(triggerCard => {
          const effects = this.triggerSystem.processTriggerEffect(triggerCard, this.gameState);
          if (effects) {
            effects.forEach(effect => {
              this.executeEffect(effect);
            });
          }
        });
      }
      
      return {
        damageDealt: amount,
        triggersActivated: triggerCards
      };
    }
  
    // 効果実行
    executeEffect(effect) {
      switch (effect.type) {
        case 'draw':
          this.log(effect.message);
          // ドロー処理の実装
          break;
        case 'bp_modify':
          this.log(effect.message);
          // BP修正処理の実装
          break;
        case 'energy_add':
          this.log(effect.message);
          // エナジー追加処理の実装
          break;
        default:
          this.log(`未実装の効果: ${effect.type}`);
      }
    }
  
    // [Auto]効果チェック
    checkAutoEffects(timing) {
      if (!this.gameState) return;
      
      // フィールド上のカードの[Auto]効果をチェック
      const allFieldCards = [
        ...this.gameState.playerFrontLine.filter(card => card),
        ...this.gameState.playerEnergyLine.filter(card => card),
        ...this.gameState.opponentFrontLine.filter(card => card),
        ...this.gameState.opponentEnergyLine.filter(card => card)
      ];
      
      allFieldCards.forEach(card => {
        const effects = this.effectSystem.processAutoEffect(card, timing, this.gameState);
        if (effects) {
          effects.forEach(effectGroup => {
            if (Array.isArray(effectGroup)) {
              effectGroup.forEach(effect => this.executeEffect(effect));
            } else {
              this.executeEffect(effectGroup);
            }
          });
        }
      });
    }
  
    // ログ追加
    log(message) {
      this.gameLog.push({
        id: Date.now() + Math.random(),
        message,
        timestamp: new Date()
      });
    }
  
    // ゲームログ取得
    getGameLog() {
      return this.gameLog;
    }
  
    // ゲームログクリア
    clearLog() {
      this.gameLog = [];
    }
  }
  
  // デフォルトエクスポート
  export default UnionArenaGameManager;