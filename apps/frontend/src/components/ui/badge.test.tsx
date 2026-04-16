import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders with text content', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('renders with secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(container.firstChild).toHaveClass('bg-secondary');
  });

  it('renders with destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });

  it('renders with outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild).toHaveClass('text-foreground');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Badge</Badge>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
