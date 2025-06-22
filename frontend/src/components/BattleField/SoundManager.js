// SoundManager.js - バトルフィールド用サウンド管理
import AudioGenerator from '../../utils/audioGenerator';

class SoundManager {
  constructor() {
    this.audioGenerator = new AudioGenerator();
    this.isMuted = false;
    this.volume = 0.5;
    this.bgmVolume = 0.3;
    this.sfxVolume = 0.5;
    
    // 音声ファイルのパス（将来的に実際のファイルに置き換え）
    this.sounds = {
      bgm: {
        battle: '/assets/sounds/bgm/battle.mp3',
        victory: '/assets/sounds/bgm/victory.mp3',
        defeat: '/assets/sounds/bgm/defeat.mp3'
      },
      sfx: {
        cardPlay: '/assets/sounds/sfx/card_play.mp3',
        energyAdd: '/assets/sounds/sfx/energy_add.mp3',
        damage: '/assets/sounds/sfx/damage.mp3',
        victory: '/assets/sounds/sfx/victory.mp3',
        defeat: '/assets/sounds/sfx/defeat.mp3',
        turnStart: '/assets/sounds/sfx/turn_start.mp3',
        phaseChange: '/assets/sounds/sfx/phase_change.mp3',
        draw: '/assets/sounds/sfx/draw.mp3',
        error: '/assets/sounds/sfx/error.mp3',
        success: '/assets/sounds/sfx/success.mp3',
        warning: '/assets/sounds/sfx/warning.mp3'
      }
    };
    
    this.audioElements = {};
    this.currentBGM = null;
  }

  // 音声ファイルを読み込み
  async loadSound(path, type = 'sfx') {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      
      // 音量設定
      if (type === 'bgm') {
        audio.volume = this.bgmVolume * this.volume;
        audio.loop = true;
      } else {
        audio.volume = this.sfxVolume * this.volume;
      }
      
      this.audioElements[path] = audio;
      return audio;
    } catch (error) {
      console.warn(`Failed to load sound: ${path}`, error);
      return null;
    }
  }

  // 効果音を再生（実際の音声ファイルまたは生成音声）
  playSFX(soundName) {
    if (this.isMuted) return;

    const soundPath = this.sounds.sfx[soundName];
    
    // 実際の音声ファイルがある場合はそれを再生
    if (this.audioElements[soundPath]) {
      const audio = this.audioElements[soundPath];
      audio.currentTime = 0;
      audio.volume = this.sfxVolume * this.volume;
      audio.play().catch(error => {
        console.warn(`Failed to play SFX: ${soundName}`, error);
        // ファイル再生に失敗した場合は生成音声を使用
        this.playGeneratedSFX(soundName);
      });
    } else {
      // 音声ファイルがない場合は生成音声を使用
      this.playGeneratedSFX(soundName);
    }
  }

  // 生成音声を再生
  playGeneratedSFX(soundName) {
    if (this.isMuted) return;

    // AudioContextを再開（ユーザーインタラクション後に必要）
    this.audioGenerator.resumeAudioContext();

    switch (soundName) {
      case 'cardPlay':
        this.audioGenerator.generateCardSound();
        break;
      case 'energyAdd':
        this.audioGenerator.generateEnergySound();
        break;
      case 'damage':
        this.audioGenerator.generateDamageSound();
        break;
      case 'victory':
        this.audioGenerator.generateVictorySound();
        break;
      case 'defeat':
        this.audioGenerator.generateDefeatSound();
        break;
      case 'turnStart':
        this.audioGenerator.generateTurnStartSound();
        break;
      case 'phaseChange':
        this.audioGenerator.generatePhaseChangeSound();
        break;
      case 'draw':
        this.audioGenerator.generateDrawSound();
        break;
      case 'error':
        this.audioGenerator.generateErrorSound();
        break;
      case 'success':
        this.audioGenerator.generateSuccessSound();
        break;
      case 'warning':
        this.audioGenerator.generateWarningSound();
        break;
      default:
        console.warn(`Unknown SFX: ${soundName}`);
    }
  }

  // BGMを再生
  async playBGM(bgmName) {
    if (this.isMuted) return;
    const soundPath = this.sounds.bgm[bgmName];

    // プリロードされていなければロード
    if (!this.audioElements[soundPath]) {
      await this.loadSound(soundPath, 'bgm');
    }

    this.stopBGM();

    if (this.audioElements[soundPath]) {
      const audio = this.audioElements[soundPath];
      audio.volume = this.bgmVolume * this.volume;
      audio.play().catch(error => {
        console.warn(`Failed to play BGM: ${bgmName}`, error);
        // 生成BGMは再生しない
      });
      this.currentBGM = audio;
    }
  }

  // BGMを停止
  stopBGM() {
    if (this.currentBGM && this.currentBGM !== 'generated') {
      this.currentBGM.pause();
      this.currentBGM.currentTime = 0;
    }
    this.currentBGM = null;
  }

  // 音量設定
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // 既存の音声要素の音量を更新
    Object.values(this.audioElements).forEach(audio => {
      if (audio.src.includes('bgm')) {
        audio.volume = this.bgmVolume * this.volume;
      } else {
        audio.volume = this.sfxVolume * this.volume;
      }
    });
  }

  // BGM音量設定
  setBGMVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    
    // BGM音声要素の音量を更新
    Object.entries(this.audioElements).forEach(([path, audio]) => {
      if (path.includes('bgm')) {
        audio.volume = this.bgmVolume * this.volume;
      }
    });
  }

  // SFX音量設定
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    // SFX音声要素の音量を更新
    Object.entries(this.audioElements).forEach(([path, audio]) => {
      if (path.includes('sfx')) {
        audio.volume = this.sfxVolume * this.volume;
      }
    });
  }

  // ミュート切り替え
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopBGM();
    }
    
    return this.isMuted;
  }

  // ミュート状態設定
  setMute(muted) {
    this.isMuted = muted;
    
    if (this.isMuted) {
      this.stopBGM();
    }
  }

  // 音声ファイルをプリロード
  async preloadSounds() {
    const loadPromises = [];
    
    // BGMをプリロード
    Object.entries(this.sounds.bgm).forEach(([name, path]) => {
      loadPromises.push(this.loadSound(path, 'bgm'));
    });
    
    // SFXをプリロード
    Object.entries(this.sounds.sfx).forEach(([name, path]) => {
      loadPromises.push(this.loadSound(path, 'sfx'));
    });
    
    try {
      await Promise.all(loadPromises);
      console.log('All sounds preloaded successfully');
    } catch (error) {
      console.warn('Some sounds failed to preload:', error);
    }
  }

  // カスタム効果音を再生
  playCustomSound(frequency, duration, type, volume) {
    if (this.isMuted) return;
    
    this.audioGenerator.resumeAudioContext();
    this.audioGenerator.generateCustomSound(frequency, duration, type, volume);
  }

  // リソースクリーンアップ
  cleanup() {
    this.stopBGM();
    Object.values(this.audioElements).forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioElements = {};
  }
}

export default SoundManager; 