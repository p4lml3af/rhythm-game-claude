export type KeyCallback = (lane: 'left' | 'right') => void;

export class InputHandler {
  private keysPressed = new Set<string>();
  private leftKey: string = 'KeyD';
  private rightKey: string = 'KeyK';
  private onKeyPress: KeyCallback | null = null;
  private onKeyRelease: KeyCallback | null = null;

  constructor(onKeyPress: KeyCallback, onKeyRelease?: KeyCallback, keyBindings?: { left: string; right: string }) {
    this.onKeyPress = onKeyPress;
    this.onKeyRelease = onKeyRelease ?? null;
    this.leftKey = keyBindings?.left ?? 'KeyD';
    this.rightKey = keyBindings?.right ?? 'KeyK';
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

    // Fire release callback for lane keys
    if (event.code === this.leftKey && this.onKeyRelease) {
      this.onKeyRelease('left');
    } else if (event.code === this.rightKey && this.onKeyRelease) {
      this.onKeyRelease('right');
    }
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
