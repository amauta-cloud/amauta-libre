export default function Loading() {
  return (
    <div style={{
      maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '1rem',
    }}>
      <div style={{ height: '28px', width: '160px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: '140px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: '64px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  )
}
