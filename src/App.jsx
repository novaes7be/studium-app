import { useState, useEffect } from 'react'
import { useApp } from './context/AppContext'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import SubjectView from './pages/SubjectView'
import PDFViewer from './pages/PDFViewer'
import Sidebar from './components/Sidebar'
import AddSubjectModal from './components/AddSubjectModal'
import QuizModal from './components/QuizModal'
import './styles/global.css'
import styles from './App.module.css'

export default function App() {
  const { user, loading } = useApp()
  const [subjects, setSubjects] = useState([])
  const [activeSubject, setActiveSubject] = useState(null)
  const [openPDF, setOpenPDF] = useState(null)
  const [openPDFPanel, setOpenPDFPanel] = useState('notes')
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [quizPDF, setQuizPDF] = useState(null)

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

  const handleSubjectCreated = (subject) => {
    setSubjects(s => [...s, { ...subject, pdf_count: 0 }])
    setActiveSubject({ ...subject, pdf_count: 0 })
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
      />

      <main className={styles.main}>
        <SubjectView
          subject={activeSubject}
          onOpenPDF={handleOpenPDF}
          onOpenQuiz={setQuizPDF}
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
          onClose={() => setQuizPDF(null)}
        />
      )}
    </div>
  )
}