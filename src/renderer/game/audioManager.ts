export class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPlaying: boolean = false;

  async loadAudio(audioPath: string): Promise<void> {
    this.audioContext = new AudioContext();

    const response = await fetch(audioPath);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer) {
      console.error('Audio not loaded');
      return;
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.audioContext.destination);
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

  stop(): void {
    if (this.sourceNode) {
      // Save current time before stopping
      this.pausedTime = this.getCurrentTime();
      this.sourceNode.stop();
      this.sourceNode = null;
      this.isPlaying = false;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
