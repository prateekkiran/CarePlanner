'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ReactNode } from 'react';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4f46e5'
    },
    secondary: {
      main: '#14b8a6'
    },
    background: {
      default: '#f5f7fb',
      paper: '#ffffff'
    }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
  }
});

export function MaterialAppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
