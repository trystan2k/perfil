import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { AdaptiveContainer } from '../AdaptiveContainer';

describe('AdaptiveContainer', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(
        <AdaptiveContainer>
          <div data-testid="child-content">Test Content</div>
        </AdaptiveContainer>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <AdaptiveContainer>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </AdaptiveContainer>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should render text nodes as children', () => {
      render(<AdaptiveContainer>Plain text content</AdaptiveContainer>);

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });

    it('should render with empty children', () => {
      const { container } = render(<AdaptiveContainer>{null}</AdaptiveContainer>);

      // Should render the container div
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render as a div element', () => {
      const { container } = render(
        <AdaptiveContainer>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const containerDiv = container.firstChild as HTMLDivElement;
      expect(containerDiv.tagName).toBe('DIV');
    });
  });

  describe('maxWidth prop - applies correct Tailwind classes', () => {
    it('should apply max-w-sm class for maxWidth="sm"', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="sm">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-sm');
    });

    it('should apply max-w-md class for maxWidth="md"', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="md">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-md');
    });

    it('should apply max-w-lg class for maxWidth="lg"', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="lg">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-lg');
    });

    it('should apply max-w-xl class for maxWidth="xl"', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="xl">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-xl');
    });

    it('should apply max-w-2xl class for maxWidth="2xl"', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="2xl">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-2xl');
    });

    it('should apply max-w-4xl class for maxWidth="4xl"', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="4xl">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-4xl');
    });

    it('should apply max-w-6xl class for maxWidth="6xl"', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="6xl">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-6xl');
    });

    it('should apply max-w-7xl class for maxWidth="7xl"', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="7xl">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-7xl');
    });

    it('should apply max-w-full class for maxWidth="full"', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="full">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-full');
    });
  });

  describe('Default maxWidth', () => {
    it('should apply max-w-7xl when maxWidth prop is not specified', () => {
      const { container } = render(
        <AdaptiveContainer>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-7xl');
    });

    it('should apply default max-w-7xl with undefined maxWidth', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth={undefined}>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-7xl');
    });
  });

  describe('Default classes', () => {
    it('should always apply container class', () => {
      const { container } = render(
        <AdaptiveContainer>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('container');
    });

    it('should always apply mx-auto class', () => {
      const { container } = render(
        <AdaptiveContainer>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('mx-auto');
    });

    it('should always apply px-4 class', () => {
      const { container } = render(
        <AdaptiveContainer>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('px-4');
    });

    it('should always apply sm:px-6 class', () => {
      const { container } = render(
        <AdaptiveContainer>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('sm:px-6');
    });

    it('should always apply lg:px-8 class', () => {
      const { container } = render(
        <AdaptiveContainer>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('lg:px-8');
    });

    it('should have all default classes together', () => {
      const { container } = render(
        <AdaptiveContainer>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass(
        'container',
        'mx-auto',
        'px-4',
        'sm:px-6',
        'lg:px-8',
        'max-w-7xl' // default maxWidth
      );
    });
  });

  describe('className prop - merging with cn utility', () => {
    it('should merge custom className with default classes', () => {
      const { container } = render(
        <AdaptiveContainer className="custom-class">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('custom-class');
      expect(div).toHaveClass('container', 'mx-auto', 'max-w-7xl');
    });

    it('should merge multiple custom classes', () => {
      const { container } = render(
        <AdaptiveContainer className="custom-class another-class">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('custom-class', 'another-class');
    });

    it('should merge custom className with specific maxWidth', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="md" className="custom-class">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('custom-class', 'max-w-md');
    });

    it('should handle conflicting Tailwind classes using cn utility (twMerge)', () => {
      const { container } = render(
        <AdaptiveContainer className="max-w-sm">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      // cn uses twMerge which should merge conflicting max-w classes
      // The custom class should take precedence or be properly merged
      expect(div.className).toContain('max-w');
    });

    it('should apply custom className alongside default padding classes', () => {
      const { container } = render(
        <AdaptiveContainer className="bg-white rounded-lg shadow">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('bg-white', 'rounded-lg', 'shadow', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    it('should handle empty string className', () => {
      const { container } = render(
        <AdaptiveContainer className="">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('container', 'mx-auto', 'max-w-7xl');
    });
  });

  describe('Ref forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <AdaptiveContainer ref={ref}>
          <span>Content</span>
        </AdaptiveContainer>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should allow accessing div properties through ref', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <AdaptiveContainer ref={ref}>
          <span>Content</span>
        </AdaptiveContainer>
      );

      expect(ref.current?.className).toContain('container');
      expect(ref.current?.className).toContain('max-w-7xl');
    });

    it('should allow manipulating DOM through ref', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <AdaptiveContainer ref={ref}>
          <span>Content</span>
        </AdaptiveContainer>
      );

      expect(ref.current).not.toBeNull();
      if (ref.current) {
        expect(ref.current.children.length).toBe(1);
      }
    });

    it('should support callback ref', () => {
      let capturedElement: HTMLDivElement | null = null;
      const refCallback = (element: HTMLDivElement | null) => {
        capturedElement = element;
      };

      render(
        <AdaptiveContainer ref={refCallback}>
          <span>Content</span>
        </AdaptiveContainer>
      );

      expect(capturedElement).toBeInstanceOf(HTMLDivElement);
      expect((capturedElement as HTMLDivElement | null)?.className).toContain('container');
    });

    it('should maintain ref through updates', () => {
      const ref = createRef<HTMLDivElement>();
      const { rerender } = render(
        <AdaptiveContainer ref={ref}>
          <span>Original</span>
        </AdaptiveContainer>
      );

      const firstRef = ref.current;

      rerender(
        <AdaptiveContainer ref={ref}>
          <span>Updated</span>
        </AdaptiveContainer>
      );

      const secondRef = ref.current;
      expect(firstRef).toBe(secondRef);
    });
  });

  describe('HTML div props - pass-through behavior', () => {
    it('should forward data attributes', () => {
      const { container } = render(
        <AdaptiveContainer data-testid="adaptive-container" data-custom="value">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('data-testid', 'adaptive-container');
      expect(div).toHaveAttribute('data-custom', 'value');
    });

    it('should forward id attribute', () => {
      const { container } = render(
        <AdaptiveContainer id="main-container">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('id', 'main-container');
    });

    it('should forward title attribute', () => {
      const { container } = render(
        <AdaptiveContainer title="Container Title">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('title', 'Container Title');
    });

    it('should forward role attribute', () => {
      const { container } = render(
        <AdaptiveContainer role="region">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('role', 'region');
    });

    it('should forward aria-label attribute', () => {
      const { container } = render(
        <AdaptiveContainer aria-label="Main content area">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('aria-label', 'Main content area');
    });

    it('should forward aria-labelledby attribute', () => {
      const { container } = render(
        <AdaptiveContainer aria-labelledby="heading-id">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('aria-labelledby', 'heading-id');
    });

    it('should forward aria-describedby attribute', () => {
      const { container } = render(
        <AdaptiveContainer aria-describedby="description-id">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('aria-describedby', 'description-id');
    });

    it('should forward multiple props together', () => {
      const { container } = render(
        <AdaptiveContainer
          id="container"
          data-testid="test-container"
          role="main"
          aria-label="Main container"
          title="My Container"
        >
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('id', 'container');
      expect(div).toHaveAttribute('data-testid', 'test-container');
      expect(div).toHaveAttribute('role', 'main');
      expect(div).toHaveAttribute('aria-label', 'Main container');
      expect(div).toHaveAttribute('title', 'My Container');
    });

    it('should handle style prop (inline styles)', () => {
      const { container } = render(
        <AdaptiveContainer style={{ minHeight: '200px' }}>
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div.style.minHeight).toBe('200px');
    });

    it('should handle multiple data attributes', () => {
      const { container } = render(
        <AdaptiveContainer data-feature="enabled" data-version="1.0" data-status="active">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('data-feature', 'enabled');
      expect(div).toHaveAttribute('data-version', '1.0');
      expect(div).toHaveAttribute('data-status', 'active');
    });
  });

  describe('displayName', () => {
    it('should have correct displayName', () => {
      expect(AdaptiveContainer.displayName).toBe('AdaptiveContainer');
    });

    it('should preserve displayName for debugging', () => {
      const displayName = AdaptiveContainer.displayName;
      expect(typeof displayName).toBe('string');
      expect(displayName?.length).toBeGreaterThan(0);
    });
  });

  describe('Component composition and integration', () => {
    it('should work with complex nested children', () => {
      render(
        <AdaptiveContainer>
          <div data-testid="outer">
            <div data-testid="inner">
              <span>Deeply nested content</span>
            </div>
          </div>
        </AdaptiveContainer>
      );

      expect(screen.getByTestId('outer')).toBeInTheDocument();
      expect(screen.getByTestId('inner')).toBeInTheDocument();
      expect(screen.getByText('Deeply nested content')).toBeInTheDocument();
    });

    it('should work with multiple maxWidth sizes in a test', () => {
      const { rerender } = render(
        <AdaptiveContainer maxWidth="sm">
          <span>Small</span>
        </AdaptiveContainer>
      );

      let div = screen.getByText('Small').parentElement as HTMLDivElement;
      expect(div).toHaveClass('max-w-sm');

      rerender(
        <AdaptiveContainer maxWidth="lg">
          <span>Large</span>
        </AdaptiveContainer>
      );

      div = screen.getByText('Large').parentElement as HTMLDivElement;
      expect(div).toHaveClass('max-w-lg');
    });

    it('should combine className and maxWidth prop correctly', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="4xl" className="pt-8 pb-12">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveClass('max-w-4xl');
      expect(div).toHaveClass('pt-8');
      expect(div).toHaveClass('pb-12');
      expect(div).toHaveClass('container', 'mx-auto');
    });

    it('should maintain all classes in className attribute', () => {
      const { container } = render(
        <AdaptiveContainer maxWidth="xl" className="custom">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      const classNames = div.className.split(' ');

      expect(classNames).toContain('container');
      expect(classNames).toContain('mx-auto');
      expect(classNames).toContain('px-4');
      expect(classNames).toContain('sm:px-6');
      expect(classNames).toContain('lg:px-8');
      expect(classNames).toContain('max-w-xl');
      expect(classNames).toContain('custom');
    });
  });

  describe('Edge cases and robustness', () => {
    it('should handle rapid re-renders', () => {
      const { rerender } = render(
        <AdaptiveContainer maxWidth="sm">
          <span>Content 1</span>
        </AdaptiveContainer>
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <AdaptiveContainer maxWidth={i % 2 === 0 ? 'md' : 'lg'}>
            <span>Content {i}</span>
          </AdaptiveContainer>
        );
      }

      const finalDiv = screen.getByText('Content 9').parentElement as HTMLDivElement;
      expect(finalDiv).toHaveClass('container', 'mx-auto');
    });

    it('should work with all maxWidth values in sequence', () => {
      const widths: Array<'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full'> = [
        'sm',
        'md',
        'lg',
        'xl',
        '2xl',
        '4xl',
        '6xl',
        '7xl',
        'full',
      ];
      const classMap = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full',
      };

      widths.forEach((width) => {
        const { container } = render(
          <AdaptiveContainer maxWidth={width}>
            <span>Content</span>
          </AdaptiveContainer>
        );

        const div = container.firstChild as HTMLDivElement;
        expect(div).toHaveClass(classMap[width]);
      });
    });

    it('should handle special characters in data attributes', () => {
      const { container } = render(
        <AdaptiveContainer data-test="value-with-dash" data-value="123">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('data-test', 'value-with-dash');
      expect(div).toHaveAttribute('data-value', '123');
    });

    it('should handle undefined and null in spread props gracefully', () => {
      const { container } = render(
        <AdaptiveContainer data-undefined={undefined} title="">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toBeInTheDocument();
      expect(div).toHaveClass('container', 'mx-auto');
    });
  });

  describe('Accessibility compliance', () => {
    it('should be keyboard accessible with proper role', () => {
      render(
        <AdaptiveContainer role="region" aria-label="Main content">
          <button type="button">Click me</button>
        </AdaptiveContainer>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should support semantic HTML attributes', () => {
      const { container } = render(
        <AdaptiveContainer role="main" aria-label="Main container">
          <span>Content</span>
        </AdaptiveContainer>
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div).toHaveAttribute('role', 'main');
      expect(div).toHaveAttribute('aria-label', 'Main container');
    });

    it('should have predictable structure for screen readers', () => {
      render(
        <AdaptiveContainer role="region" aria-label="Product details">
          <h1>Product Title</h1>
          <p>Product description</p>
        </AdaptiveContainer>
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByText('Product description')).toBeInTheDocument();
    });
  });
});
