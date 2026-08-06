import { PERMISSIONS, ROLES } from '@orange/core/models';
import { AuthSession } from '@orange/core/models';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    store = new AuthStore();
  });

  it('starts with an unknown session state', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.getSessionSnapshot()).toBeUndefined();
    expect(store.hasRole(ROLES.ADMIN)).toBe(false);
  });

  it('stores session user data and role membership', () => {
    const session = createAuthSession();

    store.setSession(session);

    expect(store.isAuthenticated()).toBe(true);
    expect(store.getSessionSnapshot()).toBe(session);
    expect(store.hasRole(ROLES.ADMIN)).toBe(true);
    expect(store.hasAnyRole([ROLES.CUSTOMER, ROLES.ADMIN])).toBe(true);
    expect(store.hasRole(ROLES.CUSTOMER)).toBe(false);
    expect(store.hasPermission(PERMISSIONS.PRODUCTS_CREATE)).toBe(true);
    expect(store.hasAllPermissions([PERMISSIONS.PRODUCTS_CREATE])).toBe(true);
  });

  it('emits user changes when session state changes', () => {
    const emissions = new Array<AuthSession['user'] | null>();
    const subscription = store.user$.subscribe((user) => {
      emissions.push(user);
    });
    const session = createAuthSession();

    store.setSession(session);
    store.clearSession();
    subscription.unsubscribe();

    expect(emissions).toEqual([null, session.user, null]);
  });

  it('clears session state', () => {
    store.setSession(createAuthSession());

    store.clearSession();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.getSessionSnapshot()).toBeNull();
    expect(store.hasRole(ROLES.ADMIN)).toBe(false);
  });
});

function createAuthSession(): AuthSession {
  return {
    user: {
      id: '52a0adc1-25d3-4cac-9154-48649ebe9d16',
      email: 'admin@example.com',
      fullName: 'Sample Admin',
      roles: [ROLES.ADMIN],
      permissions: [PERMISSIONS.PRODUCTS_CREATE],
    },
    session: {
      id: 'f48e7a9fc19d4a73b48d4e0720415073',
      createdAtUtc: '2026-06-12T21:37:26.126677+00:00',
      expiresAtUtc: '2026-06-12T23:37:26.126677+00:00',
    },
  };
}
