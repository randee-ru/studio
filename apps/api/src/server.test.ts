import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { describe, expect, it } from 'vitest'
import { createApiApp } from './server'

async function listen(app: ReturnType<typeof createApiApp>): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer(app)
  await new Promise<void>((resolve) => {
    server.listen(0, resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind server')
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
}

describe('studio api', () => {
  it('publishes via studio endpoint', async () => {
    const root = await mkdtemp(join(tmpdir(), 'randee-studio-api-'))
    const app = createApiApp({ rootDir: root })
    const server = await listen(app)

    try {
      await mkdir(join(root, 'components-src', 'slider', 'mock'), { recursive: true })
      await mkdir(join(root, 'components-src', 'slider', 'src'), { recursive: true })
      await mkdir(join(root, 'components-src', 'slider', 'bitrix'), { recursive: true })

      await writeFile(join(root, 'components-src', 'slider', 'component.config.json'), JSON.stringify({
        id: 'randee.slider',
        name: 'Randee Slider',
        code: 'slider',
        version: '1.0.0',
        type: 'component',
        vendor: 'randee'
      }), 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'studio.config.json'), JSON.stringify({
        id: 'randee.slider.studio',
        title: 'Randee Slider Studio',
        componentCode: 'slider',
        mode: 'design-preview',
        previewViewports: []
      }), 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'mock', 'data.json'), JSON.stringify({
        title: 'Slider',
        subtitle: 'Subtitle',
        slides: []
      }), 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'src', 'App.tsx'), 'export default function App(){ return null }', 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'src', 'main.tsx'), 'export {}', 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'src', 'index.css'), '', 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'bitrix', 'component.php'), '<?php echo 1; ?>', 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'bitrix', 'template.php'), '<?php echo 1; ?>', 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'bitrix', '.description.php'), '<?php echo 1; ?>', 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'bitrix', '.parameters.php'), '<?php echo 1; ?>', 'utf8')
      await writeFile(join(root, 'components-src', 'slider', 'data.adapter.ts'), 'export {}', 'utf8')

      const response = await fetch(`${server.url}/api/studio/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'component',
          code: 'slider',
          version: '1.0.0',
          channel: 'stable'
        })
      })

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toMatchObject({
        success: true,
        status: 'published'
      })

      const marketplaceResponse = await fetch(`${server.url}/api/studio/marketplace`)
      expect(marketplaceResponse.status).toBe(200)
      const marketplacePayload = await marketplaceResponse.json()
      expect(Array.isArray(marketplacePayload.audits)).toBe(true)
      expect(marketplacePayload.audits.length).toBeGreaterThan(0)
    } finally {
      await server.close()
    }
  })

  it('creates marketplace records with token auth', async () => {
    const root = await mkdtemp(join(tmpdir(), 'randee-studio-api-auth-'))
    const app = createApiApp({ rootDir: root, marketplaceApiToken: 'secret-token' })
    const server = await listen(app)

    try {
      const denied = await fetch(`${server.url}/api/admin/products`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          product_id: 'randee.slider',
          name: 'Randee Slider',
          type: 'component',
          vendor: 'randee',
          version: '1.0.0',
          channel: 'stable'
        })
      })
      expect(denied.status).toBe(401)

      const productResponse = await fetch(`${server.url}/api/admin/products`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-marketplace-api-token': 'secret-token'
        },
        body: JSON.stringify({
          product_id: 'randee.slider',
          name: 'Randee Slider',
          type: 'component',
          vendor: 'randee',
          version: '1.0.0',
          channel: 'stable'
        })
      })
      expect(productResponse.status).toBe(201)
      const productPayload = await productResponse.json()
      expect(productPayload.product.product_id).toBe('randee.slider')

      const packageResponse = await fetch(`${server.url}/api/admin/packages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-marketplace-api-token': 'secret-token'
        },
        body: JSON.stringify({
          product_id: 'randee.slider',
          version: '1.0.0',
          channel: 'stable',
          build_number: '2026.06.21.120000'
        })
      })
      expect(packageResponse.status).toBe(201)
      const packagePayload = await packageResponse.json()
      const packageId = packagePayload.package.id as string

      const uploadResponse = await fetch(`${server.url}/api/admin/packages/upload`, {
        method: 'POST',
        headers: {
          'content-type': 'application/zip',
          'x-marketplace-api-token': 'secret-token',
          'x-package-id': packageId,
          'x-file-name': 'randee.slider-1.0.0.zip'
        },
        body: Buffer.from('demo-zip-bytes')
      })
      expect(uploadResponse.status).toBe(201)

      const releaseResponse = await fetch(`${server.url}/api/admin/releases`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-marketplace-api-token': 'secret-token'
        },
        body: JSON.stringify({
          package_id: packageId,
          product_id: 'randee.slider',
          version: '1.0.0',
          channel: 'stable',
          release_notes: 'Release notes'
        })
      })
      expect(releaseResponse.status).toBe(201)
    } finally {
      await server.close()
    }
  })
})
