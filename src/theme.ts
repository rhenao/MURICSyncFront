import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#254092', // Azul corporativo oscuro
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0072CE', // Azul claro complementario
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4f4f4f',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#f57c00',
    },
    success: {
      main: '#388e3c',
    },
    info: {
      main: '#0288d1',
    },
  },
  typography: {
    fontFamily: 'Segoe UI, "Noto Sans", Roboto, Arial, sans-serif',
    fontSize: 13,
    h1: { fontWeight: 700, letterSpacing: '-0.01em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at 2% -8%, rgba(37, 64, 146, 0.08), rgba(37, 64, 146, 0) 32%), #f4f6f8',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          elevation: 2,
          borderRadius: 10,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#f4f6f8', // Mismo gris claro que background.default
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          marginLeft: 8,
          marginRight: 8,
          borderRadius: 10,
          transition: 'background-color 160ms ease, color 160ms ease',
          '&.active': {
            backgroundColor: 'rgba(37, 64, 146, 0.12)',
            color: '#254092',
            fontWeight: 700,
          },
          '&.active .MuiListItemIcon-root': {
            color: '#254092',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
        },
      },
    },
  },
});

export default theme;
