// Union Arena正式ルールに基づくフェーズ管理
export const UNION_ARENA_PHASES = {
  START: 'start',
  MOVEMENT: 'movement', 
  MAIN: 'main',
  END: 'end'
};

export const PHASE_DISPLAY_NAMES = {
  [UNION_ARENA_PHASES.START]: 'スタートフェーズ',
  [UNION_ARENA_PHASES.MOVEMENT]: 'ムーブメントフェーズ',
  [UNION_ARENA_PHASES.MAIN]: 'メインフェーズ',
  [UNION_ARENA_PHASES.END]: 'エンドフェーズ'
};

export class UnionArenaPhaseManager {
  constructor() {
    this.currentPhase = UNION_ARENA_PHASES.START;
  }

  getCurrentPhase() {
    return this.currentPhase;
  }

  nextPhase() {
    const phaseOrder = [
      UNION_ARENA_PHASES.START,
      UNION_ARENA_PHASES.MOVEMENT,
      UNION_ARENA_PHASES.MAIN,
      UNION_ARENA_PHASES.END
    ];
    
    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    const nextIndex = (currentIndex + 1) % phaseOrder.length;
    this.currentPhase = phaseOrder[nextIndex];
    return this.currentPhase;
  }

  reset() {
    this.currentPhase = UNION_ARENA_PHASES.START;
  }

  canPerformAction(action) {
    switch (action) {
      case 'draw':
        return this.currentPhase === UNION_ARENA_PHASES.START;
      case 'move':
        return this.currentPhase === UNION_ARENA_PHASES.MOVEMENT;
      case 'playCard':
      case 'activateMain':
      case 'attack':
        return this.currentPhase === UNION_ARENA_PHASES.MAIN;
      default:
        return false;
    }
  }
}