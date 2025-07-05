// frontend/src/App.js
import React, { useState } from 'react';
import './App.css';
import CardList from './components/CardList/CardList';
import DeckBuilder from './components/DeckBuilder/DeckBuilder';
import BattleField from './components/BattleField/BattleField';
import DuelMode from './components/DuelMode/DuelMode';
import DeckSelector from './components/DeckSelector/DeckSelector';
import { API_BASE_URL } from './config/config';

function App() {
  const [currentView, setCurrentView] = useState('cards'); // 'cards', 'deck-builder', 'duel-mode', 'deck-selector', 'battle-field'
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [duelMode, setDuelMode] = useState(null);

  // デッキIDからデッキ情報を取得する関数
  const fetchDeckById = async (deckId) => {
    try {
      console.log('App: Fetching deck with ID:', deckId);
      const response = await fetch(`${API_BASE_URL}/api/v1/decks/${deckId}`);
      if (!response.ok) {
        throw new Error('デッキの取得に失敗しました');
      }
      const data = await response.json();
      
      console.log('App: Deck API response:', data);
      console.log('App: Deck API response type:', typeof data);
      console.log('App: Deck API response keys:', Object.keys(data));
      
      if (data.success && data.data) {
        console.log('App: Setting selected deck:', data.data);
        console.log('App: Deck data type:', typeof data.data);
        console.log('App: Deck data keys:', Object.keys(data.data));
        console.log('App: Deck cards property exists:', 'cards' in data.data);
        console.log('App: Deck cards value:', data.data.cards);
        console.log('App: Deck cards type:', typeof data.data.cards);
        console.log('App: Deck cards is array:', Array.isArray(data.data.cards));
        return data.data;
      } else {
        console.error('App: Invalid deck data received:', data);
        throw new Error('デッキデータが無効です');
      }
    } catch (error) {
      console.error('App: Error fetching deck:', error);
      throw error;
    }
  };

  const handleDeckSelect = async (deck) => {
    try {
      console.log('App: handleDeckSelect called with:', deck);
      
      // デッキオブジェクトが直接渡された場合
      if (deck && deck.id && deck.cards) {
        console.log('App: Deck object provided directly');
        setSelectedDeck(deck);
        setCurrentView('battle-field');
        return;
      }
      
      // デッキIDが渡された場合
      if (typeof deck === 'number' || (deck && deck.id)) {
        const deckId = typeof deck === 'number' ? deck : deck.id;
        console.log('App: Fetching deck by ID:', deckId);
        const deckData = await fetchDeckById(deckId);
        setSelectedDeck(deckData);
        setCurrentView('battle-field');
        return;
      }
      
      console.error('App: Invalid deck parameter:', deck);
      throw new Error('無効なデッキ情報です');
    } catch (error) {
      console.error('App: Error in handleDeckSelect:', error);
      alert(`デッキ選択エラー: ${error.message}`);
    }
  };

  const handleDuelModeSelect = (mode) => {
    setDuelMode(mode);
    setCurrentView('deck-selector');
  };

  const handleDeckSelectForDuel = async (deck, mode) => {
    try {
      console.log('App: handleDeckSelectForDuel called with:', { deck, mode });
      
      // デッキオブジェクトが直接渡された場合
      if (deck && deck.id && deck.cards) {
        console.log('App: Deck object provided directly for duel');
        setSelectedDeck(deck);
        setDuelMode(mode);
        setCurrentView('battle-field');
        return;
      }
      
      // デッキIDが渡された場合
      if (typeof deck === 'number' || (deck && deck.id)) {
        const deckId = typeof deck === 'number' ? deck : deck.id;
        console.log('App: Fetching deck by ID for duel:', deckId);
        const deckData = await fetchDeckById(deckId);
        setSelectedDeck(deckData);
        setDuelMode(mode);
        setCurrentView('battle-field');
        return;
      }
      
      console.error('App: Invalid deck parameter for duel:', deck);
      throw new Error('無効なデッキ情報です');
    } catch (error) {
      console.error('App: Error in handleDeckSelectForDuel:', error);
      alert(`デッキ選択エラー: ${error.message}`);
    }
  };

  const handleBackToMenu = () => {
    setCurrentView('cards');
    setSelectedDeck(null);
    setDuelMode(null);
  };

  const handleBackToDuelMode = () => {
    setCurrentView('duel-mode');
    setSelectedDeck(null);
    setDuelMode(null);
  };

  return (
    <div className="App">
      <header className={`App-header ${currentView === 'battle-field' ? 'battle-mode' : ''}`}>
        <h1>UNION ARENA</h1>
        {currentView === 'battle-field' ? (
          <div className="battle-header-controls">
            <button 
              className="nav-button back-button"
              onClick={handleBackToMenu}
              title="メニューに戻る"
            >
              ← メニューに戻る
            </button>
            <div className="battle-info">
              <span className="deck-name">デッキ: {selectedDeck?.name || '未選択'}</span>
              {duelMode && (
                <span className="duel-mode">モード: {duelMode === 'online' ? 'オンライン対戦' : duelMode === 'computer' ? 'コンピュータ対戦' : 'テストモード'}</span>
              )}
            </div>
          </div>
        ) : (
          <nav className="nav-menu">
            <button 
              className={`nav-button ${currentView === 'cards' ? 'active' : ''}`}
              onClick={() => setCurrentView('cards')}
            >
              カード検索
            </button>
            <button 
              className={`nav-button ${currentView === 'deck-builder' ? 'active' : ''}`}
              onClick={() => setCurrentView('deck-builder')}
            >
              デッキ構築
            </button>
            <button 
              className={`nav-button ${currentView === 'duel-mode' ? 'active' : ''}`}
              onClick={() => setCurrentView('duel-mode')}
            >
              デュエル開始
            </button>
          </nav>
        )}
      </header>

        <main className={`App-main ${currentView === 'battle-field' ? 'battle-field' : ''}`}>
          {currentView === 'cards' && (
            <div className="centered-section cards-section">
              <CardList />
            </div>
          )}
          {currentView === 'deck-builder' && (
            <DeckBuilder 
              onDeckSaved={(deck) => {
                setSelectedDeck(deck);
                setCurrentView('battle-field');
              }}
            />
          )}
          {currentView === 'duel-mode' && (
            <DuelMode 
              onModeSelect={handleDuelModeSelect}
              onBackToMenu={handleBackToMenu}
            />
          )}
          {currentView === 'deck-selector' && (
            <DeckSelector 
              duelMode={duelMode}
              onDeckSelect={handleDeckSelectForDuel}
              onBackToMenu={handleBackToDuelMode}
            />
          )}
          {currentView === 'battle-field' && (
            (() => {
              console.log('App: About to render BattleField with selectedDeck:', selectedDeck);
              console.log('App: selectedDeck type:', typeof selectedDeck);
              console.log('App: selectedDeck keys:', selectedDeck ? Object.keys(selectedDeck) : 'null');
              if (selectedDeck) {
                console.log('App: selectedDeck.cards exists:', 'cards' in selectedDeck);
                console.log('App: selectedDeck.cards value:', selectedDeck.cards);
              }
              return (
                <BattleField 
                  selectedDeck={selectedDeck}
                  duelMode={duelMode}
                  onBackToMenu={handleBackToMenu}
                />
              );
            })()
          )}
        </main>
      
      {currentView !== 'battle-field' && (
        <footer className="App-footer">
          <p>&copy; 2024 UNION ARENA Web App - Phase 2 Demo</p>
        </footer>
      )}
    </div>
  );
}

export default App;