import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../card';

describe('Card Components', () => {
  it('renders Card component', () => {
    render(<Card data-testid="card">Card Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
  });

  it('renders CardHeader component', () => {
    render(<CardHeader data-testid="card-header">Header</CardHeader>);
    const header = screen.getByTestId('card-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  it('renders CardTitle component', () => {
    render(<CardTitle data-testid="card-title">Title</CardTitle>);
    const title = screen.getByTestId('card-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-2xl', 'font-semibold');
  });

  it('renders CardTitle as div by default', () => {
    render(<CardTitle data-testid="card-title">Title</CardTitle>);
    const title = screen.getByTestId('card-title');
    expect(title.tagName).toBe('DIV');
  });

  it('renders CardTitle as h3 when specified', () => {
    render(
      <CardTitle as="h3" data-testid="card-title">
        Title
      </CardTitle>
    );
    const title = screen.getByTestId('card-title');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-2xl', 'font-semibold');
  });

  it('renders CardTitle as different heading levels', () => {
    const { rerender } = render(
      <CardTitle as="h1" data-testid="card-title">
        Title
      </CardTitle>
    );
    expect(screen.getByTestId('card-title').tagName).toBe('H1');

    rerender(
      <CardTitle as="h2" data-testid="card-title">
        Title
      </CardTitle>
    );
    expect(screen.getByTestId('card-title').tagName).toBe('H2');

    rerender(
      <CardTitle as="h4" data-testid="card-title">
        Title
      </CardTitle>
    );
    expect(screen.getByTestId('card-title').tagName).toBe('H4');
  });

  it('renders CardDescription component', () => {
    render(<CardDescription data-testid="card-description">Description</CardDescription>);
    const description = screen.getByTestId('card-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('renders CardContent component', () => {
    render(<CardContent data-testid="card-content">Content</CardContent>);
    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('renders CardFooter component', () => {
    render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
    const footer = screen.getByTestId('card-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('applies custom className to Card', () => {
    render(
      <Card className="custom-card" data-testid="card">
        Card
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('custom-card');
  });

  it('applies custom className to CardHeader', () => {
    render(
      <CardHeader className="custom-header" data-testid="card-header">
        Header
      </CardHeader>
    );
    expect(screen.getByTestId('card-header')).toHaveClass('custom-header');
  });

  it('applies custom className to CardTitle', () => {
    render(
      <CardTitle className="custom-title" data-testid="card-title">
        Title
      </CardTitle>
    );
    expect(screen.getByTestId('card-title')).toHaveClass('custom-title');
  });

  it('applies custom className to CardDescription', () => {
    render(
      <CardDescription className="custom-description" data-testid="card-description">
        Description
      </CardDescription>
    );
    expect(screen.getByTestId('card-description')).toHaveClass('custom-description');
  });

  it('applies custom className to CardContent', () => {
    render(
      <CardContent className="custom-content" data-testid="card-content">
        Content
      </CardContent>
    );
    expect(screen.getByTestId('card-content')).toHaveClass('custom-content');
  });

  it('applies custom className to CardFooter', () => {
    render(
      <CardFooter className="custom-footer" data-testid="card-footer">
        Footer
      </CardFooter>
    );
    expect(screen.getByTestId('card-footer')).toHaveClass('custom-footer');
  });

  it('forwards ref to Card', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Card ref={ref} data-testid="card">
        Card
      </Card>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to CardFooter', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <CardFooter ref={ref} data-testid="card-footer">
        Footer
      </CardFooter>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders complete card with all subcomponents', () => {
    render(
      <Card data-testid="complete-card">
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>This is a complete card</CardDescription>
        </CardHeader>
        <CardContent>Card content goes here</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );

    expect(screen.getByTestId('complete-card')).toBeInTheDocument();
    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(screen.getByText('This is a complete card')).toBeInTheDocument();
    expect(screen.getByText('Card content goes here')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
