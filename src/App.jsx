import { useState, useEffect } from 'react'
import { useApp } from './context/AppContext'
import { supabase } from './lib/supabase'
import * as pdfjsLib from 'pdfjs-dist'
import Login from './pages/Login'
import SubjectView from './pages/SubjectView'
import PDFViewer from './pages/PDFViewer'
import Sidebar from './components/Sidebar'
import AddSubjectModal from './components/AddSubjectModal'
import QuizModal from './components/QuizModal'
import './styles/global.css'
import styles from './App.module.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

async function extractTextFromPdf(url) {
  try {
    const doc = await pdfjsLib.getDocument(url).promise
    let text = ''
    const maxPages = Math.min(doc.numPages, 30)
    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(' ') + '\n'
    }
    return text
  } catch (e) {
    console.error('Erro ao extrair texto do PDF:', e)
    return ''
  }
}

export default function App() {
  const { user, loading } = useApp()
  const [subjects, setSubjects] = useState([])
  const [activeSubject, setActiveSubject] = useState(null)
  const [openPDF, setOpenPDF] = useState(null)
  const [openPDFPanel, setOpenPDFPanel] = useState('notes')
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [quizPDF, setQuizPDF] = useState(null)
  const [quizPdfText, setQuizPdfText] = useState('')
  const [quizLoading, setQuizLoading] = useState(false)

  useEffect(() => {
    if (user) fetchSubjects()
  }, [user])

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*, pdfs(count)')
      .order('created_at')
    if (data) {
      const mapped = data.map(s => ({ ...s, pdf_count: s.pdfs?.[0]?.count || 0 }))
      setSubjects(mapped)
      if (!activeSubject && mapped.length > 0) setActiveSubject(mapped[0])
    }
  }

  const handleOpenPDF = (pdf, panel = 'notes') => {
    setOpenPDF(pdf)
    setOpenPDFPanel(panel)
  }

  const handleOpenQuiz = async (pdf) => {
    setQuizPDF(pdf)
    setQuizPdfText('')
    setQuizLoading(true)
    const { data } = await supabase.storage.from('pdfs').createSignedUrl(pdf.storage_path, 3600)
    if (data?.signedUrl) {
      const text = await extractTextFromPdf(data.signedUrl)
      setQuizPdfText(text)
    }
    setQuizLoading(false)
  }

  const handleSubjectCreated = (subject) => {
    setSubjects(s => [...s, { ...subject, pdf_count: 0 }])
    setActiveSubject({ ...subject, pdf_count: 0 })
  }

  const handleSubjectRenamed = (updated) => {
  setSubjects(s => s.map(x => x.id === updated.id ? { ...x, name: updated.name } : x))
  if (activeSubject?.id === updated.id) setActiveSubject(a => ({ ...a, name: updated.name }))
  }

  const handleSubjectDeleted = (id) => {
    setSubjects(s => s.filter(x => x.id !== id))
    if (activeSubject?.id === id) setActiveSubject(null)
  }

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingLogo}>Studium</div>
    </div>
  )

  if (!user) return <Login />

  return (
    <div className={styles.layout}>
      <Sidebar
        subjects={subjects}
        activeSubject={activeSubject}
        onSelectSubject={setActiveSubject}
        onAddSubject={() => setShowAddSubject(true)}
        onSubjectRenamed={handleSubjectRenamed}
        onSubjectDeleted={handleSubjectDeleted}
      />

      <main className={styles.main}>
        <SubjectView
          subject={activeSubject}
          onOpenPDF={handleOpenPDF}
          onOpenQuiz={handleOpenQuiz}
        />
      </main>

      {openPDF && (
        <PDFViewer
          pdf={openPDF}
          defaultPanel={openPDFPanel}
          onClose={() => setOpenPDF(null)}
        />
      )}

      {showAddSubject && (
        <AddSubjectModal
          onClose={() => setShowAddSubject(false)}
          onCreated={handleSubjectCreated}
        />
      )}

      {quizPDF && (
        <QuizModal
          pdf={quizPDF}
          pdfText={quizPdfText}
          pdfTextLoading={quizLoading}
          onClose={() => { setQuizPDF(null); setQuizPdfText('') }}
        />
      )}
    </div>
  )
}