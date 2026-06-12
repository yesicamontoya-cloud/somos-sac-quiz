/**
 * SomosQuizEngine v1.0
 * Motor compartido para todos los quizzes y certificaciones de Somos Internet.
 * Carga preguntas del array PREGUNTAS, gestiona el flujo, anti-trampa y resultados.
 */

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx_S2g0viLl6aZQWNuCd-Y77BwRSq60wgyiU-voxsXqPI4L2y8avL_yHuJho6RNo1Q4';

class SomosQuiz {
  constructor(config) {
    this.config = {
      title: config.title || 'Quiz',
      subtitle: config.subtitle || '',
      quizId: config.quizId || 'quiz',
      minApproval: config.minApproval || null, // null = sin umbral (diagnóstico)
      shuffleQuestions: config.shuffleQuestions !== false,
      shuffleOptions: config.shuffleOptions !== false,
      trackCheating: config.trackCheating !== false,
    };
    this.preguntas = config.preguntas || [];
    this.preguntasActivas = [];
    this.current = 0;
    this.score = 0;
    this.userAnswers = [];
    this.userName = '';
    this.userEmail = '';
    this.startTime = null;
    this.questionStartTime = null;
    this.tabSwitches = 0;
    this.focusLosses = 0;
    this.timePerQuestion = [];
    this._setupAntiCheat();
  }

  // ── Anti-trampa ──────────────────────────────────────────────
  _setupAntiCheat() {
    if (!this.config.trackCheating) return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this._quizActive) {
        this.tabSwitches++;
        this._logCheatEvent('tab_switch');
      }
    });
    window.addEventListener('blur', () => {
      if (this._quizActive) {
        this.focusLosses++;
        this._logCheatEvent('focus_loss');
      }
    });
    document.addEventListener('contextmenu', (e) => {
      if (this._quizActive) e.preventDefault();
    });
    document.addEventListener('copy', (e) => {
      if (this._quizActive) e.preventDefault();
    });
  }

  _logCheatEvent(type) {
    console.log(`[Quiz Anti-Cheat] ${type} at Q${this.current + 1}, time=${Date.now() - this.startTime}ms`);
  }

  get _quizActive() {
    return this.startTime !== null && this.current < this.preguntasActivas.length;
  }

  // ── Shuffle ──────────────────────────────────────────────────
  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Preparar preguntas ───────────────────────────────────────
  _prepareQuestions() {
    let qs = [...this.preguntas];
    if (this.config.shuffleQuestions) qs = this._shuffle(qs);
    this.preguntasActivas = qs.map(q => {
      if (!this.config.shuffleOptions) return { ...q };
      // Mezcla opciones preservando la correcta
      const indices = [0, 1, 2, 3];
      const shuffled = this._shuffle(indices);
      const newOpciones = shuffled.map(i => q.opciones[i]);
      const newCorrecta = shuffled.indexOf(q.correcta);
      return { ...q, opciones: newOpciones, correcta: newCorrecta };
    });
  }

  // ── Start ────────────────────────────────────────────────────
  start(nombre, email) {
    this.userName = nombre;
    this.userEmail = email;
    this.current = 0;
    this.score = 0;
    this.userAnswers = [];
    this.tabSwitches = 0;
    this.focusLosses = 0;
    this.timePerQuestion = [];
    this.startTime = Date.now();
    this._prepareQuestions();
  }

  // ── Responder ────────────────────────────────────────────────
  answer(idx) {
    const q = this.preguntasActivas[this.current];
    const elapsed = this.questionStartTime ? Math.round((Date.now() - this.questionStartTime) / 1000) : 0;
    this.timePerQuestion.push(elapsed);
    const isCorrect = idx === q.correcta;
    if (isCorrect) this.score++;
    this.userAnswers.push({
      qIndex: this.current,
      pregunta: q.texto,
      nivel: q.nivel,
      respuestaIdx: idx,
      correctaIdx: q.correcta,
      respuestaTxt: q.opciones[idx],
      correctaTxt: q.opciones[q.correcta],
      correcto: isCorrect,
      tiempo: elapsed,
      explicacion: q.explicacion,
    });
    return { isCorrect, correcta: q.correcta, explicacion: q.explicacion };
  }

  next() {
    this.current++;
    this.questionStartTime = Date.now();
  }

  markQuestionStart() {
    this.questionStartTime = Date.now();
  }

  // ── Resultados ───────────────────────────────────────────────
  getResults() {
    const total = this.preguntasActivas.length;
    const pct = Math.round((this.score / total) * 100);
    const approved = this.config.minApproval !== null ? pct >= this.config.minApproval : null;
    const totalTime = Math.round((Date.now() - this.startTime) / 1000);
    const byNivel = {};
    this.userAnswers.forEach(a => {
      if (!byNivel[a.nivel]) byNivel[a.nivel] = { correct: 0, total: 0 };
      byNivel[a.nivel].total++;
      if (a.correcto) byNivel[a.nivel].correct++;
    });
    return { total, score: this.score, pct, approved, totalTime, byNivel,
      tabSwitches: this.tabSwitches, focusLosses: this.focusLosses,
      wrongAnswers: this.userAnswers.filter(a => !a.correcto) };
  }

  // ── Guardar en Sheets ────────────────────────────────────────
  async save() {
    const r = this.getResults();
    const payload = {
      quizId: this.config.quizId,
      nombre: this.userName,
      email: this.userEmail,
      score: r.score,
      total: r.total,
      pct: r.pct,
      aprobado: r.approved === null ? 'N/A' : (r.approved ? 'Aprobado' : 'No aprobado'),
      tiempoTotal: r.totalTime,
      cambiosPestana: r.tabSwitches,
      perdidasFoco: r.focusLosses,
      preguntasFalladas: r.wrongAnswers.map(w => `P: ${w.pregunta.substring(0, 60)} | Respondió: ${w.respuestaTxt} | Correcta: ${w.correctaTxt}`).join(' || '),
      fecha: new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
    };
    try {
      await fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch {
      return false;
    }
  }
}

// ── Utilidades de UI compartidas ──────────────────────────────
function nivelBadgeClass(nivel) {
  return { facil: 'nivel-facil', medio: 'nivel-medio', dificil: 'nivel-dificil' }[nivel] || 'nivel-medio';
}

function nivelLabel(nivel) {
  return { facil: '🟢 Fácil', medio: '🟡 Medio', dificil: '🔴 Difícil' }[nivel] || nivel;
}

function resultMessage(pct, minApproval) {
  if (minApproval === null) {
    if (pct >= 80) return 'Excelente comprensión de los temas del día.';
    if (pct >= 60) return 'Buen trabajo. Repasa los temas que fallaste antes de continuar.';
    return 'Hay temas que necesitan refuerzo. El formador te apoyará.';
  }
  if (pct >= minApproval) return '¡Certificación aprobada! Puedes avanzar al siguiente bloque.';
  return `No alcanzaste el ${minApproval}% mínimo. Debes reforzar y volver a presentar.`;
}
