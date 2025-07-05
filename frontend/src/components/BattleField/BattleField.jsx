import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/config';
import { getImageUrl } from '../../services/api';
import SoundManager from './SoundManager';
import BattleSystemUI from './BattleSystemUI';
import MovementPhaseUI from './MovementPhaseUI';
import { TriggerEffectProcessor } from './TriggerSystemUI';
import { AnimationManager, createPhaseChangeAnimation, createDamageAnimation } from './AnimationSystem';
import UnionArenaGameManager from '../../utils/unionArenaGameSystems';
import { 
  UNION_ARENA_PHASES, 
  PHASE_DISPLAY_NAMES,
  UnionArenaPhaseManager,
  UnionArenaEnergyManager,
  UnionArenaLifeManager,
  VictoryConditionChecker,
  GAME_CONSTANTS
} from '../../utils/unionArenaConstants';
import AIOpponent, { AI_DIFFICULTY, AI_STRATEGY } from '../../utils/aiOpponentSystem';
import './BattleField.css';

const BattleField = ({ selectedDeck, duelMode, onBackToMenu }) => {
  // 正式ルールに基づくゲーム管理システム
  const [gameManager] = useState(() => new UnionArenaGameManager());
  const [phaseManager] = useState(() => new UnionArenaPhaseManager());
  const [energyManager] = useState(() => new UnionArenaEnergyManager());
  const [playerLifeManager] = useState(() => new UnionArenaLifeManager(GAME_CONSTANTS.INITIAL_LIFE));
  const [opponentLifeManager] = useState(() => new UnionArenaLifeManager(GAME_CONSTANTS.INITIAL_LIFE));
  const [victoryChecker] = useState(() => new VictoryConditionChecker(playerLifeManager, opponentLifeManager));
  const [soundManager] = useState(() => new SoundManager());
  const [aiOpponent] = useState(() => new AIOpponent(
    duelMode === 'computer' ? AI_DIFFICULTY.NORMAL : AI_DIFFICULTY.EASY,
    AI_STRATEGY.BALANCED
  ));
  const [animationManager] = useState(() => new AnimationManager());
  const [triggerProcessor, setTriggerProcessor] = useState(null);
  
  const [gameState, setGameState] = useState({
    playerHand: [],
    playerDeck: [],
    playerFrontLine: [null, null, null, null], // 前列：最大4枚
    playerEnergyLine: [null, null, null, null], // エナジーライン：最大4枚
    opponentFrontLine: [null, null, null, null],
    opponentEnergyLine: [null, null, null, null],
    opponentHand: [],
    opponentDeck: [],
    currentTurn: 'player',
    turnNumber: 1,
    gamePhase: UNION_ARENA_PHASES.START,
    playerEnergy: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
    opponentEnergy: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }
  });

  const [selectedCard, setSelectedCard] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [cardDetails, setCardDetails] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [gameInitialized, setGameInitialized] = useState(false);
  
  // バトルシステム状態
  const [battleState, setBattleState] = useState({
    battleInProgress: false,
    attackingCharacter: null,
    blockingCharacter: null,
    attackingPlayer: null,
    defendingPlayer: null
  });

  // AP管理状態
  const [apState, setApState] = useState({
    current: GAME_CONSTANTS.INITIAL_AP,
    max: GAME_CONSTANTS.INITIAL_AP,
    usedThisTurn: 0
  });

  // バトル関連の関数
  const handleAttack = (attacker, attackerPosition) => {
    try {
      if (!gameManager.apSystem.canPerformAction(parseInt(attacker.ap) || 1)) {
        addBattleLog('APが不足しています');
        soundManager.playSFX('error');
        return;
      }

      const result = gameManager.battleSystem.declareAttack(attacker, 'opponent');
      
      setBattleState({
        battleInProgress: true,
        attackingCharacter: attacker,
        blockingCharacter: null,
        attackingPlayer: 'player',
        defendingPlayer: 'opponent'
      });

      // APを消費
      gameManager.apSystem.useAP(parseInt(attacker.ap) || 1);
      setApState(gameManager.apSystem.getAPStatus());

      // キャラクターをレスト状態にする
      const newFrontLine = [...gameState.playerFrontLine];
      newFrontLine[attackerPosition] = { ...attacker, isResting: true };
      
      setGameState(prev => ({
        ...prev,
        playerFrontLine: newFrontLine
      }));

      addBattleLog(result.message);
      soundManager.playSFX('attack');
    } catch (error) {
      addBattleLog(error.message);
      soundManager.playSFX('error');
    }
  };

  const handleBlock = (blocker, blockerPosition, attacker) => {
    try {
      const result = gameManager.battleSystem.declareBlock(blocker, attacker);
      
      setBattleState(prev => ({
        ...prev,
        blockingCharacter: blocker
      }));

      // キャラクターをレスト状態にする
      const newFrontLine = [...gameState.opponentFrontLine];
      newFrontLine[blockerPosition] = { ...blocker, isResting: true };
      
      setGameState(prev => ({
        ...prev,
        opponentFrontLine: newFrontLine
      }));

      addBattleLog(result.message);
      soundManager.playSFX('block');
    } catch (error) {
      addBattleLog(error.message);
      soundManager.playSFX('error');
    }
  };

  const handleResolveBattle = () => {
    try {
      const result = gameManager.battleSystem.resolveBattle();
      
      // バトル結果を適用
      if (result.attackerDestroyed) {
        // 攻撃キャラクター破壊
        const attackerPos = gameState.playerFrontLine.findIndex(
          char => char?.uniqueId === battleState.attackingCharacter.uniqueId
        );
        if (attackerPos !== -1) {
          const newFrontLine = [...gameState.playerFrontLine];
          newFrontLine[attackerPos] = null;
          setGameState(prev => ({ ...prev, playerFrontLine: newFrontLine }));
        }
      }

      if (result.blockerDestroyed) {
        // ブロックキャラクター破壊
        const blockerPos = gameState.opponentFrontLine.findIndex(
          char => char?.uniqueId === battleState.blockingCharacter.uniqueId
        );
        if (blockerPos !== -1) {
          const newFrontLine = [...gameState.opponentFrontLine];
          newFrontLine[blockerPos] = null;
          setGameState(prev => ({ ...prev, opponentFrontLine: newFrontLine }));
        }
      }

      if (result.damageToPlayer > 0) {
        // プレイヤーにダメージ
        const damageResult = gameManager.processDamage(
          opponentLifeManager, 
          result.damageToPlayer, 
          gameState.opponentDeck
        );
        addBattleLog(`対戦相手に${result.damageToPlayer}ダメージ`);
        
        if (damageResult.triggersActivated.length > 0) {
          addBattleLog(`${damageResult.triggersActivated.length}個のトリガーが発動！`);
        }
      }

      addBattleLog(result.message);
      soundManager.playSFX('battle_resolve');

      // バトル状態をリセット
      setBattleState({
        battleInProgress: false,
        attackingCharacter: null,
        blockingCharacter: null,
        attackingPlayer: null,
        defendingPlayer: null
      });
    } catch (error) {
      addBattleLog(error.message);
      soundManager.playSFX('error');
    }
  };

  const handleCancelBattle = () => {
    gameManager.battleSystem.resetBattle();
    
    setBattleState({
      battleInProgress: false,
      attackingCharacter: null,
      blockingCharacter: null,
      attackingPlayer: null,
      defendingPlayer: null
    });

    addBattleLog('バトルがキャンセルされました');
    soundManager.playSFX('cancel');
  };

  // Movement Phase関連の関数
  const handleMoveCharacter = (fromLine, fromPosition, toLine, toPosition) => {
    try {
      const fromLineArray = fromLine === 'front' ? gameState.playerFrontLine : gameState.playerEnergyLine;
      const toLineArray = toLine === 'front' ? gameState.playerFrontLine : gameState.playerEnergyLine;
      
      const character = fromLineArray[fromPosition];
      if (!character) {
        throw new Error('移動するキャラクターが見つかりません');
      }

      // Front LineからEnergy Lineへの移動は▼Step▼能力が必要
      if (fromLine === 'front' && toLine === 'energy') {
        const cardDetail = cardDetails[character.card_id]?.data;
        if (!cardDetail?.能力?.includes('▼Step▼')) {
          throw new Error('このキャラクターは▼Step▼能力を持たないため、エナジーラインに移動できません');
        }
      }

      if (toLineArray[toPosition] !== null) {
        throw new Error('移動先にはすでにキャラクターがいます');
      }

      // 移動実行
      const newFromLine = [...fromLineArray];
      const newToLine = [...toLineArray];
      
      newFromLine[fromPosition] = null;
      newToLine[toPosition] = character;

      if (fromLine === 'front' && toLine === 'energy') {
        setGameState(prev => ({
          ...prev,
          playerFrontLine: newFromLine,
          playerEnergyLine: newToLine
        }));
      } else if (fromLine === 'energy' && toLine === 'front') {
        setGameState(prev => ({
          ...prev,
          playerEnergyLine: newFromLine,
          playerFrontLine: newToLine
        }));
      } else if (fromLine === toLine) {
        // 同じライン内での移動
        if (fromLine === 'front') {
          setGameState(prev => ({ ...prev, playerFrontLine: newFromLine }));
        } else {
          setGameState(prev => ({ ...prev, playerEnergyLine: newFromLine }));
        }
      }

      addBattleLog(`${character.name}を移動しました`);
      soundManager.playSFX('move');
    } catch (error) {
      addBattleLog(error.message);
      soundManager.playSFX('error');
    }
  };

  // カード詳細情報を取得
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

  // デッキ初期化
  useEffect(() => {
    if (selectedDeck && selectedDeck.cards) {
      console.log('BattleField: Initializing deck with:', selectedDeck);
      console.log('BattleField: Deck cards:', selectedDeck.cards);
      
      // 実際のデータ構造に合わせて処理
      // cards配列の各アイテムは個別のカードインスタンス
      const expandedDeck = selectedDeck.cards.map((card, index) => ({
        ...card,
        uniqueId: `${card.card_id}_${index}`,
        isResting: false,
        isSummoningSick: false
      }));

      console.log('BattleField: Expanded deck:', expandedDeck);

      const shuffledDeck = [...expandedDeck].sort(() => Math.random() - 0.5);
      const initialHand = shuffledDeck.slice(0, 5);
      const remainingDeck = shuffledDeck.slice(5);
      
      console.log('BattleField: Initial hand:', initialHand);
      console.log('BattleField: Remaining deck length:', remainingDeck.length);
      
      setGameState(prev => ({
        ...prev,
        playerHand: initialHand,
        playerDeck: remainingDeck,
        opponentHand: new Array(5).fill(null),
        opponentDeck: new Array(expandedDeck.length).fill(null)
      }));

      // 初期化完了フラグを設定
      setGameInitialized(true);
      console.log('BattleField: Game initialization completed');

      // ゲームマネージャーのセットアップ
      gameManager.setGameState(gameState);
      gameManager.setCardDetailProvider((card) => cardDetails[card.card_id]);

      // カード詳細情報を取得
      const fetchAllCardDetails = async () => {
        const details = {};
        const uniqueCardIds = [...new Set(expandedDeck.map(card => card.card_id))];
        
        console.log('BattleField: Fetching details for unique cards:', uniqueCardIds);
        
        for (const cardId of uniqueCardIds) {
          const cardDetail = await fetchCardDetails(cardId);
          if (cardDetail) {
            details[cardId] = cardDetail;
          }
        }
        
        console.log('BattleField: Card details loaded:', details);
        setCardDetails(details);
      };
      
      fetchAllCardDetails();

      addBattleLog(`Union Arena ${getModeDisplayName(duelMode)}開始！`);
      addBattleLog(`デッキ「${selectedDeck.name}」で対戦します`);
      addBattleLog(`デッキ枚数: ${expandedDeck.length}枚`);
      addBattleLog(`ライフ: プレイヤー ${playerLifeManager.getCurrentLife()}, 対戦相手 ${opponentLifeManager.getCurrentLife()}`);
      soundManager.playSFX('success');
      soundManager.playBGM('battle');
    }

    return () => {
      soundManager.stopBGM();
      soundManager.cleanup();
      setGameInitialized(false); // 次回のゲーム開始に備えてリセット
    };
  }, [selectedDeck, duelMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // エナジー計算の更新
  useEffect(() => {
    const playerEnergy = energyManager.calculateEnergyFromLine(
      gameState.playerEnergyLine.map(card => {
        if (!card) return null;
        const cardDetail = cardDetails[card.card_id]?.data;
        return { ...card, generatedEnergy: cardDetail?.発生エナジー || '' };
      }).filter(Boolean)
    );
    
    const opponentEnergy = energyManager.calculateEnergyFromLine(
      gameState.opponentEnergyLine.map(card => {
        if (!card) return null;
        const cardDetail = cardDetails[card.card_id]?.data;
        return { ...card, generatedEnergy: cardDetail?.発生エナジー || '' };
      }).filter(Boolean)
    );
    
    setGameState(prev => ({
      ...prev,
      playerEnergy,
      opponentEnergy
    }));
  }, [gameState.playerEnergyLine, gameState.opponentEnergyLine, cardDetails, energyManager]);

  // 勝利条件チェック
  useEffect(() => {
    // ゲームが初期化されていない場合はチェックしない
    if (!gameInitialized) {
      console.log('BattleField: Skipping victory check - game not initialized yet');
      return;
    }
    
    // ゲームが開始されていない場合はチェックしない
    if (gameState.turnNumber === 1 && gameState.playerDeck.length === 0) {
      console.log('BattleField: Skipping victory check - deck not ready yet');
      return;
    }
    
    const playerLife = playerLifeManager.getCurrentLife();
    const opponentLife = opponentLifeManager.getCurrentLife();
    const playerDeckLength = gameState.playerDeck.length;
    const opponentDeckLength = gameState.opponentDeck.length;
    
    console.log('BattleField: Victory check - Player deck:', playerDeckLength, 'Opponent deck:', opponentDeckLength);
    console.log('BattleField: Victory check - Player life:', playerLife, 'Opponent life:', opponentLife);
    
    const victoryResult = victoryChecker.checkVictoryConditions(gameState.playerDeck, gameState.opponentDeck);
    if (victoryResult) {
      console.log('BattleField: Victory condition met:', victoryResult);
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
  }, [gameInitialized, playerLifeManager, opponentLifeManager, gameState.playerDeck, gameState.opponentDeck, gameState.turnNumber, victoryChecker, soundManager]);

  // AI対戦相手のターン処理
  useEffect(() => {
    if (gameState.currentTurn === 'opponent' && !gameOver && (duelMode === 'computer' || duelMode === 'test')) {
      handleAITurn();
    }
  }, [gameState.currentTurn, gameState.gamePhase, gameOver, duelMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // AI対戦相手のターン処理
  const handleAITurn = async () => {
    if (aiThinking) return;
    
    setAiThinking(true);
    addBattleLog('対戦相手が思考中...');
    
    try {
      const decision = await aiOpponent.makeDecision(gameState, gameState.gamePhase, cardDetails);
      
      await executeAIDecision(decision);
      
    } catch (error) {
      console.error('AI decision error:', error);
      addBattleLog('対戦相手のターンでエラーが発生しました');
    } finally {
      setAiThinking(false);
    }
  };

  // AI決定の実行
  const executeAIDecision = async (decision) => {
    switch (decision.action) {
      case 'draw':
        await simulateAIDraw();
        break;
      case 'play_card':
        await simulateAICardPlay(decision);
        break;
      case 'attack':
        await simulateAIAttack(decision);
        break;
      case 'move':
        await simulateAIMove(decision);
        break;
      case 'activate_effect':
        await simulateAIEffect(decision);
        break;
      case 'pass':
        // フェーズを進めるかターンを終了
        if (gameState.gamePhase === UNION_ARENA_PHASES.END) {
          setTimeout(() => {
            endTurn();
          }, 1000);
        } else {
          setTimeout(() => {
            nextPhase();
          }, 800);
        }
        break;
      default:
        addBattleLog('対戦相手がパスしました');
        setTimeout(() => {
          nextPhase();
        }, 500);
    }
  };

  // AIドローシミュレーション
  const simulateAIDraw = async () => {
    if (gameState.opponentDeck.length > 0) {
      // AIの手札を1枚増やし、デッキを1枚減らす
      setGameState(prev => ({
        ...prev,
        opponentHand: [...prev.opponentHand, { id: `ai_card_${Date.now()}` }],
        opponentDeck: prev.opponentDeck.slice(1)
      }));
      
      addBattleLog('対戦相手がカードをドローしました');
      soundManager.playSFX('draw');
      
      // 少し待ってから次のフェーズへ
      setTimeout(() => {
        nextPhase();
      }, 1000);
    }
  };

  // AIカード配置シミュレーション
  const simulateAICardPlay = async (decision) => {
    const { card, line, position } = decision;
    
    // 仮想的なAIカードを配置
    const aiCard = {
      ...card,
      uniqueId: `ai_${card.card_id}_${Date.now()}`,
      isResting: false,
      isSummoningSick: true
    };
    
    if (line === 'front') {
      const newFrontLine = [...gameState.opponentFrontLine];
      newFrontLine[position] = aiCard;
      setGameState(prev => ({
        ...prev,
        opponentFrontLine: newFrontLine,
        opponentHand: prev.opponentHand.slice(1) // 手札から1枚減らす
      }));
    } else if (line === 'energy') {
      const newEnergyLine = [...gameState.opponentEnergyLine];
      newEnergyLine[position] = aiCard;
      setGameState(prev => ({
        ...prev,
        opponentEnergyLine: newEnergyLine,
        opponentHand: prev.opponentHand.slice(1) // 手札から1枚減らす
      }));
    }
    
    addBattleLog(`対戦相手が${card.name}を${line === 'front' ? 'フロントライン' : 'エナジーライン'}に配置しました`);
    soundManager.playSFX('card_play');
  };

  // AI攻撃シミュレーション
  const simulateAIAttack = async (decision) => {
    const { attacker, attackerPosition } = decision;
    
    addBattleLog(`対戦相手の${attacker.name}が攻撃を宣言しました`);
    soundManager.playSFX('attack');
    
    // 攻撃処理（簡略化）
    setTimeout(async () => {
      // ダイレクトアタックとして処理（トリガーチェック付き）
      try {
        const damageResult = gameManager.processDamage(
          playerLifeManager, 
          1, 
          gameState.playerDeck
        );
        
        addBattleLog('プレイヤーに1ダメージ');
        
        if (damageResult && damageResult.triggersActivated && damageResult.triggersActivated.length > 0) {
          addBattleLog(`${damageResult.triggersActivated.length}個のトリガーが発動！`);
        }
        
        // ダメージアニメーション
        const playerLifeElement = document.querySelector('.player-life-area');
        if (playerLifeElement) {
          animationManager.queueAnimation(createDamageAnimation(1, playerLifeElement, '#ff4757'));
        }
        
        // 攻撃キャラクターをレスト状態にする
        const newFrontLine = [...gameState.opponentFrontLine];
        newFrontLine[attackerPosition] = { ...attacker, isResting: true };
        setGameState(prev => ({ ...prev, opponentFrontLine: newFrontLine }));
        
      } catch (error) {
        console.error('AI攻撃処理エラー:', error);
        addBattleLog('プレイヤーに1ダメージ');
        
        // 攻撃キャラクターをレスト状態にする
        const newFrontLine = [...gameState.opponentFrontLine];
        newFrontLine[attackerPosition] = { ...attacker, isResting: true };
        setGameState(prev => ({ ...prev, opponentFrontLine: newFrontLine }));
      }
      
    }, 1500);
  };

  // AI移動シミュレーション
  const simulateAIMove = async (decision) => {
    const { from, to } = decision;
    
    const fromLineArray = from.line === 'front' ? gameState.opponentFrontLine : gameState.opponentEnergyLine;
    const toLineArray = to.line === 'front' ? gameState.opponentFrontLine : gameState.opponentEnergyLine;
    
    const character = fromLineArray[from.position];
    if (character) {
      const newFromLine = [...fromLineArray];
      const newToLine = [...toLineArray];
      
      newFromLine[from.position] = null;
      newToLine[to.position] = character;
      
      if (from.line === 'front' && to.line === 'energy') {
        setGameState(prev => ({
          ...prev,
          opponentFrontLine: newFromLine,
          opponentEnergyLine: newToLine
        }));
      } else if (from.line === 'energy' && to.line === 'front') {
        setGameState(prev => ({
          ...prev,
          opponentEnergyLine: newFromLine,
          opponentFrontLine: newToLine
        }));
      }
      
      addBattleLog(`対戦相手が${character.name}を移動しました`);
      soundManager.playSFX('move');
    }
  };

  // AI効果使用シミュレーション
  const simulateAIEffect = async (decision) => {
    const { card } = decision;
    
    addBattleLog(`対戦相手が${card.name}の効果を使用しました`);
    soundManager.playSFX('effect');
  };

  const getModeDisplayName = (mode) => {
    switch (mode) {
      case 'online': return 'オンライン対戦';
      case 'computer': return 'コンピュータ対戦';
      case 'test': return 'テストモード';
      default: return 'デュエル';
    }
  };

  const addBattleLog = (message) => {
    setBattleLog(prev => [...prev, { id: Date.now(), message, timestamp: new Date() }]);
  };

  // TriggerEffectProcessor の初期化
  useEffect(() => {
    if (!triggerProcessor) {
      setTriggerProcessor(new TriggerEffectProcessor(
        gameManager, gameState, setGameState, addBattleLog, soundManager
      ));
    }
  }, []); // 一度だけ初期化

  // カードを手札からプレイ
  const playCardFromHand = (card, lineType, position) => {
    const cardDetail = cardDetails[card.card_id];
    const requiredEnergy = energyManager.parseGeneratedEnergy(cardDetail?.必要エナジー || '');
    
    if (!energyManager.canPayCost(requiredEnergy, gameState.playerEnergy)) {
      addBattleLog('エナジーが不足しています');
      soundManager.playSFX('error');
      return;
    }

    if (lineType === 'front') {
      if (gameState.playerFrontLine[position] !== null) {
        addBattleLog('そのスロットには既にカードが配置されています');
        soundManager.playSFX('error');
        return;
      }
      
      const newFrontLine = [...gameState.playerFrontLine];
      newFrontLine[position] = card;
      
      setGameState(prev => ({
        ...prev,
        playerFrontLine: newFrontLine,
        playerHand: prev.playerHand.filter(c => c.uniqueId !== card.uniqueId)
      }));
      
      addBattleLog(`${card.name}をフロントライン${position + 1}に配置しました`);
    } else if (lineType === 'energy') {
      if (gameState.playerEnergyLine[position] !== null) {
        addBattleLog('そのスロットには既にカードが配置されています');
        soundManager.playSFX('error');
        return;
      }
      
      const newEnergyLine = [...gameState.playerEnergyLine];
      newEnergyLine[position] = card;
      
      setGameState(prev => ({
        ...prev,
        playerEnergyLine: newEnergyLine,
        playerHand: prev.playerHand.filter(c => c.uniqueId !== card.uniqueId)
      }));
      
      addBattleLog(`${card.name}をエナジーライン${position + 1}に配置しました`);
    }
    
    soundManager.playSFX('success');
    setSelectedCard(null);
  };

  // カードドロー
  const drawCard = () => {
    if (!phaseManager.canPerformAction('draw')) {
      addBattleLog('スタートフェーズでのみカードをドローできます');
      soundManager.playSFX('warning');
      return;
    }

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

  // フェーズ進行
  const nextPhase = () => {
    const nextPhase = phaseManager.nextPhase();
    
    setGameState(prev => ({
      ...prev,
      gamePhase: nextPhase
    }));

    // フェーズ変更アニメーション
    const phaseColors = {
      [UNION_ARENA_PHASES.START]: '#4ecdc4',
      [UNION_ARENA_PHASES.MOVEMENT]: '#45b7d1', 
      [UNION_ARENA_PHASES.MAIN]: '#f39c12',
      [UNION_ARENA_PHASES.END]: '#e74c3c'
    };
    
    animationManager.queueAnimation(createPhaseChangeAnimation(
      PHASE_DISPLAY_NAMES[nextPhase],
      phaseColors[nextPhase]
    ));

    // フェーズ開始時の処理
    if (nextPhase === UNION_ARENA_PHASES.START) {
      gameManager.startTurn(gameState.currentTurn === 'player' ? 'プレイヤー' : '対戦相手');
      setApState(gameManager.apSystem.getAPStatus());
    } else if (nextPhase === UNION_ARENA_PHASES.MOVEMENT) {
      // 全キャラクターをアクティブ状態にする
      setGameState(prev => ({
        ...prev,
        playerFrontLine: prev.playerFrontLine.map(char => 
          char ? { ...char, isResting: false } : null
        ),
        playerEnergyLine: prev.playerEnergyLine.map(char => 
          char ? { ...char, isResting: false } : null
        ),
        opponentFrontLine: prev.opponentFrontLine.map(char => 
          char ? { ...char, isResting: false } : null
        ),
        opponentEnergyLine: prev.opponentEnergyLine.map(char => 
          char ? { ...char, isResting: false } : null
        )
      }));
    }

    addBattleLog(`フェーズが${PHASE_DISPLAY_NAMES[nextPhase]}に進みました`);
    soundManager.playSFX('success');
  };

  // ターン終了
  const endTurn = () => {
    if (gameState.gamePhase !== UNION_ARENA_PHASES.END) {
      addBattleLog('エンドフェーズまで進めてからターン終了してください');
      soundManager.playSFX('warning');
      return;
    }

    // 手札制限チェック（8枚まで）
    if (gameState.playerHand.length > 8) {
      addBattleLog('手札が8枚を超えています。8枚になるまで捨ててください');
      soundManager.playSFX('warning');
      return;
    }

    const newTurn = gameState.currentTurn === 'player' ? 'opponent' : 'player';
    const newTurnNumber = gameState.currentTurn === 'opponent' ? gameState.turnNumber + 1 : gameState.turnNumber;
    
    // ターン終了処理
    gameManager.endTurn(gameState.currentTurn === 'player' ? 'プレイヤー' : '対戦相手');
    
    // フェーズをリセット
    phaseManager.reset();
    
    // APを増加（2ターン目以降）
    if (newTurn === 'player' && newTurnNumber > 1) {
      gameManager.apSystem.increaseMaxAP(1);
    }
    
    setGameState(prev => ({
      ...prev,
      currentTurn: newTurn,
      turnNumber: newTurnNumber,
      gamePhase: UNION_ARENA_PHASES.START
    }));

    setApState(gameManager.apSystem.getAPStatus());

    addBattleLog(`ターン${newTurnNumber} - ${newTurn === 'player' ? 'あなた' : '相手'}のターン`);
    soundManager.playSFX('success');
  };

  const handleCardClick = (card) => {
    if (gameOver) return;
    
    if (gameState.currentTurn === 'player') {
      // ムーブメントフェーズでもカード選択を許可（詳細表示用）
      if (phaseManager.canPerformAction('playCard')) {
        setSelectedCard(card);
        addBattleLog(`${card.name}を選択しました。配置先を選択してください。`);
        soundManager.playSFX('success');
      } else {
        // ムーブメントフェーズではカード詳細表示のみ
        setSelectedCard(card);
        addBattleLog(`${card.name}の詳細を表示中`);
        soundManager.playSFX('success');
      }
    } else {
      addBattleLog(`${PHASE_DISPLAY_NAMES[gameState.gamePhase]}ではカードを配置できません`);
      soundManager.playSFX('warning');
    }
  };

  const handleLineSlotClick = (lineType, position) => {
    if (selectedCard && phaseManager.canPerformAction('playCard')) {
      playCardFromHand(selectedCard, lineType, position);
    } else if (selectedCard && !phaseManager.canPerformAction('playCard')) {
      addBattleLog(`${PHASE_DISPLAY_NAMES[gameState.gamePhase]}ではカードを配置できません`);
      soundManager.playSFX('warning');
    }
  };

  const getCardImageUrl = (cardId) => {
    return getImageUrl.cardImage(cardId);
  };

  const getEnergyImageUrl = (energyType) => {
    const energyNameMap = {
      red: '赤',
      blue: '青',
      green: '緑',
      yellow: '黄',
      purple: '紫'
    };
    
    const japaneseName = energyNameMap[energyType] || energyType;
    return `${process.env.PUBLIC_URL}/assets/images/energy/${japaneseName}.png`;
  };

  if (!selectedDeck) {
    return (
      <div className="battle-field-container">
        <div className="no-deck-selected">
          <h2>デッキが選択されていません</h2>
          <button onClick={onBackToMenu} className="back-button">
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="battle-field-container">
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
            <button onClick={onBackToMenu} className="back-button">
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-field-container" style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a2e', 
      color: 'white',
      padding: '20px'
    }}>
      {/* ゲーム情報ヘッダー */}
      <div className="game-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#16213e',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <div className="turn-info" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span className="turn-label" style={{ fontSize: '18px', fontWeight: 'bold' }}>ターン {gameState.turnNumber}</span>
          <span className={`current-player ${gameState.currentTurn}`} style={{
            padding: '5px 15px',
            borderRadius: '20px',
            backgroundColor: gameState.currentTurn === 'player' ? '#4ecdc4' : '#e74c3c',
            color: 'white'
          }}>
            {gameState.currentTurn === 'player' ? 'あなたのターン' : '相手のターン'}
          </span>
          <span className="phase-badge" style={{
            padding: '5px 15px',
            borderRadius: '20px',
            backgroundColor: '#f39c12',
            color: 'white'
          }}>
            {PHASE_DISPLAY_NAMES[gameState.gamePhase]}
          </span>
          <span className="ap-display" style={{
            padding: '5px 15px',
            borderRadius: '20px',
            backgroundColor: '#9b59b6',
            color: 'white'
          }}>
            AP: {apState.current}/{apState.max}
          </span>
          {aiThinking && (
            <span className="ai-thinking" style={{ color: '#f39c12' }}>
              <span className="thinking-indicator">🤔</span>
              AI思考中...
            </span>
          )}
        </div>
        <div className="game-controls" style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={drawCard} 
            className="action-button draw-button"
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#27ae60',
              color: 'white',
              cursor: phaseManager.canPerformAction('draw') && gameState.playerDeck.length > 0 && gameState.currentTurn === 'player' ? 'pointer' : 'not-allowed',
              opacity: phaseManager.canPerformAction('draw') && gameState.playerDeck.length > 0 && gameState.currentTurn === 'player' ? 1 : 0.5
            }}
            disabled={!phaseManager.canPerformAction('draw') || gameState.playerDeck.length === 0 || gameState.currentTurn !== 'player'}
          >
            ドロー ({gameState.playerDeck.length})
          </button>
          <button 
            onClick={nextPhase} 
            className="action-button next-phase-button"
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#3498db',
              color: 'white',
              cursor: gameState.currentTurn === 'player' && !aiThinking ? 'pointer' : 'not-allowed',
              opacity: gameState.currentTurn === 'player' && !aiThinking ? 1 : 0.5
            }}
            disabled={gameState.currentTurn !== 'player' || aiThinking}
          >
            次のフェーズ
          </button>
          <button 
            onClick={endTurn} 
            className="action-button end-turn-button"
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#e67e22',
              color: 'white',
              cursor: gameState.gamePhase === UNION_ARENA_PHASES.END && gameState.currentTurn === 'player' && !aiThinking ? 'pointer' : 'not-allowed',
              opacity: gameState.gamePhase === UNION_ARENA_PHASES.END && gameState.currentTurn === 'player' && !aiThinking ? 1 : 0.5
            }}
            disabled={gameState.gamePhase !== UNION_ARENA_PHASES.END || gameState.currentTurn !== 'player' || aiThinking}
          >
            ターン終了
          </button>
          <button onClick={onBackToMenu} className="action-button menu-button" style={{
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#95a5a6',
            color: 'white',
            cursor: 'pointer'
          }}>
            メニュー
          </button>
        </div>
      </div>

      {/* ライフ表示 */}
      <div className="life-display" style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div className="player-life" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="life-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>プレイヤー</span>
          <div className="life-bar" style={{
            width: '200px',
            height: '30px',
            backgroundColor: '#34495e',
            borderRadius: '15px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div 
              className="life-fill player-life-fill"
              style={{ 
                width: `${playerLifeManager.getLifePercentage()}%`,
                height: '100%',
                backgroundColor: '#27ae60',
                transition: 'width 0.3s ease'
              }}
            ></div>
            <span className="life-text" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontWeight: 'bold'
            }}>{playerLifeManager.getCurrentLife()}</span>
          </div>
        </div>
        <div className="opponent-life" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="life-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>対戦相手</span>
          <div className="life-bar" style={{
            width: '200px',
            height: '30px',
            backgroundColor: '#34495e',
            borderRadius: '15px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div 
              className="life-fill opponent-life-fill"
              style={{ 
                width: `${opponentLifeManager.getLifePercentage()}%`,
                height: '100%',
                backgroundColor: '#e74c3c',
                transition: 'width 0.3s ease'
              }}
            ></div>
            <span className="life-text" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontWeight: 'bold'
            }}>{opponentLifeManager.getCurrentLife()}</span>
          </div>
        </div>
      </div>

      {/* メインゲームエリア */}
      <div className="main-game-area" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: '#0f3460',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        {/* 相手エリア */}
        <div className="opponent-section" style={{
          backgroundColor: '#e74c3c',
          borderRadius: '10px',
          padding: '15px'
        }}>
          <div className="opponent-info" style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '15px',
            color: 'white'
          }}>
            <span>手札: {gameState.opponentHand.length}枚</span>
            <span>デッキ: {gameState.opponentDeck.length}枚</span>
          </div>

          {/* 相手のフロントライン */}
          <div className="field-line opponent-front-line" style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>相手 フロントライン</h4>
            <div className="line-slots" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {gameState.opponentFrontLine.map((card, index) => (
                <div key={index} className="line-slot opponent-slot" style={{
                  width: '120px',
                  height: '160px',
                  border: '2px dashed #ffffff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: card ? 'transparent' : 'rgba(255,255,255,0.1)'
                }}>
                  {card ? (
                    <img 
                      src={getCardImageUrl(card.card_id)}
                      alt={card.name}
                      className="field-card opponent-card"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                    />
                  ) : (
                    <div className="empty-slot opponent-empty" style={{
                      color: 'white',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      <span>空</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 相手のエナジーライン */}
          <div className="field-line opponent-energy-line" style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>相手 エナジーライン</h4>
            <div className="line-slots" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {gameState.opponentEnergyLine.map((card, index) => (
                <div key={index} className="line-slot opponent-slot" style={{
                  width: '120px',
                  height: '160px',
                  border: '2px dashed #ffffff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: card ? 'transparent' : 'rgba(255,255,255,0.1)'
                }}>
                  {card ? (
                    <img 
                      src={getCardImageUrl(card.card_id)}
                      alt={card.name}
                      className="field-card opponent-card"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                    />
                  ) : (
                    <div className="empty-slot opponent-empty" style={{
                      color: 'white',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      <span>空</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 相手のエナジー表示 */}
          <div className="energy-display opponent-energy-display">
            <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>相手エナジー</h4>
            <div className="energy-row" style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              {Object.entries(gameState.opponentEnergy).map(([color, amount]) => (
                <div key={color} className="energy-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '5px 10px',
                  borderRadius: '15px'
                }}>
                  <img src={getEnergyImageUrl(color)} alt={`${color}エナジー`} style={{
                    width: '20px',
                    height: '20px'
                  }} />
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中央エリア - バトルログ */}
        <div className="center-section" style={{
          backgroundColor: '#34495e',
          borderRadius: '10px',
          padding: '15px',
          minHeight: '200px'
        }}>
          <div className="battle-log">
            <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>バトルログ</h3>
            <div className="log-messages" style={{
              maxHeight: '150px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}>
              {battleLog.slice(-8).map(log => (
                <div key={log.id} className="log-message" style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '5px',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* プレイヤーエリア */}
        <div className="player-section" style={{
          backgroundColor: '#27ae60',
          borderRadius: '10px',
          padding: '15px'
        }}>
          {/* プレイヤーのエナジー表示 */}
          <div className="energy-display player-energy-display" style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>あなたのエナジー</h4>
            <div className="energy-row" style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              {Object.entries(gameState.playerEnergy).map(([color, amount]) => (
                <div key={color} className="energy-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '5px 10px',
                  borderRadius: '15px'
                }}>
                  <img src={getEnergyImageUrl(color)} alt={`${color}エナジー`} style={{
                    width: '20px',
                    height: '20px'
                  }} />
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* プレイヤーのエナジーライン */}
          <div className="field-line player-energy-line" style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>あなたの エナジーライン</h4>
            <div className="line-slots" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {gameState.playerEnergyLine.map((card, index) => (
                <div 
                  key={index} 
                  className={`line-slot player-slot ${selectedCard ? 'can-place' : ''}`}
                  onClick={() => handleLineSlotClick('energy', index)}
                  style={{
                    width: '120px',
                    height: '160px',
                    border: `2px dashed ${selectedCard && phaseManager.canPerformAction('playCard') ? '#f39c12' : selectedCard ? '#95a5a6' : '#ffffff'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: card ? 'transparent' : selectedCard && phaseManager.canPerformAction('playCard') ? 'rgba(243,156,18,0.2)' : selectedCard ? 'rgba(149,165,166,0.2)' : 'rgba(255,255,255,0.1)',
                    cursor: selectedCard && !card && phaseManager.canPerformAction('playCard') ? 'pointer' : 'default',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {card ? (
                    <img 
                      src={getCardImageUrl(card.card_id)}
                      alt={card.name}
                      className="field-card player-card"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                    />
                  ) : (
                    <div className="empty-slot player-empty" style={{
                      color: 'white',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      {selectedCard && phaseManager.canPerformAction('playCard') ? <span>配置</span> : selectedCard ? <span>配置不可</span> : <span>空</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* プレイヤーのフロントライン */}
          <div className="field-line player-front-line">
            <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>あなたの フロントライン</h4>
            <div className="line-slots" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {gameState.playerFrontLine.map((card, index) => (
                <div 
                  key={index} 
                  className={`line-slot player-slot ${selectedCard ? 'can-place' : ''}`}
                  onClick={() => handleLineSlotClick('front', index)}
                  style={{
                    width: '120px',
                    height: '160px',
                    border: `2px dashed ${selectedCard && phaseManager.canPerformAction('playCard') ? '#f39c12' : selectedCard ? '#95a5a6' : '#ffffff'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: card ? 'transparent' : selectedCard && phaseManager.canPerformAction('playCard') ? 'rgba(243,156,18,0.2)' : selectedCard ? 'rgba(149,165,166,0.2)' : 'rgba(255,255,255,0.1)',
                    cursor: selectedCard && !card && phaseManager.canPerformAction('playCard') ? 'pointer' : 'default',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {card ? (
                    <img 
                      src={getCardImageUrl(card.card_id)}
                      alt={card.name}
                      className="field-card player-card"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                    />
                  ) : (
                    <div className="empty-slot player-empty" style={{
                      color: 'white',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      {selectedCard && phaseManager.canPerformAction('playCard') ? <span>配置</span> : selectedCard ? <span>配置不可</span> : <span>空</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 手札エリア */}
      <div className="hand-section" style={{
        backgroundColor: '#2c3e50',
        borderRadius: '15px',
        padding: '20px'
      }}>
        <div className="player-hand">
          <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>手札 ({gameState.playerHand.length}枚)</h3>
          <div className="hand-cards" style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {gameState.playerHand.map((card, index) => {
              const isSelected = selectedCard?.uniqueId === card.uniqueId;
              
              return (
                <div 
                  key={card.uniqueId} 
                  className={`hand-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCardClick(card)}
                  onMouseEnter={() => setHoveredCard(card)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    width: '100px',
                    height: '140px',
                    border: isSelected ? '3px solid #f39c12' : '2px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: isSelected ? 'translateY(-10px) scale(1.05)' : 'translateY(0) scale(1)',
                    boxShadow: isSelected ? '0 10px 20px rgba(243,156,18,0.5)' : '0 5px 15px rgba(0,0,0,0.3)'
                  }}
                >
                  <img 
                    src={getCardImageUrl(card.card_id)}
                    alt={card.name}
                    className="hand-card-image"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '6px'
                    }}
                  />
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
            {/* 名前 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#4299e1' }}>{hoveredCard.name}</span>
            </div>
            {/* 画像 */}
            <img 
              src={getCardImageUrl(hoveredCard.card_id)}
              alt={hoveredCard.name}
              className="detail-card-image"
            />
            {/* 必要エナジー */}
            {(() => {
              const cardDetail = cardDetails[hoveredCard.card_id]?.data;
              return cardDetail?.必要エナジー ? (
                <div style={{ textAlign: 'center', fontSize: '13px', color: '#f6e05e', margin: '4px 0 8px 0' }}>
                  必要エナジー: {cardDetail.必要エナジー}
                </div>
              ) : null;
            })()}
            {/* カード詳細情報 */}
            <div className="card-detail-info" style={{ width: '100%', marginTop: '4px', maxHeight: '140px', overflowY: 'auto' }}>
              {(() => {
                const cardDetail = cardDetails[hoveredCard.card_id]?.data;
                if (cardDetail) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* カード種類 */}
                      {cardDetail.カード種類 && (
                        <p><strong>カード種類:</strong> {cardDetail.カード種類}</p>
                      )}
                      {/* BP */}
                      {cardDetail.BP && (
                        <p><strong>BP:</strong> {cardDetail.BP}</p>
                      )}
                      {/* 発生エナジー */}
                      {cardDetail.発生エナジー && (
                        <p><strong>発生エナジー:</strong> {cardDetail.発生エナジー}</p>
                      )}
                      {/* 効果 */}
                      {cardDetail.効果 && (
                        <p style={{ whiteSpace: 'pre-line' }}><strong>効果:</strong> {cardDetail.効果}</p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* バトルシステムUI */}
      {battleState.battleInProgress && (
        <BattleSystemUI
          gameState={gameState}
          onAttack={handleAttack}
          onBlock={handleBlock}
          onResolveBattle={handleResolveBattle}
          onCancelBattle={handleCancelBattle}
          battleState={battleState}
          isPlayerTurn={gameState.currentTurn === 'player'}
          currentPhase={gameState.gamePhase}
        />
      )}

      {/* Movement PhaseUI */}
      {gameState.gamePhase === UNION_ARENA_PHASES.MOVEMENT && gameState.currentTurn === 'player' && (
        <MovementPhaseUI
          gameState={gameState}
          onMoveCharacter={handleMoveCharacter}
          cardDetails={cardDetails}
          isPlayerTurn={gameState.currentTurn === 'player'}
          currentPhase={gameState.gamePhase}
          onNextPhase={nextPhase}
        />
      )}
    </div>
  );
};

export default BattleField;