export class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPlaying: boolean = false;
  private stoppedManually: boolean = false;
  private onEndedCallback: (() => void) | null = null;
  private gainNode: GainNode | null = null;

  async loadAudio(audioPath: string): Promise<void> {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    const response = await fetch(audioPath);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  play(onEnded?: () => void): void {
    if (!this.audioContext || !this.audioBuffer) {
      console.error('Audio not loaded');
      return;
    }

    this.stoppedManually = false;
    this.onEndedCallback = onEnded ?? null;

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode ?? this.audioContext.destination);

    this.sourceNode.onended = () => {
      this.isPlaying = false;
      if (!this.stoppedManually && this.onEndedCallback) {
        this.onEndedCallback();
      }
    };

    this.sourceNode.start(0);
    this.startTime = this.audioContext.currentTime;
    this.isPlaying = true;
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;

    // If stopped, return the frozen time
    if (!this.isPlaying) {
      return this.pausedTime;
    }

    return this.audioContext.currentTime - this.startTime;
  }

  getDuration(): number {
    return this.audioBuffer?.duration ?? 0;
  }

  stop(): void {
    if (this.sourceNode) {
      this.stoppedManually = true;
      // Save current time before stopping
      this.pausedTime = this.getCurrentTime();
      this.sourceNode.stop();
      this.sourceNode = null;
      this.isPlaying = false;
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = volume / 100;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
