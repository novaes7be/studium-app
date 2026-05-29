import { useState, useEffect, useRef } from 'react'
import styles from './QuizModal.module.css'
import { X, Sparkles, Loader, Clock, CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const QUIZ_SYSTEM_PROMPT = (pdfName, pdfText) => `Você é um gerador de questionários acadêmicos para o documento "${pdfName}".

Conteúdo do documento:
"""
${pdfText ? pdfText.slice(0, 12000) : 'Conteúdo não disponível.'}
"""

Gere exatamente o número de questões solicitado, baseadas SOMENTE no conteúdo acima.
Responda APENAS com JSON válido, sem texto antes ou depois, sem markdown, sem blocos de código.
O JSON deve seguir EXATAMENTE este formato:
{
  "questions": [
    {
      "question": "Texto da pergunta",
      "options": ["A) opção apenas", "B) opção apenas", "C) opção apenas", "D) opção apenas"],
      "correct": 0,
      "explanation": "Explicação separada aqui"
    }
  ]
}
As options devem conter APENAS o texto da opção, sem explicações. A explanation é um campo separado.`

export default function QuizModal({ pdf, pdfText = '', pdfTextLoading = false, onClose }) {
  const { user } = useApp()
  const [step, setStep] = useState('config')
  const [config, setConfig] = useState({ questions: 5, timerMode: 'total', timePerQuestion: 60, totalTime: 300 })
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    if (step !== 'quiz') return
    const initial = config.timerMode === 'total' ? config.totalTime : config.timePerQuestion
    setTimeLeft(initial)
  }, [step, current])

  useEffect(() => {
    if (step !== 'quiz') return
    if (timeLeft <= 0) return
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timeLeft, step])

  const handleTimeUp = () => {
    if (config.timerMode === 'per_question') {
      submitAnswer(-1)
    } else {
      finishQuiz()
    }
  }

  const generateQuiz = async () => {
    setStep('loading')
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 2000,
          json_mode: true,
          system: QUIZ_SYSTEM_PROMPT(pdf.name, pdfText),
          messages: [{
            role: 'user',
            content: `Gere ${config.questions} questões de múltipla escolha sobre o documento "${pdf.name}". Varie entre fácil, médio e difícil.`
          }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const first = JSON.parse(text)
      const parsed = typeof first === 'string' ? JSON.parse(first) : first
      setQuestions(parsed.questions)
      setAnswers(new Array(parsed.questions.length).fill(null))
      setCurrent(0)
      setSelected(null)
      setStep('quiz')
    } catch (e) {
      console.error('PARSE ERROR:', e)
      setError('Erro ao gerar questões. Tente novamente.')
      setStep('config')
    }
  }

  const submitAnswer = (idx) => {
    clearTimeout(timerRef.current)
    const newAnswers = [...answers]
    newAnswers[current] = idx
    setAnswers(newAnswers)
    setSelected(idx)
  }

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      finishQuiz()
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
    }
  }

  const finishQuiz = async () => {
    clearTimeout(timerRef.current)
    const finalScore = answers.filter((a, i) => a === questions[i]?.correct).length
    await supabase.from('quiz_results').insert({
      user_id: user.id,
      pdf_id: pdf.id,
      score: finalScore,
      total: questions.length,
    })
    setStep('result')
  }

  const score = answers.filter((a, i) => a === questions[i]?.correct).length

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const timerColor = timeLeft <= 10 ? styles.timerDanger : timeLeft <= 30 ? styles.timerWarn : ''

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {step === 'config' && (
          <>
            <div className={styles.header}>
              <div>
                <div className={styles.headerTitle}>Gerar Questionário</div>
                <div className={styles.headerSub}>{pdf.name}</div>
              </div>
              <button className={styles.closeBtn} onClick={onClose}><X size={15} /></button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {!pdfText && (
              <div className={styles.error}>⚠ Abra o PDF antes de gerar o quiz para que a IA leia o conteúdo.</div>
            )}

            <div className={styles.configSection}>
              <label className={styles.configLabel}>Número de questões</label>
              <div className={styles.optionRow}>
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    className={`${styles.optionBtn} ${config.questions === n ? styles.optionActive : ''}`}
                    onClick={() => setConfig(c => ({ ...c, questions: n }))}
                  >{n}</button>
                ))}
              </div>
            </div>

            <div className={styles.configSection}>
              <label className={styles.configLabel}>Modo de timer</label>
              <div className={styles.optionRow}>
                <button
                  className={`${styles.optionBtn} ${config.timerMode === 'total' ? styles.optionActive : ''}`}
                  onClick={() => setConfig(c => ({ ...c, timerMode: 'total' }))}
                >⏱ Total</button>
                <button
                  className={`${styles.optionBtn} ${config.timerMode === 'per_question' ? styles.optionActive : ''}`}
                  onClick={() => setConfig(c => ({ ...c, timerMode: 'per_question' }))}
                >⏱ Por questão</button>
                <button
                  className={`${styles.optionBtn} ${config.timerMode === 'none' ? styles.optionActive : ''}`}
                  onClick={() => setConfig(c => ({ ...c, timerMode: 'none' }))}
                >Sem timer</button>
              </div>
            </div>

            {config.timerMode === 'per_question' && (
              <div className={styles.configSection}>
                <label className={styles.configLabel}>Tempo por questão</label>
                <div className={styles.optionRow}>
                  {[30, 60, 90, 120].map(s => (
                    <button
                      key={s}
                      className={`${styles.optionBtn} ${config.timePerQuestion === s ? styles.optionActive : ''}`}
                      onClick={() => setConfig(c => ({ ...c, timePerQuestion: s }))}
                    >{s}s</button>
                  ))}
                </div>
              </div>
            )}

            {config.timerMode === 'total' && (
              <div className={styles.configSection}>
                <label className={styles.configLabel}>Tempo total</label>
                <div className={styles.optionRow}>
                  {[{ v: 180, l: '3min' }, { v: 300, l: '5min' }, { v: 600, l: '10min' }, { v: 900, l: '15min' }].map(({ v, l }) => (
                    <button
                      key={v}
                      className={`${styles.optionBtn} ${config.totalTime === v ? styles.optionActive : ''}`}
                      onClick={() => setConfig(c => ({ ...c, totalTime: v }))}
                    >{l}</button>
                  ))}
                </div>
              </div>
            )}

            <button className={styles.generateBtn} onClick={generateQuiz} disabled={!pdfText || pdfTextLoading}>
              <Sparkles size={14} /><span>Gerar questões com IA</span>
            </button>
          </>
        )}

        {step === 'loading' && (
          <div className={styles.loading}>
            <Loader size={28} className={styles.spin} />
            <p>Gerando {config.questions} questões sobre o documento...</p>
          </div>
        )}

        {step === 'quiz' && questions.length > 0 && (
          <>
            <div className={styles.quizHeader}>
              <div className={styles.progress}>
                <span>{current + 1} / {questions.length}</span>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
                </div>
              </div>
              {config.timerMode !== 'none' && (
                <div className={`${styles.timer} ${timerColor}`}>
                  <Clock size={13} /><span>{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>

            <div className={styles.question}>
              <p className={styles.questionText}>{questions[current].question}</p>
              <div className={styles.options}>
                {questions[current].options.map((opt, i) => {
                  let cls = styles.option
                  if (selected !== null) {
                    if (i === questions[current].correct) cls += ` ${styles.optionCorrect}`
                    else if (i === selected && selected !== questions[current].correct) cls += ` ${styles.optionWrong}`
                  } else if (selected === i) {
                    cls += ` ${styles.optionSelected}`
                  }
                  return (
                    <button key={i} className={cls} onClick={() => selected === null && submitAnswer(i)} disabled={selected !== null}>
                      <span className={styles.optionLetter}>{['A', 'B', 'C', 'D'][i]}</span>
                      <span>{opt.replace(/^[A-D]\)\s*/, '')}</span>
                    </button>
                  )
                })}
              </div>

              {selected !== null && (
                <div className={`${styles.explanation} ${selected === questions[current].correct ? styles.explanationCorrect : styles.explanationWrong}`}>
                  <div className={styles.explanationHeader}>
                    {selected === questions[current].correct
                      ? <><CheckCircle size={14} /> Correto!</>
                      : <><XCircle size={14} /> Incorreto</>}
                  </div>
                  <p>{questions[current].explanation}</p>
                </div>
              )}
            </div>

            {selected !== null && (
              <button className={styles.nextBtn} onClick={nextQuestion}>
                <span>{current + 1 >= questions.length ? 'Ver resultado' : 'Próxima'}</span>
                <ChevronRight size={14} />
              </button>
            )}
          </>
        )}

        {step === 'result' && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <button className={styles.closeBtn} onClick={onClose}><X size={15} /></button>
            </div>

            <div className={styles.scoreCircle}>
              <span className={styles.scoreNum}>{score}</span>
              <span className={styles.scoreTotal}>/{questions.length}</span>
            </div>
            <div className={styles.scoreLabel}>
              {score === questions.length ? '🎉 Perfeito!' : score >= questions.length * 0.7 ? '✦ Muito bom!' : score >= questions.length * 0.5 ? 'Continue praticando' : 'Revise o material'}
            </div>

            <div className={styles.resultList}>
              {questions.map((q, i) => {
                const correct = answers[i] === q.correct
                return (
                  <div key={i} className={`${styles.resultItem} ${correct ? styles.resultCorrect : styles.resultWrong}`}>
                    <div className={styles.resultItemHeader}>
                      {correct ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      <span className={styles.resultQ}>{q.question}</span>
                    </div>
                    {!correct && (
                      <div className={styles.resultDetail}>
                        <span className={styles.yourAnswer}>
                          Sua resposta: {answers[i] >= 0 ? q.options[answers[i]] : 'Sem resposta (tempo esgotado)'}
                        </span>
                        <span className={styles.correctAnswer}>Correta: {q.options[q.correct]}</span>
                        <span className={styles.resultExplanation}>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className={styles.resultActions}>
              <button className={styles.retryBtn} onClick={() => { setStep('config'); setAnswers([]); setQuestions([]) }}>
                <RotateCcw size={14} /><span>Novo quiz</span>
              </button>
              <button className={styles.closeResultBtn} onClick={onClose}>Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}