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
