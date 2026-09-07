import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'user' | 'vendor';

interface AuthState {
  activeRole: UserRole;
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  activeRole: 'user', // Default to Customer (User) dashboard
  token: null,
  user: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRole: (state, action: PayloadAction<UserRole>) => {
      state.activeRole = action.payload;
    },
    toggleRole: (state) => {
      state.activeRole = state.activeRole === 'user' ? 'vendor' : 'user';
    },
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: { id: string; name: string; email: string } }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setRole, toggleRole, setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
