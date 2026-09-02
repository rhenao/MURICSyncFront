import { Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import useAuth from '../hooks/useAuth';

interface RequirePermissionProps {
  requiredPermissions: string[];
  children: ReactElement;
}

const RequirePermission = ({ requiredPermissions, children }: RequirePermissionProps) => {
  const { hasAnyPermission } = useAuth();

  if (!hasAnyPermission(requiredPermissions)) {
    return <Navigate to="/app/forbidden" replace />;
  }

  return children;
};

export default RequirePermission;
