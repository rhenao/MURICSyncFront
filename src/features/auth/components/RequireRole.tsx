import { Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import useAuth from '../hooks/useAuth';

interface RequireRoleProps {
  allowedRoles: string[];
  children: ReactElement;
}

const RequireRole = ({ allowedRoles, children }: RequireRoleProps) => {
  const { user } = useAuth();
  const hasRole = allowedRoles.some(role => user?.roles?.includes(role));

  if (!hasRole) {
    return <Navigate to="/app/forbidden" replace />;
  }

  return children;
};

export default RequireRole;
