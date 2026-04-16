import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    onConfirm: vi.fn(),
  };

  it('renders title when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<ConfirmDialog {...defaultProps} description="Are you sure?" />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders default confirm and cancel labels', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Konfirmasi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument();
  });

  it('renders custom confirm and cancel labels', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Yes, delete" cancelLabel="No, keep" />);
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, keep' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi' }));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading text when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading />);
    expect(screen.getByRole('button', { name: 'Memproses...' })).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading />);
    expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled();
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });
});
