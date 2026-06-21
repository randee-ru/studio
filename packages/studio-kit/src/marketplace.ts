import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ensureDir, readJson, writeJson } from './fs'
import type {
  MarketplaceAuditRecord,
  MarketplacePackageRecord,
  MarketplaceProductRecord,
  MarketplaceReleaseRecord,
  MarketplaceStoreDocument,
  PackageChannel,
} from './types'

export interface MarketplaceStoreOptions {
  rootDir: string
}

export interface CreateProductInput {
  product_id: string
  name: string
  type: MarketplaceProductRecord['type']
  vendor: string
  version: string
  channel: PackageChannel
}

export interface CreatePackageInput {
  product_id: string
  version: string
  channel: PackageChannel
  build_number: string
}

export interface CreateReleaseInput {
  package_id: string
  product_id: string
  version: string
  channel: PackageChannel
  release_notes?: string
}

export class MarketplaceStore {
  private readonly rootDir: string
  private readonly storePath: string
  private readonly uploadsDir: string

  constructor(options: MarketplaceStoreOptions) {
    this.rootDir = options.rootDir
    this.storePath = join(this.rootDir, '.studio', 'marketplace', 'store.json')
    this.uploadsDir = join(this.rootDir, '.studio', 'marketplace', 'uploads')
  }

  async read(): Promise<MarketplaceStoreDocument> {
    if (!existsSync(this.storePath)) {
      return {
        updated_at: new Date(0).toISOString(),
        products: [],
        packages: [],
        releases: []
      }
    }

    return readJson<MarketplaceStoreDocument>(this.storePath)
  }

  async write(store: MarketplaceStoreDocument): Promise<void> {
    await ensureDir(join(this.rootDir, '.studio', 'marketplace'))
    await writeJson(this.storePath, store)
  }

  async listProducts(): Promise<MarketplaceProductRecord[]> {
    return (await this.read()).products
  }

  async listPackages(): Promise<MarketplacePackageRecord[]> {
    return (await this.read()).packages
  }

  async listReleases(): Promise<MarketplaceReleaseRecord[]> {
    return (await this.read()).releases
  }

  async listAudits(): Promise<MarketplaceAuditRecord[]> {
    const auditStorePath = join(this.rootDir, '.studio', 'marketplace', 'audits.json')
    if (!existsSync(auditStorePath)) {
      return []
    }

    const data = await readJson<{ updated_at: string; audits?: MarketplaceAuditRecord[] }>(auditStorePath)
    return data.audits ?? []
  }

  async createProduct(input: CreateProductInput): Promise<MarketplaceProductRecord> {
    const store = await this.read()
    const now = new Date().toISOString()
    const existing = store.products.find((item) => item.product_id === input.product_id)
    const product: MarketplaceProductRecord = {
      id: existing?.id ?? this.makeId('product', input.product_id),
      product_id: input.product_id,
      name: input.name,
      type: input.type,
      vendor: input.vendor,
      version: input.version,
      channel: input.channel,
      created_at: existing?.created_at ?? now,
      updated_at: now
    }

    store.products = [...store.products.filter((item) => item.product_id !== input.product_id), product]
    store.updated_at = now
    await this.write(store)
    return product
  }

  async createPackage(input: CreatePackageInput): Promise<MarketplacePackageRecord> {
    const store = await this.read()
    const now = new Date().toISOString()
    const packageId = this.makeId('package', `${input.product_id}@${input.version}`)
    const record: MarketplacePackageRecord = {
      id: packageId,
      product_id: input.product_id,
      version: input.version,
      channel: input.channel,
      zip_path: '',
      zip_name: '',
      zip_sha256: '',
      zip_size: 0,
      build_number: input.build_number,
      created_at: now
    }

    store.packages.push(record)
    store.updated_at = now
    await this.write(store)
    return record
  }

  async uploadPackage(packageId: string, zipPath: string): Promise<MarketplacePackageRecord> {
    const store = await this.read()
    const index = store.packages.findIndex((item) => item.id === packageId)
    if (index < 0) {
      throw new Error(`Package not found: ${packageId}`)
    }

    const uploaded = await this.persistUpload(zipPath, packageId)
    store.packages[index] = {
      ...store.packages[index],
      zip_path: uploaded.path,
      zip_name: uploaded.name,
      zip_sha256: uploaded.sha256,
      zip_size: uploaded.size
    }
    store.updated_at = new Date().toISOString()
    await this.write(store)
    return store.packages[index]
  }

  async createRelease(input: CreateReleaseInput): Promise<MarketplaceReleaseRecord> {
    const store = await this.read()
    const now = new Date().toISOString()
    const release: MarketplaceReleaseRecord = {
      id: this.makeId('release', `${input.package_id}@${input.version}`),
      package_id: input.package_id,
      product_id: input.product_id,
      version: input.version,
      channel: input.channel,
      release_notes: input.release_notes ?? '',
      status: 'draft',
      created_at: now
    }

    store.releases.push(release)
    store.updated_at = now
    await this.write(store)
    return release
  }

  async publishRelease(releaseId: string): Promise<MarketplaceReleaseRecord> {
    const store = await this.read()
    const index = store.releases.findIndex((item) => item.id === releaseId)
    if (index < 0) {
      throw new Error(`Release not found: ${releaseId}`)
    }

    const now = new Date().toISOString()
    store.releases[index] = {
      ...store.releases[index],
      status: 'published',
      published_at: now
    }
    store.updated_at = now
    await this.write(store)
    return store.releases[index]
  }

  async createPublishAudit(record: {
    componentCode: string
    version: string
    channel: PackageChannel
    status: 'ready' | 'testing' | 'build_failed' | 'validation_failed' | 'uploading' | 'uploaded' | 'published' | 'error'
    message: string
  }): Promise<void> {
    const now = new Date().toISOString()
    const audits = await this.listAudits()
    audits.push({ id: this.makeId('audit', `${record.componentCode}@${record.version}`), created_at: now, ...record })
    const auditStorePath = join(this.rootDir, '.studio', 'marketplace', 'audits.json')
    await writeJson(auditStorePath, { updated_at: now, audits })
  }

  private async persistUpload(sourcePath: string, packageId: string): Promise<{ path: string; name: string; sha256: string; size: number }> {
    await mkdir(this.uploadsDir, { recursive: true })
    const name = join(packageId, `${packageId}.zip`).replaceAll('\\', '/')
    const targetPath = join(this.uploadsDir, `${packageId}.zip`)
    const bytes = await readFile(sourcePath)
    await writeFile(targetPath, bytes)

    const sha256 = createHash('sha256').update(bytes).digest('hex')
    return {
      path: targetPath,
      name: `${packageId}.zip`,
      sha256,
      size: bytes.byteLength
    }
  }

  private makeId(prefix: string, seed: string): string {
    const safeSeed = seed.replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    return `${prefix}_${safeSeed}_${Date.now()}`
  }
}
