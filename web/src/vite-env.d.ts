/// <reference types="vite/client" />

declare const __APP_VERSION__: string

// fonty (side-effect CSS)
declare module '@fontsource/*'
declare module '@fontsource-variable/*'

// tasteskill charts.js (side-effect: window.Charts)
interface ChartsApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any
}
interface Window {
  Charts: ChartsApi
}
