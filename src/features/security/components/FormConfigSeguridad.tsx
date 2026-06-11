import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AxiosError } from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  FormControlLabel,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SecuritySettingsService from "../services/SecuritySettingsService";
import type {
  SecuritySettingsDto,
  UpdateSecuritySettingsDto,
} from "../models/SecuritySettings.model";
import { usePermission } from "../../auth/hooks/usePermission";

interface FormState {
  passwordRequireDigit: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireUppercase: boolean;
  passwordRequireNonAlphanumeric: boolean;
  passwordRequiredLength: number;
  passwordRequiredUniqueChars: number;
  lockoutMaxFailedAttempts: number;
  lockoutDurationMinutes: number;
  lockoutAllowedForNewUsers: boolean;
  signInRequireConfirmedEmail: boolean;
  signInRequireConfirmedPhone: boolean;
}

function settingsToForm(s: SecuritySettingsDto): FormState {
  return {
    passwordRequireDigit: s.passwordRequireDigit,
    passwordRequireLowercase: s.passwordRequireLowercase,
    passwordRequireUppercase: s.passwordRequireUppercase,
    passwordRequireNonAlphanumeric: s.passwordRequireNonAlphanumeric,
    passwordRequiredLength: s.passwordRequiredLength,
    passwordRequiredUniqueChars: s.passwordRequiredUniqueChars,
    lockoutMaxFailedAttempts: s.lockoutMaxFailedAttempts,
    lockoutDurationMinutes: s.lockoutDurationMinutes,
    lockoutAllowedForNewUsers: s.lockoutAllowedForNewUsers,
    signInRequireConfirmedEmail: s.signInRequireConfirmedEmail,
    signInRequireConfirmedPhone: s.signInRequireConfirmedPhone,
  };
}

function buildDiff(original: FormState, current: FormState): UpdateSecuritySettingsDto {
  const dto: UpdateSecuritySettingsDto = {};
  (Object.keys(original) as (keyof FormState)[]).forEach((key) => {
    if (original[key] !== current[key]) {
      (dto as Record<string, unknown>)[key] = current[key];
    }
  });
  return dto;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.errors)) return (data.errors as string[]).join("; ");
  }
  return "Error al guardar la configuración.";
}

export default function FormConfigSeguridad() {
  const { hasPermission } = usePermission();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [audit, setAudit] = useState<{ updatedAt: string; updatedBy?: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    let cancelled = false;
    SecuritySettingsService.getSettings()
      .then((data) => {
        if (cancelled) return;
        const f = settingsToForm(data);
        setInitialForm(f);
        setForm(f);
        setAudit({ updatedAt: data.updatedAt, updatedBy: data.updatedBy });
      })
      .catch(() => {
        if (!cancelled) setLoadError("No se pudo cargar la configuración de seguridad.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hasPermission("seguridad.manage")) {
    return <Navigate to="/app" replace />;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  if (!form || !initialForm) return null;

  const setField = (key: keyof FormState, value: boolean | number) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!form || !initialForm) return;
    const dto = buildDiff(initialForm, form);
    if (Object.keys(dto).length === 0) {
      setSnackbar({ open: true, message: "No hay cambios para guardar.", severity: "success" });
      return;
    }
    setSaving(true);
    try {
      const result = await SecuritySettingsService.updateSettings(dto);
      const newForm = settingsToForm(result);
      setInitialForm(newForm);
      setForm(newForm);
      setAudit({ updatedAt: result.updatedAt, updatedBy: result.updatedBy });
      setSnackbar({ open: true, message: "Configuración guardada correctamente.", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: extractErrorMessage(err), severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const auditText = audit
    ? `Última modificación: ${new Date(audit.updatedAt).toLocaleString("es-CO")}${
        audit.updatedBy ? ` por ${audit.updatedBy}` : ""
      }`
    : "";

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Parámetros de Seguridad
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Sección 1: Políticas de Contraseña */}
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Políticas de Contraseña
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.passwordRequireDigit}
                  onChange={(e) => setField("passwordRequireDigit", e.target.checked)}
                />
              }
              label="Requiere dígito"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.passwordRequireLowercase}
                  onChange={(e) => setField("passwordRequireLowercase", e.target.checked)}
                />
              }
              label="Requiere minúscula"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.passwordRequireUppercase}
                  onChange={(e) => setField("passwordRequireUppercase", e.target.checked)}
                />
              }
              label="Requiere mayúscula"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.passwordRequireNonAlphanumeric}
                  onChange={(e) => setField("passwordRequireNonAlphanumeric", e.target.checked)}
                />
              }
              label="Requiere carácter especial"
            />
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
            <TextField
              label="Longitud mínima"
              type="number"
              size="small"
              value={form.passwordRequiredLength}
              onChange={(e) => setField("passwordRequiredLength", Number(e.target.value))}
              inputProps={{ min: 4, max: 128 }}
              sx={{ width: 200 }}
            />
            <TextField
              label="Caracteres únicos mínimos"
              type="number"
              size="small"
              value={form.passwordRequiredUniqueChars}
              onChange={(e) => setField("passwordRequiredUniqueChars", Number(e.target.value))}
              inputProps={{ min: 0, max: 10 }}
              sx={{ width: 240 }}
            />
          </Box>
        </Card>

        {/* Sección 2: Bloqueo de Cuenta */}
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Bloqueo de Cuenta
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <TextField
              label="Intentos fallidos máximos"
              type="number"
              size="small"
              value={form.lockoutMaxFailedAttempts}
              onChange={(e) => setField("lockoutMaxFailedAttempts", Number(e.target.value))}
              inputProps={{ min: 1, max: 20 }}
              sx={{ width: 240 }}
            />
            <TextField
              label="Duración del bloqueo (minutos)"
              type="number"
              size="small"
              value={form.lockoutDurationMinutes}
              onChange={(e) => setField("lockoutDurationMinutes", Number(e.target.value))}
              inputProps={{ min: 1, max: 1440 }}
              sx={{ width: 260 }}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.lockoutAllowedForNewUsers}
                  onChange={(e) => setField("lockoutAllowedForNewUsers", e.target.checked)}
                />
              }
              label="Aplicar bloqueo a nuevos usuarios"
            />
          </Box>
        </Card>

        {/* Sección 3: Inicio de Sesión */}
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Inicio de Sesión
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.signInRequireConfirmedEmail}
                  onChange={(e) => setField("signInRequireConfirmedEmail", e.target.checked)}
                />
              }
              label="Requiere email confirmado"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.signInRequireConfirmedPhone}
                  onChange={(e) => setField("signInRequireConfirmedPhone", e.target.checked)}
                />
              }
              label="Requiere teléfono confirmado"
            />
          </Box>
        </Card>

        {/* Pie del formulario */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {auditText}
          </Typography>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
