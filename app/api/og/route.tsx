import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Dynamic OG images for deals (spec §9): price slash + "found in {city}".
 * /api/og?name=...&original=149.00&price=0.01&city=Calgary,%20AB&retailer=Home%20Depot
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const name = (p.get('name') ?? 'Penny Deal').slice(0, 80);
  const original = p.get('original');
  const price = p.get('price') ?? '$0.01';
  const city = p.get('city');
  const retailer = p.get('retailer');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fbf6f0 0%, #f5e9db 100%)',
          padding: 64,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 40 }}>🪙</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#B87333' }}>PennyRadar</div>
          <div style={{ fontSize: 28, color: '#78716c' }}>Canada</div>
          {retailer ? (
            <div
              style={{
                marginLeft: 'auto',
                fontSize: 26,
                color: '#57534e',
                background: '#ffffff',
                padding: '8px 20px',
                borderRadius: 999,
              }}
            >
              {retailer}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: '#1c1917', lineHeight: 1.15 }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 28 }}>
            {original ? (
              <div style={{ fontSize: 48, color: '#a8a29e', textDecoration: 'line-through' }}>{original}</div>
            ) : null}
            <div style={{ fontSize: 96, fontWeight: 800, color: '#B87333' }}>{price}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 30, color: '#57534e' }}>{city ? `📍 Found in ${city}` : 'Community-reported penny deal'}</div>
          <div style={{ fontSize: 24, color: '#a8a29e' }}>Live list → pennyradar.ca</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
