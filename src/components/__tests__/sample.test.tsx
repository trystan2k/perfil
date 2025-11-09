import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Simple test component
function TestButton() {
  return <button type="button">Click me</button>;
}

describe('Sample React Component Test', () => {
  it('renders a button', () => {
    render(<TestButton />);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
