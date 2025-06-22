// ライフポイント管理クラス
export class LifeManager {
  constructor(initialLife = 20) {
    this.maxLife = initialLife;
    this.currentLife = initialLife;
    this.lifeHistory = [];
  }

  // 現在のライフを取得
  getCurrentLife() {
    return this.currentLife;
  }

  // 最大ライフを取得
  getMaxLife() {
    return this.maxLife;
  }

  // ライフを回復
  heal(amount) {
    const oldLife = this.currentLife;
    this.currentLife = Math.min(this.currentLife + amount, this.maxLife);
    const actualHeal = this.currentLife - oldLife;
    
    if (actualHeal > 0) {
      this.lifeHistory.push({
        type: 'heal',
        amount: actualHeal,
        timestamp: Date.now()
      });
    }
    
    return actualHeal;
  }

  // ダメージを受ける
  takeDamage(amount) {
    const oldLife = this.currentLife;
    this.currentLife = Math.max(0, this.currentLife - amount);
    const actualDamage = oldLife - this.currentLife;
    
    if (actualDamage > 0) {
      this.lifeHistory.push({
        type: 'damage',
        amount: actualDamage,
        timestamp: Date.now()
      });
    }
    
    return actualDamage;
  }

  // ライフを設定
  setLife(amount) {
    const oldLife = this.currentLife;
    this.currentLife = Math.max(0, Math.min(amount, this.maxLife));
    const difference = this.currentLife - oldLife;
    
    if (difference !== 0) {
      this.lifeHistory.push({
        type: difference > 0 ? 'heal' : 'damage',
        amount: Math.abs(difference),
        timestamp: Date.now()
      });
    }
    
    return this.currentLife;
  }

  // ライフをリセット
  resetLife() {
    this.currentLife = this.maxLife;
    this.lifeHistory = [];
  }

  // 死亡判定
  isDead() {
    return this.currentLife <= 0;
  }

  // ライフ履歴を取得
  getLifeHistory() {
    return this.lifeHistory;
  }

  // ライフパーセンテージを取得
  getLifePercentage() {
    return (this.currentLife / this.maxLife) * 100;
  }

  // ライフ状態を取得（文字列）
  getLifeStatus() {
    if (this.isDead()) return 'dead';
    if (this.getLifePercentage() <= 25) return 'critical';
    if (this.getLifePercentage() <= 50) return 'low';
    if (this.getLifePercentage() <= 75) return 'medium';
    return 'high';
  }
}

// 勝利条件チェック
export class VictoryConditionChecker {
  constructor(playerLifeManager, opponentLifeManager) {
    this.playerLife = playerLifeManager;
    this.opponentLife = opponentLifeManager;
  }

  // 勝利条件をチェック
  checkVictoryConditions() {
    // プレイヤーが死亡
    if (this.playerLife.isDead()) {
      return {
        winner: 'opponent',
        reason: 'player_death',
        message: 'あなたのライフが0になりました。敗北です。'
      };
    }

    // 対戦相手が死亡
    if (this.opponentLife.isDead()) {
      return {
        winner: 'player',
        reason: 'opponent_death',
        message: '対戦相手のライフが0になりました。勝利です！'
      };
    }

    // デッキ切れチェック（将来的に実装）
    // 特殊勝利条件（将来的に実装）

    return null; // 勝利条件未達成
  }

  // ゲーム終了判定
  isGameOver() {
    return this.checkVictoryConditions() !== null;
  }
} 