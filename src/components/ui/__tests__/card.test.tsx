import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRender } from '../../../__mocks__/test-utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../card';

describe('Card Components', () => {
  it('renders Card component', () => {
    customRender(<Card data-testid="card">Card Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
  });

  it('renders CardHeader component', () => {
    customRender(<CardHeader data-testid="card-header">Header</CardHeader>);
    const header = screen.getByTestId('card-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  it('renders CardTitle component', () => {
    customRender(<CardTitle data-testid="card-title">Title</CardTitle>);
    const title = screen.getByTestId('card-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-2xl', 'font-semibold');
  });

  it('renders CardTitle as div by default', () => {
    customRender(<CardTitle data-testid="card-title">Title</CardTitle>);
    const title = screen.getByTestId('card-title');
    expect(title.tagName).toBe('DIV');
  });

  it('renders CardTitle as h3 when specified', () => {
    customRender(
      <CardTitle as="h3" data-testid="card-title">
        Title
      </CardTitle>
    );
    const title = screen.getByTestId('card-title');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-2xl', 'font-semibold');
  });

  it('renders CardTitle as different heading levels', () => {
    const { rerender } = customRender(
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
    customRender(<CardDescription data-testid="card-description">Description</CardDescription>);
    const description = screen.getByTestId('card-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('renders CardContent component', () => {
    customRender(<CardContent data-testid="card-content">Content</CardContent>);
    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('renders CardFooter component', () => {
    customRender(<CardFooter data-testid="card-footer">Footer</CardFooter>);
    const footer = screen.getByTestId('card-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('applies custom className to Card', () => {
    customRender(
      <Card className="custom-card" data-testid="card">
        Card
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('custom-card');
  });

  it('applies custom className to CardHeader', () => {
    customRender(
      <CardHeader className="custom-header" data-testid="card-header">
        Header
      </CardHeader>
    );
    expect(screen.getByTestId('card-header')).toHaveClass('custom-header');
  });

  it('applies custom className to CardTitle', () => {
    customRender(
      <CardTitle className="custom-title" data-testid="card-title">
        Title
      </CardTitle>
    );
    expect(screen.getByTestId('card-title')).toHaveClass('custom-title');
  });

  it('applies custom className to CardDescription', () => {
    customRender(
      <CardDescription className="custom-description" data-testid="card-description">
        Description
      </CardDescription>
    );
    expect(screen.getByTestId('card-description')).toHaveClass('custom-description');
  });

  it('applies custom className to CardContent', () => {
    customRender(
      <CardContent className="custom-content" data-testid="card-content">
        Content
      </CardContent>
    );
    expect(screen.getByTestId('card-content')).toHaveClass('custom-content');
  });

  it('applies custom className to CardFooter', () => {
    customRender(
      <CardFooter className="custom-footer" data-testid="card-footer">
        Footer
      </CardFooter>
    );
    expect(screen.getByTestId('card-footer')).toHaveClass('custom-footer');
  });

  it('forwards ref to Card', () => {
    const ref = { current: null as HTMLDivElement | null };
    customRender(
      <Card ref={ref} data-testid="card">
        Card
      </Card>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to CardFooter', () => {
    const ref = { current: null as HTMLDivElement | null };
    customRender(
      <CardFooter ref={ref} data-testid="card-footer">
        Footer
      </CardFooter>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders complete card with all subcomponents', () => {
    customRender(
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
