import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, posix } from 'node:path'
import JSZip from 'jszip'
import { packageRoot, repoRootFrom, zipRoot } from './paths'
import type { PackageManifest, ValidationIssue, ValidationResult, TestResult } from './types'
import { buildComponentPackage } from './build'
import { packageComponentZip } from './package'

function pushIssue(issues: ValidationIssue[], severity: ValidationIssue['severity'], message: string): void {
  issues.push({ severity, message })
}

function isSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)
}

function isSafeEntry(entryName: string): boolean {
  const normalized = entryName.replaceAll('\\', '/')
  if (normalized.startsWith('/') || normalized.startsWith('\\')) return false
  return !normalized.split('/').includes('..')
}

async function readManifestFromDir(packageDir: string): Promise<PackageManifest> {
  const raw = await readFile(join(packageDir, 'package.json'), 'utf8')
  return JSON.parse(raw) as PackageManifest
}

async function inspectPackageJson(
  manifest: PackageManifest | null,
  issues: ValidationIssue[],
  entries: string[]
): Promise<void> {
  if (!manifest) {
    pushIssue(issues, 'error', 'package.json not found')
    return
  }

  const required: Array<keyof PackageManifest> = [
    'format',
    'format_version',
    'product_id',
    'type',
    'name',
    'version',
    'channel',
    'release_tag',
    'build_number',
    'install_root',
    'paths'
  ]

  for (const field of required) {
    if (manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
      pushIssue(issues, 'error', `Missing package field: ${String(field)}`)
    }
  }

  if (manifest.format !== 'randee-package') {
    pushIssue(issues, 'error', 'Invalid format, expected randee-package')
  }

  if (manifest.format_version !== '1.0') {
    pushIssue(issues, 'error', 'Invalid format_version, expected 1.0')
  }

  if (!isSemver(manifest.version)) {
    pushIssue(issues, 'error', 'Invalid semantic version')
  }

  if (typeof manifest.product_id !== 'string' || !manifest.product_id.startsWith('randee.')) {
    pushIssue(issues, 'error', 'product_id must start with randee.')
  }

  if (manifest.install_root !== 'payload') {
    pushIssue(issues, 'error', 'install_root must be payload')
  }

  if (!Array.isArray(manifest.paths) || manifest.paths.length === 0) {
    pushIssue(issues, 'error', 'paths must be a non-empty array')
  }

  const expectedRoot = expectedInstallRoot(manifest.type)
  if (expectedRoot && Array.isArray(manifest.paths)) {
    for (const path of manifest.paths) {
      if (typeof path !== 'string' || path.trim() === '') {
        pushIssue(issues, 'error', 'paths contains an empty entry')
        continue
      }

      const normalized = path.replaceAll('\\', '/').replace(/^\/+/, '')
      if (!normalized.startsWith(expectedRoot)) {
        pushIssue(issues, 'error', `Path "${normalized}" does not match type ${manifest.type}`)
      }
    }
  }

  const allowedRoot = 'payload/'
  for (const entry of entries) {
    const normalized = entry.replaceAll('\\', '/')
    if (!isSafeEntry(normalized)) {
      pushIssue(issues, 'error', `Unsafe entry path: ${normalized}`)
    }
    if (normalized !== 'package.json' && !normalized.startsWith(allowedRoot)) {
      pushIssue(issues, 'error', `Unexpected root entry: ${normalized}`)
    }
  }
}

function expectedInstallRoot(type: PackageManifest['type']): string {
  if (type === 'component') return 'local/components/'
  if (type === 'module') return 'local/modules/'
  return 'local/templates/'
}

async function inspectEntriesFromZip(zipPath: string, issues: ValidationIssue[]): Promise<PackageManifest | null> {
  const raw = await readFile(zipPath)
  const archive = await JSZip.loadAsync(raw)
  const entries = Object.keys(archive.files)
  const manifestFile = archive.file('package.json')

  if (!manifestFile) {
    pushIssue(issues, 'error', 'package.json not found in archive')
    return null
  }

  const manifest = JSON.parse(await manifestFile.async('string')) as PackageManifest
  await inspectPackageJson(manifest, issues, entries)

  for (const path of manifest.paths ?? []) {
    const normalized = posix.join('payload', path.replace(/^\/+/, ''))
    const exists = entries.some((entry) => entry === normalized || entry.startsWith(`${normalized}/`))
    if (!exists) {
      pushIssue(issues, 'error', `Missing payload path: ${path}`)
    }
  }

  return manifest
}

async function inspectEntriesFromDir(packageDir: string, issues: ValidationIssue[]): Promise<PackageManifest | null> {
  if (!existsSync(join(packageDir, 'package.json'))) {
    pushIssue(issues, 'error', 'package.json not found')
    return null
  }

  const manifest = await readManifestFromDir(packageDir)
  const entries = await collectRelativeEntries(packageDir)

  await inspectPackageJson(manifest, issues, entries)

  for (const path of manifest.paths ?? []) {
    const normalized = posix.join('payload', path.replace(/^\/+/, ''))
    const exists = entries.some((entry) => entry === normalized || entry.startsWith(`${normalized}/`))
    if (!exists) {
      pushIssue(issues, 'error', `Missing payload path: ${path}`)
    }
  }

  return manifest
}

async function collectRelativeEntries(rootDir: string): Promise<string[]> {
  const result: string[] = []
  const { readdir } = await import('node:fs/promises')
  const entries = await readdir(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    const relative = entry.name
    if (entry.isDirectory()) {
      const nested = await collectRelativeEntries(join(rootDir, entry.name))
      for (const item of nested) {
        result.push(posix.join(relative, item))
      }
      continue
    }

    result.push(relative)
  }

  return result
}

export async function validatePackageArtifact(target?: string, cwd = process.cwd()): Promise<ValidationResult> {
  const repoRoot = repoRootFrom(cwd)
  const issues: ValidationIssue[] = []
  let manifest: PackageManifest | null = null

  const resolvedTarget = target ? target : undefined
  if (!resolvedTarget) {
    const zipDir = zipRoot(repoRoot)
    if (!existsSync(zipDir)) {
      return {
        success: false,
        message: 'No package artifact found',
        issues: [{ severity: 'error', message: 'No dist/zips directory found' }]
      }
    }

    const { readdir } = await import('node:fs/promises')
    const zipFiles = (await readdir(zipDir)).filter((file) => file.endsWith('.zip'))
    if (zipFiles.length === 0) {
      return {
        success: false,
        message: 'No zip packages found',
        issues: [{ severity: 'error', message: 'No ZIP files found in dist/zips' }]
      }
    }

    for (const zipFile of zipFiles) {
      const zipPath = join(zipDir, zipFile)
      manifest = await inspectEntriesFromZip(zipPath, issues)
    }
  } else if (resolvedTarget.endsWith('.zip')) {
    manifest = await inspectEntriesFromZip(resolvedTarget, issues)
  } else {
    manifest = await inspectEntriesFromDir(resolvedTarget, issues)
  }

  const hasErrors = issues.some((issue) => issue.severity === 'error')
  return {
    success: !hasErrors,
    message: hasErrors ? 'Package validation failed' : 'Package validation passed',
    issues
  }
}

export async function testComponentPipeline(componentCode: string, cwd = process.cwd()): Promise<TestResult> {
  const report: string[] = []
  const repoRoot = repoRootFrom(cwd)
  const componentDir = packageRoot(repoRoot, componentCode)

  const sourceChecks = [
    ['component.config.json', join(repoRoot, 'components-src', componentCode, 'component.config.json')],
    ['studio.config.json', join(repoRoot, 'components-src', componentCode, 'studio.config.json')],
    ['src/main.tsx', join(repoRoot, 'components-src', componentCode, 'src', 'main.tsx')],
    ['src/App.tsx', join(repoRoot, 'components-src', componentCode, 'src', 'App.tsx')],
    ['bitrix/component.php', join(repoRoot, 'components-src', componentCode, 'bitrix', 'component.php')],
    ['bitrix/template.php', join(repoRoot, 'components-src', componentCode, 'bitrix', 'template.php')],
    ['mock/data.json', join(repoRoot, 'components-src', componentCode, 'mock', 'data.json')],
    ['data.adapter.ts', join(repoRoot, 'components-src', componentCode, 'data.adapter.ts')]
  ]

  let success = true
  for (const [label, filePath] of sourceChecks) {
    const ok = existsSync(filePath)
    report.push(`${ok ? 'OK' : 'FAIL'} ${label}`)
    if (!ok) success = false
  }

  try {
    await buildComponentPackage(componentCode, cwd)
    report.push('OK build:component')
  } catch (error) {
    success = false
    report.push(`FAIL build:component - ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    await packageComponentZip(componentCode, cwd)
    report.push('OK package:component')
  } catch (error) {
    success = false
    report.push(`FAIL package:component - ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    const validation = await validatePackageArtifact(componentDir, cwd)
    report.push(`${validation.success ? 'OK' : 'FAIL'} validate:package`)
    for (const issue of validation.issues) {
      report.push(`${issue.severity.toUpperCase()} ${issue.message}`)
    }
    if (!validation.success) {
      success = false
    }
  } catch (error) {
    success = false
    report.push(`FAIL validate:package - ${error instanceof Error ? error.message : String(error)}`)
  }

  return {
    success,
    message: success ? `Component ${componentCode} passed pipeline checks` : `Component ${componentCode} has failures`,
    report
  }
}
