import type { Config, ImportString } from 'vike/types'
import type { Exports } from './config/resolvePageContext'

export default {
  // @ts-ignore Remove this ts-ignore once Vike's new version is released.
  name: '@brillout/docpress',
  onRenderHtml: 'import:@brillout/docpress/renderer/onRenderHtml:onRenderHtml',
  onRenderClient: 'import:@brillout/docpress/renderer/onRenderClient:onRenderClient',
  onBeforeRender: 'import:@brillout/docpress/renderer/onBeforeRender:onBeforeRender',
  Layout: 'import:@brillout/docpress/Layout:Layout',
  clientRouting: true,
  hydrationCanBeAborted: true,
  passToClient: ['pageContextResolved'],
  meta: {
    Layout: {
      env: { client: true, server: true },
    },
    TopNavigation: {
      env: { client: true, server: true },
    },
  },
  prefetch: {
    staticAssets: 'hover',
    pageContext: Infinity,
  },
} satisfies Config

type ReactComponent = () => JSX.Element
declare global {
  namespace Vike {
    interface PageContext {
      Page: ReactComponent
      exports: Exports
    }
    interface Config {
      Layout?: ReactComponent | null | ImportString
      TopNavigation?: ReactComponent
    }
  }
}
