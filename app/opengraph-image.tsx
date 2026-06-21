import { ImageResponse } from 'next/og';

export const alt = "It's Called Football. Period.";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            padding: '40px 60px',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 75, marginBottom: '10px' }}>🟥</div>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '-0.05em',
              margin: 0,
            }}
          >
            IT&apos;S CALLED FOOTBALL.
          </h1>
          <p
            style={{
              fontSize: 20,
              color: '#a1a1aa',
              marginTop: '15px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            The global database of etymological accuracy
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
