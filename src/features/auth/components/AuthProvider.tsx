import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import AuthService, {
  type LoginRequest,
} from "../../security/services/AuthService";
import type AuthResponseDto from "../../security/models/AuthResponseDto";
import type { UserInfoDto } from "../../security/models/UserInfoDto";

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: UserInfoDto | null;
  initializing: boolean;
  authLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponseDto>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserInfoDto | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    AuthService.isAuthenticated()
  );
  const [initializing, setInitializing] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      setUser(AuthService.getUser());
      setIsAuthenticated(true);
    }
    setInitializing(false);
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<AuthResponseDto> => {
      setAuthLoading(true);
      try {
        const response = await AuthService.login(credentials);
        if (response.success) {
          setIsAuthenticated(true);
          setUser(response.user ?? AuthService.getUser());
        }
        return response;
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      initializing,
      authLoading,
      login,
      logout,
    }),
    [authLoading, initializing, isAuthenticated, login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
