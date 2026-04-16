import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No data" description="Try adding some items" />);
    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="No data" />);
    expect(screen.queryByText('Try adding some items')).not.toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(<EmptyState title="No data" action={<button>Add Item</button>} />);
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(<EmptyState title="No data" icon={<span data-testid="custom-icon">Icon</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders default icon when not provided', () => {
    const { container } = render(<EmptyState title="No data" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="No data" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
