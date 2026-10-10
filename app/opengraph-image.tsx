import { ImageResponse } from 'next/og';

export const alt = 'Pluteo - Arapski parfemi i oud mirisi | Hrvatska';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same mark as app/icon.svg
const LOGO_PATH =
  'M314.63,460l-16.79,15.8L281,459.91c-15.37,11.8-32.1,18.76-51.62,16.78-17.47-1.78-32.47-11.68-41.38-20.1,19.85-19.73,55-33.44,93.21-4.09l12.45-11.76c-12.36-14.59-19.83-30.62-16.91-50,2-13,11.59-30.14,21.07-37.84,18.91,17.75,35.64,51.53,4.32,88.15l12.48,11.5c37.91-29.49,73.05-15.5,93.21,3.69C388.67,475.13,353.05,489.69,314.63,460Zm-16.77-23.77c22.2-24.92,19.73-53.28-.16-74.72C277.07,385,276.7,412.94,297.86,436.19Zm100.75,20.08c-25.47-20.74-55.37-19.08-78.38,0C343.75,475.54,374.35,476.59,398.61,456.27Zm-123-.12c-11.49-9.33-29.11-17-46.39-14.43-12,1.76-22.56,6.8-32.07,14.47C220.58,476.18,251.48,476,275.56,456.15Zm22.31,11.38,11.91-11.25-11.94-11.39-12,11.43a7.4,7.4,0,0,0,.74.89Z';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1d1d1b',
          color: '#f5efe6',
        }}
      >
        <svg width="260" height="147" viewBox="0 0 219.83 124.17">
          <path d={LOGO_PATH} fill="#c9a96e" transform="translate(-187.96 -352.86)" />
        </svg>
        <div style={{ fontSize: 96, letterSpacing: 18, marginTop: 36 }}>PLUTEO</div>
        <div style={{ width: 120, height: 2, background: '#c9a96e', margin: '28px 0' }} />
        <div style={{ fontSize: 40 }}>Arapski parfemi i oud mirisi</div>
        <div style={{ fontSize: 28, marginTop: 16, opacity: 0.75 }}>
          Lattafa · Armaf · French Avenue · Dostava diljem Hrvatske
        </div>
      </div>
    ),
    size
  );
}
