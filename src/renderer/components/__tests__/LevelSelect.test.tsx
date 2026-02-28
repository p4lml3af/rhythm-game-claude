import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelSelect } from '../LevelSelect';
import type { LevelInfo } from '../../../shared/types';

// Mock scoreStore
vi.mock('../../stores/scoreStore', () => ({
  useScoreStore: () => ({
    getBestScore: (levelId: string) => {
      if (levelId === 'level-01') return 87.5;
      return null;
    },
  }),
}));

const testLevels: LevelInfo[] = [
  { id: 'level-01', songTitle: 'First Song', bpm: 120, duration: 30, noteCount: 10 },
  { id: 'level-02', songTitle: 'Second Song', bpm: 140, duration: 45, noteCount: 20 },
];

describe('LevelSelect', () => {
  const defaultProps = {
    levels: testLevels,
    onSelectLevel: vi.fn(),
    onBack: vi.fn(),
    onSettings: vi.fn(),
  };

  it('renders list of levels', () => {
    render(<LevelSelect {...defaultProps} />);
    expect(screen.getByTestId('level-row-level-01')).toBeTruthy();
    expect(screen.getByTestId('level-row-level-02')).toBeTruthy();
  });

  it('displays level name, BPM, and duration', () => {
    render(<LevelSelect {...defaultProps} />);
    expect(screen.getByText('First Song')).toBeTruthy();
    expect(screen.getByText('Second Song')).toBeTruthy();
    expect(screen.getByText(/120 BPM/)).toBeTruthy();
    expect(screen.getByText(/140 BPM/)).toBeTruthy();
    expect(screen.getByText(/0:30/)).toBeTruthy();
    expect(screen.getByText(/0:45/)).toBeTruthy();
  });

  it('displays "Not played" for levels with no best score', () => {
    render(<LevelSelect {...defaultProps} />);
    const best = screen.getByTestId('level-best-level-02');
    expect(best.textContent).toBe('Not played');
  });

  it('displays best accuracy for played levels', () => {
    render(<LevelSelect {...defaultProps} />);
    const best = screen.getByTestId('level-best-level-01');
    expect(best.textContent).toBe('87.5%');
  });

  it('calls onSelectLevel with correct levelId when level clicked', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelect {...defaultProps} onSelectLevel={onSelectLevel} />);
    fireEvent.click(screen.getByTestId('level-row-level-02'));
    expect(onSelectLevel).toHaveBeenCalledWith('level-02');
  });

  it('calls onBack when Back button clicked', () => {
    const onBack = vi.fn();
    render(<LevelSelect {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByTestId('button-back-to-menu'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('calls onBack on Escape key', () => {
    const onBack = vi.fn();
    render(<LevelSelect {...defaultProps} onBack={onBack} />);
    const container = screen.getByTestId('screen-level-select');
    fireEvent.keyDown(container, { key: 'Escape' });
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('supports keyboard selection with Enter', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelect {...defaultProps} onSelectLevel={onSelectLevel} />);
    const container = screen.getByTestId('screen-level-select');
    // First level is focused by default
    fireEvent.keyDown(container, { key: 'Enter' });
    expect(onSelectLevel).toHaveBeenCalledWith('level-01');
  });

  it('displays "No levels found" when levels array is empty', () => {
    render(<LevelSelect {...defaultProps} levels={[]} />);
    expect(screen.getByText('No levels found')).toBeTruthy();
  });
});
