'use client';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminFacialPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#0f172a' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '32px' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '4px' }}>Panel admin</p>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Facial cloud</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>
          Reconocimiento facial automático — requiere configurar Google Cloud Vision API
        </p>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', maxWidth: '600px' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>🤖</p>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>
            Reconocimiento facial
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6, textAlign: 'center', marginBottom: '24px' }}>
            Esta funcionalidad procesa automáticamente las fotos subidas y las compara con los vectores faciales de los usuarios registrados. Confidence score mínimo: 85%.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            {[
              { label: '1. Usuario sube selfie al registrarse', done: true },
              { label: '2. Google Cloud Vision genera vector facial', done: false },
              { label: '3. Admin sube fotos del evento', done: true },
              { label: '4. Sistema detecta rostros automáticamente', done: false },
              { label: '5. Matching con usuarios registrados', done: false },
              { label: '6. Notificación automática por email/WhatsApp', done: false },
            ].map((paso) => (
              <div key={paso.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                <span style={{ fontSize: '16px' }}>{paso.done ? '✅' : '⏳'}</span>
                <span style={{ color: paso.done ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '14px' }}>{paso.label}</span>
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '20px', textAlign: 'center' }}>
            Para activar: configura GOOGLE_CLOUD_PROJECT_ID y GOOGLE_APPLICATION_CREDENTIALS en el .env
          </p>
        </div>
      </div>
    </div>
  );
}