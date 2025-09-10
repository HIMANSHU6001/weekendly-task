"use client"

import {Toaster as HotToaster} from "react-hot-toast"

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          padding: '10px',
          color: 'var(--foreground)',
          fontSize: '14px',
          maxWidth: '350px',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: 'white',
          },
        },
      }}
    />
  )
}
