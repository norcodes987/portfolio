import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#059669',
        }}
      >
        <svg width="320" height="320" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 17 10 11l4 4 6-7" />
          <path d="M15 5h5v5" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
