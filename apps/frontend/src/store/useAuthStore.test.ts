import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import type { UserData } from './useAuthStore';

const mockUser: UserData = {
  id: 1,
  uuid: 'test-uuid',
  fullName: 'Test User',
  email: 'test@trinity.co.id',
  role: 'SUPERADMIN',
  division: { id: 1, name: 'IT', code: 'IT' },
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setAuth stores user and tokens', () => {
    useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('access-123');
    expect(state.refreshToken).toBe('refresh-456');
  });

  it('updateUser partially updates user data', () => {
    useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');
    useAuthStore.getState().updateUser({ fullName: 'Updated Name' });

    const state = useAuthStore.getState();
    expect(state.user?.fullName).toBe('Updated Name');
    expect(state.user?.email).toBe('test@trinity.co.id');
  });

  it('setTokens updates tokens without affecting user', () => {
    useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');
    useAuthStore.getState().setTokens('new-access', 'new-refresh');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-access');
    expect(state.refreshToken).toBe('new-refresh');
    expect(state.user).toEqual(mockUser);
  });

  it('logout clears all state', () => {
    useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});
