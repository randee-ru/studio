import { join, resolve } from 'node:path'

export function repoRootFrom(cwd = process.cwd()): string {
  return resolve(cwd)
}

export function componentRoot(repoRoot: string, componentCode: string): string {
  return join(repoRoot, 'components-src', componentCode)
}

export function distRoot(repoRoot: string): string {
  return join(repoRoot, 'dist')
}

export function packageRoot(repoRoot: string, componentCode: string): string {
  return join(distRoot(repoRoot), 'packages', componentCode)
}

export function zipRoot(repoRoot: string): string {
  return join(distRoot(repoRoot), 'zips')
}

export function buildRoot(repoRoot: string, componentCode: string): string {
  return join(packageRoot(repoRoot, componentCode), 'payload')
}

