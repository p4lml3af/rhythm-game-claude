import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioManager } from '../audioManager';

// Mock Web Audio API
const mockGainValue = { value: 1.0 };
const mockGainNode = {
  connect: vi.fn(),
  gain: mockGainValue,
};
const mockAudioContext = {
  createGain: vi.fn(() => mockGainNode),
  createBufferSource: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    buffer: null,
    onended: null,
  })),
  decodeAudioData: vi.fn(() => Promise.resolve({ duration: 10 })),
  destination: {},
  currentTime: 0,
};

class MockAudioContext {
  createGain = mockAudioContext.createGain;
  createBufferSource = mockAudioContext.createBufferSource;
  decodeAudioData = mockAudioContext.decodeAudioData;
  destination = mockAudioContext.destination;
  currentTime = mockAudioContext.currentTime;
}
vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) })
));

describe('AudioManager — volume', () => {
  let manager: AudioManager;

  beforeEach(async () => {
    mockGainValue.value = 1.0;
    manager = new AudioManager();
    await manager.loadAudio('/test.mp3');
  });

  it('creates GainNode on loadAudio', () => {
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
  });

  it('setVolume(100) sets gain to 1.0', () => {
    manager.setVolume(100);
    expect(mockGainValue.value).toBe(1.0);
  });

  it('setVolume(50) sets gain to 0.5', () => {
    manager.setVolume(50);
    expect(mockGainValue.value).toBe(0.5);
  });

  it('setVolume(0) sets gain to 0.0', () => {
    manager.setVolume(0);
    expect(mockGainValue.value).toBe(0.0);
  });

  it('setVolume(75) sets gain to 0.75', () => {
    manager.setVolume(75);
    expect(mockGainValue.value).toBe(0.75);
  });
});
