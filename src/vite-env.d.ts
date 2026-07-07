declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  type ComponentProps = Record<string, unknown>
  type ComponentEmits = Record<string, unknown[]>
  const component: DefineComponent<ComponentProps, ComponentEmits, unknown>
  export default component
}
