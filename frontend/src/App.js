// frontend/src/App.js
import React, { useState } from 'react';
import './App.css';
import CardList from './components/CardList/CardList';
import DeckBuilder from './components/DeckBuilder/DeckBuilder';

function App() {
  const [currentView, setCurrentView] = useState('cards'); // 'cards' or 'deck-builder'

  return (
    <div className="App">
      <header className="App-header">
        <h1>UNION ARENA</h1>
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
        </nav>
      </header>

      <main className="App-main">
        {currentView === 'cards' && <CardList />}
        {currentView === 'deck-builder' && <DeckBuilder />}
      </main>
      
      <footer className="App-footer">
        <p>&copy; 2024 UNION ARENA Web App - Phase 1 Demo</p>
      </footer>
    </div>
  );
}

export default App;