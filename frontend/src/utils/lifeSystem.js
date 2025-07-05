// Union Arena正式ルールに基づくライフ管理
export class UnionArenaLifeManager {
  constructor(initialLife = 7) {
    this.lifeArea = [];
    // Union Arenaではライフはカード枚数で管理
    for (let i = 0; i < initialLife; i++) {
      this.lifeArea.push({ id: `life_${i}`, type: 'life' });
    }
  }

  getCurrentLife() {
    return this.lifeArea.length;
  }

  takeDamage(amount, deck) {
    const cardsToLife = [];
    for (let i = 0; i < amount && deck.length > 0; i++) {
      const card = deck.shift();
      if (card) {
        cardsToLife.push(card);
      }
    }
    
    this.lifeArea.push(...cardsToLife);
    return cardsToLife; // トリガーチェック用
  }

  isDefeated() {
    return this.lifeArea.length === 0;
  }

  getLifePercentage() {
    const maxLife = 7;
    return Math.max(0, (this.getCurrentLife() / maxLife) * 100);
  }
}

export class VictoryConditionChecker {
  constructor(playerLifeManager, opponentLifeManager) {
    this.playerLifeManager = playerLifeManager;
    this.opponentLifeManager = opponentLifeManager;
  }

  checkVictoryConditions() {
    if (this.playerLifeManager.isDefeated()) {
      return {
        winner: 'opponent',
        message: 'プレイヤーのライフが0になりました。敗北です。'
      };
    }
    
    if (this.opponentLifeManager.isDefeated()) {
      return {
        winner: 'player',
        message: '対戦相手のライフが0になりました。勝利です！'
      };
    }
    
    return null;
  }
}