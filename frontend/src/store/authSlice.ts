import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearAuthToken } from "@/lib/auth-token";

const USER_INFO_KEY = "userInfo";

export type UserInfo = {
  id: string | null;
  name: string | null;
  email: string | null;
  isAdmin: boolean | null;
};

export type AuthState = {
  userInfo: UserInfo;
};

const emptyUserInfo: UserInfo = {
  id: null,
  name: null,
  email: null,
  isAdmin: null,
};

function getInitialAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { userInfo: { ...emptyUserInfo } };
  }

  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    if (!raw) return { userInfo: { ...emptyUserInfo } };

    const parsed = JSON.parse(raw) as Partial<UserInfo>;
    if (parsed && typeof parsed.email === "string") {
      return {
        userInfo: {
          id: parsed.id ?? null,
          name: parsed.name ?? null,
          email: parsed.email,
          isAdmin: parsed.isAdmin ?? false,
        },
      };
    }
  } catch {
    // ignore invalid stored data
  }

  return { userInfo: { ...emptyUserInfo } };
}

const initialState: AuthState = getInitialAuthState();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<UserInfo & { email: string }>) => {
      // Id w localStorage może być obecny, jeśli został tam ustawiony (np. po pobraniu user info).
      // Jeżeli action.payload ma id: null, to przypisz obecny id z localStorage (jeśli istnieje).
      let currentId = null;
      try {
        const raw = localStorage.getItem(USER_INFO_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          currentId = parsed.id ?? null;
        }
      } catch {
        // ignore errors
      }

      state.userInfo = {
        ...action.payload,
        id:
          action.payload.id !== null && action.payload.id !== undefined
            ? action.payload.id
            : currentId,
      };
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.userInfo = { ...emptyUserInfo };
      localStorage.removeItem(USER_INFO_KEY);
      clearAuthToken();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
