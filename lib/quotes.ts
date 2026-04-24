export const quotes: string[] = [
  // Semana 1 — Reconocimiento
  'La riqueza no arranca con plata. Arranca con cómo pensás cuando te levantás.',
  'La pobreza más dura no es la falta de plata. Es creer que la abundancia es para otros.',
  'La escasez y la abundancia son dos historias. Vos elegís cuál contarte hoy.',
  'Lo que enfocás, crece. Elegí bien qué mirás hoy.',
  'El dinero no es malo ni bueno. Es un símbolo. Lo que cargás sobre él, eso sí importa.',
  'Cada pensamiento que repetís se va grabando. Elegí los que te construyan.',
  'Tu vida de hoy vino de lo que pensabas ayer. Tu vida de mañana, de lo que pensás ahora.',

  // Semana 2 — Posibilidad
  'Viniste a expresar lo mejor de vos, no a sobrevivir. Hay una diferencia enorme.',
  'Fuiste hecho para la plenitud, no para la conformidad.',
  'Ser rico no va en contra de ser buena persona. La abundancia y la bondad no se excluyen.',
  'Hay algo en vos que sabe más de lo que tu cabeza puede ver. Aprendé a escucharlo.',
  'Pedir con fe no es debilidad. Es confiar en que hay caminos que todavía no ves.',
  'Cada idea que sostenés con emoción tiende a volverse real. ¿Qué ideas sostenés hoy?',
  'Tu mente no distingue entre lo que ya pasó y lo que imaginás vívidamente. Úsala a tu favor.',

  // Semana 3 — Herramientas
  'Lo que imaginás con claridad y sentís como real, tu mente lo toma como una orden.',
  'La imaginación no es escapismo. Es donde todo cambio empieza antes de volverse real.',
  "Tu mente más profunda no entiende el 'voy a intentar'. Solo ejecuta lo que le decís con convicción.",
  'Perdonar no es hacer las paces con quien te lastimó. Es soltar el peso que cargás vos.',
  'Envidiar es rezar para que el otro pierda. Desear lo mismo para vos, eso sí funciona.',
  'El éxito de otros no te quita nada. Celebrarlo es decirle al universo que vos también querés.',
  'La fe y el miedo no pueden convivir en la misma mente. Uno desplaza al otro. Vos elegís cuál.',

  // Semana 4 — Identidad
  'Asumir responsabilidad no significa culparte. Significa reconocer que tenés poder para cambiar.',
  'La mente enfocada en soluciones encuentra opciones. La que se enfoca en problemas, más problemas.',
  'Un hábito pequeño repetido con constancia vence a un plan brillante ejecutado una vez.',
  'La autoconfianza no viene de logros pasados. Viene de confiar en tu capacidad actual.',
  'Cambiar de hábito es cambiar de programa. Tu mente aprende por repetición.',
  'La armonía que sentís por dentro es la que creás por fuera. Empezá ahí.',
  'El amor no es solo un sentimiento. Es la fuerza que mantiene en orden todo lo que importa.',
  'Un pensamiento de abundancia repetido hoy es una semilla plantada para mañana.',
  'Un mes de pensar diferente no es el final. Es quién sos ahora.',
]

export function getQuoteOfDay(): string {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return quotes[dayOfYear % quotes.length]
}
