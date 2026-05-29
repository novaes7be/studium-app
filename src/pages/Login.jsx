import { useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './Login.module.css'

export default function Login() {
  const { signInWithPassword, signUpWithPassword } = useApp()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    if (!email || !email.includes('@')) return 'Digite um email válido.'
    if (password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
    if (mode === 'register' && password !== confirm) return 'As senhas não coincidem.'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    const fn = mode === 'login' ? signInWithPassword : signUpWithPassword
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Studium</div>

        <h1 className={styles.title}>
          {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
        </h1>
        <p className={styles.sub}>
          {mode === 'login' ? 'Entre na sua conta para continuar.' : 'Crie sua conta para começar.'}
        </p>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            autoComplete="email"
          />
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="password"
            placeholder="Senha (mín. 8 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {mode === 'register' && (
          <div className={styles.field}>
            <input
              className={styles.input}
              type="password"
              placeholder="Confirmar senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="new-password"
            />
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        <p className={styles.hint}>
          {mode === 'login' ? (
            <>Não tem conta?{' '}
              <button className={styles.link} onClick={() => { setMode('register'); setError('') }}>
                Criar conta
              </button>
            </>
          ) : (
            <>Já tem conta?{' '}
              <button className={styles.link} onClick={() => { setMode('login'); setError('') }}>
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}