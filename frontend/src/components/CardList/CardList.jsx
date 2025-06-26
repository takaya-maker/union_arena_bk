// frontend/src/components/CardList/CardList.jsx
import React, { useState, useEffect } from 'react';
import CardCompact from '../Card/CardCompact';
import CardDetailModal from '../Card/CardDetailModal';
import { cardAPI } from '../../services/api';
import './CardList.css';

const CardList = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchParams, setSearchParams] = useState({
    name: '',
    card_type: '',
    energy: '',
    card_term: '',
    card_rank: '',
    card_term_name: '',
    card_rank_name: ''
  });
  const [cardTypes, setCardTypes] = useState([]);
  const [cardTerms, setCardTerms] = useState([]);
  const [cardRanks, setCardRanks] = useState([]);
  const [cardTermNames, setCardTermNames] = useState([]);
  const [cardRankNames, setCardRankNames] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);

  // 初期データ読み込み
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // カードデータと各種一覧を並行して取得
      const [
        cardsResponse, 
        typesResponse, 
        termsResponse, 
        ranksResponse,
        termNamesResponse,
        rankNamesResponse
      ] = await Promise.all([
        cardAPI.getAllCards(page, limit),
        cardAPI.getCardTypes(),
        cardAPI.getCardTerms(),
        cardAPI.getCardRanks(),
        cardAPI.getCardTermNames(),
        cardAPI.getCardRankNames()
      ]);

      if (cardsResponse.success) {
        setCards(cardsResponse.data);
        setTotal(cardsResponse.count);
      }

      if (typesResponse.success) {
        setCardTypes(typesResponse.data);
      }

      if (termsResponse.success) {
        setCardTerms(termsResponse.data);
      }

      if (ranksResponse.success) {
        setCardRanks(ranksResponse.data);
      }

      if (termNamesResponse.success) {
        setCardTermNames(termNamesResponse.data);
      }

      if (rankNamesResponse.success) {
        setCardRankNames(rankNamesResponse.data);
      }

    } catch (err) {
      setError('データの読み込みに失敗しました');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 検索実行
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      // 空の検索パラメータは除外
      const params = {};
      if (searchParams.name.trim()) params.name = searchParams.name.trim();
      if (searchParams.card_type) params.card_type = searchParams.card_type;
      if (searchParams.energy.trim()) params.energy = searchParams.energy.trim();
      if (searchParams.card_term) params.card_term = searchParams.card_term;
      if (searchParams.card_rank) params.card_rank = searchParams.card_rank;
      if (searchParams.card_term_name.trim()) params.card_term_name = searchParams.card_term_name.trim();
      if (searchParams.card_rank_name.trim()) params.card_rank_name = searchParams.card_rank_name.trim();

      const response = await cardAPI.searchCards(params);
      
      if (response.success) {
        setCards(response.data);
      } else {
        setError('検索に失敗しました');
      }
    } catch (err) {
      setError('検索中にエラーが発生しました');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 全カード表示
  const handleShowAll = async () => {
    setSearchParams({ 
      name: '', 
      card_type: '', 
      energy: '', 
      card_term: '', 
      card_rank: '', 
      card_term_name: '', 
      card_rank_name: '' 
    });
    await loadInitialData();
  };

  // カード選択
  const handleCardSelect = (card) => {
    setSelectedCard(card);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCard(null);
  };

  // 検索パラメータ変更
  const handleSearchParamChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadCards = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await cardAPI.getAllCards(pageNum, limit);
      if (response.success) {
        setCards(response.data);
        setTotal(response.count);
        setPage(response.page);
      }
    } catch (err) {
      setError('カードの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards(page);
  }, [page, limit]);

  if (loading) {
    return (
      <div className="card-list-container">
        <div className="loading">データを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-list-container">
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
    <div className="card-list-container">
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
            <label>作品（日本語名）:</label>
            <input
              type="text"
              value={searchParams.card_term_name}
              onChange={(e) => handleSearchParamChange('card_term_name', e.target.value)}
              placeholder="例: ハイキュー!!"
            />
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

          {/* <div className="search-field">
            <label>セット（日本語名）:</label>
            <input
              type="text"
              value={searchParams.card_rank_name}
              onChange={(e) => handleSearchParamChange('card_rank_name', e.target.value)}
              placeholder="例: メインセット01"
            />
          </div> */}
        </div>

        <div className="search-buttons">
          <button onClick={handleSearch} className="search-button">
            検索
          </button>
          <button onClick={handleShowAll} className="show-all-button">
            全て表示
          </button>
        </div>
      </div>

      {/* カード一覧 */}
      <div className="cards-section">
        <div className="cards-header">
          <h3>カード一覧 ({cards.length}件)</h3>
          {selectedCard && (
            <div className="selected-info">
              選択中: {selectedCard.name}
            </div>
          )}
        </div>

        <div className="cards-grid">
          {cards.map(card => (
            <CardCompact
              key={card.id}
              card={card}
              onClick={() => handleCardSelect(card)}
              isSelected={selectedCard?.id === card.id}
              showAddButton={false}
            />
          ))}
        </div>

        {cards.length === 0 && (
          <div className="no-cards">
            カードが見つかりませんでした
          </div>
        )}
      </div>
      <CardDetailModal
        card={selectedCard}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        showAddButton={false}
      />
      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>前へ</button>
        <span>{page} / {Math.ceil(total / limit)}ページ</span>
        <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / limit)}>次へ</button>
      </div>
    </div>
  );
};

export default CardList;