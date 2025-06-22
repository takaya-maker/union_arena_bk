// 音声ファイルのプレースホルダー機能
export class AudioPlaceholder {
  constructor() {
    this.audioContext = null;
    this.isSupported = false;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      // Web Audio APIのサポートチェック
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        this.isSupported = true;
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // 簡単なビープ音を生成
  createBeep(frequency = 440, duration = 0.1, type = 'sine') {
    if (!this.isSupported || !this.audioContext) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to create beep:', error);
    }
  }

  // 効果音の種類別プレースホルダー
  playButtonClick() {
    this.createBeep(800, 0.05, 'square');
  }

  playCardPlay() {
    this.createBeep(600, 0.1, 'sine');
  }

  playCardDraw() {
    this.createBeep(400, 0.08, 'triangle');
  }

  playBattleStart() {
    // 複数の音を組み合わせて戦闘開始音
    this.createBeep(300, 0.2, 'sawtooth');
    setTimeout(() => this.createBeep(500, 0.2, 'sawtooth'), 200);
    setTimeout(() => this.createBeep(700, 0.3, 'sawtooth'), 400);
  }

  playTurnStart() {
    this.createBeep(500, 0.15, 'sine');
    setTimeout(() => this.createBeep(700, 0.15, 'sine'), 150);
  }

  playTurnEnd() {
    this.createBeep(700, 0.1, 'sine');
    setTimeout(() => this.createBeep(500, 0.1, 'sine'), 100);
  }

  playPhaseChange() {
    this.createBeep(600, 0.1, 'triangle');
    setTimeout(() => this.createBeep(800, 0.1, 'triangle'), 100);
  }

  playBattleEnd() {
    // 勝利/敗北音
    this.createBeep(400, 0.3, 'sine');
    setTimeout(() => this.createBeep(600, 0.3, 'sine'), 300);
    setTimeout(() => this.createBeep(800, 0.5, 'sine'), 600);
  }

  playEnergyConsume() {
    this.createBeep(300, 0.08, 'square');
  }

  playDamage() {
    this.createBeep(200, 0.2, 'sawtooth');
  }

  playHeal() {
    this.createBeep(800, 0.15, 'sine');
    setTimeout(() => this.createBeep(1000, 0.15, 'sine'), 150);
  }

  // BGMプレースホルダー（ループする簡単なメロディー）
  playBGM() {
    if (!this.isSupported) return;
    
    // 簡単なループメロディー
    const notes = [440, 494, 523, 587, 659, 587, 523, 494];
    let currentNote = 0;
    
    this.bgmInterval = setInterval(() => {
      this.createBeep(notes[currentNote], 0.3, 'sine');
      currentNote = (currentNote + 1) % notes.length;
    }, 600);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

// シングルトンインスタンス
export const audioPlaceholder = new AudioPlaceholder(); 