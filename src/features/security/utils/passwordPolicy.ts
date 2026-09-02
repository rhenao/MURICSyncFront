export const PASSWORD_MIN_LENGTH = 10;

export const PASSWORD_HELPER_TEXT = `Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con mayúscula, minúscula, número y carácter especial`;

export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una letra minúscula");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una letra mayúscula");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe incluir al menos un número");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("La contraseña debe incluir al menos un carácter especial");
  }

  return errors;
}
