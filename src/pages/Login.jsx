import { useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './Login.module.css'

export default function Login() {
  const { signInWithEmail } = useApp()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Digite um email válido.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ animationDelay: '0.1s' }}>
        <div className={styles.logo}>Studium</div>

        {!sent ? (
          <>
            <h1 className={styles.title}>Bem-vindo de volta</h1>
            <p className={styles.sub}>Entre com seu email — sem senha, sem complicação.</p>

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

            <button
              className={styles.btn}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar link de acesso'}
            </button>

            <p className={styles.hint}>
              Você receberá um link mágico no seu email para entrar instantaneamente.
            </p>
          </>
        ) : (
          <div className={styles.success}>
            <div className={styles.successIcon}>✦</div>
            <h2>Verifique seu email</h2>
            <p>Enviamos um link de acesso para <strong>{email}</strong>. Clique nele para entrar.</p>
            <button className={styles.btnGhost} onClick={() => setSent(false)}>
              Usar outro email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
