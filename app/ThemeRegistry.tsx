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
