export type ComponentKind = 'component' | 'module' | 'template'
export type PackageChannel = 'stable' | 'beta' | 'hotfix' | 'dev'
export type ValidationSeverity = 'info' | 'warning' | 'error'
export type StudioPreviewMode = 'mock' | 'json' | 'bitrix-connector' | 'bitrix-site' | 'bitrix-iblock'

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
  defaultDataSourceMode?: StudioPreviewMode
  dataSourceModes?: StudioPreviewMode[]
  connectorEndpoint?: string
  connectorIblockId?: number
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

export interface MarketplaceProductRecord {
  id: string
  product_id: string
  name: string
  type: ComponentKind
  vendor: string
  version: string
  channel: PackageChannel
  created_at: string
  updated_at: string
}

export interface MarketplacePackageRecord {
  id: string
  product_id: string
  version: string
  channel: PackageChannel
  zip_path: string
  zip_name: string
  zip_sha256: string
  zip_size: number
  build_number: string
  created_at: string
}

export interface MarketplaceReleaseRecord {
  id: string
  package_id: string
  product_id: string
  version: string
  channel: PackageChannel
  release_notes: string
  status: 'draft' | 'published'
  created_at: string
  published_at?: string
}

export interface MarketplaceAuditRecord {
  id: string
  componentCode: string
  version: string
  channel: PackageChannel
  status: 'ready' | 'testing' | 'build_failed' | 'validation_failed' | 'uploading' | 'uploaded' | 'published' | 'error'
  message: string
  created_at: string
}

export interface MarketplaceStoreDocument {
  updated_at: string
  products: MarketplaceProductRecord[]
  packages: MarketplacePackageRecord[]
  releases: MarketplaceReleaseRecord[]
  audits?: MarketplaceAuditRecord[]
}
