import { createServer } from 'node:http'
import { type RequestListener } from 'node:http'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadPreviewData } from './preview'

async function listen(handler: RequestListener): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer(handler)
  await new Promise<void>((resolve) => {
    server.listen(0, resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind preview server')
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
}

describe('loadPreviewData', () => {
  it('returns mock data for mock mode', async () => {
    const root = await mkdtemp(join(tmpdir(), 'randee-preview-mock-'))
    await mkdir(join(root, 'components-src', 'slider', 'mock'), { recursive: true })
    await writeFile(join(root, 'components-src', 'slider', 'mock', 'data.json'), JSON.stringify({ title: 'Mock', subtitle: 'Subtitle', slides: [] }), 'utf8')

    const data = await loadPreviewData({ code: 'slider', mode: 'mock' }, root)
    expect(data).toMatchObject({ title: 'Mock' })
  })

  it('fetches connector payload from endpoint', async () => {
    const api = await listen((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({
        ok: true,
        iblockId: url.searchParams.get('iblockId')
      }))
    })

    try {
      const root = await mkdtemp(join(tmpdir(), 'randee-preview-connector-'))
      await mkdir(join(root, 'components-src', 'slider', 'mock'), { recursive: true })
      await writeFile(join(root, 'components-src', 'slider', 'mock', 'data.json'), JSON.stringify({ title: 'Mock', subtitle: 'Subtitle', slides: [] }), 'utf8')

      const data = await loadPreviewData({ code: 'slider', mode: 'bitrix-connector', endpoint: `${api.url}/local/tools/randee.connector/api.php`, iblockId: 12 }, root)
      expect(data).toMatchObject({ ok: true, iblockId: '12' })
    } finally {
      await api.close()
    }
  })
})
