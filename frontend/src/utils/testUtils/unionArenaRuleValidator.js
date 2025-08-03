/**
 * Union Arena Rule Validator
 * 正式ルールに基づくゲーム状態・アクションの検証ユーティリティ
 */

export class UnionArenaRuleValidator {
  constructor() {
    this.officialRules = {
      // 基本ルール
      initialHandSize: 7,
      initialLife: 7,
      maxFrontLine: 4,
      maxEnergyLine: 4,
      maxHandSize: 8,
      
      // フェーズ順序
      phaseOrder: ['start', 'movement', 'main', 'end'],
      
      // エナジー色
      energyColors: ['red', 'blue', 'green', 'yellow', 'purple'],
      
      // カード種類
      cardTypes: ['キャラクター', 'イベント', 'ブロッカー']
    };
  }

  // ゲーム初期状態の検証
  validateInitialGameState(gameState) {
    const violations = [];

    // 手札枚数チェック
    if (gameState.playerHand.length !== this.officialRules.initialHandSize) {
      violations.push({
        rule: 'Initial Hand Size',
        expected: this.officialRules.initialHandSize,
        actual: gameState.playerHand.length,
        severity: 'error'
      });
    }

    // 初期ライフチェック
    if (gameState.playerLife !== this.officialRules.initialLife) {
      violations.push({
        rule: 'Initial Life',
        expected: this.officialRules.initialLife,
        actual: gameState.playerLife,
        severity: 'error'
      });
    }

    // フィールドの初期状態チェック
    if (gameState.playerFrontLine.some(slot => slot !== null)) {
      violations.push({
        rule: 'Initial Front Line',
        expected: 'All slots empty',
        actual: 'Has cards',
        severity: 'error'
      });
    }

    if (gameState.playerEnergyLine.some(slot => slot !== null)) {
      violations.push({
        rule: 'Initial Energy Line',
        expected: 'All slots empty',
        actual: 'Has cards',
        severity: 'error'
      });
    }

    // 初期フェーズチェック
    if (gameState.gamePhase !== 'start') {
      violations.push({
        rule: 'Initial Phase',
        expected: 'start',
        actual: gameState.gamePhase,
        severity: 'error'
      });
    }

    return violations;
  }

  // フェーズ進行の検証
  validatePhaseTransition(currentPhase, nextPhase) {
    const currentIndex = this.officialRules.phaseOrder.indexOf(currentPhase);
    const nextIndex = this.officialRules.phaseOrder.indexOf(nextPhase);
    
    if (currentIndex === -1 || nextIndex === -1) {
      return {
        valid: false,
        error: 'Invalid phase name',
        currentPhase,
        nextPhase
      };
    }

    const expectedNextIndex = (currentIndex + 1) % this.officialRules.phaseOrder.length;
    
    if (nextIndex !== expectedNextIndex) {
      return {
        valid: false,
        error: 'Invalid phase transition',
        currentPhase,
        nextPhase,
        expectedNext: this.officialRules.phaseOrder[expectedNextIndex]
      };
    }

    return { valid: true };
  }

  // カード配置の検証
  validateCardPlacement(card, targetLine, targetPosition, gameState, cardDetails) {
    const violations = [];
    const cardDetail = cardDetails[card.card_id]?.data;

    if (!cardDetail) {
      violations.push({
        rule: 'Card Data',
        error: 'Card details not found',
        cardId: card.card_id,
        severity: 'error'
      });
      return violations;
    }

    // フェーズチェック
    if (gameState.gamePhase !== 'main') {
      violations.push({
        rule: 'Phase Restriction',
        error: 'Cards can only be placed during main phase',
        currentPhase: gameState.gamePhase,
        severity: 'error'
      });
    }

    // ターンチェック
    if (gameState.currentTurn !== 'player') {
      violations.push({
        rule: 'Turn Restriction',
        error: 'Can only place cards during your turn',
        currentTurn: gameState.currentTurn,
        severity: 'error'
      });
    }

    // 配置先の有効性チェック
    if (targetLine === 'front' && targetPosition >= this.officialRules.maxFrontLine) {
      violations.push({
        rule: 'Front Line Limit',
        error: 'Invalid front line position',
        position: targetPosition,
        maxPosition: this.officialRules.maxFrontLine - 1,
        severity: 'error'
      });
    }

    if (targetLine === 'energy' && targetPosition >= this.officialRules.maxEnergyLine) {
      violations.push({
        rule: 'Energy Line Limit',
        error: 'Invalid energy line position',
        position: targetPosition,
        maxPosition: this.officialRules.maxEnergyLine - 1,
        severity: 'error'
      });
    }

    // 配置先スロットの空きチェック
    const targetSlot = targetLine === 'front' ? 
      gameState.playerFrontLine[targetPosition] : 
      gameState.playerEnergyLine[targetPosition];

    if (targetSlot !== null) {
      violations.push({
        rule: 'Slot Availability',
        error: 'Target slot is already occupied',
        targetLine,
        targetPosition,
        severity: 'error'
      });
    }

    // カード種類と配置先の適合性チェック
    if (targetLine === 'front' && cardDetail.種類 === 'イベント') {
      violations.push({
        rule: 'Card Type Placement',
        error: 'Event cards cannot be placed on front line',
        cardType: cardDetail.種類,
        targetLine,
        severity: 'error'
      });
    }

    // エナジーコストの検証
    if (targetLine === 'front') {
      const costViolations = this.validateEnergyCost(cardDetail, gameState);
      violations.push(...costViolations);
    }

    return violations;
  }

  // エナジーコストの検証
  validateEnergyCost(cardDetail, gameState) {
    const violations = [];
    
    if (!cardDetail.必要エナジー) {
      return violations;
    }

    const requiredEnergy = this.parseEnergyCost(cardDetail.必要エナジー);
    const availableEnergy = gameState.playerEnergy || {};

    for (const [color, required] of Object.entries(requiredEnergy)) {
      const available = availableEnergy[color] || 0;
      
      if (available < required) {
        violations.push({
          rule: 'Energy Cost',
          error: `Insufficient ${color} energy`,
          required: required,
          available: available,
          shortage: required - available,
          severity: 'error'
        });
      }
    }

    return violations;
  }

  // エナジーコスト解析
  parseEnergyCost(costString) {
    const costs = {};
    const colorMap = {
      '赤': 'red',
      '青': 'blue',
      '緑': 'green',
      '黄': 'yellow',
      '紫': 'purple'
    };

    Object.keys(colorMap).forEach(jpColor => {
      const regex = new RegExp(jpColor + '(\\d+)', 'g');
      const match = regex.exec(costString);
      if (match) {
        const englishColor = colorMap[jpColor];
        costs[englishColor] = parseInt(match[1], 10);
      }
    });

    return costs;
  }

  // バトル計算の検証
  validateBattleCalculation(attacker, blocker, attackerDetails, blockerDetails) {
    const violations = [];

    if (!attackerDetails?.BP || !blockerDetails?.BP) {
      violations.push({
        rule: 'Battle Requirements',
        error: 'Missing BP values for battle calculation',
        attacker: attackerDetails?.BP,
        blocker: blockerDetails?.BP,
        severity: 'error'
      });
      return violations;
    }

    const attackerBP = parseInt(attackerDetails.BP);
    const blockerBP = parseInt(blockerDetails.BP);

    // Union Arenaのバトル計算ルール
    let battleResult;
    if (attackerBP > blockerBP) {
      battleResult = 'attacker_wins';
    } else if (blockerBP > attackerBP) {
      battleResult = 'blocker_wins';
    } else {
      battleResult = 'draw';
    }

    return {
      valid: true,
      result: battleResult,
      attackerBP,
      blockerBP,
      damage: Math.abs(attackerBP - blockerBP)
    };
  }

  // 効果処理の検証
  validateEffectExecution(card, effectType, gameState, cardDetails) {
    const violations = [];
    const cardDetail = cardDetails[card.card_id]?.data;

    if (!cardDetail?.能力) {
      return violations;
    }

    const ability = cardDetail.能力;

    // 登場時効果の検証
    if (effectType === 'onPlay') {
      if (!ability.includes('登場時') && !ability.includes('【登場時】')) {
        violations.push({
          rule: 'Effect Trigger',
          error: 'Card does not have on-play effect',
          cardId: card.card_id,
          ability,
          severity: 'warning'
        });
      }
    }

    // アクティベート効果の検証
    if (effectType === 'activate') {
      if (!ability.includes('[Activate: Main]')) {
        violations.push({
          rule: 'Effect Trigger',
          error: 'Card does not have activate effect',
          cardId: card.card_id,
          ability,
          severity: 'error'
        });
      }

      if (gameState.gamePhase !== 'main') {
        violations.push({
          rule: 'Effect Timing',
          error: 'Activate effects can only be used in main phase',
          currentPhase: gameState.gamePhase,
          severity: 'error'
        });
      }
    }

    // トリガー効果の検証
    if (effectType === 'trigger') {
      if (!ability.includes('[Trigger]')) {
        violations.push({
          rule: 'Effect Trigger',
          error: 'Card does not have trigger effect',
          cardId: card.card_id,
          ability,
          severity: 'error'
        });
      }
    }

    return violations;
  }

  // 勝利条件の検証
  validateVictoryConditions(gameState) {
    const results = [];

    // ライフ0による勝敗
    if (gameState.playerLife <= 0) {
      results.push({
        condition: 'Life Zero',
        winner: 'opponent',
        reason: 'Player life reached 0',
        severity: 'game_end'
      });
    }

    if (gameState.opponentLife <= 0) {
      results.push({
        condition: 'Life Zero',
        winner: 'player',
        reason: 'Opponent life reached 0',
        severity: 'game_end'
      });
    }

    // デッキアウトによる勝敗
    if (gameState.playerDeck.length === 0) {
      results.push({
        condition: 'Deck Out',
        winner: 'opponent',
        reason: 'Player deck is empty',
        severity: 'game_end'
      });
    }

    if (gameState.opponentDeck.length === 0) {
      results.push({
        condition: 'Deck Out',
        winner: 'player',
        reason: 'Opponent deck is empty',
        severity: 'game_end'
      });
    }

    return results;
  }

  // 手札上限の検証
  validateHandLimit(hand) {
    const violations = [];

    if (hand.length > this.officialRules.maxHandSize) {
      violations.push({
        rule: 'Hand Size Limit',
        error: 'Hand size exceeds maximum',
        current: hand.length,
        maximum: this.officialRules.maxHandSize,
        excess: hand.length - this.officialRules.maxHandSize,
        severity: 'warning'
      });
    }

    return violations;
  }

  // デッキ構築ルールの検証
  validateDeckConstruction(deck, cardDetails) {
    const violations = [];
    const cardCounts = {};
    let totalCards = 0;

    // カード枚数の集計
    deck.cards.forEach(entry => {
      cardCounts[entry.card_id] = entry.quantity;
      totalCards += entry.quantity;
    });

    // デッキ枚数チェック（Union Arenaは50枚固定）
    if (totalCards !== 50) {
      violations.push({
        rule: 'Deck Size',
        error: 'Deck must contain exactly 50 cards',
        current: totalCards,
        required: 50,
        severity: 'error'
      });
    }

    // 同名カード枚数制限（通常は4枚まで）
    Object.entries(cardCounts).forEach(([cardId, quantity]) => {
      if (quantity > 4) {
        violations.push({
          rule: 'Card Limit',
          error: 'Too many copies of same card',
          cardId,
          quantity,
          maximum: 4,
          severity: 'error'
        });
      }
    });

    return violations;
  }

  // 包括的なゲーム状態検証
  validateCompleteGameState(gameState, cardDetails, context = {}) {
    const allViolations = {
      initialization: [],
      phases: [],
      cards: [],
      energy: [],
      battles: [],
      effects: [],
      victory: [],
      rules: []
    };

    // 基本ルール検証
    if (context.checkInitialization) {
      allViolations.initialization = this.validateInitialGameState(gameState);
    }

    // フェーズ検証
    if (context.previousPhase) {
      const phaseValidation = this.validatePhaseTransition(context.previousPhase, gameState.gamePhase);
      if (!phaseValidation.valid) {
        allViolations.phases.push(phaseValidation);
      }
    }

    // 手札上限検証
    allViolations.rules.push(...this.validateHandLimit(gameState.playerHand));
    allViolations.rules.push(...this.validateHandLimit(gameState.opponentHand));

    // 勝利条件検証
    allViolations.victory = this.validateVictoryConditions(gameState);

    return allViolations;
  }

  // 検証結果のレポート生成
  generateValidationReport(violations) {
    const report = {
      summary: {
        total: 0,
        errors: 0,
        warnings: 0,
        gameEnding: 0
      },
      details: {},
      recommendations: []
    };

    Object.entries(violations).forEach(([category, categoryViolations]) => {
      report.details[category] = categoryViolations;
      
      categoryViolations.forEach(violation => {
        report.summary.total++;
        
        switch (violation.severity) {
          case 'error':
            report.summary.errors++;
            break;
          case 'warning':
            report.summary.warnings++;
            break;
          case 'game_end':
            report.summary.gameEnding++;
            break;
        }
      });
    });

    // 推奨事項の生成
    if (report.summary.errors > 0) {
      report.recommendations.push('Critical rule violations found - fix immediately');
    }
    if (report.summary.warnings > 0) {
      report.recommendations.push('Minor rule inconsistencies detected - review recommended');
    }
    if (report.summary.gameEnding > 0) {
      report.recommendations.push('Game ending conditions met - check victory handling');
    }

    return report;
  }
}

export default UnionArenaRuleValidator;