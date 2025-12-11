import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('should render as a div element', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild;

    expect(skeleton?.nodeName).toBe('DIV');
  });

  it('should have animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.className).toContain('animate-pulse');
  });

  it('should have bg-muted class', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.className).toContain('bg-muted');
  });

  it('should have rounded-md class', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.className).toContain('rounded-md');
  });

  it('should accept custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.className).toContain('h-10');
    expect(skeleton.className).toContain('w-full');
  });

  it('should forward ref correctly', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Skeleton ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should accept HTML attributes', () => {
    const { container } = render(<Skeleton data-testid="test-skeleton" />);
    const skeleton = container.querySelector('[data-testid="test-skeleton"]');

    expect(skeleton).toBeInTheDocument();
  });

  it('should combine multiple classNames correctly', () => {
    const { container } = render(<Skeleton className="h-20 w-32 mb-4" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.className).toContain('animate-pulse');
    expect(skeleton.className).toContain('bg-muted');
    expect(skeleton.className).toContain('h-20');
    expect(skeleton.className).toContain('w-32');
    expect(skeleton.className).toContain('mb-4');
  });
});
