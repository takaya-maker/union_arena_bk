// Union Arena カード効果処理システム
// src/utils/effectProcessor.js

import { EFFECT_TYPES, COLORS } from './unionArenaConstants';

export class EffectProcessor {
  constructor(gameStateManager, battleLogManager) {
    this.gameStateManager = gameStateManager;
    this.battleLogManager = battleLogManager;
    this.pendingEffects = [];
  }

  // カード配置時の効果処理（登場時効果）
  processOnPlayEffects(card, cardDetails, line, position, player) {
    const cardDetail = cardDetails[card.card_id]?.data;
    if (!cardDetail?.能力) return [];

    const effects = [];
    const abilities = cardDetail.能力;

    // 登場時効果の検出と処理
    if (abilities.includes('登場時') || abilities.includes('【登場時】')) {
      effects.push({
        type: 'ON_PLAY',
        card: card,
        ability: abilities,
        player: player,
        triggerTime: Date.now()
      });

      this.executeOnPlayEffect(card, cardDetail, line, position, player);
    }

    // [Auto]効果の検出
    if (abilities.includes('[Auto]')) {
      effects.push({
        type: 'AUTO',
        card: card,
        ability: abilities,
        player: player,
        triggerTime: Date.now()
      });

      this.processAutoEffect(card, cardDetail, player);
    }

    return effects;
  }

  // 登場時効果の実行
  executeOnPlayEffect(card, cardDetail, line, position, player) {
    const abilities = cardDetail.能力;
    
    // 基本的な登場時効果パターンを処理
    
    // カードドロー効果
    if (abilities.includes('カードを1枚引く') || abilities.includes('1枚引く')) {
      this.executeDrawEffect(player, 1);
      this.battleLogManager(`${card.name}の登場時効果：カードを1枚引きました`);
    }
    
    if (abilities.includes('カードを2枚引く') || abilities.includes('2枚引く')) {
      this.executeDrawEffect(player, 2);
      this.battleLogManager(`${card.name}の登場時効果：カードを2枚引きました`);
    }

    // ライフ回復効果
    if (abilities.includes('ライフを1回復') || abilities.includes('1回復')) {
      this.executeHealEffect(player, 1);
      this.battleLogManager(`${card.name}の登場時効果：ライフを1回復しました`);
    }

    // エナジー生成効果
    if (abilities.includes('エナジーを生成')) {
      this.executeEnergyGenerateEffect(card, cardDetail, player);
    }

    // 相手カード選択効果
    if (abilities.includes('相手のフロントラインのキャラクター1体を選ぶ')) {
      this.executeTargetOpponentEffect(card, player);
    }

    // サーチ効果
    if (abilities.includes('デッキから') && abilities.includes('手札に加える')) {
      this.executeSearchEffect(card, cardDetail, player);
    }

    // 汎用的な登場時効果ログ
    if (!abilities.includes('カードを') && !abilities.includes('ライフ') && 
        !abilities.includes('エナジー') && !abilities.includes('相手の') &&
        !abilities.includes('デッキから')) {
      this.battleLogManager(`${card.name}の登場時効果が発動しました`);
    }
  }

  // [Auto]効果の処理
  processAutoEffect(card, cardDetail, player) {
    const abilities = cardDetail.能力;
    
    // 常時効果の処理
    if (abilities.includes('このキャラクターの') || abilities.includes('自分の')) {
      this.processPassiveEffect(card, cardDetail, player);
    }

    this.battleLogManager(`${card.name}の[Auto]効果が有効になりました`);
  }

  // アクティベート効果の処理
  processActivateEffect(card, cardDetail, player) {
    if (!cardDetail?.能力?.includes('[Activate: Main]')) {
      return false;
    }

    const abilities = cardDetail.能力;
    
    // メインフェーズのアクティベート効果
    if (abilities.includes('カードを1枚引く')) {
      this.executeDrawEffect(player, 1);
      this.battleLogManager(`${card.name}の[Activate: Main]効果：カードを1枚引きました`);
      return true;
    }

    if (abilities.includes('ダメージを与える')) {
      this.executeDamageEffect(card, cardDetail, player);
      return true;
    }

    // 汎用的なアクティベート効果
    this.battleLogManager(`${card.name}の[Activate: Main]効果を使用しました`);
    return true;
  }

  // トリガー効果の処理
  processTriggerEffect(card, cardDetail, triggerCondition, player) {
    if (!cardDetail?.能力?.includes('[Trigger]')) {
      return false;
    }

    const abilities = cardDetail.能力;
    
    // ダメージトリガー
    if (triggerCondition === 'damage') {
      if (abilities.includes('カードを1枚引く')) {
        this.executeDrawEffect(player, 1);
        this.battleLogManager(`${card.name}のトリガー効果：カードを1枚引きました`);
        return true;
      }

      if (abilities.includes('ライフを1回復')) {
        this.executeHealEffect(player, 1);
        this.battleLogManager(`${card.name}のトリガー効果：ライフを1回復しました`);
        return true;
      }

      // 汎用トリガー効果
      this.battleLogManager(`${card.name}のトリガー効果が発動しました`);
      return true;
    }

    return false;
  }

  // ▼Final▼効果の処理
  processFinalEffect(card, cardDetail, player) {
    if (!cardDetail?.能力?.includes('▼Final▼')) {
      return false;
    }

    const abilities = cardDetail.能力;
    
    // Final効果は通常、破壊時やライフが特定条件になった時に発動
    if (abilities.includes('カードを2枚引く')) {
      this.executeDrawEffect(player, 2);
      this.battleLogManager(`${card.name}の▼Final▼効果：カードを2枚引きました`);
      return true;
    }

    if (abilities.includes('ダメージを与える')) {
      this.executeDamageEffect(card, cardDetail, player);
      return true;
    }

    this.battleLogManager(`${card.name}の▼Final▼効果が発動しました`);
    return true;
  }

  // 個別効果の実装

  // カードドロー効果
  executeDrawEffect(player, amount) {
    const currentState = this.gameStateManager.getGameState();
    const deck = player === 'player' ? currentState.playerDeck : currentState.opponentDeck;
    const hand = player === 'player' ? currentState.playerHand : currentState.opponentHand;

    for (let i = 0; i < amount && deck.length > 0; i++) {
      const drawnCard = deck.shift();
      hand.push(drawnCard);
    }

    this.gameStateManager.updateGameState({
      [player === 'player' ? 'playerDeck' : 'opponentDeck']: deck,
      [player === 'player' ? 'playerHand' : 'opponentHand']: hand
    });
  }

  // ライフ回復効果
  executeHealEffect(player, amount) {
    // Union Arenaではライフ回復は実装次第
    // 通常はライフクロックからカードを手札に加える等
    this.battleLogManager(`ライフ回復効果を処理中... (未実装)`);
  }

  // エナジー生成効果
  executeEnergyGenerateEffect(card, cardDetail, player) {
    // カードの発生エナジーを即座に追加
    const generatedEnergy = this.parseEnergyGeneration(cardDetail.発生エナジー);
    if (Object.keys(generatedEnergy).length > 0) {
      const currentState = this.gameStateManager.getGameState();
      const currentEnergy = player === 'player' ? currentState.playerEnergy : currentState.opponentEnergy;
      
      const newEnergy = { ...currentEnergy };
      Object.keys(generatedEnergy).forEach(color => {
        newEnergy[color] = (newEnergy[color] || 0) + generatedEnergy[color];
      });

      this.gameStateManager.updateGameState({
        [player === 'player' ? 'playerEnergy' : 'opponentEnergy']: newEnergy
      });
    }
  }

  // ダメージ効果
  executeDamageEffect(card, cardDetail, player) {
    const abilities = cardDetail.能力;
    
    // ダメージ量を解析
    let damage = 1; // デフォルト
    const damageMatch = abilities.match(/(\d+)ダメージ/);
    if (damageMatch) {
      damage = parseInt(damageMatch[1]);
    }

    this.battleLogManager(`${card.name}の効果：${damage}ダメージを与えました`);
    // 実際のダメージ処理は別途実装
  }

  // パッシブ効果の処理
  processPassiveEffect(card, cardDetail, player) {
    // 常時効果の管理
    // BP上昇、コスト軽減などの効果
    this.battleLogManager(`${card.name}のパッシブ効果が適用されています`);
  }

  // 相手選択効果
  executeTargetOpponentEffect(card, player) {
    // 相手のカードを選択する効果の処理
    this.battleLogManager(`${card.name}の効果：相手のカードを選択してください`);
    // 実際の選択UIは別途実装
  }

  // サーチ効果
  executeSearchEffect(card, cardDetail, player) {
    this.battleLogManager(`${card.name}の効果：デッキからカードをサーチします`);
    // サーチUIは別途実装
  }

  // エナジー生成の解析
  parseEnergyGeneration(energyString) {
    if (!energyString) return {};

    const colorMap = {
      '赤': 'red',
      '青': 'blue',
      '緑': 'green',
      '黄': 'yellow',
      '紫': 'purple'
    };

    const energy = {};
    Object.keys(colorMap).forEach(jpColor => {
      const regex = new RegExp(jpColor + '(\\d+)', 'g');
      const match = regex.exec(energyString);
      if (match) {
        const englishColor = colorMap[jpColor];
        energy[englishColor] = parseInt(match[1], 10);
      }
    });

    return energy;
  }

  // 効果の有効性チェック
  canActivateEffect(card, cardDetail, effectType, gameState) {
    switch (effectType) {
      case 'ACTIVATE_MAIN':
        return gameState.gamePhase === 'main' && gameState.currentTurn === 'player';
      case 'AUTO':
        return true; // 常時効果は常に有効
      case 'TRIGGER':
        return true; // トリガー条件次第
      case 'FINAL':
        return true; // Final条件次第
      default:
        return false;
    }
  }

  // 効果対象の取得
  getEffectTargets(card, cardDetail, gameState) {
    const abilities = cardDetail.能力;
    const targets = [];

    if (abilities.includes('相手のフロントライン')) {
      targets.push(...gameState.opponentFrontLine.filter(c => c !== null));
    }

    if (abilities.includes('自分のフロントライン')) {
      targets.push(...gameState.playerFrontLine.filter(c => c !== null));
    }

    return targets;
  }

  // 効果コストの確認
  canPayEffectCost(card, cardDetail, gameState) {
    // アクティベート効果のコストチェック等
    // 現在は簡易実装
    return true;
  }

  // 効果の実行可能性をチェック
  isEffectExecutable(card, cardDetail, effectType, gameState) {
    return (
      this.canActivateEffect(card, cardDetail, effectType, gameState) &&
      this.canPayEffectCost(card, cardDetail, gameState)
    );
  }
}

export default EffectProcessor;