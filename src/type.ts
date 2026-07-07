export interface ButtonAttrs {
  onClick?: () => Promise<void> | void
  [key: string]: any
}
