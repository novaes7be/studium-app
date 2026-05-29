import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import styles from './SubjectView.module.css'
import { Upload, FileText, Sparkles, StickyNote, Trash2, Search, ClipboardList } from 'lucide-react'

export default function SubjectView({ subject, onOpenPDF, onOpenQuiz }) {
  const { user } = useApp()
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [search, setSearch] = useState('')
  const [quizStats, setQuizStats] = useState({})

  useEffect(() => {
    if (subject) { fetchPdfs(); fetchQuizStats() }
  }, [subject])

  const fetchPdfs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('pdfs')
      .select('*')
      .eq('subject_id', subject.id)
      .order('created_at', { ascending: false })
    setPdfs(data || [])
    setLoading(false)
  }

  const fetchQuizStats = async () => {
    const { data } = await supabase
      .from('quiz_results')
      .select('pdf_id, score, total')
      .eq('user_id', user.id)

    if (!data) return
    const stats = {}
    data.forEach(r => {
      if (!stats[r.pdf_id]) stats[r.pdf_id] = { sum: 0, total: 0, count: 0 }
      stats[r.pdf_id].sum += r.score
      stats[r.pdf_id].total += r.total
      stats[r.pdf_id].count += 1
    })
    Object.keys(stats).forEach(id => {
      stats[id].avg = Math.round((stats[id].sum / stats[id].total) * 100)
    })
    setQuizStats(stats)
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf')
    if (!files.length) return

    setUploading(true)
    setUploadProgress({ done: 0, total: files.length })

    for (const file of files) {
      const path = `${user.id}/${subject.id}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('pdfs').upload(path, file)
      if (!error) {
        await supabase.from('pdfs').insert({
          name: file.name.replace('.pdf', ''),
          storage_path: path,
          subject_id: subject.id,
          user_id: user.id,
          size: file.size,
        })
      }
      setUploadProgress(p => ({ ...p, done: p.done + 1 }))
    }

    setUploading(false)
    setUploadProgress({ done: 0, total: 0 })
    fetchPdfs()
    e.target.value = ''
  }

  const handleDelete = async (pdf) => {
    if (!confirm(`Deletar "${pdf.name}"?`)) return
    await supabase.storage.from('pdfs').remove([pdf.storage_path])
    await supabase.from('pdfs').delete().eq('id', pdf.id)
    setPdfs(p => p.filter(x => x.id !== pdf.id))
  }

  const filtered = pdfs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  if (!subject) return (
    <div className={styles.empty}>
      <div className={styles.emptyInner}>
        <div className={styles.emptyIcon}>✦</div>
        <h2>Selecione uma matéria</h2>
        <p>Escolha ou crie uma matéria na barra lateral para começar.</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.dot} style={{ background: subject.color || '#8757BA' }} />
          <h1 className={styles.title}>{subject.name}</h1>
          <span className={styles.count}>{pdfs.length} PDFs</span>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <Search size={13} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <label className={styles.uploadBtn}>
            <Upload size={14} />
            <span>
              {uploading
                ? `Enviando ${uploadProgress.done}/${uploadProgress.total}...`
                : 'Upload PDF'}
            </span>
            <input type="file" accept=".pdf" multiple onChange={handleUpload} hidden />
          </label>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loader}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <label className={styles.dropzone}>
            <input type="file" accept=".pdf" multiple onChange={handleUpload} hidden />
            <Upload size={28} className={styles.dropIcon} />
            <span>Solte PDFs aqui ou clique para enviar</span>
            <span className={styles.dropSub}>Pode selecionar vários de uma vez</span>
          </label>
        ) : (
          <div className={styles.grid}>
            {filtered.map((pdf, i) => (
              <div key={pdf.id} className={styles.card} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className={styles.cardTop} onClick={() => onOpenPDF(pdf)}>
                  <div className={styles.cardIcon}>
                    <FileText size={20} />
                  </div>
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{pdf.name}</span>
                    <span className={styles.cardMeta}>
                      {pdf.size ? `${(pdf.size / 1024 / 1024).toFixed(1)} MB` : ''}
                      {pdf.annotation_count > 0 && ` · ${pdf.annotation_count} anotações`}
                    </span>
                    {quizStats[pdf.id] && (
                      <span className={styles.cardQuizStat}>
                        ✦ {quizStats[pdf.id].avg}% · {quizStats[pdf.id].count} quiz{quizStats[pdf.id].count > 1 ? 'zes' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button className={styles.actionBtn} onClick={() => onOpenPDF(pdf)}>
                    <FileText size={13} /><span>Abrir</span>
                  </button>
                  <button className={styles.actionBtn} onClick={() => onOpenPDF(pdf, 'notes')}>
                    <StickyNote size={13} /><span>Notas</span>
                  </button>
                  <button className={styles.actionBtn} onClick={() => onOpenPDF(pdf, 'ai')}>
                    <Sparkles size={13} /><span>IA</span>
                  </button>
                  <button className={styles.actionBtn} onClick={() => onOpenQuiz(pdf)}>
                    <ClipboardList size={13} /><span>Quiz</span>
                  </button>
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(pdf)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}