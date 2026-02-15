export type KeyCallback = (lane: 'left' | 'right') => void;

export class InputHandler {
  private keysPressed = new Set<string>();
  private leftKey: string = 'KeyD';
  private rightKey: string = 'KeyK';
  private onKeyPress: KeyCallback | null = null;

  constructor(onKeyPress: KeyCallback) {
    this.onKeyPress = onKeyPress;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore key repeats (REQ-2, AC5)
    if (this.keysPressed.has(event.code)) {
      return;
    }

    this.keysPressed.add(event.code);

    if (event.code === this.leftKey && this.onKeyPress) {
      this.onKeyPress('left');
    } else if (event.code === this.rightKey && this.onKeyPress) {
      this.onKeyPress('right');
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.code);
  }

  start(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  stop(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keysPressed.clear();
  }
}
