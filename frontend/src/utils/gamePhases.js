// ゲームフェーズの定義
export const GAME_PHASES = {
  DRAW: 'draw',           // ドローフェーズ
  MAIN: 'main',           // メインフェーズ
  BATTLE: 'battle',       // バトルフェーズ
  END: 'end'              // エンドフェーズ
};

// フェーズの表示名
export const PHASE_DISPLAY_NAMES = {
  [GAME_PHASES.DRAW]: 'ドローフェーズ',
  [GAME_PHASES.MAIN]: 'メインフェーズ',
  [GAME_PHASES.BATTLE]: 'バトルフェーズ',
  [GAME_PHASES.END]: 'エンドフェーズ'
};

// フェーズの順序
export const PHASE_ORDER = [
  GAME_PHASES.DRAW,
  GAME_PHASES.MAIN,
  GAME_PHASES.BATTLE,
  GAME_PHASES.END
];

// フェーズ管理クラス
export class PhaseManager {
  constructor() {
    this.currentPhase = GAME_PHASES.DRAW;
    this.phaseIndex = 0;
    this.phaseHistory = [];
  }

  // 現在のフェーズを取得
  getCurrentPhase() {
    return this.currentPhase;
  }

  // 次のフェーズに進む
  nextPhase() {
    this.phaseIndex = (this.phaseIndex + 1) % PHASE_ORDER.length;
    this.currentPhase = PHASE_ORDER[this.phaseIndex];
    this.phaseHistory.push({
      phase: this.currentPhase,
      timestamp: Date.now()
    });
    return this.currentPhase;
  }

  // 特定のフェーズに設定
  setPhase(phase) {
    if (PHASE_ORDER.includes(phase)) {
      this.currentPhase = phase;
      this.phaseIndex = PHASE_ORDER.indexOf(phase);
      this.phaseHistory.push({
        phase: this.currentPhase,
        timestamp: Date.now()
      });
    }
    return this.currentPhase;
  }

  // フェーズの表示名を取得
  getPhaseDisplayName() {
    return PHASE_DISPLAY_NAMES[this.currentPhase];
  }

  // フェーズ履歴を取得
  getPhaseHistory() {
    return this.phaseHistory;
  }

  // フェーズをリセット
  reset() {
    this.currentPhase = GAME_PHASES.DRAW;
    this.phaseIndex = 0;
    this.phaseHistory = [];
  }
}

// フェーズごとのアクション制限
export const PHASE_ACTIONS = {
  [GAME_PHASES.DRAW]: {
    canDraw: true,
    canPlayCards: false,
    canAttack: false,
    canUseSkills: false
  },
  [GAME_PHASES.MAIN]: {
    canDraw: false,
    canPlayCards: true,
    canAttack: false,
    canUseSkills: true
  },
  [GAME_PHASES.BATTLE]: {
    canDraw: false,
    canPlayCards: false,
    canAttack: true,
    canUseSkills: true
  },
  [GAME_PHASES.END]: {
    canDraw: false,
    canPlayCards: false,
    canAttack: false,
    canUseSkills: false
  }
};

// フェーズごとのアクションが可能かチェック
export function canPerformAction(phase, action) {
  return PHASE_ACTIONS[phase]?.[action] || false;
} 