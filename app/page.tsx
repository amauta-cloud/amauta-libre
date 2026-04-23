import Link from 'next/link'
import Image from 'next/image'

const purple = '#8B5CF6'
const pink = '#EC4899'
const gold = '#F5C518'
const green = '#10b981'
const bgApp = '#0f0d1a'
const bgCard = '#1a1730'
const textPrimary = '#f3f0ff'
const textMuted = '#9ca3af'
const gradientCTA = 'linear-gradient(135deg, #8B5CF6, #EC4899)'
const borderSubtle = 'rgba(255,255,255,0.07)'
const borderPurple = 'rgba(139,92,246,0.2)'

export default function LandingPage() {
  return (
    <div style={{ background: bgApp, color: textPrimary, fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .btn-cta {
          background: ${gradientCTA};
          color: white; border: none; border-radius: 12px;
          font-weight: 700; cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          display: inline-flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .btn-cta:hover { opacity: 0.9; transform: translateY(-1px); }
        .card { background: ${bgCard}; border: 1px solid ${borderPurple}; border-radius: 16px; padding: 28px 24px; }
        .section { padding: 80px 24px; max-width: 960px; margin: 0 auto; }
        .section-full { padding: 80px 24px; }
        .tag {
          display: inline-block; background: rgba(139,92,246,0.12); color: #a78bfa;
          border: 1px solid rgba(139,92,246,0.3); border-radius: 999px;
          font-size: 0.78rem; font-weight: 600; padding: 4px 14px; margin-bottom: 20px;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .section { padding: 60px 20px; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .hero-title { font-size: clamp(2rem, 8vw, 3.4rem) !important; }
          .nav-inner { padding: 0 20px !important; }
          .screenshot-item { border-radius: 16px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15,13,26,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${borderSubtle}` }}>
        <div className="nav-inner" style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo-transparent.png" alt="Amauta Libre" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary }}>Amauta Libre</span>
          </div>
          <Link href="/login" className="btn-cta" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
            Entrar
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '100px 24px 80px', maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.08)', border: `1px solid rgba(139,92,246,0.25)`, borderRadius: 999, padding: '5px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 28 }}>
          Gratis para siempre · Sin tarjeta · Sin trampa
        </div>

        <h1 className="hero-title" style={{ fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 20 }}>
          Tus hábitos, tus tareas,<br />
          <span style={{ background: gradientCTA, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>tu crecimiento.</span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: textMuted, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Hábitos, finanzas y metas en un solo lugar. Todo gratis, todo abierto. Entrás desde el navegador del celular, sin instalar nada.
        </p>

        <Link href="/login" className="btn-cta" style={{ padding: '16px 36px', fontSize: '1.05rem', borderRadius: 14, boxShadow: '0 8px 32px rgba(139,92,246,0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Entrar con Google
        </Link>

        <p style={{ marginTop: 16, fontSize: '0.82rem', color: '#6b7280' }}>
          Tardás 2 minutos · Sin contraseña
        </p>

        {/* Ring mockup visual */}
        <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: bgCard, border: `1px solid ${borderPurple}`, borderRadius: 24, padding: 32, maxWidth: 320, width: '100%', boxShadow: '0 24px 80px rgba(139,92,246,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>⚡ Hoy</span>
              <span style={{ color: '#F5C518', fontSize: '0.85rem', fontWeight: 600 }}>🔥 12 días</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative', width: 110, height: 110 }}>
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="10" />
                  <circle cx="55" cy="55" r="46" fill="none" stroke="url(#grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray="289" strokeDashoffset="72" transform="rotate(-90 55 55)" />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.4rem', background: gradientCTA, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>75%</span>
                  <span style={{ fontSize: '0.65rem', color: textMuted }}>hoy</span>
                </div>
              </div>
            </div>
            {[
              { emoji: '💧', name: 'Agua', done: true },
              { emoji: '📚', name: 'Lectura', done: true },
              { emoji: '🏃', name: 'Ejercicio', done: true },
              { emoji: '🧘', name: 'Meditación', done: false },
            ].map((h) => (
              <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${borderSubtle}` }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: h.done ? gradientCTA : 'rgba(255,255,255,0.06)', border: h.done ? 'none' : '1.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {h.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <span style={{ fontSize: '0.88rem', opacity: h.done ? 1 : 0.5 }}>{h.emoji} {h.name}</span>
              </div>
            ))}
            <p style={{ marginTop: 16, fontSize: '0.8rem', color: '#a78bfa', textAlign: 'center', fontWeight: 600 }}>Vas bien, seguí</p>
          </div>
        </div>
      </section>

      {/* ── CAPTURAS REALES ── */}
      <section style={{ padding: '80px 24px', background: 'radial-gradient(ellipse at center, #130b28 0%, #0b0520 70%)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div className="tag">La app real</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
            Sin filtros. Esto es lo que vas a ver.
          </h2>
          <p style={{ color: textMuted, marginBottom: 48, fontSize: '1rem' }}>
            Capturas reales tomadas desde el celular.
          </p>
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, alignItems: 'start' }}>
            {[
              { src: '/screenshots/screenshot_1_habitos.png', label: '✏️ Tus hábitos', desc: 'Base + personales' },
              { src: '/screenshots/screenshot_2_metas.png', label: '🎯 Tus metas', desc: '30 / 90 / 180 días' },
              { src: '/screenshots/screenshot_3_tablero.png', label: '⚡ El tablero', desc: 'Hoy a primera vista' },
              { src: '/screenshots/screenshot_4_finanzas.png', label: '💰 Finanzas', desc: 'Categorías personales' },
            ].map((s) => (
              <div key={s.src} className="screenshot-item" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(139,92,246,0.22)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
                <Image
                  src={s.src}
                  alt={s.label}
                  width={300}
                  height={620}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <div style={{ padding: '10px 12px', background: bgCard, borderTop: `1px solid ${borderSubtle}`, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary }}>{s.label}</div>
                  <div style={{ fontSize: '0.7rem', color: textMuted }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(139,92,246,0.03)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 16 }}>
            ¿Cuántas veces empezaste y lo dejaste?
          </h2>
          <p style={{ color: textMuted, marginBottom: 48, fontSize: '1rem' }}>
            Casi siempre pasa lo mismo: la voluntad está, la estructura no.
          </p>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: '🔄', title: '"Empiezo y lo abandono"', desc: 'Sin sistema de racha, los hábitos se caen al tercer día.' },
              { icon: '💸', title: '"No sé a dónde se va mi plata"', desc: 'Sin registro diario, el mes termina y no entendés qué pasó.' },
              { icon: '🎯', title: '"Nunca sé bien qué quiero"', desc: 'Sin una meta escrita y con fecha, todo queda en intención.' },
            ].map((p) => (
              <div key={p.title} className="card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{p.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: textPrimary }}>{p.title}</h3>
                <p style={{ color: textMuted, fontSize: '0.875rem', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 MÓDULOS ── */}
      <section className="section">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="tag">Qué tiene</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800 }}>
            Todo en un solo lugar
          </h2>
          <p style={{ color: textMuted, marginTop: 12, fontSize: '1rem' }}>No son tres cosas por separado.</p>
        </div>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            {
              emoji: '⚡',
              title: 'Hábitos',
              color: purple,
              items: ['Ring de progreso diario', 'Racha global y por hábito', 'Historial de los últimos 30 días', 'Frecuencia personalizada por hábito'],
            },
            {
              emoji: '💰',
              title: 'Finanzas',
              color: gold,
              items: ['Ingresos, gastos y categorías', 'Inversión registrada como movimiento real', 'Balance: Libre, Gastos, Inversión', 'Análisis mensual por categoría'],
            },
            {
              emoji: '🎯',
              title: 'Metas',
              color: green,
              items: ['Sistema 30 / 90 / 180 días', 'Barra de progreso en tiempo real', 'Tareas, ideas y calendario', 'Racha como ancla de compromiso'],
            },
          ].map((mod) => (
            <div key={mod.title} className="card" style={{ borderColor: `${mod.color}33` }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${mod.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: 16 }}>
                {mod.emoji}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16, color: mod.color }}>{mod.title}</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {mod.items.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: '0.875rem', color: textMuted }}>
                    <span style={{ color: mod.color, marginTop: 2, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── METAS 30/90/180 ── */}
      <section style={{ padding: '80px 24px', background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0b0520 60%)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="tag">Sistema de metas</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
              No son buenas intenciones. Son compromisos con fecha.
            </h2>
            <p style={{ color: textMuted, fontSize: '1rem' }}>
              La mayoría de las personas no tienen objetivos claros. Vos ya vas a tener tres.
            </p>
          </div>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { emoji: '🌱', label: '30 días', question: '¿Qué cambio querés notar en un mes?', color: green, bg: `${green}12` },
              { emoji: '🚀', label: '90 días', question: '¿Qué querés haber logrado en 3 meses?', color: purple, bg: `${purple}12` },
              { emoji: '🏆', label: '180 días', question: '¿En qué persona querés convertirte en 6 meses?', color: gold, bg: `${gold}12` },
            ].map((m) => (
              <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.color}33`, borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>{m.emoji}</div>
                <div style={{ fontWeight: 800, color: m.color, fontSize: '1.1rem', marginBottom: 10 }}>{m.label}</div>
                <p style={{ color: textMuted, fontSize: '0.875rem', lineHeight: 1.5, fontStyle: 'italic' }}>{m.question}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGLA DEL 10% ── */}
      <section className="section">
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div className="tag">Finanzas personales</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 800, marginBottom: 16 }}>
              La Regla del 10%
            </h2>
            <p style={{ color: textMuted, lineHeight: 1.7, fontSize: '1rem', marginBottom: 20 }}>
              Cada día, la app calcula el 10% de lo que ganaste y te sugiere invertirlo. Lo registrás como un movimiento real — porque sale de tu bolsillo.
            </p>
            <p style={{ color: textMuted, lineHeight: 1.7, fontSize: '1rem' }}>
              La mayoría no ahorra porque nadie le dio un sistema, no porque no quiera. Esto te da el sistema.
            </p>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.72rem', color: textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hoy ganaste</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: green }}>$45.000</p>
            </div>
            <div style={{ background: `${gold}10`, border: `1px solid ${gold}30`, borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: textMuted, fontWeight: 600 }}>Regla del 10%</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, color: gold }}>$4.500 sugeridos</p>
                </div>
                <div style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${gold}40`, background: `${gold}15`, color: gold, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  📈 Registrar
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: '💚 Ingresos', value: '+$45.000', color: green },
                { label: '📈 Inversión', value: '-$4.500', color: gold },
                { label: '📊 Libre', value: '+$40.500', color: green, bold: true },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.82rem', color: textMuted }}>{row.label}</span>
                  <span style={{ fontSize: row.bold ? '0.92rem' : '0.85rem', fontWeight: row.bold ? 800 : 600, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GRATIS SIN TRAMPA ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(139,92,246,0.03)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div className="tag">Modelo de negocio</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
            Gratis. Sin cobros sorpresa. Sin letra chica.
          </h2>
          <p style={{ color: textMuted, marginBottom: 48, fontSize: '1rem', maxWidth: 480, margin: '0 auto 48px' }}>
            Hay aplicaciones que arrancan gratis y después te cobran para usar lo que prometieron. Acá es todo de entrada, sin excepciones.
          </p>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: '✅', text: 'Todos los módulos incluidos' },
              { icon: '🚫', text: 'Sin funciones bloqueadas' },
              { icon: '💳', text: 'Sin tarjeta de crédito' },
              { icon: '♾️', text: 'Sin límite de hábitos o metas' },
              { icon: '🔒', text: 'Tus datos son tuyos' },
              { icon: '🌍', text: 'Disponible en 10 idiomas' },
            ].map((item) => (
              <div key={item.text} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MULTIIDIOMA ── */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="tag">Disponible en</div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
          Para cualquier persona en el mundo
        </h2>
        <p style={{ color: textMuted, marginBottom: 40, fontSize: '1rem' }}>
          Disponible en más de 10 idiomas.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {[
            { flag: '🇦🇷', name: 'Español' },
            { flag: '🇬🇧', name: 'English' },
            { flag: '🇧🇷', name: 'Português' },
            { flag: '🇫🇷', name: 'Français' },
            { flag: '🇮🇳', name: 'हिन्दी' },
            { flag: '🇸🇦', name: 'العربية' },
            { flag: '🇨🇳', name: '中文' },
            { flag: '🇯🇵', name: '日本語' },
            { flag: '🇮🇩', name: 'Indonesia' },
            { flag: '🇷🇺', name: 'Русский' },
          ].map((lang) => (
            <div key={lang.name} style={{ background: bgCard, border: `1px solid ${borderPurple}`, borderRadius: 12, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
              <span style={{ color: textMuted }}>{lang.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── INSTALÁ COMO APP ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(139,92,246,0.03)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div className="tag">Sin tienda de aplicaciones</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
            Tenela en tu celular como una app
          </h2>
          <p style={{ color: textMuted, marginBottom: 48, fontSize: '1rem', maxWidth: 480, margin: '0 auto 48px' }}>
            No necesitás descargarla de ninguna tienda. Se instala directo desde el navegador en dos toques.
          </p>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 720, margin: '0 auto' }}>
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: '1.6rem' }}>🤖</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Android (Chrome)</span>
              </div>
              {[
                { n: '1', text: 'Abrí libre.amauta.cloud en Chrome' },
                { n: '2', text: 'Tocá los 3 puntos (⋮) arriba a la derecha' },
                { n: '3', text: 'Elegí "Instalar app" o "Agregar a pantalla de inicio"' },
                { n: '4', text: 'Tocá "Instalar" y listo' },
              ].map((step) => (
                <div key={step.n} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: gradientCTA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, color: 'white' }}>
                    {step.n}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: textMuted, lineHeight: 1.5, paddingTop: 2 }}>{step.text}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: '1.6rem' }}>🍎</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>iPhone (Safari)</span>
              </div>
              {[
                { n: '1', text: 'Abrí libre.amauta.cloud en Safari' },
                { n: '2', text: 'Tocá el botón de compartir (□↑) abajo al centro' },
                { n: '3', text: 'Deslizá y elegí "Agregar a inicio"' },
                { n: '4', text: 'Tocá "Agregar" arriba a la derecha' },
              ].map((step) => (
                <div key={step.n} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: gradientCTA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, color: 'white' }}>
                    {step.n}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: textMuted, lineHeight: 1.5, paddingTop: 2 }}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ marginTop: 32, fontSize: '0.82rem', color: '#6b7280' }}>
            Queda en tu pantalla de inicio con el ícono de Amauta Libre. Se abre como cualquier app, sin barra del navegador.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0b0520 70%)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Image src="/logo-transparent.png" alt="Amauta Libre" width={64} height={64} style={{ borderRadius: 16, marginBottom: 28, boxShadow: '0 8px 32px rgba(139,92,246,0.4)' }} />
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
            Empezá ahora.
          </h2>
          <p style={{ color: textMuted, fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.6 }}>
            Lo que hacés hoy define quién sos mañana.<br />
            Tardás 2 minutos. No necesitás contraseña.
          </p>
          <Link href="/login" className="btn-cta" style={{ padding: '18px 44px', fontSize: '1.1rem', borderRadius: 14, boxShadow: '0 12px 40px rgba(139,92,246,0.35)', margin: '0 auto' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Entrar con Google — es gratis
          </Link>

          {/* CTA secundario — Amauta Cloud */}
          <div style={{ marginTop: 32, padding: '20px 24px', borderRadius: 14, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.06)' }}>
            <p style={{ fontSize: '0.8rem', color: textMuted, marginBottom: 10 }}>
              ¿Querés más que una app? ¿Buscás mentoría personalizada con IA?
            </p>
            <a href="https://amauta.cloud/landing" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
              Conocé Amauta Cloud →
            </a>
          </div>

          <p style={{ marginTop: 24, fontSize: '0.82rem', color: '#6b7280' }}>
            Una app de <a href="https://amauta.cloud" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'none' }}>Amauta</a> — hecha en Argentina, para el mundo.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${borderSubtle}`, padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, fontSize: '0.82rem', color: textMuted }}>
          <span>© 2026 Amauta Libre</span>
          <Link href="/privacidad" style={{ color: textMuted, textDecoration: 'none' }}>Privacidad</Link>
          <Link href="/terminos" style={{ color: textMuted, textDecoration: 'none' }}>Términos</Link>
          <a href="https://amauta.cloud" target="_blank" rel="noopener noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Amauta Cloud</a>
          <a href="https://libreria.amauta.cloud" target="_blank" rel="noopener noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Librería</a>
        </div>
      </footer>

    </div>
  )
}
