export default function PrivacidadPage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Política de Privacidad
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '2rem' }}>Última actualización: abril 2025</p>

      {[
        {
          titulo: '¿Qué datos recopilamos?',
          texto: 'Al iniciar sesión con Google recopilamos tu nombre, dirección de email y foto de perfil. Adicionalmente guardamos los datos que vos ingresás en la app: hábitos registrados, tareas y progreso educativo.',
        },
        {
          titulo: '¿Para qué usamos tus datos?',
          texto: 'Exclusivamente para mostrarte tu propio panel dentro de la app. No vendemos ni compartimos tus datos con terceros. Los datos de hábitos, tareas y progreso son estrictamente personales y solo vos los podés ver.',
        },
        {
          titulo: 'Publicidad',
          texto: 'Amauta Libre puede mostrar publicidad de terceros (Google AdSense) para sostener el servicio gratuito. Estos servicios pueden usar cookies para mostrar anuncios relevantes según tu navegación general. Podés optar por no recibir publicidad personalizada en la configuración de tu cuenta de Google.',
        },
        {
          titulo: 'Cookies',
          texto: 'Usamos cookies de sesión para mantener tu login activo. No usamos cookies de seguimiento propias más allá de lo necesario para el funcionamiento de la app.',
        },
        {
          titulo: 'Eliminar tu cuenta',
          texto: 'Podés solicitar la eliminación completa de tu cuenta y todos tus datos escribiéndonos a amauta.iiaa@gmail.com. Procesamos las solicitudes en menos de 72 horas.',
        },
        {
          titulo: 'Contacto',
          texto: 'Para cualquier consulta sobre privacidad: amauta.iiaa@gmail.com',
        },
      ].map(({ titulo, texto }) => (
        <div key={titulo} style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ color: '#a78bfa', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{titulo}</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.7 }}>{texto}</p>
        </div>
      ))}
    </div>
  )
}
