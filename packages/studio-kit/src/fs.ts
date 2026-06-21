import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

export async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw) as T
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await ensureDir(dirname(path))
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function copyFileText(source: string, target: string): Promise<void> {
  await ensureDir(dirname(target))
  await writeFile(target, await readFile(source, 'utf8'), 'utf8')
}

export async function copyFileBinary(source: string, target: string): Promise<void> {
  await ensureDir(dirname(target))
  await writeFile(target, await readFile(source))
}

export async function copyDirectoryTree(sourceDir: string, targetDir: string): Promise<void> {
  await ensureDir(targetDir)
  const entries = await readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name)
    const targetPath = join(targetDir, entry.name)

    if (entry.isDirectory()) {
      await copyDirectoryTree(sourcePath, targetPath)
      continue
    }

    await copyFileBinary(sourcePath, targetPath)
  }
}

export async function removeDir(path: string): Promise<void> {
  if (existsSync(path)) {
    await rm(path, { recursive: true, force: true })
  }
}

export function pathExists(path: string): boolean {
  return existsSync(path)
}

