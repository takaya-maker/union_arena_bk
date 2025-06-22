/**
 * デッキエクスポート・インポート機能
 */
export class DeckExporter {
  constructor() {
    this.version = '1.0';
  }

  /**
   * デッキをエクスポート用データに変換
   * @param {Object} deck - デッキオブジェクト
   * @returns {Object} エクスポート用データ
   */
  exportDeck(deck) {
    const exportData = {
      version: this.version,
      timestamp: new Date().toISOString(),
      deck: {
        name: deck.name,
        description: deck.description || '',
        cards: deck.cards.map(card => ({
          card_id: card.card_id,
          name: card.name,
          card_type: card.card_type,
          card_term_name: card.card_term_name,
          card_rank_name: card.card_rank_name,
          quantity: card.quantity
        }))
      }
    };

    return exportData;
  }

  /**
   * デッキコードを生成
   * @param {Object} deck - デッキオブジェクト
   * @returns {string} デッキコード
   */
  generateDeckCode(deck) {
    const exportData = this.exportDeck(deck);
    const jsonString = JSON.stringify(exportData);
    
    // Base64エンコード
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    
    // 短縮化（オプション）
    return this.shortenCode(base64);
  }

  /**
   * デッキコードを短縮化
   * @param {string} base64 - Base64エンコードされた文字列
   * @returns {string} 短縮されたコード
   */
  shortenCode(base64) {
    // 簡単な短縮化（実際の実装ではより高度なアルゴリズムを使用）
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  /**
   * デッキコードを復元
   * @param {string} code - デッキコード
   * @returns {Object} デッキデータ
   */
  restoreDeckCode(code) {
    try {
      // 短縮化されたコードを復元
      const base64 = this.restoreCode(code);
      
      // Base64デコード
      const jsonString = decodeURIComponent(escape(atob(base64)));
      const exportData = JSON.parse(jsonString);
      
      // バージョンチェック
      if (exportData.version !== this.version) {
        throw new Error('デッキコードのバージョンが異なります');
      }
      
      return exportData.deck;
    } catch (error) {
      throw new Error('デッキコードの解析に失敗しました: ' + error.message);
    }
  }

  /**
   * 短縮化されたコードを復元
   * @param {string} code - 短縮化されたコード
   * @returns {string} 元のBase64文字列
   */
  restoreCode(code) {
    // 短縮化の逆変換
    let base64 = code.replace(/-/g, '+').replace(/_/g, '/');
    
    // パディングを追加
    while (base64.length % 4) {
      base64 += '=';
    }
    
    return base64;
  }

  /**
   * デッキをJSONファイルとしてエクスポート
   * @param {Object} deck - デッキオブジェクト
   * @param {string} filename - ファイル名（オプション）
   */
  exportToFile(deck, filename = null) {
    const exportData = this.exportDeck(deck);
    const jsonString = JSON.stringify(exportData, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${deck.name}_deck.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * JSONファイルからデッキをインポート
   * @param {File} file - JSONファイル
   * @returns {Promise<Object>} デッキデータ
   */
  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const exportData = JSON.parse(event.target.result);
          
          // バージョンチェック
          if (exportData.version !== this.version) {
            reject(new Error('ファイルのバージョンが異なります'));
            return;
          }
          
          resolve(exportData.deck);
        } catch (error) {
          reject(new Error('ファイルの解析に失敗しました: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * デッキをクリップボードにコピー
   * @param {Object} deck - デッキオブジェクト
   * @returns {Promise<boolean>} 成功したかどうか
   */
  async copyToClipboard(deck) {
    try {
      const deckCode = this.generateDeckCode(deck);
      await navigator.clipboard.writeText(deckCode);
      return true;
    } catch (error) {
      console.error('クリップボードへのコピーに失敗:', error);
      return false;
    }
  }

  /**
   * クリップボードからデッキを読み込み
   * @returns {Promise<Object>} デッキデータ
   */
  async loadFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      return this.restoreDeckCode(text);
    } catch (error) {
      throw new Error('クリップボードからの読み込みに失敗しました: ' + error.message);
    }
  }

  /**
   * デッキの詳細情報を生成
   * @param {Object} deck - デッキオブジェクト
   * @returns {string} 詳細情報テキスト
   */
  generateDeckInfo(deck) {
    const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
    const uniqueCards = deck.cards.length;
    
    let info = `デッキ名: ${deck.name}\n`;
    if (deck.description) {
      info += `説明: ${deck.description}\n`;
    }
    info += `総枚数: ${totalCards}/50\n`;
    info += `カード種類: ${uniqueCards}種類\n\n`;
    
    info += 'カード一覧:\n';
    deck.cards.forEach(card => {
      info += `・${card.name} ×${card.quantity}`;
      if (card.card_term_name) {
        info += ` (${card.card_term_name})`;
      }
      info += '\n';
    });
    
    return info;
  }

  /**
   * デッキコードの妥当性チェック
   * @param {string} code - デッキコード
   * @returns {boolean} 妥当かどうか
   */
  isValidDeckCode(code) {
    try {
      this.restoreDeckCode(code);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// シングルトンインスタンス
export const deckExporter = new DeckExporter(); 