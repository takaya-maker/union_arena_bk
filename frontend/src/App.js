// frontend/src/App.js
import React, { useState } from 'react';
import './App.css';
import CardList from './components/CardList/CardList';
import DeckBuilder from './components/DeckBuilder/DeckBuilder';
import BattleField from './components/BattleField/BattleField';
import DuelMode from './components/DuelMode/DuelMode';
import DeckSelector from './components/DeckSelector/DeckSelector';

function App() {
  const [currentView, setCurrentView] = useState('cards'); // 'cards', 'deck-builder', 'duel-mode', 'deck-selector', 'battle-field'
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [duelMode, setDuelMode] = useState(null);

  const handleDeckSelect = (deck) => {
    setSelectedDeck(deck);
    setCurrentView('battle-field');
  };

  const handleDuelModeSelect = (mode) => {
    setDuelMode(mode);
    setCurrentView('deck-selector');
  };

  const handleDeckSelectForDuel = (deck, mode) => {
    setSelectedDeck(deck);
    setDuelMode(mode);
    setCurrentView('battle-field');
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
          <BattleField 
            selectedDeck={selectedDeck}
            duelMode={duelMode}
            onBackToMenu={handleBackToMenu}
          />
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