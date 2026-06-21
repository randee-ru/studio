import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import JSZip from 'jszip'
import { ensureDir, readJson } from './fs'
import { packageRoot, repoRootFrom, zipRoot } from './paths'
import { buildComponentPackage } from './build'
import type { PackageResult } from './types'

export async function packageComponentZip(componentCode: string, cwd = process.cwd()): Promise<PackageResult> {
  const repoRoot = repoRootFrom(cwd)
  const packageDir = packageRoot(repoRoot, componentCode)

  if (!existsSync(join(packageDir, 'package.json'))) {
    await buildComponentPackage(componentCode, cwd)
  }

  const manifest = await readJson<{ version: string }>(join(packageDir, 'package.json'))
  const zip = new JSZip()
  const files = await collectFiles(packageDir)

  for (const file of files) {
    const relativePath = file.relativePath.replaceAll('\\', '/')
    zip.file(relativePath, await readFile(file.absolutePath))
  }

  const outputDir = zipRoot(repoRoot)
  await ensureDir(outputDir)
  const zipPath = join(outputDir, `randee.${componentCode}-${manifest.version}.zip`)
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  await writeFile(zipPath, buffer)

  return {
    success: true,
    message: `Packaged component ZIP: ${componentCode}`,
    zipPath,
    packageRoot: packageDir
  }
}

async function collectFiles(rootDir: string): Promise<Array<{ absolutePath: string; relativePath: string }>> {
  const result: Array<{ absolutePath: string; relativePath: string }> = []
  const entries = await import('node:fs/promises').then((mod) => mod.readdir(rootDir, { withFileTypes: true }))

  for (const entry of entries) {
    const absolutePath = join(rootDir, entry.name)
    if (entry.isDirectory()) {
      const nested = await collectFiles(absolutePath)
      for (const file of nested) {
        result.push({
          absolutePath: file.absolutePath,
          relativePath: join(entry.name, file.relativePath)
        })
      }
      continue
    }

    result.push({
      absolutePath,
      relativePath: entry.name
    })
  }

  return result
}

