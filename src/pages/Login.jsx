import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import styles from './Login.module.css'

export default function Login() {
  const { signInWithPassword, signUpWithPassword } = useApp()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const validate = () => {
    if (!email || !email.includes('@')) return 'Digite um email válido.'
    if (mode === 'reset') return null
    if (password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
    if (mode === 'register' && password !== confirm) return 'As senhas não coincidem.'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      setLoading(false)
      if (error) setError(error.message)
      else setResetSent(true)
      return
    }

    const fn = mode === 'login' ? signInWithPassword : signUpWithPassword
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) setError(error.message)
  }

  const switchMode = (m) => { setMode(m); setError(''); setResetSent(false) }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Studium</div>

        {mode === 'reset' ? (
          resetSent ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>✦</div>
              <h2>Email enviado</h2>
              <p>Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para redefinir sua senha.</p>
              <button className={styles.btnGhost} onClick={() => switchMode('login')}>Voltar ao login</button>
            </div>
          ) : (
            <>
              <h1 className={styles.title}>Recuperar senha</h1>
              <p className={styles.sub}>Informe seu email e enviaremos um link para redefinir sua senha.</p>
              <div className={styles.field}>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoFocus
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.btn} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
              <p className={styles.hint}>
                <button className={styles.link} onClick={() => switchMode('login')}>Voltar ao login</button>
              </p>
            </>
          )
        ) : (
          <>
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
                <>
                  Não tem conta?{' '}
                  <button className={styles.link} onClick={() => switchMode('register')}>Criar conta</button>
                  {' · '}
                  <button className={styles.link} onClick={() => switchMode('reset')}>Esqueci a senha</button>
                </>
              ) : (
                <>
                  Já tem conta?{' '}
                  <button className={styles.link} onClick={() => switchMode('login')}>Entrar</button>
                </>
              )}
            </p>

            <p className={styles.warning}>
              ⚠ Guarde sua senha num bloco de notas ou app de senhas (ex: Google Passwords). Sem ela, a recuperação depende do acesso ao seu email.
            </p>
          </>
        )}
      </div>
    </div>
  )
}