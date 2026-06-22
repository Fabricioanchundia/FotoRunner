'use client';

interface LoadingScreenProps {
  variant?: 'cliente' | 'admin';
}

export default function LoadingScreen({ variant = 'cliente' }: LoadingScreenProps) {
  const dark = variant === 'admin';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backgroundColor: dark ? '#16142a' : 'white',
      gap: '18px',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        backgroundColor: dark ? 'rgba(129,140,248,0.12)' : '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fr-pulse 1.4s ease-in-out infinite',
      }}>
        <img src="/Logo.png" alt="FotoRunner" style={{ width: '38px', height: '38px', objectFit: 'contain' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
      <p style={{
        fontSize: '13px', fontWeight: 600, letterSpacing: '1px',
        color: dark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
      }}>
        Cargando...
      </p>
      <style>{`
        @keyframes fr-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.94); }
        }
      `}</style>
    </div>
  );
}