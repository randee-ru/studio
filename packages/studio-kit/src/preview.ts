import { readJson } from './fs'
import { componentRoot, repoRootFrom } from './paths'
import type { StudioPreviewMode } from './types'

export interface StudioPreviewRequest {
  code: string
  mode: StudioPreviewMode
  endpoint?: string
  iblockId?: number | string
}

export async function loadPreviewData(request: StudioPreviewRequest, cwd = process.cwd()): Promise<unknown> {
  const repoRoot = repoRootFrom(cwd)
  const sourceRoot = componentRoot(repoRoot, request.code)
  const mockPath = `${sourceRoot}/mock/data.json`
  const mockData = await readJson<unknown>(mockPath)

  if (request.mode === 'mock') {
    return mockData
  }

  const endpoint = normalizeEndpoint(request.endpoint)
  if (!endpoint) {
    return mockData
  }

  if (request.mode === 'json') {
    return fetchJson(endpoint, undefined)
  }

  return fetchConnectorData(endpoint, request.iblockId)
}

function normalizeEndpoint(endpoint?: string): string | undefined {
  const value = (endpoint ?? '').trim()
  if (!value) return undefined
  if (!/^https?:\/\//i.test(value)) return undefined
  return value.replace(/\/+$/, '')
}

async function fetchJson(endpoint: string, iblockId?: number | string): Promise<unknown> {
  const url = new URL(endpoint)
  if (iblockId !== undefined && iblockId !== null && `${iblockId}`.trim() !== '') {
    url.searchParams.set('iblockId', `${iblockId}`)
  }

  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Preview endpoint responded with ${response.status}`)
  }

  return response.json()
}

async function fetchConnectorData(endpoint: string, iblockId?: number | string): Promise<unknown> {
  const queryUrl = new URL(endpoint)
  if (iblockId !== undefined && iblockId !== null && `${iblockId}`.trim() !== '') {
    queryUrl.searchParams.set('iblockId', `${iblockId}`)
  }

  const queryResponse = await fetch(queryUrl, {
    headers: {
      accept: 'application/json'
    }
  })

  if (queryResponse.ok) {
    return queryResponse.json()
  }

  const postResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      iblockId: iblockId === undefined || iblockId === null ? undefined : Number(iblockId)
    })
  })

  if (!postResponse.ok) {
    throw new Error(`Connector endpoint responded with ${postResponse.status}`)
  }

  return postResponse.json()
}
