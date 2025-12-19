import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRender } from '../../__mocks__/test-utils.tsx';
import { Logo } from '../Logo.tsx';

describe('Logo', () => {
  it('should render the logo image with correct src and alt', () => {
    customRender(<Logo />);

    const logoImage = screen.getByRole('img', { name: /perfil logo/i });
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', '/favicon.png');
  });

  it('should render the text "Perfil" by default', () => {
    customRender(<Logo />);

    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('should not render the text when showText is false', () => {
    customRender(<Logo showText={false} />);

    expect(screen.queryByText('Perfil')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    customRender(<Logo className="custom-class" />);

    // The Logo component wrapper has the class
    // We can find it by the text or just check if the container has the class if we can identify it
    // Let's assume the root div gets the class.
    // Since we don't have a specific role for the div, we might need to rely on the container
    // or adding a data-testid to the Logo component if needed, but let's try to find it via the text's parent.

    // Alternatively, we can inspect the rendered output structure.
    // The simplest way without modifying code is often checking if the class exists in the rendered tree
    // but specific targeting is better.

    // Let's modify Logo.tsx to accept data-testid or just check the container's first child
    // However, I prefer not to modify source just for tests if possible.
    // The Logo text is "Perfil".
    const textElement = screen.getByText('Perfil');
    // The text is inside the div which should have the class.
    const container = textElement.closest('div');
    expect(container).toHaveClass('custom-class');
  });
});
