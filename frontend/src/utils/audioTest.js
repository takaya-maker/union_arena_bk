// 音声機能テストユーティリティ
import AudioGenerator from './audioGenerator';
import SoundManager from '../components/BattleField/SoundManager';

class AudioTest {
  constructor() {
    this.audioGenerator = new AudioGenerator();
    this.soundManager = new SoundManager();
    this.isTestMode = false;
  }

  // テストモードを開始
  startTest() {
    this.isTestMode = true;
    console.log('🎵 音声テストモードを開始しました');
    this.audioGenerator.resumeAudioContext();
  }

  // テストモードを終了
  stopTest() {
    this.isTestMode = false;
    this.soundManager.cleanup();
    console.log('🎵 音声テストモードを終了しました');
  }

  // 全効果音をテスト再生
  testAllSFX() {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    const sounds = [
      { name: 'カード効果音', method: () => this.audioGenerator.generateCardSound() },
      { name: 'エナジー効果音', method: () => this.audioGenerator.generateEnergySound() },
      { name: 'ダメージ効果音', method: () => this.audioGenerator.generateDamageSound() },
      { name: '勝利効果音', method: () => this.audioGenerator.generateVictorySound() },
      { name: '敗北効果音', method: () => this.audioGenerator.generateDefeatSound() },
      { name: 'ターン開始効果音', method: () => this.audioGenerator.generateTurnStartSound() },
      { name: 'フェーズ変更効果音', method: () => this.audioGenerator.generatePhaseChangeSound() },
      { name: 'カードドロー効果音', method: () => this.audioGenerator.generateDrawSound() },
      { name: 'エラー効果音', method: () => this.audioGenerator.generateErrorSound() },
      { name: '成功効果音', method: () => this.audioGenerator.generateSuccessSound() },
      { name: '警告効果音', method: () => this.audioGenerator.generateWarningSound() }
    ];

    console.log('🎵 全効果音を順次再生します...');
    
    sounds.forEach((sound, index) => {
      setTimeout(() => {
        console.log(`再生中: ${sound.name}`);
        sound.method();
      }, index * 1000); // 1秒間隔で再生
    });
  }

  // 特定の効果音をテスト
  testSpecificSFX(soundName) {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    console.log(`🎵 ${soundName}を再生します`);
    this.soundManager.playSFX(soundName);
  }

  // カスタム音声をテスト
  testCustomSound(frequency = 440, duration = 0.5, type = 'sine', volume = 0.3) {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    console.log(`🎵 カスタム音声を再生: ${frequency}Hz, ${duration}秒, ${type}波, 音量${volume}`);
    this.audioGenerator.generateCustomSound(frequency, duration, type, volume);
  }

  // 音階テスト
  testScale() {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major scale
    console.log('🎵 ドレミファソラシドを再生します');

    scale.forEach((note, index) => {
      setTimeout(() => {
        this.audioGenerator.generateTone(note, 0.3, 'sine', 0.2);
      }, index * 400);
    });
  }

  // 波形テスト
  testWaveforms() {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    const waveforms = ['sine', 'square', 'triangle', 'sawtooth'];
    console.log('🎵 各波形を順次再生します');

    waveforms.forEach((waveform, index) => {
      setTimeout(() => {
        console.log(`再生中: ${waveform}波`);
        this.audioGenerator.generateTone(440, 0.5, waveform, 0.2);
      }, index * 800);
    });
  }

  // 音量テスト
  testVolume() {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    const volumes = [0.1, 0.3, 0.5, 0.7, 0.9];
    console.log('🎵 音量レベルを順次テストします');

    volumes.forEach((volume, index) => {
      setTimeout(() => {
        console.log(`再生中: 音量${volume}`);
        this.audioGenerator.generateTone(440, 0.3, 'sine', volume);
      }, index * 600);
    });
  }

  // BGMテスト
  testBGM() {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    console.log('🎵 BGMを開始します（10秒間）');
    this.soundManager.playBGM('battle');
    
    setTimeout(() => {
      console.log('🎵 BGMを停止します');
      this.soundManager.stopBGM();
    }, 10000);
  }

  // 音声設定テスト
  testAudioSettings() {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    console.log('🎵 音声設定をテストします');
    
    // 音量設定テスト
    this.soundManager.setVolume(0.8);
    this.soundManager.setBGMVolume(0.4);
    this.soundManager.setSFXVolume(0.6);
    
    console.log('音量設定を変更しました');
    this.audioGenerator.generateTone(440, 0.5, 'sine', 0.3);
  }

  // ミュートテスト
  testMute() {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    console.log('🎵 ミュート機能をテストします');
    
    // 通常音声
    this.audioGenerator.generateTone(440, 0.3, 'sine', 0.3);
    
    setTimeout(() => {
      console.log('ミュートを有効にします');
      this.soundManager.setMute(true);
      this.audioGenerator.generateTone(440, 0.3, 'sine', 0.3);
    }, 500);
    
    setTimeout(() => {
      console.log('ミュートを無効にします');
      this.soundManager.setMute(false);
      this.audioGenerator.generateTone(440, 0.3, 'sine', 0.3);
    }, 1000);
  }

  // 全テストを実行
  runAllTests() {
    if (!this.isTestMode) {
      console.warn('テストモードを開始してください');
      return;
    }

    console.log('🎵 全音声テストを開始します');
    
    setTimeout(() => this.testScale(), 1000);
    setTimeout(() => this.testWaveforms(), 5000);
    setTimeout(() => this.testVolume(), 9000);
    setTimeout(() => this.testAllSFX(), 13000);
    setTimeout(() => this.testBGM(), 24000);
    setTimeout(() => this.testMute(), 34000);
    setTimeout(() => this.testAudioSettings(), 38000);
  }

  // ブラウザの音声対応状況をチェック
  checkBrowserSupport() {
    const support = {
      webAudioAPI: !!(window.AudioContext || window.webkitAudioContext),
      audioElement: !!window.Audio,
      getUserMedia: !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia),
      mediaDevices: !!navigator.mediaDevices
    };

    console.log('🎵 ブラウザ音声対応状況:');
    console.log('- Web Audio API:', support.webAudioAPI ? '✅ 対応' : '❌ 非対応');
    console.log('- Audio Element:', support.audioElement ? '✅ 対応' : '❌ 非対応');
    console.log('- getUserMedia:', support.getUserMedia ? '✅ 対応' : '❌ 非対応');
    console.log('- MediaDevices:', support.mediaDevices ? '✅ 対応' : '❌ 非対応');

    return support;
  }
}

// グローバルに公開（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  window.audioTest = new AudioTest();
  console.log('🎵 音声テストツールが利用可能です: window.audioTest');
  console.log('使用方法:');
  console.log('- window.audioTest.startTest() - テストモード開始');
  console.log('- window.audioTest.testAllSFX() - 全効果音テスト');
  console.log('- window.audioTest.runAllTests() - 全テスト実行');
  console.log('- window.audioTest.checkBrowserSupport() - ブラウザ対応確認');
}

export default AudioTest; 