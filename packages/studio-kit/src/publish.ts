import { buildComponentPackageWithOptions } from './build'
import { packageComponentZip } from './package'
import { testComponentPipeline, validatePackageArtifact } from './validate'
import { readJson } from './fs'
import { componentRoot, repoRootFrom } from './paths'
import { MarketplaceStore } from './marketplace'
import type { BuildResult, PackageChannel, PackageManifest, TestResult, ValidationResult } from './types'

export interface PublishComponentInput {
  type: 'component' | 'module' | 'template'
  code: string
  version: string
  channel: PackageChannel
}

export interface PublishComponentResult {
  success: boolean
  status: 'published' | 'error'
  message: string
  test: TestResult
  build: BuildResult
  validation: ValidationResult
  productId: string
  packageId: string
  releaseId: string
  zipPath: string
}

export async function publishArtifact(input: PublishComponentInput, cwd = process.cwd()): Promise<PublishComponentResult> {
  const repoRoot = repoRootFrom(cwd)
  const sourceRoot = componentRoot(repoRoot, input.code)
  const config = await readJson<{ id: string; name: string; code: string; version: string; type: 'component' | 'module' | 'template'; vendor: string }>(
    `${sourceRoot}/component.config.json`
  )

  const store = new MarketplaceStore({ rootDir: repoRoot })
  await store.createPublishAudit({
    componentCode: input.code,
    version: input.version,
    channel: input.channel,
    status: 'ready',
    message: 'Publish request accepted'
  })

  const test = await testComponentPipeline(input.code, cwd)
  await store.createPublishAudit({
    componentCode: input.code,
    version: input.version,
    channel: input.channel,
    status: 'testing',
    message: test.success ? 'Tests passed' : 'Tests failed'
  })

  if (!test.success) {
    await store.createPublishAudit({
      componentCode: input.code,
      version: input.version,
      channel: input.channel,
      status: 'build_failed',
      message: test.message
    })

    const build = await buildComponentPackageWithOptions(input.code, cwd, {
      version: input.version,
      channel: input.channel
    })
    const validation = await validatePackageArtifact(build.packageRoot, cwd)
    const zip = await packageComponentZip(input.code, cwd)

    return {
      success: false,
      status: 'error',
      message: 'Test failed',
      test,
      build,
      validation,
      productId: build.packageManifest.product_id,
      packageId: '',
      releaseId: '',
      zipPath: zip.zipPath
    }
  }

  const build = await buildComponentPackageWithOptions(input.code, cwd, {
    version: input.version,
    channel: input.channel
  })
  const zip = await packageComponentZip(input.code, cwd)
  const validation = await validatePackageArtifact(build.packageRoot, cwd)

  if (!validation.success) {
    await store.createPublishAudit({
      componentCode: input.code,
      version: input.version,
      channel: input.channel,
      status: 'validation_failed',
      message: 'Validation failed'
    })

    return {
      success: false,
      status: 'error',
      message: 'Validation failed',
      test,
      build,
      validation,
      productId: build.packageManifest.product_id,
      packageId: '',
      releaseId: '',
      zipPath: zip.zipPath
    }
  }

  const product = await store.createProduct({
    product_id: build.packageManifest.product_id,
    name: config.name,
    type: input.type,
    vendor: config.vendor,
    version: input.version,
    channel: input.channel
  })

  await store.createPublishAudit({
    componentCode: input.code,
    version: input.version,
    channel: input.channel,
    status: 'uploading',
    message: 'Uploading package'
  })

  const pkg = await store.createPackage({
    product_id: product.product_id,
    version: input.version,
    channel: input.channel,
    build_number: build.packageManifest.build_number
  })

  await store.uploadPackage(pkg.id, zip.zipPath)
  await store.createPublishAudit({
    componentCode: input.code,
    version: input.version,
    channel: input.channel,
    status: 'uploaded',
    message: 'Package uploaded'
  })

  const release = await store.createRelease({
    package_id: pkg.id,
    product_id: product.product_id,
    version: input.version,
    channel: input.channel,
    release_notes: `${config.name} ${input.version}`
  })
  await store.publishRelease(release.id)
  await store.createPublishAudit({
    componentCode: input.code,
    version: input.version,
    channel: input.channel,
    status: 'published',
    message: 'Release published'
  })

  return {
    success: true,
    status: 'published',
    message: 'Published to marketplace',
    test,
    build,
    validation,
    productId: product.product_id,
    packageId: pkg.id,
    releaseId: release.id,
    zipPath: zip.zipPath
  }
}

export const publishComponent = publishArtifact
