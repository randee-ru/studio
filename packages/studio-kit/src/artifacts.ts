import type { ComponentConfig } from './types'

export function resolveInstallPath(config: Pick<ComponentConfig, 'code' | 'type' | 'vendor'>): string {
  if (config.type === 'component') {
    return `local/components/${config.vendor}/${config.code}`
  }

  if (config.type === 'module') {
    return `local/modules/${config.vendor}.${config.code}`
  }

  return `local/templates/${config.code}`
}

export function resolveInstallPaths(config: Pick<ComponentConfig, 'code' | 'type' | 'vendor'>): string[] {
  return [resolveInstallPath(config)]
}
