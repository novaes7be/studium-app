import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import styles from './PDFViewer.module.css'
import { X, Sparkles, StickyNote, Send, Loader, Plus, Trash2 } from 'lucide-react'

const PDF_SYSTEM_PROMPT = (pdfName) => `Você é um assistente de estudos especializado, focado exclusivamente no documento "${pdfName}".

Regras que você DEVE seguir:
- Responda APENAS sobre o conteúdo do documento em questão
- Se o usuário perguntar algo fora do escopo do documento, redirecione educadamente para o conteúdo do PDF
- Única exceção: se o usuário pedir dicas de como estudar, organizar revisões ou técnicas de aprendizado relacionadas ao tema do documento, você pode responder
- Sempre responda em português, de forma clara e objetiva
- Ao resumir, use tópicos e destaque os pontos mais importantes
- Nunca invente informações que não estejam no documento`

export default function PDFViewer({ pdf, defaultPanel = 'notes', onClose }) {
  const { user } = useApp()
  const [pdfUrl, setPdfUrl] = useState(null)
  const [panel, setPanel] = useState(defaultPanel)
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [messages, setMessages] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => { loadPdfUrl(); loadNotes() }, [pdf])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadPdfUrl = async () => {
    const { data } = await supabase.storage.from('pdfs').createSignedUrl(pdf.storage_path, 3600)
    if (data) setPdfUrl(data.signedUrl)
  }

  const loadNotes = async () => {
    const { data } = await supabase.from('notes').select('*').eq('pdf_id', pdf.id).order('created_at', { ascending: false })
    setNotes(data || [])
  }

  const saveNote = async () => {
    if (!newNote.trim()) return
    const { data } = await supabase.from('notes').insert({
      content: newNote, pdf_id: pdf.id, user_id: user.id,
    }).select().single()
    if (data) setNotes(n => [data, ...n])
    setNewNote('')
  }

  const deleteNote = async (id) => {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(n => n.filter(x => x.id !== id))
  }

  const callAI = async (userMessage) => {
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setAiLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
         },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          json_mode: true,  
          system: PDF_SYSTEM_PROMPT(pdf.name),
          messages: newMessages,
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Erro ao gerar resposta.'
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Erro ao conectar com a IA.' }])
    }
    setAiLoading(false)
  }

  const handleSend = () => {
    if (!aiInput.trim()) return
    const msg = aiInput; setAiInput(''); callAI(msg)
  }

  const generateSummary = async () => {
    setSummaryLoading(true)
    await callAI(`Gere um resumo completo e estruturado do documento "${pdf.name}". Use tópicos e destaque os pontos mais importantes.`)
    setSummaryLoading(false)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.pdfSide}>
        <div className={styles.pdfHeader}>
          <span className={styles.pdfName}>{pdf.name}</span>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>
        {pdfUrl
          ? <iframe src={pdfUrl} className={styles.iframe} title={pdf.name} />
          : <div className={styles.pdfLoading}>Carregando PDF...</div>}
      </div>

      <div className={styles.panelSide}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${panel === 'notes' ? styles.tabActive : ''}`} onClick={() => setPanel('notes')}>
            <StickyNote size={14} /><span>Notas</span>
          </button>
          <button className={`${styles.tab} ${panel === 'ai' ? styles.tabActive : ''}`} onClick={() => setPanel('ai')}>
            <Sparkles size={14} /><span>IA</span>
          </button>
        </div>

        {panel === 'notes' && (
          <div className={styles.notesPanel}>
            <div className={styles.noteInput}>
              <textarea
                className={styles.textarea}
                placeholder="Nova anotação sobre este PDF..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.metaKey && saveNote()}
              />
              <button className={styles.saveNoteBtn} onClick={saveNote}>
                <Plus size={14} /><span>Salvar</span>
              </button>
            </div>
            <div className={styles.notesList}>
              {notes.length === 0 && <div className={styles.panelEmpty}>Nenhuma anotação ainda.</div>}
              {notes.map(note => (
                <div key={note.id} className={styles.noteCard}>
                  <p>{note.content}</p>
                  <div className={styles.noteFooter}>
                    <span>{new Date(note.created_at).toLocaleDateString('pt-BR')}</span>
                    <button onClick={() => deleteNote(note.id)} className={styles.deleteNoteBtn}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {panel === 'ai' && (
          <div className={styles.aiPanel}>
            {messages.length === 0 && (
              <div className={styles.aiEmpty}>
                <Sparkles size={24} className={styles.aiIcon} />
                <p>Faça perguntas sobre o documento ou gere um resumo.<br /><span className={styles.aiHint}>A IA responde apenas sobre o conteúdo deste PDF.</span></p>
                <button className={styles.summaryBtn} onClick={generateSummary} disabled={summaryLoading}>
                  {summaryLoading ? <Loader size={14} className={styles.spin} /> : <Sparkles size={14} />}
                  <span>{summaryLoading ? 'Gerando...' : 'Gerar resumo'}</span>
                </button>
              </div>
            )}
            <div className={styles.chat}>
              {messages.map((m, i) => (
                <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgAI}`}>
                  <p>{m.content}</p>
                </div>
              ))}
              {aiLoading && <div className={`${styles.msg} ${styles.msgAI}`}><Loader size={14} className={styles.spin} /></div>}
              <div ref={chatEndRef} />
            </div>
            <div className={styles.aiInput}>
              {messages.length > 0 && (
                <button className={styles.summaryBtn2} onClick={generateSummary} disabled={summaryLoading}>
                  <Sparkles size={12} /><span>Resumo</span>
                </button>
              )}
              <div className={styles.inputRow}>
                <input
                  className={styles.chatInput}
                  placeholder="Pergunte sobre o documento..."
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button className={styles.sendBtn} onClick={handleSend} disabled={aiLoading}><Send size={14} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}