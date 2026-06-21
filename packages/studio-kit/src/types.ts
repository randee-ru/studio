export type ComponentKind = 'component' | 'module' | 'template'
export type PackageChannel = 'stable' | 'beta' | 'hotfix' | 'dev'
export type ValidationSeverity = 'info' | 'warning' | 'error'

export interface ComponentConfig {
  id: string
  name: string
  code: string
  version: string
  type: ComponentKind
  vendor: string
}

export interface StudioConfig {
  id: string
  title: string
  componentCode: string
  mode: 'design-preview' | 'content-preview' | 'qa' | 'package'
  previewViewports: Array<{
    id: 'desktop' | 'tablet' | 'mobile'
    width: number
    label: string
  }>
}

export interface PackageManifest {
  format: 'randee-package'
  format_version: '1.0'
  product_id: string
  type: ComponentKind
  name: string
  version: string
  channel: PackageChannel
  release_tag: string
  build_number: string
  install_root: 'payload'
  paths: string[]
}

export interface ValidationIssue {
  severity: ValidationSeverity
  message: string
}

export interface ValidationResult {
  success: boolean
  message: string
  issues: ValidationIssue[]
}

export interface BuildResult {
  success: boolean
  message: string
  componentCode: string
  packageRoot: string
  payloadRoot: string
  packageManifest: PackageManifest
}

export interface PackageResult {
  success: boolean
  message: string
  zipPath: string
  packageRoot: string
}

export interface TestResult {
  success: boolean
  message: string
  report: string[]
}

