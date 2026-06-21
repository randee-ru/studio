import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { validatePackageArtifact } from './validate'

describe('validatePackageArtifact', () => {
  it('fails on missing package metadata', async () => {
    const root = await mkdtemp(join(tmpdir(), 'randee-studio-kit-'))
    const packageDir = join(root, 'dist', 'packages', 'slider')
    await mkdir(packageDir, { recursive: true })
    await writeFile(join(packageDir, 'package.json'), JSON.stringify({ format: 'randee-package' }), 'utf8')

    const result = await validatePackageArtifact(packageDir, root)
    expect(result.success).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })
})

