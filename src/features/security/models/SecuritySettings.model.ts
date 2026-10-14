export interface SecuritySettingsDto {
  // Contraseña
  passwordRequireDigit: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireUppercase: boolean;
  passwordRequireNonAlphanumeric: boolean;
  passwordRequiredLength: number;
  passwordRequiredUniqueChars: number;

  // Bloqueo
  lockoutMaxFailedAttempts: number;
  lockoutDurationMinutes: number;
  lockoutAllowedForNewUsers: boolean;

  // Inicio de sesión
  signInRequireConfirmedEmail: boolean;
  signInRequireConfirmedPhone: boolean;

  // Auditoría
  updatedAt: string;
  updatedBy?: string;
}

export interface UpdateSecuritySettingsDto {
  passwordRequireDigit?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireUppercase?: boolean;
  passwordRequireNonAlphanumeric?: boolean;
  passwordRequiredLength?: number;
  passwordRequiredUniqueChars?: number;
  lockoutMaxFailedAttempts?: number;
  lockoutDurationMinutes?: number;
  lockoutAllowedForNewUsers?: boolean;
  signInRequireConfirmedEmail?: boolean;
  signInRequireConfirmedPhone?: boolean;
}
