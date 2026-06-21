import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build as esbuildBuild } from 'esbuild'
import { ensureDir, copyDirectoryTree, readJson, writeJson } from './fs'
import { buildRoot, componentRoot, packageRoot, repoRootFrom } from './paths'
import { resolveInstallPath, resolveInstallPaths } from './artifacts'
import type { BuildResult, ComponentConfig, PackageChannel, PackageManifest } from './types'

function semverFromVersion(version: string): string {
  return `v${version}`
}

function buildNumber(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  const ss = String(now.getUTCSeconds()).padStart(2, '0')
  return `${y}.${m}.${d}.${hh}${mm}${ss}`
}

export async function buildComponentPackage(componentCode: string, cwd = process.cwd()): Promise<BuildResult> {
  return buildComponentPackageWithOptions(componentCode, cwd)
}

export async function buildComponentPackageWithOptions(
  componentCode: string,
  cwd = process.cwd(),
  options: { version?: string; channel?: PackageChannel } = {}
): Promise<BuildResult> {
  const repoRoot = repoRootFrom(cwd)
  const sourceRoot = componentRoot(repoRoot, componentCode)
  const packageDir = packageRoot(repoRoot, componentCode)
  const payloadRoot = buildRoot(repoRoot, componentCode)

  if (!existsSync(sourceRoot)) {
    throw new Error(`Component source not found: ${componentCode}`)
  }

  const componentConfig = await readJson<ComponentConfig>(join(sourceRoot, 'component.config.json'))
  const resolvedVersion = options.version ?? componentConfig.version
  const resolvedChannel = options.channel ?? 'stable'
  const installPath = resolveInstallPath(componentConfig)
  const componentDir = join(payloadRoot, installPath)
  const templateDistDir = join(componentDir, 'templates', '.default', 'dist')

  await ensureDir(templateDistDir)
  await copyDirectoryTree(join(sourceRoot, 'bitrix'), componentDir)

  const bundle = await esbuildBuild({
    entryPoints: [join(sourceRoot, 'src', 'main.tsx')],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    jsx: 'automatic',
    legalComments: 'none',
    outdir: join(packageDir, '_bundle'),
    loader: {
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.jpeg': 'dataurl',
      '.svg': 'dataurl',
      '.webp': 'dataurl',
      '.json': 'json'
    }
  })

  const files = new Map<string, Uint8Array>()
  for (const output of bundle.outputFiles ?? []) {
    const normalized = output.path.replaceAll('\\', '/')
    files.set(normalized.split('/').pop() ?? normalized, output.contents)
  }

  const jsFile = [...files.entries()].find(([name]) => name.endsWith('.js'))
  const cssFile = [...files.entries()].find(([name]) => name.endsWith('.css'))

  if (!jsFile) {
    throw new Error('Component bundle did not produce JavaScript output')
  }

  await ensureDir(templateDistDir)
  await writeFile(join(templateDistDir, 'app.js'), jsFile[1])
  if (cssFile) {
    await writeFile(join(templateDistDir, 'app.css'), cssFile[1])
  } else {
    await writeFile(join(templateDistDir, 'app.css'), await buildFallbackCss(sourceRoot))
  }

  const manifest: PackageManifest = {
    format: 'randee-package',
    format_version: '1.0',
    product_id: `randee.${componentConfig.code}`,
    type: componentConfig.type,
    name: componentConfig.name,
    version: resolvedVersion,
    channel: resolvedChannel,
    release_tag: semverFromVersion(resolvedVersion),
    build_number: buildNumber(),
    install_root: 'payload',
    paths: resolveInstallPaths(componentConfig)
  }

  await writeJson(join(packageDir, 'package.json'), manifest)

  return {
    success: true,
    message: `Built component package: ${componentConfig.code}`,
    componentCode,
    packageRoot: packageDir,
    payloadRoot,
    packageManifest: manifest
  }
}

async function buildFallbackCss(sourceRoot: string): Promise<string> {
  const cssPath = join(sourceRoot, 'src', 'index.css')
  if (existsSync(cssPath)) {
    return readFile(cssPath, 'utf8')
  }

  return [
    ':root { color-scheme: dark; }',
    '.randee-slider-shell { min-height: 100%; }'
  ].join('\n')
}
