import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import styles from './Sidebar.module.css'
import {
  BookOpen, Plus, Sun, Moon, LogOut, Settings,
  GraduationCap, ChevronRight, MoreHorizontal, Pencil, Trash2, Check, X
} from 'lucide-react'

const ACCENT_COLORS = ['#8757BA', '#FF4A89', '#F4A4FF', '#642080', '#FFC5D6', '#5B8DEF', '#3ECFAE']

export default function Sidebar({ subjects, activeSubject, onSelectSubject, onAddSubject, onSubjectRenamed, onSubjectDeleted }) {
  const { theme, toggleTheme, accentColor, setAccentColor, signOut, user } = useApp()
  const [showSettings, setShowSettings] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const editInputRef = useRef(null)

  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus()
  }, [editingId])

  const startEdit = (s, e) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setEditingId(s.id)
    setEditingName(s.name)
  }

  const confirmEdit = async (s) => {
    if (!editingName.trim() || editingName === s.name) { setEditingId(null); return }
    await supabase.from('subjects').update({ name: editingName.trim() }).eq('id', s.id)
    onSubjectRenamed?.({ ...s, name: editingName.trim() })
    setEditingId(null)
  }

  const handleDelete = async (s, e) => {
    e.stopPropagation()
    setMenuOpenId(null)
    if (!confirm(`Deletar "${s.name}" e todos os seus PDFs?`)) return
    await supabase.from('subjects').delete().eq('id', s.id)
    onSubjectDeleted?.(s.id)
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Studium</div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          <span>Matérias</span>
          <button className={styles.addBtn} onClick={onAddSubject} title="Nova matéria">
            <Plus size={14} />
          </button>
        </div>

        <nav className={styles.nav}>
          {subjects.map(s => (
            <div
              key={s.id}
              className={`${styles.navItem} ${activeSubject?.id === s.id ? styles.active : ''}`}
              onClick={() => { if (editingId !== s.id) onSelectSubject(s) }}
            >
              <span className={styles.dot} style={{ background: s.color || accentColor }} />

              {editingId === s.id ? (
                <input
                  ref={editInputRef}
                  className={styles.editInput}
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmEdit(s)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className={styles.navLabel}>{s.name}</span>
              )}

              {editingId === s.id ? (
                <div className={styles.editActions} onClick={e => e.stopPropagation()}>
                  <button className={styles.editConfirm} onClick={() => confirmEdit(s)}><Check size={12} /></button>
                  <button className={styles.editCancel} onClick={() => setEditingId(null)}><X size={12} /></button>
                </div>
              ) : (
                <>
                  <span className={styles.navCount}>{s.pdf_count || 0}</span>
                  <button
                    className={styles.menuBtn}
                    onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id) }}
                  >
                    <MoreHorizontal size={13} />
                  </button>
                </>
              )}

              {menuOpenId === s.id && (
                <div className={styles.dropMenu} onClick={e => e.stopPropagation()}>
                  <button onClick={e => startEdit(s, e)}><Pencil size={12} /><span>Renomear</span></button>
                  <button className={styles.dropDelete} onClick={e => handleDelete(s, e)}><Trash2 size={12} /><span>Deletar</span></button>
                </div>
              )}
            </div>
          ))}

          {subjects.length === 0 && (
            <div className={styles.empty}>
              <GraduationCap size={20} className={styles.emptyIcon} />
              <span>Nenhuma matéria ainda</span>
            </div>
          )}
        </nav>
      </div>

      <div className={styles.bottom}>
        <button className={styles.settingsToggle} onClick={() => setShowSettings(s => !s)}>
          <Settings size={14} />
          <span>Preferências</span>
          <ChevronRight size={12} style={{ transform: showSettings ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }} />
        </button>

        {showSettings && (
          <div className={styles.settingsPanel}>
            <div className={styles.settingRow}>
              <span>Tema</span>
              <button className={styles.themeBtn} onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
              </button>
            </div>
            <div className={styles.settingRow}>
              <span>Cor de destaque</span>
            </div>
            <div className={styles.colorPicker}>
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  className={`${styles.colorSwatch} ${accentColor === c ? styles.colorActive : ''}`}
                  style={{ background: c }}
                  onClick={() => setAccentColor(c)}
                />
              ))}
            </div>
          </div>
        )}

        <div className={styles.userRow}>
          <div className={styles.avatar}>{user?.email?.[0]?.toUpperCase() || '?'}</div>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
          <button className={styles.logoutBtn} onClick={signOut} title="Sair">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}