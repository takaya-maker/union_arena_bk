// エナジーの種類
export const ENERGY_TYPES = {
  BLUE: 'blue',
  RED: 'red',
  GREEN: 'green',
  YELLOW: 'yellow',
  PURPLE: 'purple'
};

// エナジーの日本語名
export const ENERGY_DISPLAY_NAMES = {
  [ENERGY_TYPES.BLUE]: '青',
  [ENERGY_TYPES.RED]: '赤',
  [ENERGY_TYPES.GREEN]: '緑',
  [ENERGY_TYPES.YELLOW]: '黄',
  [ENERGY_TYPES.PURPLE]: '紫'
};

// エナジー管理クラス
export class EnergyManager {
  constructor() {
    this.energy = {
      [ENERGY_TYPES.BLUE]: 0,
      [ENERGY_TYPES.RED]: 0,
      [ENERGY_TYPES.GREEN]: 0,
      [ENERGY_TYPES.YELLOW]: 0,
      [ENERGY_TYPES.PURPLE]: 0
    };
    this.maxEnergy = {
      [ENERGY_TYPES.BLUE]: 10,
      [ENERGY_TYPES.RED]: 10,
      [ENERGY_TYPES.GREEN]: 10,
      [ENERGY_TYPES.YELLOW]: 10,
      [ENERGY_TYPES.PURPLE]: 10
    };
  }

  // エナジーを取得
  getEnergy(type) {
    return this.energy[type] || 0;
  }

  // 全エナジーを取得
  getAllEnergy() {
    return { ...this.energy };
  }

  // エナジーを追加
  addEnergy(type, amount = 1) {
    if (this.energy[type] !== undefined) {
      this.energy[type] = Math.min(
        this.energy[type] + amount,
        this.maxEnergy[type]
      );
    }
    return this.energy[type];
  }

  // エナジーを消費
  consumeEnergy(type, amount = 1) {
    if (this.energy[type] !== undefined && this.energy[type] >= amount) {
      this.energy[type] -= amount;
      return true;
    }
    return false;
  }

  // 複数のエナジーを消費
  consumeMultipleEnergy(costs) {
    // まず消費可能かチェック
    for (const [type, amount] of Object.entries(costs)) {
      if (this.energy[type] < amount) {
        return false;
      }
    }

    // 消費実行
    for (const [type, amount] of Object.entries(costs)) {
      this.energy[type] -= amount;
    }
    return true;
  }

  // エナジーコストが支払えるかチェック
  canPayCost(costs) {
    for (const [type, amount] of Object.entries(costs)) {
      if (this.energy[type] < amount) {
        return false;
      }
    }
    return true;
  }

  // エナジーをリセット
  resetEnergy() {
    this.energy = {
      [ENERGY_TYPES.BLUE]: 0,
      [ENERGY_TYPES.RED]: 0,
      [ENERGY_TYPES.GREEN]: 0,
      [ENERGY_TYPES.YELLOW]: 0,
      [ENERGY_TYPES.PURPLE]: 0
    };
  }

  // ターン開始時のエナジー生成
  generateTurnEnergy(turnNumber) {
    // 基本エナジー生成（ターン数に応じて増加）
    const baseEnergy = Math.min(turnNumber, 5);
    
    // 各色のエナジーをランダムに生成
    const energyTypes = Object.values(ENERGY_TYPES);
    for (let i = 0; i < baseEnergy; i++) {
      const randomType = energyTypes[Math.floor(Math.random() * energyTypes.length)];
      this.addEnergy(randomType);
    }
  }

  // エナジー総量を取得
  getTotalEnergy() {
    return Object.values(this.energy).reduce((sum, amount) => sum + amount, 0);
  }

  // エナジー不足の詳細を取得
  getMissingEnergy(costs) {
    const missing = {};
    for (const [type, amount] of Object.entries(costs)) {
      const current = this.energy[type] || 0;
      if (current < amount) {
        missing[type] = amount - current;
      }
    }
    return missing;
  }
}

// カードのエナジーコストを解析
export function parseEnergyCost(costString) {
  if (!costString) return {};
  
  const costs = {};
  const costPattern = /([青赤緑黄紫])(\d+)?/g;
  let match;
  
  while ((match = costPattern.exec(costString)) !== null) {
    const color = match[1];
    const amount = parseInt(match[2]) || 1;
    
    // 日本語色名を英語に変換
    const colorMap = {
      '青': ENERGY_TYPES.BLUE,
      '赤': ENERGY_TYPES.RED,
      '緑': ENERGY_TYPES.GREEN,
      '黄': ENERGY_TYPES.YELLOW,
      '紫': ENERGY_TYPES.PURPLE
    };
    
    const energyType = colorMap[color];
    if (energyType) {
      costs[energyType] = (costs[energyType] || 0) + amount;
    }
  }
  
  return costs;
}

// エナジーコストの表示用文字列を生成
export function formatEnergyCost(costs) {
  const parts = [];
  for (const [type, amount] of Object.entries(costs)) {
    const displayName = ENERGY_DISPLAY_NAMES[type];
    parts.push(`${displayName}${amount > 1 ? amount : ''}`);
  }
  return parts.join(' ');
} 