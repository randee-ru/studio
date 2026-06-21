import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { MarketplaceStore } from '../../../packages/studio-kit/src/marketplace'
import { buildComponentPackageWithOptions } from '../../../packages/studio-kit/src/build'
import { packageComponentZip } from '../../../packages/studio-kit/src/package'
import { publishArtifact } from '../../../packages/studio-kit/src/publish'
import { componentRoot } from '../../../packages/studio-kit/src/paths'
import { testComponentPipeline, validatePackageArtifact } from '../../../packages/studio-kit/src/validate'

export interface ApiServerOptions {
  rootDir?: string
  marketplaceApiToken?: string
}

function readBearerToken(req: Request): string {
  return (req.header('x-marketplace-api-token') ?? req.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
}

function requireToken(expected: string | undefined, req: Request, res: Response): boolean {
  if (!expected) return true
  const received = readBearerToken(req)
  if (received !== expected) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Field "${field}" is required`)
  }
  return value.trim()
}

function asChannel(value: unknown): 'stable' | 'beta' | 'hotfix' | 'dev' {
  const channel = asString(value, 'channel')
  if (channel === 'stable' || channel === 'beta' || channel === 'hotfix' || channel === 'dev') {
    return channel
  }
  throw new Error('Field "channel" must be one of: stable, beta, hotfix, dev')
}

function asType(value: unknown): 'component' | 'module' | 'template' {
  const type = asString(value, 'type')
  if (type === 'component' || type === 'module' || type === 'template') return type
  throw new Error('Field "type" must be one of: component, module, template')
}

export function createApiApp(options: ApiServerOptions = {}) {
  const rootDir = options.rootDir ?? process.cwd()
  const marketplaceApiToken = options.marketplaceApiToken ?? process.env.MARKETPLACE_API_TOKEN
  const store = new MarketplaceStore({ rootDir })
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/api/admin/products', async (_req, res) => {
    res.json({ products: await store.listProducts() })
  })

  app.post('/api/admin/products', async (req, res) => {
    if (!requireToken(marketplaceApiToken, req, res)) return

    try {
      const product = await store.createProduct({
        product_id: asString(req.body.product_id, 'product_id'),
        name: asString(req.body.name, 'name'),
        type: asType(req.body.type),
        vendor: asString(req.body.vendor, 'vendor'),
        version: asString(req.body.version, 'version'),
        channel: asChannel(req.body.channel)
      })
      res.status(201).json({ product })
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Product error' })
    }
  })

  app.get('/api/admin/packages', async (_req, res) => {
    res.json({ packages: await store.listPackages() })
  })

  app.post('/api/admin/packages', async (req, res) => {
    if (!requireToken(marketplaceApiToken, req, res)) return

    try {
      const record = await store.createPackage({
        product_id: asString(req.body.product_id, 'product_id'),
        version: asString(req.body.version, 'version'),
        channel: asChannel(req.body.channel),
        build_number: asString(req.body.build_number, 'build_number')
      })
      res.status(201).json({ package: record })
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Package error' })
    }
  })

  app.post('/api/admin/packages/upload', express.raw({ type: ['application/octet-stream', 'application/zip', 'application/x-zip-compressed'], limit: '200mb' }), async (req, res) => {
    if (!requireToken(marketplaceApiToken, req, res)) return

    try {
      const packageId = asString(req.header('x-package-id'), 'x-package-id')
      const fileName = (req.header('x-file-name') ?? `${packageId}.zip`).trim()
      const uploadDir = join(rootDir, '.studio', 'marketplace', 'incoming')
      const sourcePath = join(uploadDir, fileName)
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from([])
      if (body.byteLength === 0) {
        throw new Error('ZIP payload is empty')
      }

      await mkdir(uploadDir, { recursive: true })
      await writeFile(sourcePath, body)

      const updated = await store.uploadPackage(packageId, sourcePath)
      res.status(201).json({ package: updated })
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Upload error' })
    }
  })

  app.get('/api/admin/releases', async (_req, res) => {
    res.json({ releases: await store.listReleases() })
  })

  app.post('/api/admin/releases', async (req, res) => {
    if (!requireToken(marketplaceApiToken, req, res)) return

    try {
      const release = await store.createRelease({
        package_id: asString(req.body.package_id, 'package_id'),
        product_id: asString(req.body.product_id, 'product_id'),
        version: asString(req.body.version, 'version'),
        channel: asChannel(req.body.channel),
        release_notes: typeof req.body.release_notes === 'string' ? req.body.release_notes : ''
      })
      res.status(201).json({ release })
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Release error' })
    }
  })

  app.post('/api/admin/releases/:id/publish', async (req, res) => {
    if (!requireToken(marketplaceApiToken, req, res)) return

    try {
      const release = await store.publishRelease(req.params.id)
      res.json({ release })
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Publish error' })
    }
  })

  app.get('/api/studio/marketplace', async (_req, res) => {
    res.json({
      products: await store.listProducts(),
      packages: await store.listPackages(),
      releases: await store.listReleases(),
      audits: await store.listAudits()
    })
  })

  app.post('/api/studio/test', async (req, res) => {
    try {
      const code = asString(req.body.code, 'code')
      const result = await testComponentPipeline(code, rootDir)
      res.json(result)
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Test error' })
    }
  })

  app.post('/api/studio/build', async (req, res) => {
    try {
      const code = asString(req.body.code, 'code')
      const result = await buildComponentPackageWithOptions(code, rootDir, {
        version: typeof req.body.version === 'string' ? req.body.version : undefined,
        channel: typeof req.body.channel === 'string' ? asChannel(req.body.channel) : undefined
      })
      res.json(result)
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Build error' })
    }
  })

  app.post('/api/studio/package', async (req, res) => {
    try {
      const code = asString(req.body.code, 'code')
      const result = await packageComponentZip(code, rootDir)
      res.json(result)
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Package error' })
    }
  })

  app.post('/api/studio/validate', async (req, res) => {
    try {
      const code = asString(req.body.code, 'code')
      const result = await validatePackageArtifact(componentRoot(rootDir, code), rootDir)
      res.json({ code, ...result })
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Validate error' })
    }
  })

  app.post('/api/studio/publish', async (req, res) => {
    try {
      const result = await publishArtifact({
        type: asType(req.body.type),
        code: asString(req.body.code, 'code'),
        version: asString(req.body.version, 'version'),
        channel: asChannel(req.body.channel)
      }, rootDir)

      if (!result.success) {
        return res.status(400).json(result)
      }

      res.json({
        success: true,
        status: result.status,
        productId: result.productId,
        packageId: result.packageId,
        releaseId: result.releaseId,
        zipPath: result.zipPath
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Publish error'
      })
    }
  })

  return app
}

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 4010)
  const rootDir = process.cwd()
  const app = createApiApp({
    rootDir,
    marketplaceApiToken: process.env.MARKETPLACE_API_TOKEN
  })

  const server = createServer(app)
  server.listen(port, () => {
    process.stdout.write(`Randee Studio API listening on http://localhost:${port}\n`)
  })
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] === currentFile) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
