import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import styles from './AddSubjectModal.module.css'
import { X } from 'lucide-react'

const COLORS = ['#8757BA', '#FF4A89', '#F4A4FF', '#642080', '#FFC5D6', '#5B8DEF', '#3ECFAE', '#FF8C42']

export default function AddSubjectModal({ onClose, onCreated }) {
  const { user } = useApp()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#8757BA')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    const { data } = await supabase.from('subjects').insert({
      name,
      color,
      user_id: user.id,
    }).select().single()
    setLoading(false)
    if (data) { onCreated(data); onClose() }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Nova matéria</span>
          <button className={styles.closeBtn} onClick={onClose}><X size={15} /></button>
        </div>

        <input
          className={styles.input}
          placeholder="Nome da matéria..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
        />

        <div className={styles.colorLabel}>Cor</div>
        <div className={styles.colors}>
          {COLORS.map(c => (
            <button
              key={c}
              className={`${styles.swatch} ${color === c ? styles.swatchActive : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <button className={styles.btn} onClick={handleCreate} disabled={loading || !name.trim()}>
          {loading ? 'Criando...' : 'Criar matéria'}
        </button>
      </div>
    </div>
  )
}
