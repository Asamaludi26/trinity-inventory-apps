import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock stores
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      setAuth: vi.fn(),
      user: null,
      isAuthenticated: false,
    }),
}));

vi.mock('@/store/useUIStore', () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      toggleTheme: vi.fn(),
      theme: 'light',
    }),
}));

import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders login form with email and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<LoginPage />);

    expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument();
  });

  it('renders app title', () => {
    render(<LoginPage />);

    expect(screen.getByText('Trinity Inventory')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    render(<LoginPage />);

    expect(screen.getByRole('button', { name: 'Toggle tema' })).toBeInTheDocument();
  });

  it('renders password visibility toggle', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Tampilkan password')).toBeInTheDocument();
  });
});
