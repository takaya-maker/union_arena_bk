import React, { useState, useEffect } from 'react';
import { cardAPI } from '../../services/api';
import { createDeck, updateDeck } from '../../services/deckAPI';
import { deckValidator } from '../../utils/deckValidator';
import { deckExporter } from '../../utils/deckExporter';
import CardComponent from '../Card/CardComponent';
import CardCompact from '../Card/CardCompact';
import CardDetailModal from '../Card/CardDetailModal';
import DeckList from '../DeckList/DeckList';
import './DeckBuilder.css';

const DeckBuilder = ({ onDeckSaved }) => {
  const [allCards, setAllCards] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [deckCards, setDeckCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // デッキ情報
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [editingDeck, setEditingDeck] = useState(null);
  
  // 検索パラメータ
  const [searchParams, setSearchParams] = useState({
    name: '',
    card_type: '',
    energy: '',
    card_term: '',
    card_rank: '',
    card_term_name: '',
    card_rank_name: ''
  });

  // 表示モード
  const [viewMode, setViewMode] = useState('builder'); // 'builder', 'list', 'validation'
  const [selectedDeck, setSelectedDeck] = useState(null);

  // 検証結果
  const [validationResult, setValidationResult] = useState(null);

  // 検索用オプションリスト
  const [cardTypes, setCardTypes] = useState([]);
  const [cardTerms, setCardTerms] = useState([]);
  const [cardRanks, setCardRanks] = useState([]);
  const [cardTermNames, setCardTermNames] = useState([]);
  const [cardRankNames, setCardRankNames] = useState([]);

  // カード表示モード
  const [cardDisplayMode, setCardDisplayMode] = useState('compact'); // 'compact', 'detailed'
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);

  // 初期データ読み込み
  useEffect(() => {
    loadInitialData();
  }, []);

  // デッキが変更されたら検証を実行
  useEffect(() => {
    if (deckCards.length > 0) {
      const result = deckValidator.validateDeck(deckCards);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [deckCards]);

  // カード詳細表示のハンドラー
  const handleCardClick = (card) => {
    setSelectedCardForDetail(card);
  };

  const handleCloseDetailModal = () => {
    setSelectedCardForDetail(null);
  };

  // フォームをリセット
  const resetForm = () => {
    setDeckName('');
    setDeckDescription('');
    setDeckCards([]);
    setEditingDeck(null);
    setValidationResult(null);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [cardsResponse, typesResponse, termsResponse, ranksResponse] = await Promise.all([
        cardAPI.getAllCards(),
        cardAPI.getCardTypes(),
        cardAPI.getCardTerms(),
        cardAPI.getCardRanks(),
      ]);

      // カードデータの処理
      if (cardsResponse && cardsResponse.success) {
        setAllCards(cardsResponse.data);
        setSearchResults(cardsResponse.data);
      } else {
        // ... (エラー処理)
      }

      // 各種リストの処理
      if (typesResponse && typesResponse.success) {
        setCardTypes(typesResponse.data);
      }
      if (termsResponse && termsResponse.success) {
        setCardTerms(termsResponse.data);
      }
      if (ranksResponse && ranksResponse.success) {
        setCardRanks(ranksResponse.data);
      }

    } catch (err) {
      setError('データの読み込みに失敗しました');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // カード検索
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (searchParams.name.trim()) params.name = searchParams.name.trim();
      if (searchParams.card_type) params.card_type = searchParams.card_type;
      if (searchParams.energy.trim()) params.energy = searchParams.energy.trim();
      if (searchParams.card_term) params.card_term = searchParams.card_term;
      if (searchParams.card_rank) params.card_rank = searchParams.card_rank;
      if (searchParams.card_term_name.trim()) params.card_term_name = searchParams.card_term_name.trim();
      if (searchParams.card_rank_name.trim()) params.card_rank_name = searchParams.card_rank_name.trim();

      const response = await cardAPI.searchCards(params);
      
      if (response && response.success) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setError('検索中にエラーが発生しました');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // カードをデッキに追加
  const addCardToDeck = (card) => {
    const existingCard = deckCards.find(deckCard => deckCard.card_id === card.id);
    
    if (existingCard) {
      // 既に存在する場合は枚数を増やす（最大4枚まで）
      if (existingCard.quantity < 4) {
        setDeckCards(prev => prev.map(deckCard => 
          deckCard.card_id === card.id 
            ? { ...deckCard, quantity: deckCard.quantity + 1 }
            : deckCard
        ));
      } else {
        alert('同じカードは最大4枚までしか追加できません');
      }
    } else {
      // 新しいカードを追加
      const deckCard = {
        card_id: card.id,
        name: card.name,
        card_type: card.カード種類,
        card_term_name: card.card_term_name,
        card_rank_name: card.card_rank_name,
        quantity: 1
      };
      setDeckCards(prev => [...prev, deckCard]);
    }
  };

  // デッキからカードを削除
  const removeCardFromDeck = (cardId) => {
    setDeckCards(prev => prev.filter(card => card.card_id !== cardId));
  };

  // カード枚数を変更
  const changeCardQuantity = (cardId, newQuantity) => {
    if (newQuantity <= 0) {
      removeCardFromDeck(cardId);
    } else if (newQuantity <= 4) {
      setDeckCards(prev => prev.map(card => 
        card.card_id === cardId 
          ? { ...card, quantity: newQuantity }
          : card
      ));
    }
  };

  // デッキを保存
  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      alert('デッキ名を入力してください');
      return;
    }

    if (deckCards.length === 0) {
      alert('デッキにカードを追加してください');
      return;
    }

    try {
      const deckData = {
        name: deckName,
        description: deckDescription,
        cards: deckCards.map(card => ({
          card_id: card.card_id,
          name: card.name,
          quantity: card.quantity
        }))
      };

      let response;
      if (editingDeck) {
        response = await updateDeck(editingDeck.id, deckData);
      } else {
        response = await createDeck(deckData);
      }

      alert(editingDeck ? 'デッキを更新しました' : 'デッキを保存しました');
      
      // フォームをリセット
      resetForm();
      
      // 親コンポーネントに通知
      if (onDeckSaved) {
        onDeckSaved(response);
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      alert('デッキの保存に失敗しました');
    }
  };

  // デッキを読み込み
  const loadDeck = (deck) => {
    setDeckName(deck.name);
    setDeckDescription(deck.description || '');
    setDeckCards(deck.cards);
    setEditingDeck(deck);
    setViewMode('builder');
  };

  // デッキを編集
  const editDeck = (deck) => {
    loadDeck(deck);
  };

  // デッキを削除
  const deleteDeck = (deck) => {
    if (editingDeck && editingDeck.id === deck.id) {
      resetForm();
    }
  };

  // 検索パラメータ変更
  const handleSearchParamChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // デッキの総枚数計算
  const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0);

  // デッキコードを生成
  const generateDeckCode = async () => {
    if (deckCards.length === 0) {
      alert('デッキにカードを追加してください');
      return;
    }

    const deck = {
      name: deckName || '無名のデッキ',
      description: deckDescription,
      cards: deckCards
    };

    try {
      const success = await deckExporter.copyToClipboard(deck);
      if (success) {
        alert('デッキコードをクリップボードにコピーしました！');
      } else {
        alert('クリップボードへのコピーに失敗しました');
      }
    } catch (err) {
      alert('デッキコードの生成に失敗しました');
      console.error('Generate deck code error:', err);
    }
  };

  // デッキコードを読み込み
  const loadDeckCode = async () => {
    try {
      const deck = await deckExporter.loadFromClipboard();
      setDeckName(deck.name);
      setDeckDescription(deck.description || '');
      setDeckCards(deck.cards);
      setEditingDeck(null);
      setViewMode('builder');
      alert('デッキコードを読み込みました！');
    } catch (err) {
      alert('デッキコードの読み込みに失敗しました: ' + err.message);
    }
  };

  // デッキをファイルにエクスポート
  const exportDeckToFile = () => {
    if (deckCards.length === 0) {
      alert('デッキにカードを追加してください');
      return;
    }

    const deck = {
      name: deckName || '無名のデッキ',
      description: deckDescription,
      cards: deckCards
    };

    deckExporter.exportToFile(deck);
  };

  // ファイルからデッキをインポート
  const importDeckFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    deckExporter.importFromFile(file)
      .then(deck => {
        setDeckName(deck.name);
        setDeckDescription(deck.description || '');
        setDeckCards(deck.cards);
        setEditingDeck(null);
        setViewMode('builder');
        alert('デッキファイルを読み込みました！');
      })
      .catch(err => {
        alert('デッキファイルの読み込みに失敗しました: ' + err.message);
      });

    // ファイル入力をリセット
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="deck-builder-container">
        <div className="loading">データを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deck-builder-container">
        <div className="error">
          {error}
          <button onClick={loadInitialData} className="retry-button">
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-builder-container">
      <div className="deck-builder-header">
        <h2>デッキ構築</h2>
        
        {/* ナビゲーション */}
        <div className="deck-nav">
          <button 
            className={`nav-btn ${viewMode === 'builder' ? 'active' : ''}`}
            onClick={() => setViewMode('builder')}
          >
            デッキ構築
          </button>
          <button 
            className={`nav-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            デッキ一覧
          </button>
          <button 
            className={`nav-btn ${viewMode === 'validation' ? 'active' : ''}`}
            onClick={() => setViewMode('validation')}
            disabled={deckCards.length === 0}
          >
            デッキ検証
          </button>
        </div>

        {/* デッキ情報 */}
        {viewMode === 'builder' && (
          <div className="deck-info">
            <div className="deck-form">
              <div className="form-group">
                <label>デッキ名:</label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="デッキ名を入力"
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label>説明:</label>
                <textarea
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  placeholder="デッキの説明（任意）"
                  rows={3}
                />
              </div>
            </div>
            <div className="deck-stats">
              <div className="stat">
                <span className="label">総枚数:</span>
                <span className={`value ${totalCards === 50 ? 'valid' : 'invalid'}`}>
                  {totalCards}/50
                </span>
              </div>
              <div className="stat">
                <span className="label">カード種類:</span>
                <span className="value">{deckCards.length}種類</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* メインコンテンツ */}
      {viewMode === 'builder' && (
        <div className="deck-builder-content">
          {/* カード検索セクション */}
          <div className="card-search-section">
            <h3>カード検索</h3>
            
            <div className="search-form">
              <div className="search-inputs">
                <div className="search-field">
                  <label>カード名:</label>
                  <input
                    type="text"
                    value={searchParams.name}
                    onChange={(e) => handleSearchParamChange('name', e.target.value)}
                    placeholder="カード名で検索"
                  />
                </div>

                <div className="search-field">
                  <label>カード種類:</label>
                  <select
                    value={searchParams.card_type}
                    onChange={(e) => handleSearchParamChange('card_type', e.target.value)}
                  >
                    <option value="">すべて</option>
                    {cardTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="search-field">
                  <label>必要エナジー:</label>
                  <input
                    type="text"
                    value={searchParams.energy}
                    onChange={(e) => handleSearchParamChange('energy', e.target.value)}
                    placeholder="例: 青1"
                  />
                </div>

                <div className="search-field">
                  <label>作品（略称）:</label>
                  <select
                    value={searchParams.card_term}
                    onChange={(e) => handleSearchParamChange('card_term', e.target.value)}
                  >
                    <option value="">すべて</option>
                    {cardTerms.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>

                <div className="search-field">
                  <label>セット（略称）:</label>
                  <select
                    value={searchParams.card_rank}
                    onChange={(e) => handleSearchParamChange('card_rank', e.target.value)}
                  >
                    <option value="">すべて</option>
                    {cardRanks.map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>

                <div className="search-field">
                  <label>作品（日本語名）:</label>
                  <input
                    type="text"
                    value={searchParams.card_term_name}
                    onChange={(e) => handleSearchParamChange('card_term_name', e.target.value)}
                    placeholder="例: HUNTER×HUNTER"
                  />
                </div>
              </div>

              <div className="search-buttons">
                <button onClick={handleSearch} className="search-button">
                  検索
                </button>
                <button onClick={() => setSearchResults(allCards)} className="show-all-button">
                  全て表示
                </button>
              </div>
            </div>

            <div className="search-results">
              <div className="search-results-header">
                <h4>検索結果 ({searchResults.length}件)</h4>
                <div className="display-mode-controls">
                  <button 
                    className={`mode-btn ${cardDisplayMode === 'compact' ? 'active' : ''}`}
                    onClick={() => setCardDisplayMode('compact')}
                    title="コンパクト表示"
                  >
                    📋
                  </button>
                  <button 
                    className={`mode-btn ${cardDisplayMode === 'detailed' ? 'active' : ''}`}
                    onClick={() => setCardDisplayMode('detailed')}
                    title="詳細表示"
                  >
                    📄
                  </button>
                </div>
              </div>
              
              <div className="cards-grid">
                {Array.isArray(searchResults) && searchResults.map(card => (
                  <div key={card.id} className="search-card-item">
                    {cardDisplayMode === 'compact' ? (
                      <CardCompact 
                        card={card}
                        onClick={handleCardClick}
                        onAddToDeck={addCardToDeck}
                        isSelected={selectedCardForDetail?.id === card.id}
                      />
                    ) : (
                      <>
                        <CardComponent card={card} />
                        <button 
                          onClick={() => addCardToDeck(card)}
                          className="add-to-deck-button"
                        >
                          デッキに追加
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {!Array.isArray(searchResults) && (
                  <div className="search-error">
                    検索結果の読み込みに失敗しました
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* デッキセクション */}
          <div className="deck-section">
            <h3>デッキ ({totalCards}枚)</h3>
            
            {deckCards.length === 0 ? (
              <div className="empty-deck">
                <p>デッキにカードを追加してください</p>
              </div>
            ) : (
              <div className="deck-cards">
                {deckCards.map(card => (
                  <div key={card.card_id} className="deck-card-item">
                    <div className="card-info">
                      <span className="card-name">{card.name}</span>
                      <span className="card-type">{card.card_type}</span>
                      {card.card_term_name && (
                        <span className="card-term">{card.card_term_name}</span>
                      )}
                    </div>
                    <div className="card-controls">
                      <button 
                        onClick={() => changeCardQuantity(card.card_id, card.quantity - 1)}
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <span className="quantity">{card.quantity}</span>
                      <button 
                        onClick={() => changeCardQuantity(card.card_id, card.quantity + 1)}
                        className="quantity-btn"
                        disabled={card.quantity >= 4}
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeCardFromDeck(card.card_id)}
                        className="remove-btn"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 検証結果表示 */}
            {validationResult && (
              <div className="validation-section">
                <h4>デッキ検証結果</h4>
                {validationResult.errors.length > 0 && (
                  <div className="validation-errors">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="error-item">❌ {error}</div>
                    ))}
                  </div>
                )}
                {validationResult.warnings.length > 0 && (
                  <div className="validation-warnings">
                    {validationResult.warnings.map((warning, index) => (
                      <div key={index} className="warning-item">⚠️ {warning}</div>
                    ))}
                  </div>
                )}
                {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
                  <div className="validation-success">✅ デッキは有効です</div>
                )}
              </div>
            )}

            <div className="deck-actions">
              <button 
                onClick={handleSaveDeck}
                className="save-deck-button"
                disabled={!deckName.trim() || deckCards.length === 0}
              >
                {editingDeck ? 'デッキを更新' : 'デッキを保存'}
              </button>
              
              {editingDeck && (
                <button 
                  onClick={resetForm}
                  className="cancel-button"
                >
                  キャンセル
                </button>
              )}
            </div>

            {/* 共有機能 */}
            <div className="share-section">
              <h4>デッキ共有</h4>
              <div className="share-buttons">
                <button onClick={generateDeckCode} className="share-btn">
                  デッキコード生成
                </button>
                <button onClick={loadDeckCode} className="share-btn">
                  デッキコード読み込み
                </button>
                <button onClick={exportDeckToFile} className="share-btn">
                  ファイルにエクスポート
                </button>
                <label className="share-btn file-input-label">
                  ファイルからインポート
                  <input
                    type="file"
                    accept=".json"
                    onChange={importDeckFromFile}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* デッキ一覧表示 */}
      {viewMode === 'list' && (
        <DeckList 
          onDeckSelect={setSelectedDeck}
          onDeckEdit={editDeck}
          onDeckDelete={deleteDeck}
        />
      )}

      {/* デッキ検証詳細表示 */}
      {viewMode === 'validation' && validationResult && (
        <div className="validation-detail">
          <h3>デッキ詳細分析</h3>
          
          <div className="validation-summary">
            <div className={`validation-status ${validationResult.isValid ? 'valid' : 'invalid'}`}>
              {validationResult.isValid ? '✅ 有効なデッキ' : '❌ 無効なデッキ'}
            </div>
            
            <div className="validation-stats">
              <h4>統計情報</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="label">総枚数:</span>
                  <span className="value">{validationResult.stats.totalCards}/50</span>
                </div>
                <div className="stat-item">
                  <span className="label">カード種類:</span>
                  <span className="value">{validationResult.stats.uniqueCards}種類</span>
                </div>
              </div>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="validation-errors">
                <h4>エラー</h4>
                {validationResult.errors.map((error, index) => (
                  <div key={index} className="error-item">❌ {error}</div>
                ))}
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="validation-warnings">
                <h4>警告</h4>
                {validationResult.warnings.map((warning, index) => (
                  <div key={index} className="warning-item">⚠️ {warning}</div>
                ))}
              </div>
            )}
          </div>

          <div className="deck-analysis">
            <h4>デッキ分析</h4>
            {(() => {
              const analysis = deckValidator.analyzeDeck(deckCards);
              const compatibility = deckValidator.checkDeckCompatibility(deckCards);
              
              return (
                <div className="analysis-content">
                  {analysis.recommendations.length > 0 && (
                    <div className="recommendations">
                      <h5>推奨事項</h5>
                      {analysis.recommendations.map((rec, index) => (
                        <div key={index} className="recommendation-item">💡 {rec}</div>
                      ))}
                    </div>
                  )}

                  {analysis.strengths.length > 0 && (
                    <div className="strengths">
                      <h5>強み</h5>
                      {analysis.strengths.map((strength, index) => (
                        <div key={index} className="strength-item">✅ {strength}</div>
                      ))}
                    </div>
                  )}

                  {analysis.weaknesses.length > 0 && (
                    <div className="weaknesses">
                      <h5>改善点</h5>
                      {analysis.weaknesses.map((weakness, index) => (
                        <div key={index} className="weakness-item">⚠️ {weakness}</div>
                      ))}
                    </div>
                  )}

                  {compatibility.synergies.length > 0 && (
                    <div className="synergies">
                      <h5>相性</h5>
                      {compatibility.synergies.map((synergy, index) => (
                        <div key={index} className="synergy-item">🎯 {synergy}</div>
                      ))}
                    </div>
                  )}

                  {compatibility.issues.length > 0 && (
                    <div className="compatibility-issues">
                      <h5>相性の問題</h5>
                      {compatibility.issues.map((issue, index) => (
                        <div key={index} className="issue-item">⚠️ {issue}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* カード詳細モーダル */}
      <CardDetailModal
        card={selectedCardForDetail}
        isOpen={!!selectedCardForDetail}
        onClose={handleCloseDetailModal}
        onAddToDeck={addCardToDeck}
      />
    </div>
  );
};

export default DeckBuilder; 