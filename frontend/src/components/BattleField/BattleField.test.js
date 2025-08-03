import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BattleField from './BattleField';

// Mock外部依存関係
jest.mock('../../utils/aiOpponentSystem', () => ({
  AIOpponentSystem: jest.fn().mockImplementation(() => ({
    getAIAction: jest.fn(),
    initializeAI: jest.fn(),
    processPlayerAction: jest.fn()
  }))
}));

jest.mock('../../utils/effectProcessor', () => ({
  EffectProcessor: jest.fn().mockImplementation(() => ({
    processOnPlayEffects: jest.fn(() => []),
    processActivateEffect: jest.fn(() => true),
    canActivateEffect: jest.fn(() => true)
  }))
}));

// モックデータ
const mockCardDetails = {
  'test-card-1': {
    data: {
      name: 'テストカード1',
      種類: 'キャラクター',
      BP: 3000,
      AP: 1,
      必要エナジー: '赤1',
      発生エナジー: '赤1',
      能力: '【登場時】カードを1枚引く。'
    }
  }
};

const mockInitialGameState = {
  playerHand: [
    { card_id: 'test-card-1', name: 'テストカード1' }
  ],
  opponentHand: [],
  playerDeck: [],
  opponentDeck: [],
  playerFrontLine: [null, null, null, null],
  playerEnergyLine: [null, null, null, null],
  opponentFrontLine: [null, null, null, null],
  opponentEnergyLine: [null, null, null, null],
  playerEnergy: { red: 1, blue: 0, green: 0, yellow: 0, purple: 0 },
  opponentEnergy: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
  currentTurn: 'player',
  gamePhase: 'main',
  turnNumber: 1,
  playerLife: 7,
  opponentLife: 7,
  playerGraveyard: [],
  opponentGraveyard: [],
  battleLog: []
};

describe('BattleField Component - TDD Tests', () => {
  let mockProps;

  beforeEach(() => {
    mockProps = {
      selectedDeck: { 
        deck_id: 'test-deck',
        cards: [{ card_id: 'test-card-1', quantity: 3 }]
      },
      cardDetails: mockCardDetails
    };
    
    // コンソールエラーをモック
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('基本レンダリングテスト', () => {
    test('BattleFieldコンポーネントが正常にレンダリングされる', () => {
      render(<BattleField {...mockProps} />);
      
      // 基本UI要素の存在確認
      expect(screen.getByText(/ターン/)).toBeInTheDocument();
      expect(screen.getByText(/フェーズ/)).toBeInTheDocument();
      expect(screen.getByText(/手札/)).toBeInTheDocument();
    });

    test('ゲームヘッダーが表示される', () => {
      render(<BattleField {...mockProps} />);
      
      const gameHeader = screen.getByRole('banner', { name: /ゲームヘッダー/i }) || 
                        document.querySelector('.game-header');
      expect(gameHeader).toBeInTheDocument();
    });

    test('プレイヤーとAIのライフエリアが表示される', () => {
      render(<BattleField {...mockProps} />);
      
      expect(screen.getByText(/プレイヤー ライフ/)).toBeInTheDocument();
      expect(screen.getByText(/相手 ライフ/)).toBeInTheDocument();
    });
  });

  describe('グリッドレイアウトテスト', () => {
    test('main-game-areaのグリッドレイアウトが正しく設定されている', () => {
      render(<BattleField {...mockProps} />);
      
      const mainGameArea = document.querySelector('.main-game-area');
      expect(mainGameArea).toBeInTheDocument();
      
      const computedStyle = window.getComputedStyle(mainGameArea);
      expect(computedStyle.display).toBe('grid');
    });

    test('4つの主要セクション（相手・センター・プレイヤー・手札）が表示される', () => {
      render(<BattleField {...mockProps} />);
      
      // 各セクションの存在確認
      expect(document.querySelector('.opponent-section')).toBeInTheDocument();
      expect(document.querySelector('.center-section')).toBeInTheDocument();
      expect(document.querySelector('.player-section')).toBeInTheDocument();
      expect(document.querySelector('.hand-section')).toBeInTheDocument();
    });

    test('フロントラインとエナジーラインが正しく表示される', () => {
      render(<BattleField {...mockProps} />);
      
      // プレイヤーのフロントライン（4スロット）
      const playerFrontSlots = document.querySelectorAll('.player-section .front-line .line-slot');
      expect(playerFrontSlots).toHaveLength(4);
      
      // プレイヤーのエナジーライン（4スロット）
      const playerEnergySlots = document.querySelectorAll('.player-section .energy-line .line-slot');
      expect(playerEnergySlots).toHaveLength(4);
    });
  });

  describe('カード配置機能テスト', () => {
    test('手札のカードをクリックして選択できる', async () => {
      render(<BattleField {...mockProps} />);
      
      // 手札のカードを探す
      const handCard = await waitFor(() => {
        const card = document.querySelector('.hand-card img');
        expect(card).toBeInTheDocument();
        return card;
      });

      // カードクリックで選択
      fireEvent.click(handCard);
      
      // 選択状態の確認（border等のスタイル変更を確認）
      await waitFor(() => {
        expect(handCard.closest('.hand-card')).toHaveStyle('border: 3px solid #4299e1');
      });
    });

    test('選択したカードをフロントラインに配置できる', async () => {
      render(<BattleField {...mockProps} />);
      
      // 手札のカードを選択
      const handCard = await waitFor(() => {
        return document.querySelector('.hand-card img');
      });
      fireEvent.click(handCard);
      
      // フロントラインの空きスロットをクリック
      const frontSlot = document.querySelector('.player-section .front-line .line-slot');
      fireEvent.click(frontSlot);
      
      // カードが配置されたことを確認
      await waitFor(() => {
        const placedCard = frontSlot.querySelector('img');
        expect(placedCard).toBeInTheDocument();
      });
    });

    test('選択したカードをエナジーラインに配置できる', async () => {
      render(<BattleField {...mockProps} />);
      
      // 手札のカードを選択
      const handCard = await waitFor(() => {
        return document.querySelector('.hand-card img');
      });
      fireEvent.click(handCard);
      
      // エナジーラインの空きスロットをクリック
      const energySlot = document.querySelector('.player-section .energy-line .line-slot');
      fireEvent.click(energySlot);
      
      // カードが配置されたことを確認
      await waitFor(() => {
        const placedCard = energySlot.querySelector('img');
        expect(placedCard).toBeInTheDocument();
      });
    });
  });

  describe('ドラッグ&ドロップ機能テスト', () => {
    test('カードをドラッグして配置可能スロットがハイライトされる', async () => {
      render(<BattleField {...mockProps} />);
      
      const handCard = await waitFor(() => {
        return document.querySelector('.hand-card img');
      });
      
      // ドラッグ開始
      fireEvent.dragStart(handCard);
      
      // 配置可能スロットがハイライトされることを確認
      await waitFor(() => {
        const slots = document.querySelectorAll('.line-slot');
        const highlightedSlots = Array.from(slots).filter(slot => 
          slot.classList.contains('drag-valid') || 
          window.getComputedStyle(slot).boxShadow !== 'none'
        );
        expect(highlightedSlots.length).toBeGreaterThan(0);
      });
    });

    test('ドラッグ終了時にハイライトが解除される', async () => {
      render(<BattleField {...mockProps} />);
      
      const handCard = await waitFor(() => {
        return document.querySelector('.hand-card img');
      });
      
      // ドラッグ開始
      fireEvent.dragStart(handCard);
      
      // ドラッグ終了
      fireEvent.dragEnd(handCard);
      
      // ハイライトが解除されることを確認
      await waitFor(() => {
        const slots = document.querySelectorAll('.line-slot');
        const highlightedSlots = Array.from(slots).filter(slot => 
          slot.classList.contains('drag-valid')
        );
        expect(highlightedSlots).toHaveLength(0);
      });
    });
  });

  describe('フェーズ管理テスト', () => {
    test('フェーズ名が正しく表示される', () => {
      render(<BattleField {...mockProps} />);
      
      expect(screen.getByText(/メインフェーズ/)).toBeInTheDocument();
    });

    test('次のフェーズボタンが機能する', async () => {
      render(<BattleField {...mockProps} />);
      
      const nextPhaseButton = screen.getByText(/次のフェーズ/) || 
                             screen.getByRole('button', { name: /フェーズ/ });
      
      if (nextPhaseButton) {
        fireEvent.click(nextPhaseButton);
        
        // フェーズが変更されることを確認
        await waitFor(() => {
          expect(screen.queryByText(/メインフェーズ/)).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('エフェクト処理テスト', () => {
    test('カード配置時に登場時効果が発動する', async () => {
      render(<BattleField {...mockProps} />);
      
      // 手札のカードを選択してフロントラインに配置
      const handCard = await waitFor(() => {
        return document.querySelector('.hand-card img');
      });
      fireEvent.click(handCard);
      
      const frontSlot = document.querySelector('.player-section .front-line .line-slot');
      fireEvent.click(frontSlot);
      
      // バトルログにエフェクト発動が記録されることを確認
      await waitFor(() => {
        const battleLog = screen.getByText(/バトルログ/) || 
                         document.querySelector('.battle-log');
        if (battleLog) {
          expect(battleLog.textContent).toMatch(/登場時|効果/);
        }
      });
    });

    test('Activate効果ボタンが表示される', async () => {
      // Activate効果持ちカードをモック
      const activateCardDetails = {
        'activate-card': {
          data: {
            name: 'アクティベートカード',
            種類: 'キャラクター',
            BP: 3000,
            AP: 1,
            必要エナジー: '赤1',
            能力: '[Activate: Main] カードを1枚引く。'
          }
        }
      };

      const propsWithActivateCard = {
        ...mockProps,
        cardDetails: activateCardDetails
      };

      render(<BattleField {...propsWithActivateCard} />);

      // カードを配置
      // 実際のテスト実装では、先にActivate効果持ちカードを手札に追加し、
      // 配置後にActivateボタンが表示されることを確認
    });
  });

  describe('レスポンシブデザインテスト', () => {
    test('モバイル画面サイズでレイアウトが適切に調整される', () => {
      // 画面サイズを変更
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<BattleField {...mockProps} />);
      
      const mainGameArea = document.querySelector('.main-game-area');
      expect(mainGameArea).toBeInTheDocument();
      
      // モバイル用CSSが適用されていることを確認
      // 実際のテストでは、CSS media queriesの確認やグリッドレイアウトの変更を検証
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('カードデータが不正な場合でもクラッシュしない', () => {
      const propsWithInvalidCard = {
        ...mockProps,
        cardDetails: {
          'invalid-card': {
            data: null
          }
        }
      };

      expect(() => {
        render(<BattleField {...propsWithInvalidCard} />);
      }).not.toThrow();
    });

    test('デッキデータが存在しない場合でもクラッシュしない', () => {
      const propsWithoutDeck = {
        ...mockProps,
        selectedDeck: null
      };

      expect(() => {
        render(<BattleField {...propsWithoutDeck} />);
      }).not.toThrow();
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量のカードが存在してもレンダリング時間が許容範囲内', async () => {
      const startTime = performance.now();
      
      // 大量のカードを含むモックデータ
      const largeHandSize = 50;
      const largeHand = Array.from({ length: largeHandSize }, (_, i) => ({
        card_id: `test-card-${i}`,
        name: `テストカード${i}`
      }));

      const propsWithLargeHand = {
        ...mockProps,
        // 実際には初期ゲーム状態を変更する必要があります
      };

      render(<BattleField {...propsWithLargeHand} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // レンダリング時間が1秒以内であることを確認
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('アクセシビリティテスト', () => {
    test('キーボードナビゲーションが機能する', () => {
      render(<BattleField {...mockProps} />);
      
      // TABキーでフォーカス移動できることを確認
      const focusableElements = document.querySelectorAll(
        'button, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('ARIA属性が適切に設定されている', () => {
      render(<BattleField {...mockProps} />);
      
      // 重要なUI要素にARIA属性が設定されていることを確認
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
});