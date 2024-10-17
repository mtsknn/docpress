import React from 'react'
import { usePageContext, usePageContext2 } from './renderer/usePageContext'

export { MobileHeader }
export { MobileShowNavigationToggle }

function MobileHeader() {
  const pageContext = usePageContext()
  const pageContext2 = usePageContext2()
  return (
    <div
      id="mobile-header"
      style={{
        height: 'var(--mobile-header-height)',
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'fixed',
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          zIndex: 99,
          top: 0,
          left: 0,
          height: 'var(--mobile-header-height)',
          width: '100%',
          borderBottom: '1px solid #ddd',
        }}
      >
        <MobileShowNavigationToggle />
        <a
          href="/"
          style={{
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            textDecoration: 'none',
          }}
        >
          TODO
        </a>
      </div>
    </div>
  )
}

// TODO/refactor: rename & move
function MobileShowNavigationToggle(props?: { style?: React.CSSProperties; width?: number }) {
  const width = props?.width ?? 20
  const height = width * (22.844 / 20)
  return (
    <div style={{ padding: 20, lineHeight: 0, cursor: 'pointer', ...props?.style }} id="mobile-show-navigation-toggle">
      <svg
        style={{ width, height }}
        className="icon"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="img"
        viewBox="0 0 448 512"
      >
        <path
          fill="currentColor"
          d="M436 124H12c-6.627 0-12-5.373-12-12V80c0-6.627 5.373-12 12-12h424c6.627 0 12 5.373 12 12v32c0 6.627-5.373 12-12 12zm0 160H12c-6.627 0-12-5.373-12-12v-32c0-6.627 5.373-12 12-12h424c6.627 0 12 5.373 12 12v32c0 6.627-5.373 12-12 12zm0 160H12c-6.627 0-12-5.373-12-12v-32c0-6.627 5.373-12 12-12h424c6.627 0 12 5.373 12 12v32c0 6.627-5.373 12-12 12z"
        ></path>
      </svg>
    </div>
  )
}
