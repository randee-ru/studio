import { describe, expect, it } from 'vitest'
import { buildComponentPackage, packageComponentZip, validatePackageArtifact } from './index'

const artifacts = ['slider', 'menu', 'legacy'] as const

describe('artifact pipeline', () => {
  for (const artifact of artifacts) {
    it(`builds, packages and validates ${artifact}`, async () => {
      const build = await buildComponentPackage(artifact)
      expect(build.success).toBe(true)

      const zip = await packageComponentZip(artifact)
      expect(zip.success).toBe(true)

      const validation = await validatePackageArtifact(build.packageRoot)
      expect(validation.success).toBe(true)
      expect(validation.issues.find((issue) => issue.severity === 'error')).toBeUndefined()
    })
  }
})
