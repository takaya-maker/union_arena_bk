import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BattleField from './BattleField';

// レイアウト専用テスト - UI配置問題の特定と修正
describe('BattleField Layout Issue Detection - TDD', () => {
  const mockProps = {
    selectedDeck: { 
      deck_id: 'test-deck',
      cards: [{ card_id: 'test-card-1', quantity: 3 }]
    },
    cardDetails: {
      'test-card-1': {
        data: {
          name: 'テストカード1',
          種類: 'キャラクター',
          BP: 3000
        }
      }
    }
  };

  beforeEach(() => {
    // コンソールエラーをモック
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('グリッドレイアウト整合性テスト', () => {
    test('main-game-areaが4行のグリッドレイアウトを持つ', () => {
      render(<BattleField {...mockProps} />);
      
      const mainGameArea = document.querySelector('.main-game-area');
      expect(mainGameArea).toBeInTheDocument();
      
      const computedStyle = window.getComputedStyle(mainGameArea);
      expect(computedStyle.display).toBe('grid');
      
      // グリッドテンプレートの行数を確認
      const gridTemplateRows = computedStyle.gridTemplateRows;
      const rowCount = gridTemplateRows.split(' ').length;
      expect(rowCount).toBe(4); // 相手・センター・プレイヤー・手札の4行
    });

    test('各グリッドセクションが正しい順序で配置されている', () => {
      render(<BattleField {...mockProps} />);
      
      const mainGameArea = document.querySelector('.main-game-area');
      const children = Array.from(mainGameArea.children);
      
      // 子要素が期待される順序で存在することを確認
      expect(children[0]).toHaveClass('opponent-section');
      expect(children[1]).toHaveClass('center-section');
      expect(children[2]).toHaveClass('player-section');
      expect(children[3]).toHaveClass('hand-section');
    });

    test('ビューポート内にすべてのセクションが表示される', () => {
      // 標準的な画面サイズを設定
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 900,
      });

      render(<BattleField {...mockProps} />);
      
      const sections = [
        '.opponent-section',
        '.center-section', 
        '.player-section',
        '.hand-section'
      ];

      sections.forEach(selector => {
        const section = document.querySelector(selector);
        expect(section).toBeInTheDocument();
        
        // セクションがビューポート内に表示されているかを確認
        const rect = section.getBoundingClientRect();
        expect(rect.top).toBeGreaterThanOrEqual(0);
        expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
      });
    });
  });

  describe('プレイヤーエリア可視性テスト', () => {
    test('プレイヤーのフロントラインが画面内に表示される', () => {
      render(<BattleField {...mockProps} />);
      
      const playerSection = document.querySelector('.player-section');
      const frontLine = playerSection.querySelector('.front-line');
      
      expect(frontLine).toBeInTheDocument();
      
      // フロントラインがビューポート内にあることを確認
      const rect = frontLine.getBoundingClientRect();
      expect(rect.top).toBeGreaterThanOrEqual(0);
      expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    });

    test('プレイヤーのエナジーラインが画面内に表示される', () => {
      render(<BattleField {...mockProps} />);
      
      const playerSection = document.querySelector('.player-section');
      const energyLine = playerSection.querySelector('.energy-line');
      
      expect(energyLine).toBeInTheDocument();
      
      // エナジーラインがビューポート内にあることを確認
      const rect = energyLine.getBoundingClientRect();
      expect(rect.top).toBeGreaterThanOrEqual(0);
      expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    });

    test('手札エリアが画面内に表示される', () => {
      render(<BattleField {...mockProps} />);
      
      const handSection = document.querySelector('.hand-section');
      expect(handSection).toBeInTheDocument();
      
      // 手札エリアがビューポート内にあることを確認
      const rect = handSection.getBoundingClientRect();
      expect(rect.top).toBeGreaterThanOrEqual(0);
      expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    });
  });

  describe('スクロール不要性テスト', () => {
    test('ページ全体がスクロールなしで表示される', () => {
      render(<BattleField {...mockProps} />);
      
      const battleFieldContainer = document.querySelector('.battle-field-container');
      expect(battleFieldContainer).toBeInTheDocument();
      
      // コンテナの高さがビューポート内に収まることを確認
      const rect = battleFieldContainer.getBoundingClientRect();
      expect(rect.height).toBeLessThanOrEqual(window.innerHeight);
    });

    test('main-game-areaでオーバーフローが発生しない', () => {
      render(<BattleField {...mockProps} />);
      
      const mainGameArea = document.querySelector('.main-game-area');
      const computedStyle = window.getComputedStyle(mainGameArea);
      
      // オーバーフローが hidden に設定されていることを確認
      expect(computedStyle.overflow).toBe('hidden');
    });
  });

  describe('レスポンシブレイアウトテスト', () => {
    test('タブレット画面サイズでレイアウトが適切', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<BattleField {...mockProps} />);
      
      // タブレット用メディアクエリが適用されることを確認
      const mainGameArea = document.querySelector('.main-game-area');
      const rect = mainGameArea.getBoundingClientRect();
      expect(rect.height).toBeLessThanOrEqual(768);
    });

    test('モバイル画面サイズでレイアウトが適切', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<BattleField {...mockProps} />);
      
      const sections = document.querySelectorAll('.main-game-area > div');
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        expect(rect.top).toBeGreaterThanOrEqual(0);
        expect(rect.bottom).toBeLessThanOrEqual(1024);
      });
    });
  });

  describe('インラインスタイル整合性テスト', () => {
    test('インラインスタイルがCSSグリッドと競合しない', () => {
      render(<BattleField {...mockProps} />);
      
      const mainGameArea = document.querySelector('.main-game-area');
      const childElements = Array.from(mainGameArea.children);
      
      childElements.forEach(child => {
        const inlineStyle = child.style;
        // height: 100% などのインラインスタイルがグリッドレイアウトを妨害しないことを確認
        expect(inlineStyle.height).not.toBe('100%');
        expect(inlineStyle.position).not.toBe('absolute');
      });
    });

    test('グリッド子要素の配置プロパティが正しく設定される', () => {
      render(<BattleField {...mockProps} />);
      
      const sections = [
        document.querySelector('.opponent-section'),
        document.querySelector('.center-section'),
        document.querySelector('.player-section'),
        document.querySelector('.hand-section')
      ];

      sections.forEach((section, index) => {
        const computedStyle = window.getComputedStyle(section);
        // grid-row-start が暗黙的に正しく設定されることを確認
        expect(computedStyle.display).not.toBe('none');
      });
    });
  });

  describe('カードサイズ最適化テスト', () => {
    test('手札カードが適切なサイズで表示される', () => {
      render(<BattleField {...mockProps} />);
      
      const handCards = document.querySelectorAll('.hand-card');
      handCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        // カードサイズが手札エリアに収まることを確認
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.height).toBeGreaterThan(0);
        expect(rect.width).toBeLessThan(100); // 過度に大きくないことを確認
      });
    });

    test('フィールドカードが適切なサイズで表示される', () => {
      render(<BattleField {...mockProps} />);
      
      const lineSlots = document.querySelectorAll('.line-slot');
      lineSlots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        // スロットサイズが適切であることを確認
        expect(rect.width).toBeGreaterThan(80);
        expect(rect.height).toBeGreaterThan(100);
        expect(rect.width).toBeLessThan(150);
        expect(rect.height).toBeLessThan(200);
      });
    });
  });

  describe('ガップとパディング最適化テスト', () => {
    test('グリッドのガップが適切に設定されている', () => {
      render(<BattleField {...mockProps} />);
      
      const mainGameArea = document.querySelector('.main-game-area');
      const computedStyle = window.getComputedStyle(mainGameArea);
      
      // ガップが適切な値に設定されていることを確認
      expect(computedStyle.gap).toBe('2px');
    });

    test('コンテナのパディングが適切に設定されている', () => {
      render(<BattleField {...mockProps} />);
      
      const mainGameArea = document.querySelector('.main-game-area');
      const computedStyle = window.getComputedStyle(mainGameArea);
      
      // パディングが適切な値に設定されていることを確認
      expect(computedStyle.padding).toBe('2px');
    });
  });

  describe('UI要素の可操作性テスト', () => {
    test('すべてのカードスロットがクリック可能な位置にある', () => {
      render(<BattleField {...mockProps} />);
      
      const allSlots = document.querySelectorAll('.line-slot');
      allSlots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        // スロットがビューポート内にあり、クリック可能であることを確認
        expect(rect.top).toBeGreaterThanOrEqual(0);
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
        expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
      });
    });

    test('手札カードがドラッグ可能な位置にある', () => {
      render(<BattleField {...mockProps} />);
      
      const handCards = document.querySelectorAll('.hand-card');
      handCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        // カードがビューポート内にあり、ドラッグ可能であることを確認
        expect(rect.top).toBeGreaterThanOrEqual(0);
        expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
      });
    });
  });
});