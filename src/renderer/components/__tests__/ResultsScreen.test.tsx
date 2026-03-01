import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsScreen } from '../ResultsScreen';

describe('ResultsScreen', () => {
  const defaultProps = {
    accuracy: 85.5,
    maxCombo: 12,
    perfectHits: 8,
    totalNotes: 15,
    levelId: 'test-level-01',
    levelTitle: 'Test Song',
    previousBest: 80.0,
    isNewBest: true,
    onReplay: vi.fn(),
    onBack: vi.fn(),
  };

  it('displays accuracy percentage', () => {
    render(<ResultsScreen {...defaultProps} />);
    expect(screen.getByText('85.5%')).toBeTruthy();
  });

  it('displays "New best!" when isNewBest is true', () => {
    render(<ResultsScreen {...defaultProps} isNewBest={true} />);
    expect(screen.getByTestId('label-new-best')).toBeTruthy();
  });

  it('displays previous best when isNewBest is false', () => {
    render(<ResultsScreen {...defaultProps} isNewBest={false} />);
    expect(screen.getByTestId('label-previous-best')).toBeTruthy();
    expect(screen.getByTestId('label-previous-best').textContent).toContain('80.0%');
  });

  it('displays stats (combo, perfect hits, total notes)', () => {
    render(<ResultsScreen {...defaultProps} />);
    expect(screen.getByText('12x')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
  });

  it('displays level title', () => {
    render(<ResultsScreen {...defaultProps} />);
    expect(screen.getByText('Test Song')).toBeTruthy();
  });

  // Practice mode tests
  it('displays "PRACTICE MODE" label when isPracticeMode is true', () => {
    render(<ResultsScreen {...defaultProps} isPracticeMode={true} />);
    expect(screen.getByTestId('label-practice-mode')).toBeTruthy();
    expect(screen.getByTestId('label-practice-mode').textContent).toBe('PRACTICE MODE');
  });

  it('hides best score section when isPracticeMode is true', () => {
    render(<ResultsScreen {...defaultProps} isPracticeMode={true} isNewBest={true} />);
    expect(screen.queryByTestId('label-new-best')).toBeNull();
    expect(screen.queryByTestId('label-previous-best')).toBeNull();
  });

  it('still displays stats in practice mode', () => {
    render(<ResultsScreen {...defaultProps} isPracticeMode={true} />);
    expect(screen.getByText('12x')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
  });

  it('normal display when isPracticeMode is false', () => {
    render(<ResultsScreen {...defaultProps} isPracticeMode={false} isNewBest={true} />);
    expect(screen.queryByTestId('label-practice-mode')).toBeNull();
    expect(screen.getByTestId('label-new-best')).toBeTruthy();
  });
});
