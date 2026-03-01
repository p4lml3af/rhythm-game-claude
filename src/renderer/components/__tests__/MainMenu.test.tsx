import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainMenu } from '../MainMenu';

describe('MainMenu', () => {
  const defaultProps = {
    onPlay: vi.fn(),
    onSettings: vi.fn(),
    onEditor: vi.fn(),
  };

  it('renders Play, Settings, and Editor buttons', () => {
    render(<MainMenu {...defaultProps} />);
    expect(screen.getByTestId('button-play')).toBeTruthy();
    expect(screen.getByTestId('button-settings-menu')).toBeTruthy();
    expect(screen.getByTestId('button-editor')).toBeTruthy();
  });

  it('renders the game title', () => {
    render(<MainMenu {...defaultProps} />);
    expect(screen.getByText('Beat Trainer')).toBeTruthy();
  });

  it('calls onPlay when Play button clicked', () => {
    const onPlay = vi.fn();
    render(<MainMenu {...defaultProps} onPlay={onPlay} />);
    fireEvent.click(screen.getByTestId('button-play'));
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('calls onSettings when Settings button clicked', () => {
    const onSettings = vi.fn();
    render(<MainMenu {...defaultProps} onSettings={onSettings} />);
    fireEvent.click(screen.getByTestId('button-settings-menu'));
    expect(onSettings).toHaveBeenCalledOnce();
  });

  it('calls onEditor when Editor button clicked', () => {
    const onEditor = vi.fn();
    render(<MainMenu {...defaultProps} onEditor={onEditor} />);
    fireEvent.click(screen.getByTestId('button-editor'));
    expect(onEditor).toHaveBeenCalledOnce();
  });

  it('supports keyboard navigation with Enter to select', () => {
    const onPlay = vi.fn();
    render(<MainMenu {...defaultProps} onPlay={onPlay} />);
    const container = screen.getByTestId('screen-menu');
    fireEvent.keyDown(container, { key: 'Enter' });
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('supports arrow key navigation', () => {
    const onSettings = vi.fn();
    render(<MainMenu {...defaultProps} onSettings={onSettings} />);
    const container = screen.getByTestId('screen-menu');
    // Move down to Settings, then press Enter
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    fireEvent.keyDown(container, { key: 'Enter' });
    expect(onSettings).toHaveBeenCalledOnce();
  });
});
