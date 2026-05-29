import { useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './Sidebar.module.css'
import {
  BookOpen, Plus, Sun, Moon, LogOut, Settings,
  GraduationCap, ChevronRight
} from 'lucide-react'

const ACCENT_COLORS = ['#8757BA', '#FF4A89', '#F4A4FF', '#642080', '#FFC5D6', '#5B8DEF', '#3ECFAE']

export default function Sidebar({ subjects, activeSubject, onSelectSubject, onAddSubject }) {
  const { theme, toggleTheme, accentColor, setAccentColor, signOut, user } = useApp()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>Studium</div>

      {/* Subjects */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          <span>Matérias</span>
          <button className={styles.addBtn} onClick={onAddSubject} title="Nova matéria">
            <Plus size={14} />
          </button>
        </div>

        <nav className={styles.nav}>
          {subjects.map(s => (
            <button
              key={s.id}
              className={`${styles.navItem} ${activeSubject?.id === s.id ? styles.active : ''}`}
              onClick={() => onSelectSubject(s)}
            >
              <span className={styles.dot} style={{ background: s.color || accentColor }} />
              <span className={styles.navLabel}>{s.name}</span>
              <span className={styles.navCount}>{s.pdf_count || 0}</span>
            </button>
          ))}

          {subjects.length === 0 && (
            <div className={styles.empty}>
              <GraduationCap size={20} className={styles.emptyIcon} />
              <span>Nenhuma matéria ainda</span>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom */}
      <div className={styles.bottom}>
        {/* Settings toggle */}
        <button
          className={styles.settingsToggle}
          onClick={() => setShowSettings(s => !s)}
        >
          <Settings size={14} />
          <span>Preferências</span>
          <ChevronRight size={12} style={{ transform: showSettings ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }} />
        </button>

        {showSettings && (
          <div className={styles.settingsPanel}>
            {/* Theme toggle */}
            <div className={styles.settingRow}>
              <span>Tema</span>
              <button className={styles.themeBtn} onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
              </button>
            </div>

            {/* Accent color picker */}
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

        {/* User */}
        <div className={styles.userRow}>
          <div className={styles.avatar}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
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
