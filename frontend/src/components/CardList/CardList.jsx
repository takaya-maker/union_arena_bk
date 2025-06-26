// frontend/src/components/CardList/CardList.jsx（ESLint準拠版）
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CardCompact from '../Card/CardCompact';
import CardDetailModal from '../Card/CardDetailModal';
import { cardAPI } from '../../services/api';
import { useCardSearch } from '../../hooks/useCardSearch';
import './CardList.css';

// カードアイテムコンポーネント（メモ化）
const CardItem = React.memo(({ columnIndex, rowIndex, style, data }) => {
  const { cards, columnsPerRow, onCardSelect, selectedCardId } = data;
  const cardIndex = rowIndex * columnsPerRow + columnIndex;
  const card = cards[cardIndex];

  if (!card) {
    return <div style={style} />; // 空のセル
  }

  return (
    <div style={style}>
      <div className="card-item-wrapper">
        <CardCompact
          card={card}
          onClick={() => onCardSelect(card)}
          isSelected={selectedCardId === card.id}
          showAddButton={false}
        />
      </div>
    </div>
  );
});

// フォールバック用グリッドコンポーネント
const FallbackGrid = ({ cards, onCardSelect, selectedCardId }) => {
  return (
    <div className="fallback-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '16px',
      padding: '16px'
    }}>
      {cards.map(card => (
        <CardCompact
          key={card.id}
          card={card}
          onClick={() => onCardSelect(card)}
          isSelected={selectedCardId === card.id}
          showAddButton={false}
        />
      ))}
    </div>
  );
};

// 仮想化グリッドコンポーネント
const VirtualizedGrid = ({ 
  gridDimensions, 
  rowCount, 
  itemData, 
  onScroll 
}) => {
  const [Grid, setGrid] = useState(null);

  useEffect(() => {
    // 動的インポートでreact-windowを読み込み
    const loadReactWindow = async () => {
      try {
        const { FixedSizeGrid } = await import('react-window');
        setGrid(() => FixedSizeGrid);
      } catch (error) {
        console.warn('react-window is not available:', error);
        setGrid(null);
      }
    };

    loadReactWindow();
  }, []);

  if (!Grid) {
    // react-windowが利用できない場合はフォールバック
    return (
      <FallbackGrid 
        cards={itemData.cards}
        onCardSelect={itemData.onCardSelect}
        selectedCardId={itemData.selectedCardId}
      />
    );
  }

  return (
    <div className="virtualized-grid-container">
      <Grid
        columnCount={gridDimensions.columnsPerRow}
        columnWidth={200}
        height={gridDimensions.height}
        rowCount={rowCount}
        rowHeight={280}
        width={gridDimensions.width}
        itemData={itemData}
        onScroll={onScroll}
        overscanRowCount={2}
        style={{ margin: '0 auto' }}
      >
        {CardItem}
      </Grid>
    </div>
  );
};

// メインカードリストコンポーネント
const CardList = () => {
  const {
    searchParams,
    cards: searchResults,
    loading: searchLoading,
    error: searchError,
    updateSearchParam,
    clearCache,
    cacheSize
  } = useCardSearch();

  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [cardTypes, setCardTypes] = useState([]);
  const [cardTermNames, setCardTermNames] = useState([]);
  const [cardRanks, setCardRanks] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [allCards, setAllCards] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [gridDimensions, setGridDimensions] = useState({
    width: 1200,
    height: 600,
    columnsPerRow: 6
  });

  // レスポンシブ対応：画面サイズに応じてグリッドのカラム数を調整
  useEffect(() => {
    const updateGridDimensions = () => {
      const containerWidth = Math.min(window.innerWidth - 40, 1400);
      const cardWidth = 200;
      const columnsPerRow = Math.floor(containerWidth / cardWidth);
      
      setGridDimensions({
        width: containerWidth,
        height: Math.min(window.innerHeight - 400, 800),
        columnsPerRow: Math.max(columnsPerRow, 1)
      });
    };

    updateGridDimensions();
    window.addEventListener('resize', updateGridDimensions);
    return () => window.removeEventListener('resize', updateGridDimensions);
  }, []);

  // 初期データ読み込み
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      
      // APIがページング対応しているかチェック
      const [
        cardsResponse, 
        typesResponse, 
        termNamesResponse, 
        ranksResponse
      ] = await Promise.all([
        cardAPI.getAllCards(),
        cardAPI.getCardTypes(),
        cardAPI.getCardTermNames(),
        cardAPI.getCardRanks()
      ]);

      if (cardsResponse.success) {
        setAllCards(cardsResponse.data || []);
      } else if (cardsResponse.data) {
        // 古いAPI形式の場合
        setAllCards(cardsResponse.data);
      }

      if (typesResponse.success) {
        setCardTypes(typesResponse.data || []);
      } else if (typesResponse.data) {
        setCardTypes(typesResponse.data);
      }

      if (termNamesResponse.success) {
        setCardTermNames(termNamesResponse.data || []);
      } else if (termNamesResponse.data) {
        setCardTermNames(termNamesResponse.data);
      }

      if (ranksResponse.success) {
        setCardRanks(ranksResponse.data || []);
      } else if (ranksResponse.data) {
        setCardRanks(ranksResponse.data);
      }

    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  // 無限スクロール用の追加データ読み込み
  const loadMoreCards = useCallback(async () => {
    if (isSearchMode) return;
    
    try {
      // ページング対応APIが利用可能な場合のみ実行
      if (typeof cardAPI.getAllCards === 'function') {
        const nextPage = Math.floor(allCards.length / 100) + 1;
        const response = await cardAPI.getAllCards(nextPage, 100);
        
        if (response.success && response.data.length > 0) {
          setAllCards(prev => [...prev, ...response.data]);
        }
      }
    } catch (err) {
      console.error('Error loading more cards:', err);
    }
  }, [allCards.length, isSearchMode]);

  // 表示するカードを決定
  const displayCards = useMemo(() => {
    return isSearchMode ? searchResults : allCards;
  }, [isSearchMode, searchResults, allCards]);

  // グリッドの行数計算
  const rowCount = useMemo(() => {
    return Math.ceil(displayCards.length / gridDimensions.columnsPerRow);
  }, [displayCards.length, gridDimensions.columnsPerRow]);

  // 検索状態の判定
  useEffect(() => {
    const hasSearchTerm = Object.values(searchParams).some(value => 
      value && value.toString().trim()
    );
    setIsSearchMode(hasSearchTerm);
  }, [searchParams]);

  // 全カード表示に戻る
  const handleShowAll = async () => {
    Object.keys(searchParams).forEach(key => {
      updateSearchParam(key, '');
    });
    
    // 必要に応じて全カードを再読み込み
    try {
      const response = await cardAPI.getAllCards();
      if (response.success) {
        setAllCards(response.data || []);
      } else if (response.data) {
        setAllCards(response.data);
      }
    } catch (err) {
      console.error('Error loading all cards:', err);
    }
  };

  // カード選択
  const handleCardSelect = useCallback((card) => {
    setSelectedCard(card);
    setShowDetailModal(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedCard(null);
  }, []);

  // 検索入力の変更
  const handleSearchParamChange = useCallback((field, value) => {
    updateSearchParam(field, value);
  }, [updateSearchParam]);

  // グリッドアイテムデータ
  const itemData = useMemo(() => ({
    cards: displayCards,
    columnsPerRow: gridDimensions.columnsPerRow,
    onCardSelect: handleCardSelect,
    selectedCardId: selectedCard?.id
  }), [displayCards, gridDimensions.columnsPerRow, handleCardSelect, selectedCard?.id]);

  // スクロール時の追加読み込み処理
  const handleScroll = useCallback(({ scrollTop, scrollHeight, clientHeight }) => {
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      loadMoreCards();
    }
  }, [loadMoreCards]);

  const isLoading = initialLoading || (isSearchMode && searchLoading);

  if (initialLoading) {
    return (
      <div className="card-list-container">
        <div className="loading">初期データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="card-list-container">
      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{padding: '10px', background: '#f0f0f0', margin: '10px 0'}}>
          <small>
            キャッシュ: {cacheSize} | 
            検索モード: {isSearchMode ? 'ON' : 'OFF'} |
            表示: {displayCards.length}件 |
            グリッド: {gridDimensions.columnsPerRow}列 × {rowCount}行
            <button onClick={clearCache} style={{marginLeft: '10px', fontSize: '12px'}}>
              キャッシュクリア
            </button>
          </small>
        </div>
      )}

      {/* 検索フォーム */}
      <div className="search-form">
        <h2>カード検索</h2>
        
        <div className="search-inputs">
          <div className="search-field">
            <label>カード名:</label>
            <input
              type="text"
              value={searchParams.name}
              onChange={(e) => handleSearchParamChange('name', e.target.value)}
              placeholder="カード名で検索（自動検索）"
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
            <label>アニメタイトル:</label>
            <select
              value={searchParams.card_term_name}
              onChange={(e) => handleSearchParamChange('card_term_name', e.target.value)}
            >
              <option value="">すべて</option>
              {cardTermNames.map(termName => (
                <option key={termName} value={termName}>{termName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="search-buttons">
          <button onClick={handleShowAll} className="show-all-button">
            全て表示
          </button>
          {isSearchMode && (
            <span className="search-status">
              {searchLoading ? '検索中...' : `${searchResults.length}件の結果`}
            </span>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {searchError && (
        <div className="error">{searchError}</div>
      )}

      {/* カード一覧 */}
      <div className="cards-section">
        <div className="cards-header">
          <h3>
            カード一覧 ({displayCards.length}件)
            {isSearchMode && ' - 検索結果'}
          </h3>
        </div>

        {isLoading && (
          <div className="loading">読み込み中...</div>
        )}

        {displayCards.length > 0 ? (
          <VirtualizedGrid 
            gridDimensions={gridDimensions}
            rowCount={rowCount}
            itemData={itemData}
            onScroll={handleScroll}
          />
        ) : (
          !isLoading && (
            <div className="no-cards">
              {isSearchMode ? '検索条件に一致するカードが見つかりませんでした' : 'カードが見つかりませんでした'}
            </div>
          )
        )}
      </div>

      <CardDetailModal
        card={selectedCard}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        showAddButton={false}
      />
    </div>
  );
};

export default CardList;