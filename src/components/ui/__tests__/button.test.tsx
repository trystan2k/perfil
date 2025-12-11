import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRender } from '../../../__mocks__/test-utils';
import { Button } from '../button';

describe('Button', () => {
  it('renders as a button element by default', () => {
    customRender(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button.tagName).toBe('BUTTON');
  });

  it('renders with asChild prop using Slot component', () => {
    customRender(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies variant classes correctly', () => {
    const { rerender } = customRender(<Button variant="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toHaveClass('underline-offset-4');
  });

  it('applies size classes correctly', () => {
    const { rerender } = customRender(<Button size="default">Default Size</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-14');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12', 'w-12');
  });

  it('applies custom className', () => {
    customRender(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLButtonElement | null };
    customRender(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('passes through additional props', () => {
    customRender(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>
    );
    const button = screen.getByTestId('submit-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });

  describe('Loading State', () => {
    it('shows spinner when isLoading is true', () => {
      customRender(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeInTheDocument();
    });

    it('does not show spinner when isLoading is false', () => {
      customRender(<Button isLoading={false}>Normal</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).not.toBeInTheDocument();
    });

    it('disables button when isLoading is true', () => {
      customRender(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('button is enabled when isLoading is false', () => {
      customRender(<Button isLoading={false}>Click</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('sets aria-busy="true" when isLoading is true', () => {
      customRender(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('does not set aria-busy when isLoading is false', () => {
      customRender(<Button isLoading={false}>Normal</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-busy', 'true');
    });

    it('keeps text visible when loading', () => {
      customRender(<Button isLoading>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('spinner has animate-spin class', () => {
      customRender(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('spinner has correct size classes', () => {
      customRender(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).toHaveClass('h-4', 'w-4');
    });

    it('both loading and disabled props work together', () => {
      customRender(
        <Button isLoading disabled>
          Loading
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      const spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeInTheDocument();
    });

    it('transitions from loading to loaded state', () => {
      const { rerender } = customRender(<Button isLoading>Loading</Button>);
      let button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      let spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeInTheDocument();

      rerender(<Button isLoading={false}>Done</Button>);
      button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('aria-busy', 'true');
      spinner = button.querySelector('[class*="animate-spin"]');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Accessibility: Touch Target Sizes (WCAG 2.5.5 AAA)', () => {
    it('should have minimum 48px height for default size button', () => {
      customRender(<Button size="default">Default Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
      // h-12 = 48px (12 * 4px Tailwind unit)
    });

    it('should have minimum 44px height for small size button', () => {
      customRender(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
      // h-11 = 44px (11 * 4px Tailwind unit)
    });

    it('should have minimum 56px height for large size button', () => {
      customRender(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14');
      // h-14 = 56px (14 * 4px Tailwind unit)
    });

    it('should have minimum 48x48px for icon button', () => {
      customRender(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'w-12');
      // h-12 w-12 = 48x48px
    });

    it('should apply proper touch target sizing with padding for default buttons', () => {
      customRender(<Button size="default">Clickable</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-4', 'py-2');
      // Ensures adequate touch target with proper padding
    });

    it('should apply proper touch target sizing with padding for small buttons', () => {
      customRender(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'rounded-md', 'px-3');
      // Ensures adequate touch target for small variant
    });

    it('should apply proper touch target sizing with padding for large buttons', () => {
      customRender(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14', 'rounded-md', 'px-8');
      // Ensures adequate touch target for large variant
    });

    it('should maintain minimum touch target across all button variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

      for (const variant of variants) {
        const { unmount } = customRender(<Button variant={variant}>Test</Button>);
        const button = screen.getByRole('button');

        // All buttons should have at least h-12 (default size, 48px minimum)
        expect(button).toHaveClass('h-12');

        unmount();
      }
    });

    it('should have proper Tailwind classes for flexbox alignment in touch targets', () => {
      customRender(<Button>Aligned Button</Button>);
      const button = screen.getByRole('button');

      // Ensure flexbox classes for proper content alignment
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });
  });
});
