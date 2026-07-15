import { Box, Button, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
        textAlign: 'center',
        px: 3,
      }}
    >
      <LockOutlinedIcon sx={{ fontSize: 72, color: 'error.main' }} />
      <Typography variant="h4" fontWeight={600}>
        Acceso denegado
      </Typography>
      <Typography variant="body1" color="text.secondary">
        No tienes permisos para acceder a esta sección.
        <br />
        Contacta al administrador si consideras que esto es un error.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/app')}>
        Volver al inicio
      </Button>
    </Box>
  );
}
