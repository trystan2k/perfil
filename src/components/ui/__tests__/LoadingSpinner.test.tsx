import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('Basic Rendering', () => {
    it('should render spinner with default props', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should render with custom text', () => {
      const text = 'Loading game...';
      render(<LoadingSpinner text={text} />);

      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('should apply size classes correctly', () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector('[role="status"]');

      expect(spinner).toHaveClass('size-16');
      expect(spinner).toHaveClass('border-4');
    });

    it('should support sm size', () => {
      const { container } = render(<LoadingSpinner size="sm" />);
      const spinner = container.querySelector('[role="status"]');

      expect(spinner).toHaveClass('size-6');
      expect(spinner).toHaveClass('border-2');
    });

    it('should support md size (default)', () => {
      const { container } = render(<LoadingSpinner size="md" />);
      const spinner = container.querySelector('[role="status"]');

      expect(spinner).toHaveClass('size-10');
      expect(spinner).toHaveClass('border-3');
    });

    it('should support lg size', () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector('[role="status"]');

      expect(spinner).toHaveClass('size-16');
      expect(spinner).toHaveClass('border-4');
    });
  });

  describe('Full Page Mode', () => {
    it('should render as full page overlay when fullPage is true', () => {
      const { container } = render(<LoadingSpinner fullPage />);

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('z-50');
      expect(overlay).toHaveClass('bg-background/80');
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    it('should not render as full page overlay when fullPage is false', () => {
      const { container } = render(<LoadingSpinner fullPage={false} />);

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).not.toBeInTheDocument();
    });

    it('should render with min-h-screen when fullPage is true', () => {
      const { container } = render(<LoadingSpinner fullPage />);

      const contentWrapper = container.querySelector('.flex.flex-col.items-center');
      expect(contentWrapper).toHaveClass('min-h-screen');
    });
  });

  describe('Text Display', () => {
    it('should not render text element when text prop is not provided', () => {
      render(<LoadingSpinner />);

      // Should not have any paragraph elements
      const paragraphs = screen.queryAllByRole('paragraph', { hidden: true });
      expect(paragraphs).toHaveLength(0);
    });

    it('should render text with correct styling', () => {
      render(<LoadingSpinner text="Please wait..." />);

      const textElement = screen.getByText('Please wait...');
      expect(textElement).toHaveClass('text-sm');
      expect(textElement).toHaveClass('text-muted-foreground');
    });

    it('should support long text', () => {
      const longText =
        'Loading your game session. This may take a moment depending on your connection speed.';
      render(<LoadingSpinner text={longText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    describe('Accessibility', () => {
      it('should have proper ARIA attributes', () => {
        render(<LoadingSpinner />);

        const spinner = screen.getByRole('status');
        expect(spinner).toHaveAttribute('aria-label');
      });

      it('should be marked as status region for screen readers', () => {
        render(<LoadingSpinner />);

        const spinner = screen.getByRole('status');
        expect(spinner).toBeInTheDocument();
      });

      it('should support custom className', () => {
        const { container } = render(<LoadingSpinner className="custom-class" />);

        expect(container.firstChild).toHaveClass('custom-class');
      });
    });

    describe('Styling', () => {
      it('should apply spinner animation class', () => {
        const { container } = render(<LoadingSpinner />);

        const spinner = container.querySelector('[role="status"]');
        expect(spinner).toHaveClass('animate-spin');
        expect(spinner).toHaveClass('rounded-full');
      });

      it('should have border styling', () => {
        const { container } = render(<LoadingSpinner />);

        const spinner = container.querySelector('[role="status"]');
        expect(spinner).toHaveClass('border-primary');
        expect(spinner).toHaveClass('border-t-transparent');
      });

      it('should center content properly', () => {
        const { container } = render(<LoadingSpinner />);

        const wrapper = container.querySelector('.flex.flex-col');
        expect(wrapper).toHaveClass('items-center');
        expect(wrapper).toHaveClass('justify-center');
      });
    });

    describe('Props and HTML Attributes', () => {
      it('should accept and apply standard HTML div props', () => {
        const { container } = render(
          <LoadingSpinner data-testid="custom-spinner" id="spinner-1" />
        );

        const element = container.querySelector('[data-testid="custom-spinner"]');
        expect(element).toBeInTheDocument();
        expect(element).toHaveAttribute('id', 'spinner-1');
      });

      it('should merge custom className with default classes', () => {
        const { container } = render(<LoadingSpinner fullPage className="my-custom-class" />);

        const overlay = container.querySelector('.fixed');
        expect(overlay).toHaveClass('my-custom-class');
        expect(overlay).toHaveClass('fixed');
        expect(overlay).toHaveClass('inset-0');
      });
    });

    describe('Combinations', () => {
      it('should work with size and text together', () => {
        const { container } = render(<LoadingSpinner size="lg" text="Loading game data..." />);

        const spinner = container.querySelector('[role="status"]');
        expect(spinner).toHaveClass('size-16');

        expect(screen.getByText('Loading game data...')).toBeInTheDocument();
      });

      it('should work with fullPage, size, and text together', () => {
        const { container } = render(<LoadingSpinner fullPage size="md" text="Please wait..." />);

        const overlay = container.querySelector('.fixed.inset-0');
        expect(overlay).toBeInTheDocument();

        const spinner = container.querySelector('[role="status"]');
        expect(spinner).toHaveClass('size-10');

        expect(screen.getByText('Please wait...')).toBeInTheDocument();
      });

      it('should support all props together', () => {
        const { container } = render(
          <LoadingSpinner
            fullPage
            size="sm"
            text="Loading..."
            className="custom-overlay"
            data-testid="full-spinner"
          />
        );

        const overlay = container.querySelector('[data-testid="full-spinner"]');
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveClass('custom-overlay');
        expect(overlay).toHaveClass('fixed');

        const spinner = container.querySelector('[role="status"]');
        expect(spinner).toHaveClass('size-6');

        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });
});
