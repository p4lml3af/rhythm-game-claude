import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputHandler } from '../inputHandler';

describe('InputHandler', () => {
  let handler: InputHandler;
  let callback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    callback = vi.fn();
    handler = new InputHandler(callback);
    handler.start();
  });

  afterEach(() => {
    handler.stop();
  });

  function fireKeyDown(code: string) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  }

  function fireKeyUp(code: string) {
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
  }

  it('fires left lane callback for D key', () => {
    fireKeyDown('KeyD');
    expect(callback).toHaveBeenCalledWith('left');
  });

  it('fires right lane callback for K key', () => {
    fireKeyDown('KeyK');
    expect(callback).toHaveBeenCalledWith('right');
  });

  it('ignores unmapped keys', () => {
    fireKeyDown('KeyA');
    expect(callback).not.toHaveBeenCalled();
  });

  it('blocks key repeat (same key pressed twice without release)', () => {
    fireKeyDown('KeyD');
    fireKeyDown('KeyD');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('allows re-press after key release', () => {
    fireKeyDown('KeyD');
    fireKeyUp('KeyD');
    fireKeyDown('KeyD');
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('handles simultaneous keys (both D and K pressed)', () => {
    fireKeyDown('KeyD');
    fireKeyDown('KeyK');
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('left');
    expect(callback).toHaveBeenCalledWith('right');
  });

  it('stops listening after stop() is called', () => {
    handler.stop();
    fireKeyDown('KeyD');
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('InputHandler — onKeyRelease', () => {
  let pressCallback: ReturnType<typeof vi.fn>;
  let releaseCallback: ReturnType<typeof vi.fn>;
  let handler: InputHandler;

  beforeEach(() => {
    pressCallback = vi.fn();
    releaseCallback = vi.fn();
    handler = new InputHandler(pressCallback, releaseCallback);
    handler.start();
  });

  afterEach(() => {
    handler.stop();
  });

  function fireKeyDown(code: string) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  }

  function fireKeyUp(code: string) {
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
  }

  it('fires onKeyRelease for left lane (D key released)', () => {
    fireKeyDown('KeyD');
    fireKeyUp('KeyD');
    expect(releaseCallback).toHaveBeenCalledWith('left');
  });

  it('fires onKeyRelease for right lane (K key released)', () => {
    fireKeyDown('KeyK');
    fireKeyUp('KeyK');
    expect(releaseCallback).toHaveBeenCalledWith('right');
  });

  it('does NOT fire onKeyRelease for non-lane keys', () => {
    fireKeyDown('KeyA');
    fireKeyUp('KeyA');
    expect(releaseCallback).not.toHaveBeenCalled();
  });

  it('onKeyRelease is optional (constructor works without it)', () => {
    const simpleHandler = new InputHandler(pressCallback);
    simpleHandler.start();
    fireKeyDown('KeyD');
    fireKeyUp('KeyD');
    // Should not throw — release callback is null
    expect(pressCallback).toHaveBeenCalledWith('left');
    simpleHandler.stop();
  });

  it('hold sequence: keydown D → keyup D fires both callbacks', () => {
    fireKeyDown('KeyD');
    expect(pressCallback).toHaveBeenCalledWith('left');

    fireKeyUp('KeyD');
    expect(releaseCallback).toHaveBeenCalledWith('left');

    expect(pressCallback).toHaveBeenCalledTimes(1);
    expect(releaseCallback).toHaveBeenCalledTimes(1);
  });
});
