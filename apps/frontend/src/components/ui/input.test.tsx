import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('renders text input by default', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with specified type', () => {
    render(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');
  });

  it('renders disabled state', () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('accepts user input', () => {
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here');
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(input).toHaveValue('Hello');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" placeholder="Custom" />);
    expect(screen.getByPlaceholderText('Custom')).toHaveClass('custom-input');
  });

  it('renders with value', () => {
    render(<Input defaultValue="preset value" />);
    expect(screen.getByDisplayValue('preset value')).toBeInTheDocument();
  });
});
