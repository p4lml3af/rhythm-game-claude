import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioManager } from '../audioManager';

// Mock Web Audio API
const mockGainValue = { value: 1.0 };
const mockGainNode = {
  connect: vi.fn(),
  gain: mockGainValue,
};
const mockPlaybackRate = { value: 1.0 };
const mockSourceNode = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  buffer: null as unknown,
  onended: null as (() => void) | null,
  playbackRate: mockPlaybackRate,
};
const mockAudioContext = {
  createGain: vi.fn(() => mockGainNode),
  createBufferSource: vi.fn(() => ({ ...mockSourceNode, playbackRate: { value: 1.0 } })),
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

describe('AudioManager — playback rate', () => {
  let manager: AudioManager;

  beforeEach(async () => {
    mockAudioContext.currentTime = 0;
    mockAudioContext.createBufferSource.mockClear();
    manager = new AudioManager();
    await manager.loadAudio('/test.mp3');
  });

  it('defaults to playback rate 1.0', () => {
    expect(manager.getPlaybackRate()).toBe(1.0);
  });

  it('setPlaybackRate stores rate correctly', () => {
    manager.setPlaybackRate(0.75);
    expect(manager.getPlaybackRate()).toBe(0.75);
  });

  it('clamps playback rate to minimum 0.5', () => {
    manager.setPlaybackRate(0.3);
    expect(manager.getPlaybackRate()).toBe(0.5);
  });

  it('clamps playback rate to maximum 1.0', () => {
    manager.setPlaybackRate(1.5);
    expect(manager.getPlaybackRate()).toBe(1.0);
  });

  it('play() applies playback rate to source node', () => {
    manager.setPlaybackRate(0.75);
    const sourceNode = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), buffer: null, onended: null, playbackRate: { value: 1.0 } };
    mockAudioContext.createBufferSource.mockReturnValueOnce(sourceNode);
    manager.play();
    expect(sourceNode.playbackRate.value).toBe(0.75);
  });

  it('getCurrentTime returns scaled time at rate 0.5', () => {
    manager.setPlaybackRate(0.5);
    const sourceNode = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), buffer: null, onended: null, playbackRate: { value: 1.0 } };
    mockAudioContext.createBufferSource.mockReturnValueOnce(sourceNode);
    manager.play();
    // Simulate 10 real seconds elapsed
    (manager as any).audioContext.currentTime = 10;
    expect(manager.getCurrentTime()).toBe(5.0);
  });

  it('getCurrentTime at rate 1.0 returns unscaled time', () => {
    manager.setPlaybackRate(1.0);
    const sourceNode = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), buffer: null, onended: null, playbackRate: { value: 1.0 } };
    mockAudioContext.createBufferSource.mockReturnValueOnce(sourceNode);
    manager.play();
    (manager as any).audioContext.currentTime = 10;
    expect(manager.getCurrentTime()).toBe(10.0);
  });
});
