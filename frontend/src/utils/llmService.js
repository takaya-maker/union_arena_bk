// LLM API連携サービス
// Ollama API (localhost:11434) との通信を管理

class LLMService {
  constructor() {
    this.baseURL = process.env.REACT_APP_LLM_API_URL || 'http://localhost:11434';
    this.defaultModel = 'llama2:latest';
  }

  // 利用可能なモデル一覧を取得
  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  }

  // AIアドバイスを生成（戦略提案用）
  async generateGameAdvice(gameState, situation) {
    const prompt = this.buildGameAdvicePrompt(gameState, situation);
    
    try {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            max_tokens: 200
          }
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'アドバイスを生成できませんでした。';
    } catch (error) {
      console.error('Failed to generate advice:', error);
      return 'AI機能は現在利用できません。';
    }
  }

  // カード効果の説明を生成
  async explainCardEffect(cardData) {
    const prompt = `
Union Arenaカードゲームのカード効果を初心者向けに説明してください。

カード名: ${cardData.name}
種類: ${cardData.種類}
BP: ${cardData.BP}
AP: ${cardData.AP}
能力: ${cardData.能力}

このカードの効果と使い方を簡潔に説明してください（100文字以内）：
`;

    try {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.5,
            max_tokens: 150
          }
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'カード効果の説明を生成できませんでした。';
    } catch (error) {
      console.error('Failed to explain card effect:', error);
      return 'カード効果の説明は現在利用できません。';
    }
  }

  // ゲーム状況に基づくアドバイスプロンプトを構築
  buildGameAdvicePrompt(gameState, situation) {
    return `
Union Arenaカードゲームの戦略アドバイザーとして回答してください。

現在の状況:
- ターン: ${gameState.turnNumber}
- フェーズ: ${gameState.gamePhase}
- プレイヤーライフ: ${gameState.playerLife}
- 相手ライフ: ${gameState.opponentLife}
- 手札枚数: ${gameState.playerHand?.length || 0}
- フロントライン: ${gameState.playerFrontLine?.filter(card => card !== null).length || 0}体
- エナジー: 赤${gameState.playerEnergy?.red || 0} 青${gameState.playerEnergy?.blue || 0} 緑${gameState.playerEnergy?.green || 0}

特殊状況: ${situation}

この状況での最適な戦略を50文字以内でアドバイスしてください：
`;
  }

  // デッキ構築アドバイス
  async generateDeckAdvice(deckCards, theme) {
    const prompt = `
Union Arenaのデッキ構築アドバイザーとして回答してください。

テーマ: ${theme}
現在のデッキ枚数: ${deckCards?.length || 0}

デッキ改善のポイントを3つ、50文字以内で提案してください：
`;

    try {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.6,
            max_tokens: 200
          }
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'デッキアドバイスを生成できませんでした。';
    } catch (error) {
      console.error('Failed to generate deck advice:', error);
      return 'デッキ構築アドバイスは現在利用できません。';
    }
  }

  // ストリーミング応答（リアルタイム生成用）
  async streamGenerate(prompt, onChunk) {
    try {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          prompt: prompt,
          stream: true,
          options: {
            temperature: 0.7,
            max_tokens: 300
          }
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              onChunk(data.response);
            }
          } catch (parseError) {
            console.warn('Failed to parse chunk:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Streaming generation failed:', error);
      onChunk('ストリーミング生成に失敗しました。');
    }
  }

  // LLM APIの接続テスト
  async testConnection() {
    try {
      const models = await this.getAvailableModels();
      return {
        connected: true,
        modelsAvailable: models.length > 0,
        models: models.map(m => m.name)
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

export default new LLMService();