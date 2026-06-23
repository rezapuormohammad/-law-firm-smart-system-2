export const db = {};
export const auth = {};
export const googleProvider = {};

type User = { uid: string; email?: string | null };

// Mock auth state triggers
const triggerAuthStateChange = (user: any) => {
  if (user) {
    localStorage.setItem('mock_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('mock_user');
  }
  window.dispatchEvent(new CustomEvent('mock_auth_change', { detail: user }));
};

export const onAuthStateChanged = (auth: any, callback: (user: User | null) => void) => {
  const check = () => {
    const user = localStorage.getItem('mock_user');
    callback(user ? JSON.parse(user) : null);
  };
  check();
  window.addEventListener('mock_auth_change', check);
  return () => window.removeEventListener('mock_auth_change', check);
};

export const signOut = async (auth: any) => {
  localStorage.removeItem('mock_user');
  window.dispatchEvent(new CustomEvent('mock_auth_change', { detail: null }));
};

export const signInWithGoogle = async () => {
  const user = { uid: 'local_user', email: 'local@example.com' };
  triggerAuthStateChange(user);
  return user;
};

export const signInWithGoogleDrive = async () => {
  const user = { uid: 'drive_user' };
  triggerAuthStateChange(user);
  return { user, accessToken: 'fake_token' };
};

export const signInWithEmail = async (email: string, pass: string) => {
  const user = { uid: 'local_user', email };
  triggerAuthStateChange(user);
  return user;
};

export const signUpWithEmail = async (email: string, pass: string) => {
  const user = { uid: 'local_user', email };
  triggerAuthStateChange(user);
  return user;
};
