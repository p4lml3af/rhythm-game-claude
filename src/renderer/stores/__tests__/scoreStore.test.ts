import { describe, it, expect, beforeEach } from 'vitest';
import { useScoreStore } from '../scoreStore';

describe('scoreStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useScoreStore.setState({ bestScores: {} });
  });

  it('setBestScore stores accuracy for new level', () => {
    useScoreStore.getState().setBestScore('level-1', 85.5);
    expect(useScoreStore.getState().bestScores['level-1']).toBe(85.5);
  });

  it('setBestScore updates if new score is higher', () => {
    useScoreStore.getState().setBestScore('level-1', 70);
    useScoreStore.getState().setBestScore('level-1', 90);
    expect(useScoreStore.getState().bestScores['level-1']).toBe(90);
  });

  it('setBestScore does NOT update if new score is lower', () => {
    useScoreStore.getState().setBestScore('level-1', 90);
    useScoreStore.getState().setBestScore('level-1', 70);
    expect(useScoreStore.getState().bestScores['level-1']).toBe(90);
  });

  it('setBestScore does NOT update if new score is equal', () => {
    useScoreStore.getState().setBestScore('level-1', 85);
    useScoreStore.getState().setBestScore('level-1', 85);
    expect(useScoreStore.getState().bestScores['level-1']).toBe(85);
  });

  it('getBestScore returns null for unplayed level', () => {
    expect(useScoreStore.getState().getBestScore('nonexistent')).toBeNull();
  });

  it('getBestScore returns stored value for played level', () => {
    useScoreStore.getState().setBestScore('level-1', 92.3);
    expect(useScoreStore.getState().getBestScore('level-1')).toBe(92.3);
  });

  it('loadScores hydrates store correctly', () => {
    useScoreStore.getState().loadScores({ 'level-1': 80, 'level-2': 95 });
    expect(useScoreStore.getState().getBestScore('level-1')).toBe(80);
    expect(useScoreStore.getState().getBestScore('level-2')).toBe(95);
  });

  it('multiple levels tracked independently', () => {
    useScoreStore.getState().setBestScore('level-1', 80);
    useScoreStore.getState().setBestScore('level-2', 95);
    useScoreStore.getState().setBestScore('level-1', 85);
    expect(useScoreStore.getState().getBestScore('level-1')).toBe(85);
    expect(useScoreStore.getState().getBestScore('level-2')).toBe(95);
  });
});
