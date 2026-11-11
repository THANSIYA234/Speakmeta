import { createTheme, type Theme } from '@mui/material/styles';

export const palette = {
  primary: '#7C5CFF',
  primaryDark: '#5B3FE0',
  primaryLight: '#EDE7FF',
  secondary: '#B9A6FF',
  secondarySoft: '#F3EFFF',
  background: '#F7F5FF',
  surface: '#FFFFFF',
  text: '#171A3B',
  textMuted: '#6E739B',
  success: '#28B26B',
  warning: '#F5A524',
  error: '#F2545B',
  border: '#EAE6FB',
} as const;

export const theme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: palette.primary,
      dark: palette.primaryDark,
      light: palette.primaryLight,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: palette.secondary,
      light: palette.secondarySoft,
      dark: palette.primaryDark,
      contrastText: palette.text,
    },
    background: {
      default: palette.background,
      paper: palette.surface,
    },
    text: {
      primary: palette.text,
      secondary: palette.textMuted,
    },
    success: { main: palette.success },
    warning: { main: palette.warning },
    error: { main: palette.error },
    divider: palette.border,
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily:
      '"Plus Jakarta Sans", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.background,
          color: palette.text,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '::selection': {
          backgroundColor: palette.secondary,
          color: palette.text,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 24,
          paddingBlock: 12,
        },
        sizeLarge: {
          paddingInline: 32,
          paddingBlock: 16,
          fontSize: '1rem',
        },
        contained: {
          backgroundImage: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
          '&:hover': {
            backgroundImage: `linear-gradient(135deg, ${palette.primaryDark} 0%, #4A31C4 100%)`,
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: palette.surface,
          borderRadius: 24,
          border: `1px solid ${palette.border}`,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 999,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 10,
          borderRadius: 999,
          backgroundColor: palette.primaryLight,
        },
        bar: {
          borderRadius: 999,
          backgroundImage: `linear-gradient(90deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: palette.surface,
          borderTop: `1px solid ${palette.border}`,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: 'transparent',
      },
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          color: palette.text,
        },
      },
    },
  },
});

export default theme;
