import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useThemeStore } from '../../stores/themeStore';
import { ThemeSwitcher } from '../ThemeSwitcher';

// Mock the store
vi.mock('../../stores/themeStore', () => ({
  useThemeStore: vi.fn(),
}));

describe('ThemeSwitcher', () => {
  let mockSetTheme: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetTheme = vi.fn();
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });
  });

  it('renders theme switcher with all theme options', () => {
    render(<ThemeSwitcher />);

    expect(screen.getByRole('navigation', { name: /theme switcher/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/switch to light theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch to dark theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch to system theme/i)).toBeInTheDocument();
  });

  it('marks current theme as active', () => {
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeSwitcher />);

    const darkButton = screen.getByLabelText(/switch to dark theme/i);
    expect(darkButton).toHaveAttribute('aria-current', 'page');
  });

  it('calls setTheme when clicking a theme button', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    const darkButton = screen.getByLabelText(/switch to dark theme/i);
    await user.click(darkButton);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('updates active state when theme changes', () => {
    const { rerender } = render(<ThemeSwitcher />);

    let darkButton = screen.getByLabelText(/switch to dark theme/i);
    expect(darkButton).not.toHaveAttribute('aria-current', 'page');

    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    rerender(<ThemeSwitcher />);

    darkButton = screen.getByLabelText(/switch to dark theme/i);
    expect(darkButton).toHaveAttribute('aria-current', 'page');
  });

  it('renders with accessible labels and icons', () => {
    render(<ThemeSwitcher />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });
  });
});
