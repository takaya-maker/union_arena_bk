import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/config';
import { getImageUrl } from '../../services/api';
import SoundManager from './SoundManager';
import { 
  PhaseManager, 
  GAME_PHASES, 
  PHASE_DISPLAY_NAMES, 
  PHASE_ORDER,
  canPerformAction 
} from '../../utils/gamePhases';
import { 
  EnergyManager, 
  parseEnergyCost, 
  formatEnergyCost 
} from '../../utils/energySystem';
import { 
  LifeManager, 
  VictoryConditionChecker 
} from '../../utils/lifeSystem';
import './BattleField.css';

const BattleField = ({ selectedDeck, duelMode, onBackToMenu }) => {
  // ゲーム管理システムの初期化
  const [phaseManager] = useState(() => new PhaseManager());
  const [playerEnergyManager] = useState(() => new EnergyManager());
  const [opponentEnergyManager] = useState(() => new EnergyManager());
  const [playerLifeManager] = useState(() => new LifeManager(20));
  const [opponentLifeManager] = useState(() => new LifeManager(20));
  const [victoryChecker] = useState(() => new VictoryConditionChecker(playerLifeManager, opponentLifeManager));
  const [soundManager] = useState(() => new SoundManager());

  const [gameState, setGameState] = useState({
    playerHand: [],
    playerField: [],
    playerDeck: [],
    opponentField: [],
    opponentHand: [], // 相手の手札（枚数のみ表示）
    opponentDeck: [], // 相手のデッキ（枚数のみ表示）
    currentTurn: 'player',
    turnNumber: 1,
    gamePhase: phaseManager.getCurrentPhase()
  });

  const [selectedCard, setSelectedCard] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [gameOver, setGameOver] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [cardDetails, setCardDetails] = useState({}); // カード詳細情報を保存

  // カード詳細情報を取得する関数
  const fetchCardDetails = async (cardId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cards/${cardId}`);
      if (response.ok) {
        const cardData = await response.json();
        return cardData;
      }
    } catch (error) {
      console.error('Error fetching card details:', error);
    }
    return null;
  };

  // カード情報を解析して表示用テキストを生成する関数
  const parseTextWithImages = (text, type) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const imageName = part.slice(1, -1).replace(/[:*?"<>|]/g, '');
        let imageUrl = '';
        if (type === 'generated_energy') {
          imageUrl = getImageUrl.generatedEnergyImage(imageName);
        } else if (type === 'effect') {
          imageUrl = getImageUrl.effectImage(imageName);
        } else if (type === 'trigger') {
          imageUrl = getImageUrl.effectImage(imageName);
        }
        return (
          <img
            key={index}
            src={imageUrl}
            alt={imageName}
            className="inline-effect-icon"
            style={{ width: '16px', height: '16px', verticalAlign: 'middle', margin: '0 2px' }}
          />
        );
      }
      return part;
    });
  };

  // デッキから初期手札を設定
  useEffect(() => {
    if (selectedDeck && selectedDeck.cards) {
      // デッキのカードをquantityに応じて展開
      const expandedDeck = [];
      selectedDeck.cards.forEach(card => {
        for (let i = 0; i < card.quantity; i++) {
          expandedDeck.push({
            ...card,
            uniqueId: `${card.card_id}_${i}` // 同じカードでも区別できるようにユニークIDを付与
          });
        }
      });

      // デッキをシャッフル
      const shuffledDeck = [...expandedDeck].sort(() => Math.random() - 0.5);
      
      const initialHand = shuffledDeck.slice(0, 5); // 初期手札5枚
      const remainingDeck = shuffledDeck.slice(5);
      
      // 相手の初期設定（モックデータ）
      const opponentHandCount = 5;
      const opponentDeckCount = expandedDeck.length;
      
      setGameState(prev => ({
        ...prev,
        playerHand: initialHand,
        playerDeck: remainingDeck,
        opponentHand: new Array(opponentHandCount).fill(null), // 手札枚数のみ
        opponentDeck: new Array(opponentDeckCount).fill(null) // デッキ枚数のみ
      }));

      // カード詳細情報を取得
      const fetchAllCardDetails = async () => {
        const details = {};
        for (const card of expandedDeck) {
          const cardDetail = await fetchCardDetails(card.card_id);
          if (cardDetail) {
            details[card.card_id] = cardDetail;
          }
        }
        setCardDetails(details);
      };
      
      fetchAllCardDetails();

      // ゲーム開始ログとサウンド
      const modeDisplayName = getModeDisplayName(duelMode);
      addBattleLog(`${modeDisplayName}開始！デッキ「${selectedDeck.name}」で対戦します`);
      addBattleLog(`ライフ: プレイヤー ${playerLifeManager.getCurrentLife()}, 対戦相手 ${opponentLifeManager.getCurrentLife()}`);
      addBattleLog(`デッキ枚数: ${expandedDeck.length}枚`);
      soundManager.playSFX('success');
      soundManager.playBGM('battle');
    }

    // コンポーネントアンマウント時にBGM停止とクリーンアップ
    return () => {
      soundManager.stopBGM();
      soundManager.cleanup();
    };
  }, [selectedDeck, duelMode]);

  // 背景画像の読み込み確認
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setBackgroundLoaded(true);
      setBackgroundStyle({
        backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/battle-bg.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      });
    };
    img.onerror = () => {
      setBackgroundLoaded(false);
      setBackgroundStyle({});
    };
    img.src = `${process.env.PUBLIC_URL}/assets/images/battle-bg.jpg`;
  }, []);

  // 勝利条件チェック
  useEffect(() => {
    const victoryResult = victoryChecker.checkVictoryConditions();
    if (victoryResult) {
      setGameOver(victoryResult);
      addBattleLog(victoryResult.message);
      
      if (victoryResult.winner === 'player') {
        soundManager.playSFX('victory');
        soundManager.playBGM('victory');
      } else {
        soundManager.playSFX('defeat');
        soundManager.playBGM('defeat');
      }
    }
  }, [playerLifeManager.getCurrentLife(), opponentLifeManager.getCurrentLife()]);

  const getModeDisplayName = (mode) => {
    switch (mode) {
      case 'online': return 'オンライン対戦';
      case 'computer': return 'コンピュータ対戦';
      case 'test': return 'テストモード';
      default: return 'デュエル';
    }
  };

  const getNextPhaseName = () => {
    const currentIndex = PHASE_ORDER.indexOf(gameState.gamePhase);
    const nextIndex = (currentIndex + 1) % PHASE_ORDER.length;
    return PHASE_DISPLAY_NAMES[PHASE_ORDER[nextIndex]];
  };

  const getEnergyImageUrl = (energyType) => {
    // 色名を日本語にマッピング
    const energyNameMap = {
      blue: '青',
      red: '赤',
      green: '緑',
      yellow: '黄',
      purple: '紫'
    };
    
    const japaneseName = energyNameMap[energyType] || energyType;
    return `${process.env.PUBLIC_URL}/assets/images/energy/${japaneseName}.png`;
  };

  const addBattleLog = (message) => {
    setBattleLog(prev => [...prev, { id: Date.now(), message, timestamp: new Date() }]);
  };

  const handleCardClick = (card) => {
    if (gameOver) return;
    
    const currentPhase = phaseManager.getCurrentPhase();
    
    // プレイヤーのターンで、メインフェーズまたはバトルフェーズの場合のみカード選択可能
    if (gameState.currentTurn === 'player' && 
        (currentPhase === GAME_PHASES.MAIN || currentPhase === GAME_PHASES.BATTLE)) {
      
      // カード詳細情報からコストを取得
      const cardDetail = cardDetails[card.card_id];
      const costString = cardDetail?.必要エナジー || card.cost || '';
      const costs = parseEnergyCost(costString);
      
      if (playerEnergyManager.canPayCost(costs)) {
        setSelectedCard(card);
        soundManager.playSFX('success');
        addBattleLog(`${card.name}を選択しました。場に配置してください。`);
      } else {
        const missing = playerEnergyManager.getMissingEnergy(costs);
        addBattleLog(`エナジーが不足しています: ${formatEnergyCost(missing)}`);
        soundManager.playSFX('error');
      }
    } else if (gameState.currentTurn !== 'player') {
      addBattleLog('あなたのターンではありません');
      soundManager.playSFX('warning');
    } else {
      addBattleLog(`${PHASE_DISPLAY_NAMES[currentPhase]}ではカードを配置できません`);
      soundManager.playSFX('warning');
    }
  };

  // ドラッグ開始
  const handleDragStart = (e, card) => {
    if (gameOver) return;
    
    const currentPhase = phaseManager.getCurrentPhase();
    
    // プレイヤーのターンで、メインフェーズまたはバトルフェーズの場合のみドラッグ可能
    if (gameState.currentTurn === 'player' && 
        (currentPhase === GAME_PHASES.MAIN || currentPhase === GAME_PHASES.BATTLE)) {
      
      // カード詳細情報からコストを取得
      const cardDetail = cardDetails[card.card_id];
      const costString = cardDetail?.必要エナジー || card.cost || '';
      const costs = parseEnergyCost(costString);
      
      if (playerEnergyManager.canPayCost(costs)) {
        setDraggedCard(card);
        soundManager.playSFX('success');
        addBattleLog(`${card.name}をドラッグ中です。場にドロップしてください。`);
      } else {
        const missing = playerEnergyManager.getMissingEnergy(costs);
        addBattleLog(`エナジーが不足しています: ${formatEnergyCost(missing)}`);
        soundManager.playSFX('error');
        e.preventDefault();
      }
    } else {
      e.preventDefault();
    }
  };

  const handleDragEnd = (e) => {
    setDraggedCard(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e, position) => {
    e.preventDefault();
    if (draggedCard) {
      setDragOverSlot(position);
    }
  };

  const handleDragLeave = (e) => {
    setDragOverSlot(null);
  };

  const handleDrop = (e, position) => {
    e.preventDefault();
    if (draggedCard && dragOverSlot !== null) {
      placeCardOnField(draggedCard, position);
      setDraggedCard(null);
      setDragOverSlot(null);
    }
  };

  const handleFieldClick = (position) => {
    if (gameOver) return;
    
    if (selectedCard) {
      placeCardOnField(selectedCard, position);
      setSelectedCard(null);
    } else if (gameState.playerField[position]) {
      // フィールドのカードをクリックした場合の処理
      const fieldCard = gameState.playerField[position];
      addBattleLog(`${fieldCard.name}が選択されました`);
      soundManager.playSFX('success');
    }
  };

  const placeCardOnField = (card, position) => {
    if (gameState.playerField[position]) {
      addBattleLog('そのスロットには既にカードが配置されています');
      soundManager.playSFX('error');
      return;
    }

    // カード詳細情報からコストを取得
    const cardDetail = cardDetails[card.card_id];
    const costString = cardDetail?.必要エナジー || card.cost || '';
    const costs = parseEnergyCost(costString);
    
    if (playerEnergyManager.consumeMultipleEnergy(costs)) {
      // 手札からカードを削除
      const newHand = gameState.playerHand.filter(c => c.uniqueId !== card.uniqueId);
      
      // フィールドにカードを配置
      const newField = [...gameState.playerField];
      newField[position] = card;
      
      setGameState(prev => ({
        ...prev,
        playerHand: newHand,
        playerField: newField
      }));
      
      addBattleLog(`${card.name}をフィールド${position + 1}に配置しました`);
      soundManager.playSFX('success');
    } else {
      addBattleLog('エナジーが不足しています');
      soundManager.playSFX('error');
    }
  };

  const drawCard = () => {
    if (gameState.playerDeck.length === 0) {
      addBattleLog('デッキが空です');
      soundManager.playSFX('error');
      return;
    }

    const drawnCard = gameState.playerDeck[0];
    const newDeck = gameState.playerDeck.slice(1);
    const newHand = [...gameState.playerHand, drawnCard];

    setGameState(prev => ({
      ...prev,
      playerHand: newHand,
      playerDeck: newDeck
    }));

    addBattleLog(`${drawnCard.name}をドローしました`);
    soundManager.playSFX('success');
  };

  const nextPhase = () => {
    const currentPhase = phaseManager.getCurrentPhase();
    const nextPhase = phaseManager.nextPhase();
    
    setGameState(prev => ({
      ...prev,
      gamePhase: nextPhase
    }));

    addBattleLog(`フェーズが${PHASE_DISPLAY_NAMES[nextPhase]}に進みました`);
    soundManager.playSFX('success');
  };

  const endTurn = () => {
    if (gameState.gamePhase !== GAME_PHASES.END) {
      addBattleLog('エンドフェーズまで進めてからターン終了してください');
      soundManager.playSFX('warning');
      return;
    }

    // ターン終了処理
    const newTurn = gameState.currentTurn === 'player' ? 'opponent' : 'player';
    const newTurnNumber = gameState.currentTurn === 'opponent' ? gameState.turnNumber + 1 : gameState.turnNumber;
    
    // フェーズをリセット
    phaseManager.reset();
    
    setGameState(prev => ({
      ...prev,
      currentTurn: newTurn,
      turnNumber: newTurnNumber,
      gamePhase: GAME_PHASES.DRAW
    }));

    addBattleLog(`ターン${newTurnNumber} - ${newTurn === 'player' ? 'あなた' : '相手'}のターン`);
    soundManager.playSFX('success');
  };

  const handleMenuButtonClick = () => {
    soundManager.playSFX('success');
    onBackToMenu();
  };

  const getCardImageUrl = (cardId) => {
    return getImageUrl.cardImage(cardId);
  };

  // 手札の扇状配置のための角度計算
  const getHandCardStyle = (index, total) => {
    const maxRotation = 20; // 最大回転角度
    const maxOffset = 30; // 最大Y軸オフセット
    const maxZIndex = 100; // 最大Zインデックス
    
    if (total <= 1) {
      return { 
        transform: 'rotate(0deg) translateY(0px)',
        zIndex: maxZIndex
      };
    }
    
    // 中心からの距離を計算
    const centerIndex = (total - 1) / 2;
    const distanceFromCenter = Math.abs(index - centerIndex);
    
    // 回転角度を計算（中心から離れるほど大きく回転）
    const rotationStep = maxRotation / centerIndex;
    const rotation = (index - centerIndex) * rotationStep;
    
    // Y軸オフセットを計算（中心から離れるほど大きくオフセット）
    const offsetStep = maxOffset / centerIndex;
    const offset = distanceFromCenter * offsetStep;
    
    // Zインデックスを計算（中心に近いほど前面に表示）
    const zIndex = maxZIndex - distanceFromCenter * 10;
    
    return {
      transform: `rotate(${rotation}deg) translateY(${offset}px)`,
      zIndex: Math.max(zIndex, 1)
    };
  };

  if (!selectedDeck) {
    return (
      <div className="battle-field-container">
        <div className="no-deck-selected">
          <h2>デッキが選択されていません</h2>
          <button onClick={handleMenuButtonClick} className="back-button">
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="battle-field-container">
        <div className={`battle-background ${backgroundLoaded ? 'has-background' : ''}`} style={backgroundStyle}></div>
        <div className="game-over-screen">
          <div className="game-over-content">
            <h2 className={`game-over-title ${gameOver.winner}`}>
              {gameOver.winner === 'player' ? '勝利！' : '敗北...'}
            </h2>
            <p className="game-over-message">{gameOver.message}</p>
            <div className="game-over-stats">
              <p>最終ライフ: プレイヤー {playerLifeManager.getCurrentLife()}, 対戦相手 {opponentLifeManager.getCurrentLife()}</p>
              <p>ターン数: {gameState.turnNumber}</p>
            </div>
            <button onClick={handleMenuButtonClick} className="back-button">
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-field-container">
      {/* 背景画像 */}
      <div className={`battle-background ${backgroundLoaded ? 'has-background' : ''}`} style={backgroundStyle}></div>
      
      {/* ゲーム情報ヘッダー */}
      <div className="game-header">
        <div className="turn-info">
          <span className="turn-label">ターン {gameState.turnNumber}</span>
          <span className={`current-player ${gameState.currentTurn}`}>
            {gameState.currentTurn === 'player' ? 'あなたのターン' : '相手のターン'}
          </span>
          <span className="phase-badge">
            {PHASE_DISPLAY_NAMES[gameState.gamePhase]}
          </span>
          {duelMode && (
            <span className="duel-mode-badge">
              {getModeDisplayName(duelMode)}
            </span>
          )}
          <div className="phase-info">
            {gameState.currentTurn === 'player' && (
              <span className="phase-actions">
                {gameState.gamePhase === GAME_PHASES.DRAW && 'カードをドローできます'}
                {gameState.gamePhase === GAME_PHASES.MAIN && 'カードを配置できます'}
                {gameState.gamePhase === GAME_PHASES.BATTLE && '攻撃とカード配置が可能です'}
                {gameState.gamePhase === GAME_PHASES.END && 'ターン終了の準備をしてください'}
              </span>
            )}
          </div>
        </div>
        <div className="game-controls">
          <button 
            onClick={drawCard} 
            className="action-button draw-button"
            disabled={!canPerformAction(gameState.gamePhase, 'canDraw') || gameState.playerDeck.length === 0}
            title={!canPerformAction(gameState.gamePhase, 'canDraw') ? 
              `${PHASE_DISPLAY_NAMES[gameState.gamePhase]}ではドローできません` : 
              gameState.playerDeck.length === 0 ? 'デッキが空です' : 'カードをドロー'}
          >
            ドロー ({gameState.playerDeck.length})
          </button>
          <button 
            onClick={nextPhase} 
            className="action-button next-phase-button"
            title={`次のフェーズ: ${getNextPhaseName()}`}
          >
            次のフェーズ
          </button>
          <button 
            onClick={endTurn} 
            className="action-button end-turn-button"
            disabled={gameState.gamePhase !== GAME_PHASES.END}
            title={gameState.gamePhase !== GAME_PHASES.END ? 
              'エンドフェーズまで進めてからターン終了してください' : 'ターンを終了'}
          >
            ターン終了
          </button>
          <button onClick={handleMenuButtonClick} className="action-button menu-button">
            メニュー
          </button>
        </div>
      </div>

      {/* ライフ表示 */}
      <div className="life-display">
        <div className="player-life">
          <span className="life-label">プレイヤー</span>
          <div className="life-bar">
            <div 
              className="life-fill player-life-fill"
              style={{ width: `${playerLifeManager.getLifePercentage()}%` }}
            ></div>
            <span className="life-text">{playerLifeManager.getCurrentLife()}</span>
          </div>
        </div>
        <div className="opponent-life">
          <span className="life-label">対戦相手</span>
          <div className="life-bar">
            <div 
              className="life-fill opponent-life-fill"
              style={{ width: `${opponentLifeManager.getLifePercentage()}%` }}
            ></div>
            <span className="life-text">{opponentLifeManager.getCurrentLife()}</span>
          </div>
        </div>
      </div>

      {/* メインゲームエリア */}
      <div className="main-game-area">
        {/* 相手エリア */}
        <div className="opponent-section">
          {/* 相手の手札・デッキ情報 */}
          <div className="opponent-info">
            <div className="opponent-hand-info">
              <span className="hand-count">手札: {gameState.opponentHand.length}枚</span>
            </div>
            <div className="opponent-deck-info">
              <span className="deck-count">デッキ: {gameState.opponentDeck.length}枚</span>
            </div>
          </div>

          {/* 相手のエナジー */}
          <div className="opponent-energy">
            <h4>相手エナジー</h4>
            <div className="energy-display horizontal">
              {Object.entries(opponentEnergyManager.getAllEnergy()).map(([color, amount]) => (
                <div 
                  key={color} 
                  className="energy-item opponent-energy-item"
                  data-color={color}
                  data-amount={amount}
                >
                  <img 
                    src={getEnergyImageUrl(color)} 
                    alt={`${color}エナジー`}
                    className="energy-icon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="energy-icon-fallback" 
                    style={{display: 'none'}}
                  >
                    {color}
                  </div>
                  <span className="energy-amount">{amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 相手のフィールド */}
          <div className="opponent-field">
            <h3>相手フィールド</h3>
            <div className="field-slots opponent-field-slots">
              {[0, 1, 2, 3, 4].map(position => (
                <div key={position} className="field-slot opponent-slot">
                  {gameState.opponentField[position] && (
                    <img 
                      src={getCardImageUrl(gameState.opponentField[position].card_id)}
                      alt={gameState.opponentField[position].name}
                      className="field-card opponent-field-card"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中央エリア - バトルログ */}
        <div className="center-section">
          <div className="battle-log">
            <h3>バトルログ</h3>
            <div className="log-messages">
              {battleLog.slice(-8).map(log => (
                <div key={log.id} className="log-message">
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* プレイヤーエリア */}
        <div className="player-section">
          {/* プレイヤーのフィールド */}
          <div className="player-field">
            <h3>あなたのフィールド</h3>
            <div className="field-slots player-field-slots">
              {[0, 1, 2, 3, 4].map(position => (
                <div 
                  key={position} 
                  className={`field-slot player-slot ${selectedCard ? 'highlighted' : ''} ${dragOverSlot === position ? 'drag-over' : ''}`}
                  onClick={() => handleFieldClick(position)}
                  onDragOver={(e) => handleDragOver(e, position)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, position)}
                >
                  {gameState.playerField[position] && (
                    <img 
                      src={getCardImageUrl(gameState.playerField[position].card_id)}
                      alt={gameState.playerField[position].name}
                      className="field-card player-field-card"
                    />
                  )}
                  {dragOverSlot === position && (
                    <div className="drop-indicator">
                      <span>ドロップ</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* プレイヤーのエナジー */}
          <div className="player-energy">
            <h4>あなたのエナジー</h4>
            <div className="energy-display horizontal">
              {Object.entries(playerEnergyManager.getAllEnergy()).map(([color, amount]) => (
                <div 
                  key={color} 
                  className="energy-item player-energy-item"
                  data-color={color}
                  data-amount={amount}
                >
                  <img 
                    src={getEnergyImageUrl(color)} 
                    alt={`${color}エナジー`}
                    className="energy-icon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="energy-icon-fallback" 
                    style={{display: 'none'}}
                  >
                    {color}
                  </div>
                  <span className="energy-amount">{amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* プレイヤーのデッキ情報 */}
          <div className="player-deck-info">
            <span>デッキ残り: {gameState.playerDeck.length}枚</span>
          </div>
        </div>
      </div>

      {/* 手札エリア */}
      <div className="hand-section">
        <div className="player-hand">
          <h3>手札 ({gameState.playerHand.length}枚)</h3>
          <div className="hand-cards">
            {gameState.playerHand.map((card, index) => {
              // カード詳細情報からコストを取得
              const cardDetail = cardDetails[card.card_id];
              const costString = cardDetail?.必要エナジー || card.cost || '';
              const costs = parseEnergyCost(costString);
              const canPlay = playerEnergyManager.canPayCost(costs);
              const currentPhase = phaseManager.getCurrentPhase();
              const isPlayablePhase = currentPhase === GAME_PHASES.MAIN || currentPhase === GAME_PHASES.BATTLE;
              const isPlayerTurn = gameState.currentTurn === 'player';
              const isUnplayable = !canPlay || !isPlayablePhase || !isPlayerTurn;
              const isDragging = draggedCard?.uniqueId === card.uniqueId;
              const handStyle = getHandCardStyle(index, gameState.playerHand.length);
              
              return (
                <div 
                  key={card.uniqueId} 
                  className={`hand-card ${selectedCard?.uniqueId === card.uniqueId ? 'selected' : ''} ${isUnplayable ? 'unplayable' : ''} ${isDragging ? 'dragging' : ''}`}
                  style={handStyle}
                  onClick={() => handleCardClick(card)}
                  onMouseEnter={() => setHoveredCard(card)}
                  onMouseLeave={() => setHoveredCard(null)}
                  draggable={!isUnplayable}
                  onDragStart={(e) => handleDragStart(e, card)}
                  onDragEnd={handleDragEnd}
                  title={isUnplayable ? 
                    (!isPlayerTurn ? 'あなたのターンではありません' :
                     !isPlayablePhase ? `${PHASE_DISPLAY_NAMES[currentPhase]}では使用できません` :
                     !canPlay ? `エナジー不足: ${formatEnergyCost(costs)}` : '使用できません') :
                    `使用可能: ${card.name} (ドラッグして配置)`
                  }
                >
                  <img 
                    src={getCardImageUrl(card.card_id)}
                    alt={card.name}
                    className="hand-card-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="hand-card-fallback" style={{display: 'none'}}>
                    {card.name}
                  </div>
                  {costString && (
                    <div className="card-cost">
                      {formatEnergyCost(costs)}
                    </div>
                  )}
                  {!isUnplayable && (
                    <div className="drag-indicator">
                      ↕
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* カード詳細表示 */}
      {hoveredCard && (
        <div className="card-detail-popup">
          <div className="card-detail-content">
            <div className="card-detail-title">
              <h4>{hoveredCard.name}</h4>
            </div>
            <div className="card-detail-image-wrapper">
            <img 
              src={getCardImageUrl(hoveredCard.card_id)}
              alt={hoveredCard.name}
              className="detail-card-image"
            />
            </div>
            <div className="card-detail-info">
              {(() => {
                const cardDetailObj = cardDetails[hoveredCard.card_id];
                const cardDetail = cardDetailObj ? cardDetailObj.data : null;
                if (cardDetail) {
                  return (
                    <>
                      {cardDetail.必要エナジー && <p>必要エナジー: {cardDetail.必要エナジー}</p>}
                      {cardDetail.カード種類 && <p>カード種類: {cardDetail.カード種類}</p>}
                      {cardDetail.BP && <p>BP: {cardDetail.BP}</p>}
                      {cardDetail.消費AP && <p>消費AP: {cardDetail.消費AP}</p>}
                      {cardDetail.発生エナジー && (
                        <p>発生エナジー: {parseTextWithImages(cardDetail.発生エナジー, 'generated_energy')}</p>
                      )}
                    </>
                  );
                } else {
                  return (
                    <>
                      <p>必要エナジー: {hoveredCard.cost || 'なし'}</p>
                      <p>カード種類: {hoveredCard.card_type || '不明'}</p>
                      <p>BP: {hoveredCard.bp || 'なし'}</p>
                      <p>消費AP: {hoveredCard.ap || 'なし'}</p>
                    </>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ドラッグ＆ドロップの説明 */}
      {draggedCard && (
        <div className="drag-instruction">
          <div className="drag-instruction-content">
            <h4>カードを配置中</h4>
            <p>{draggedCard.name}を場のスロットにドロップしてください</p>
            <div className="drag-instruction-arrow">↓</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleField; 