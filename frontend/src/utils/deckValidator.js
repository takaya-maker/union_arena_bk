// frontend/src/utils/deckValidator.js

/**
 * デッキ検証クラス
 */
export class DeckValidator {
  constructor() {
    this.maxCards = 50;
    this.maxCopies = 4;
    this.restrictedCards = []; // 制限カードリスト（将来的に追加）
    this.bannedCards = []; // 禁止カードリスト（将来的に追加）
  }

  /**
   * デッキの完全検証
   * @param {Array} deckCards - デッキ内のカード配列
   * @returns {Object} 検証結果
   */
  validateDeck(deckCards) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: this.calculateStats(deckCards)
    };

    // 基本検証
    this.validateCardCount(deckCards, results);
    this.validateCardCopies(deckCards, results);
    this.validateRestrictedCards(deckCards, results);
    this.validateBannedCards(deckCards, results);

    // 結果を更新
    results.isValid = results.errors.length === 0;

    return results;
  }

  /**
   * カード枚数検証
   */
  validateCardCount(deckCards, results) {
    const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0);
    
    if (totalCards < this.maxCards) {
      results.errors.push(`デッキが${this.maxCards}枚ではありません（現在${totalCards}枚）`);
    } else if (totalCards > this.maxCards) {
      results.errors.push(`デッキが${this.maxCards}枚を超えています（現在${totalCards}枚）`);
    }
  }

  /**
   * カード枚数制限検証
   */
  validateCardCopies(deckCards, results) {
    deckCards.forEach(card => {
      if (card.quantity > this.maxCopies) {
        results.errors.push(`「${card.name}」が${this.maxCopies}枚を超えています（現在${card.quantity}枚）`);
      }
    });
  }

  /**
   * 制限カード検証
   */
  validateRestrictedCards(deckCards, results) {
    deckCards.forEach(card => {
      if (this.restrictedCards.includes(card.card_id) && card.quantity > 1) {
        results.warnings.push(`「${card.name}」は制限カードのため1枚までしか使用できません`);
      }
    });
  }

  /**
   * 禁止カード検証
   */
  validateBannedCards(deckCards, results) {
    deckCards.forEach(card => {
      if (this.bannedCards.includes(card.card_id)) {
        results.errors.push(`「${card.name}」は禁止カードのため使用できません`);
      }
    });
  }

  /**
   * デッキ統計計算
   */
  calculateStats(deckCards) {
    const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0);
    const uniqueCards = deckCards.length;
    
    // カード種類別統計
    const typeStats = {};
    deckCards.forEach(card => {
      const type = card.card_type || '不明';
      if (!typeStats[type]) {
        typeStats[type] = 0;
      }
      typeStats[type] += card.quantity;
    });

    // 作品別統計
    const termStats = {};
    deckCards.forEach(card => {
      const term = card.card_term_name || '不明';
      if (!termStats[term]) {
        termStats[term] = 0;
      }
      termStats[term] += card.quantity;
    });

    return {
      totalCards,
      uniqueCards,
      typeStats,
      termStats,
      isValid: totalCards === this.maxCards
    };
  }

  /**
   * デッキの詳細分析
   */
  analyzeDeck(deckCards) {
    const stats = this.calculateStats(deckCards);
    const analysis = {
      ...stats,
      recommendations: [],
      strengths: [],
      weaknesses: []
    };

    // カード種類のバランス分析
    const characterCards = stats.typeStats['キャラクター'] || 0;
    const eventCards = stats.typeStats['イベント'] || 0;
    const fieldCards = stats.typeStats['フィールド'] || 0;

    // 推奨事項
    if (characterCards < 20) {
      analysis.recommendations.push('キャラクターカードが少ないです。最低20枚程度は含めることを推奨します。');
    }
    if (eventCards < 10) {
      analysis.recommendations.push('イベントカードが少ないです。10枚程度は含めることを推奨します。');
    }
    if (fieldCards === 0) {
      analysis.recommendations.push('フィールドカードが含まれていません。1-2枚程度は含めることを推奨します。');
    }

    // 強み・弱みの分析
    if (characterCards >= 25) {
      analysis.strengths.push('キャラクターカードが豊富で、安定した戦闘力があります。');
    }
    if (eventCards >= 15) {
      analysis.strengths.push('イベントカードが豊富で、戦術の幅が広いです。');
    }
    if (characterCards < 15) {
      analysis.weaknesses.push('キャラクターカードが少なく、戦闘力が不安定です。');
    }
    if (eventCards < 5) {
      analysis.weaknesses.push('イベントカードが少なく、戦術の幅が狭いです。');
    }

    return analysis;
  }

  /**
   * デッキの相性チェック
   */
  checkDeckCompatibility(deckCards) {
    const compatibility = {
      score: 0,
      issues: [],
      synergies: []
    };

    // 作品別の相性チェック
    const termGroups = {};
    deckCards.forEach(card => {
      const term = card.card_term_name || '不明';
      if (!termGroups[term]) {
        termGroups[term] = [];
      }
      termGroups[term].push(card);
    });

    // 単一作品に偏りすぎている場合
    const termCounts = Object.keys(termGroups).map(term => ({
      term,
      count: termGroups[term].reduce((sum, card) => sum + card.quantity, 0)
    }));

    const dominantTerm = termCounts.reduce((max, current) => 
      current.count > max.count ? current : max
    );

    if (dominantTerm.count > 35) {
      compatibility.issues.push(`${dominantTerm.term}に偏りすぎています（${dominantTerm.count}枚）。他の作品のカードも含めることを推奨します。`);
      compatibility.score -= 10;
    } else if (dominantTerm.count >= 25) {
      compatibility.synergies.push(`${dominantTerm.term}を中心としたデッキで、作品の相性が良いです。`);
      compatibility.score += 5;
    }

    // カード種類のバランス
    const characterCards = deckCards.filter(card => card.card_type === 'キャラクター').reduce((sum, card) => sum + card.quantity, 0);
    const eventCards = deckCards.filter(card => card.card_type === 'イベント').reduce((sum, card) => sum + card.quantity, 0);

    if (characterCards >= 20 && eventCards >= 10) {
      compatibility.synergies.push('キャラクターとイベントのバランスが良いです。');
      compatibility.score += 10;
    }

    return compatibility;
  }
}

// シングルトンインスタンス
export const deckValidator = new DeckValidator();