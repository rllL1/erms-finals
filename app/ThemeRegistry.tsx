'use client'

import * as React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#16a34a',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          overflowX: 'hidden',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '44px',
          '@media (max-width: 640px)': {
            minHeight: '40px',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minHeight: '44px',
          minWidth: '44px',
          '@media (max-width: 640px)': {
            minHeight: '40px',
            minWidth: '40px',
          },
        },
      },
    },
  },
})

// Create emotion cache
const createEmotionCache = () => {
  return createCache({ key: 'css', prepend: true })
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => createEmotionCache())

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}
