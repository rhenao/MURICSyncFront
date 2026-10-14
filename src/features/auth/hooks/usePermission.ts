import useAuth from './useAuth';

export function usePermission() {
  const { hasPermission, hasAnyPermission } = useAuth();

  const hasAllPermissions = (codes: string[]): boolean =>
    codes.every((code) => hasPermission(code));

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
