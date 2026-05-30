import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext({})

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accent') || '#8757BA')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
    localStorage.setItem('accent', accentColor)
  }, [accentColor])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const signInWithPassword = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUpWithPassword = async (email, password) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (data.error) return { error: data.error }
  // Loga automaticamente após cadastro
  return await supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      accentColor, setAccentColor,
      user, loading,
      signInWithPassword, signUpWithPassword, signOut
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)