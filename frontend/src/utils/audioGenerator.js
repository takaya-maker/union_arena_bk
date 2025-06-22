// 音声ファイル生成ユーティリティ
class AudioGenerator {
  constructor() {
    this.audioContext = null;
    this.initAudioContext();
  }

  // AudioContextの初期化
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // 基本的な音色を生成
  generateTone(frequency = 440, duration = 0.5, type = 'sine', volume = 0.3) {
    if (!this.audioContext) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    // フェードイン・アウト
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);

    return oscillator;
  }

  // カード効果音を生成
  generateCardSound() {
    return this.generateTone(800, 0.2, 'square', 0.2);
  }

  // エナジー効果音を生成
  generateEnergySound() {
    return this.generateTone(600, 0.3, 'triangle', 0.25);
  }

  // ダメージ効果音を生成
  generateDamageSound() {
    const oscillator = this.generateTone(200, 0.4, 'sawtooth', 0.3);
    if (oscillator) {
      // 周波数を徐々に下げる
      oscillator.frequency.exponentialRampToValueAtTime(
        50, 
        this.audioContext.currentTime + 0.4
      );
    }
    return oscillator;
  }

  // 勝利効果音を生成
  generateVictorySound() {
    const notes = [523, 659, 784, 1047]; // C, E, G, C
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.generateTone(note, 0.3, 'sine', 0.2);
      }, index * 200);
    });
  }

  // 敗北効果音を生成
  generateDefeatSound() {
    const notes = [400, 300, 200]; // 下降音
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.generateTone(note, 0.4, 'sawtooth', 0.25);
      }, index * 300);
    });
  }

  // ターン開始効果音を生成
  generateTurnStartSound() {
    return this.generateTone(440, 0.5, 'sine', 0.2);
  }

  // フェーズ変更効果音を生成
  generatePhaseChangeSound() {
    return this.generateTone(660, 0.2, 'triangle', 0.2);
  }

  // カードドロー効果音を生成
  generateDrawSound() {
    return this.generateTone(880, 0.15, 'sine', 0.15);
  }

  // エラーメッセージ効果音を生成
  generateErrorSound() {
    const oscillator = this.generateTone(300, 0.3, 'square', 0.3);
    if (oscillator) {
      // ビープ音を2回
      setTimeout(() => {
        this.generateTone(300, 0.3, 'square', 0.3);
      }, 150);
    }
    return oscillator;
  }

  // 成功メッセージ効果音を生成
  generateSuccessSound() {
    return this.generateTone(800, 0.2, 'sine', 0.2);
  }

  // 警告効果音を生成
  generateWarningSound() {
    return this.generateTone(400, 0.4, 'triangle', 0.25);
  }

  // カスタム効果音を生成
  generateCustomSound(frequency, duration, type, volume) {
    return this.generateTone(frequency, duration, type, volume);
  }

  // AudioContextを再開（ユーザーインタラクション後に必要）
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export default AudioGenerator; 