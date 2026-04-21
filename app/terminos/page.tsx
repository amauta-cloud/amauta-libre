export default function TerminosPage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Términos de Uso
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '2rem' }}>Última actualización: abril 2026</p>

      {[
        {
          titulo: '1. Aceptación de los términos',
          texto: 'Al acceder y usar Amauta Libre aceptás estos términos. Si no estás de acuerdo con alguna parte, no uses la aplicación.',
        },
        {
          titulo: '2. Descripción del servicio',
          texto: 'Amauta Libre es una aplicación gratuita de coaching personal que te permite registrar hábitos, finanzas personales, metas, tareas y acceder a contenido educativo. El servicio se ofrece "tal como está" y puede modificarse o discontinuarse en cualquier momento.',
        },
        {
          titulo: '3. Cuenta de usuario',
          texto: 'Para usar Amauta Libre necesitás una cuenta de Google. Sos responsable de mantener la confidencialidad de tu cuenta y de todas las actividades que ocurran bajo ella. Si detectás uso no autorizado, notificanos a amauta.iiaa@gmail.com.',
        },
        {
          titulo: '4. Uso aceptable',
          texto: 'Te comprometés a usar Amauta Libre solo para fines personales y lícitos. Está prohibido intentar acceder a datos de otros usuarios, realizar ingeniería inversa de la aplicación, usar la app para actividades ilegales, o sobrecargar intencionalmente los servidores.',
        },
        {
          titulo: '5. Propiedad intelectual',
          texto: 'El contenido educativo incluido en Amauta Libre (textos de libros, audios, materiales) está referenciado con fines educativos sin ánimo de lucro. Los derechos de cada obra pertenecen a sus respectivos autores y editoriales. Amauta Libre no reclama propiedad sobre ese contenido.',
        },
        {
          titulo: '6. Tus datos',
          texto: 'Los datos que ingresás (hábitos, finanzas, metas) son tuyos. No los vendemos ni compartimos con terceros. Podés solicitar la eliminación completa de tu cuenta y todos tus datos en cualquier momento desde la configuración de la app.',
        },
        {
          titulo: '7. Publicidad',
          texto: 'Amauta Libre puede mostrar publicidad de terceros (Google AdSense) para financiar el servicio gratuito. La publicidad está sujeta a las políticas de privacidad de Google. No tenemos control sobre los anuncios específicos que se muestran.',
        },
        {
          titulo: '8. Limitación de responsabilidad',
          texto: 'Amauta Libre se provee "tal como está". No garantizamos disponibilidad continua ni ausencia de errores. No somos responsables por pérdida de datos, lucro cesante u otros daños indirectos derivados del uso de la aplicación.',
        },
        {
          titulo: '9. Modificaciones',
          texto: 'Podemos actualizar estos términos en cualquier momento. Te notificaremos por email ante cambios significativos. El uso continuado de la app después de los cambios implica aceptación de los nuevos términos.',
        },
        {
          titulo: '10. Jurisdicción',
          texto: 'Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será resuelta en los tribunales competentes de la Ciudad Autónoma de Buenos Aires.',
        },
        {
          titulo: 'Contacto',
          texto: 'Consultas sobre estos términos: amauta.iiaa@gmail.com',
        },
      ].map(({ titulo, texto }) => (
        <div key={titulo} style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ color: '#a78bfa', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{titulo}</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.7 }}>{texto}</p>
        </div>
      ))}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem', marginTop: '1rem' }}>
        <a href="/privacidad" style={{ color: '#7c3aed', fontSize: '0.8rem', textDecoration: 'none' }}>
          Ver Política de Privacidad →
        </a>
      </div>
    </div>
  )
}
