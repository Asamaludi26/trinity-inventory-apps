import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders with known status and default label', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('Menunggu')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<StatusBadge status="PENDING" label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('renders unknown status as raw value', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
  });

  it('renders COMPLETED status correctly', () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText('Selesai')).toBeInTheDocument();
  });

  it('renders IN_STORAGE status correctly', () => {
    render(<StatusBadge status="IN_STORAGE" />);
    expect(screen.getByText('Di Gudang')).toBeInTheDocument();
  });

  it('renders REJECTED status correctly', () => {
    render(<StatusBadge status="REJECTED" />);
    expect(screen.getByText('Ditolak')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBadge status="PENDING" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
