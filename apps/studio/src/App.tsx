import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { artifacts, artifactsByKind, registry, type ArtifactKind, type StudioArtifactEntry } from './component-registry'

type PreviewFrameProps = {
  title: string
  width: number
  scale?: number
  component: ComponentType
}

type MarketplaceSnapshot = {
  products: Array<{ id: string; product_id: string; name: string; type: string; version: string; channel: string; updated_at: string }>
  packages: Array<{ id: string; product_id: string; version: string; channel: string; zip_name: string; zip_size: number; build_number: string; created_at: string }>
  releases: Array<{ id: string; package_id: string; product_id: string; version: string; channel: string; status: string; release_notes: string; created_at: string; published_at?: string }>
  audits: Array<{ id: string; componentCode: string; version: string; channel: string; status: string; message: string; created_at: string }>
}

type OperationState = {
  label: string
  message: string
  kind: 'idle' | 'pending' | 'success' | 'error'
}

function PreviewFrame({ title, width, scale = 1, component: Component }: PreviewFrameProps) {
  return (
    <section className="preview-card">
      <div className="preview-card__header">
        <span>{title}</span>
        <span>{width}px</span>
      </div>
      <div className="preview-frame" style={{ width: `${width}px` }}>
        <div className="preview-frame__canvas" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Component />
        </div>
      </div>
    </section>
  )
}

function formatTimestamp(value?: string): string {
  if (!value) return 'now'
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function statusLabel(status: string): string {
  switch (status) {
    case 'ready':
      return 'Ready'
    case 'testing':
      return 'Testing'
    case 'build_failed':
      return 'Build Failed'
    case 'validation_failed':
      return 'Validation Failed'
    case 'uploading':
      return 'Uploading'
    case 'uploaded':
      return 'Uploaded'
    case 'published':
      return 'Published'
    default:
      return 'Error'
  }
}

export function StudioApp() {
  const componentCode = (import.meta.env.VITE_STUDIO_COMPONENT || artifacts[0]?.componentConfig.code || 'slider') as keyof typeof registry
  const [selectedCode, setSelectedCode] = useState(componentCode)
  const selectedArtifact = registry[selectedCode] ?? artifacts[0]
  const Component = selectedArtifact.component
  const { componentConfig, studioConfig } = selectedArtifact
  const [selectedKind, setSelectedKind] = useState<ArtifactKind>(selectedArtifact.kind)
  const [selectedMode, setSelectedMode] = useState(studioConfig.defaultDataSourceMode ?? 'mock')
  const [marketplace, setMarketplace] = useState<MarketplaceSnapshot | null>(null)
  const [operation, setOperation] = useState<OperationState>({ label: 'Status', message: 'Ready', kind: 'idle' })
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle')
  const [publishMessage, setPublishMessage] = useState('Ready')

  const filteredArtifacts = useMemo(() => artifactsByKind(selectedKind), [selectedKind])
  const counts = useMemo(
    () => ({
      component: artifactsByKind('component').length,
      module: artifactsByKind('module').length,
      template: artifactsByKind('template').length
    }),
    []
  )

  async function loadMarketplace(): Promise<void> {
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4010'
    const response = await fetch(`${apiBase}/api/studio/marketplace`)
    const payload = (await response.json().catch(() => null)) as MarketplaceSnapshot | null
    if (response.ok && payload) {
      setMarketplace(payload)
    }
  }

  useEffect(() => {
    void loadMarketplace().catch(() => {
      setMarketplace(null)
    })
  }, [])

  useEffect(() => {
    setSelectedKind(selectedArtifact.kind)
    setSelectedMode(studioConfig.defaultDataSourceMode ?? 'mock')
  }, [selectedArtifact.kind, studioConfig.defaultDataSourceMode, selectedCode])

  async function runAction(endpoint: 'test' | 'build' | 'package' | 'validate'): Promise<void> {
    setOperation({ label: endpoint.toUpperCase(), message: 'Running…', kind: 'pending' })

    try {
      const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4010'
      const response = await fetch(`${apiBase}/api/studio/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: componentConfig.code,
          version: componentConfig.version,
          channel: 'stable'
        })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error ?? `${endpoint} failed`)
      }

      setOperation({
        label: endpoint.toUpperCase(),
        kind: 'success',
        message: payload.message ?? `${endpoint} completed`
      })
      await loadMarketplace()
    } catch (error) {
      setOperation({
        label: endpoint.toUpperCase(),
        kind: 'error',
        message: error instanceof Error ? error.message : `${endpoint} failed`
      })
    }
  }

  async function publishToMarketplace(): Promise<void> {
    setPublishState('publishing')
    setPublishMessage('Sending publish request...')

    try {
      const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4010'
      const response = await fetch(`${apiBase}/api/studio/publish`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          type: componentConfig.type,
          code: componentConfig.code,
          version: componentConfig.version,
          channel: 'stable'
        })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error ?? 'Publish failed')
      }

      setPublishState('published')
      setPublishMessage(`Published: ${payload.status ?? 'published'}`)
      await loadMarketplace()
    } catch (error) {
      setPublishState('error')
      setPublishMessage(error instanceof Error ? error.message : 'Publish failed')
    }
  }

  const releaseNotes = marketplace?.releases?.[0]?.release_notes ?? `${componentConfig.name} ${componentConfig.version}`
  const lastAudit = marketplace?.audits?.at(-1)
  const lastPublish = marketplace?.releases?.find((release) => release.status === 'published') ?? marketplace?.releases?.[0]

  return (
    <main className="studio-shell">
      <aside className="studio-panel studio-panel--left">
        <div className="studio-brand">
          <div className="studio-brand__mark">R</div>
          <div>
            <p>Randee Studio</p>
            <span>Component Builder</span>
          </div>
        </div>

        <nav className="studio-nav">
          <button
            className={`studio-nav__item ${selectedKind === 'component' ? 'studio-nav__item--active' : ''}`}
            type="button"
            onClick={() => {
              setSelectedKind('component')
              const first = artifactsByKind('component')[0]
              if (first) setSelectedCode(first.componentConfig.code)
            }}
          >
            Components <span>{counts.component}</span>
          </button>
          <button
            className={`studio-nav__item ${selectedKind === 'module' ? 'studio-nav__item--active' : ''}`}
            type="button"
            onClick={() => {
              setSelectedKind('module')
              const first = artifactsByKind('module')[0]
              if (first) setSelectedCode(first.componentConfig.code)
            }}
          >
            Modules <span>{counts.module}</span>
          </button>
          <button
            className={`studio-nav__item ${selectedKind === 'template' ? 'studio-nav__item--active' : ''}`}
            type="button"
            onClick={() => {
              setSelectedKind('template')
              const first = artifactsByKind('template')[0]
              if (first) setSelectedCode(first.componentConfig.code)
            }}
          >
            Templates <span>{counts.template}</span>
          </button>
        </nav>

        <section className="studio-card">
          <p className="studio-card__label">Current artifact</p>
          <h1>{componentConfig.name}</h1>
          <dl className="studio-meta">
            <div>
              <dt>Code</dt>
              <dd>{componentConfig.code}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{componentConfig.version}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{componentConfig.type}</dd>
            </div>
            <div>
              <dt>Vendor</dt>
              <dd>{componentConfig.vendor}</dd>
            </div>
          </dl>
        </section>

        <section className="studio-card">
          <p className="studio-card__label">Artifact list</p>
          <ul className="checklist">
            {filteredArtifacts.length > 0 ? (
              filteredArtifacts.map((artifact) => (
                <li key={artifact.componentConfig.id}>
                  <button
                    type="button"
                    className={`studio-artifact-pick ${selectedCode === artifact.componentConfig.code ? 'studio-artifact-pick--active' : ''}`}
                    onClick={() => {
                      setSelectedCode(artifact.componentConfig.code)
                      setSelectedKind(artifact.kind)
                      setSelectedMode(artifact.studioConfig.defaultDataSourceMode ?? 'mock')
                    }}
                  >
                    <span>{artifact.componentConfig.name}</span>
                    <small>{artifact.kind}</small>
                  </button>
                </li>
              ))
            ) : (
              <li>Scaffolds for this group are not added yet</li>
            )}
          </ul>
        </section>
      </aside>

      <section className="studio-center">
        <header className="studio-topbar">
          <div>
            <p>Preview</p>
            <h2>{studioConfig.title}</h2>
          </div>
          <div className="studio-topbar__stack">
            <div className="studio-status">Hot reload ready</div>
            <div className="studio-status studio-status--secondary">Data source: {selectedMode}</div>
          </div>
        </header>

        <div className="studio-toolbar">
          {(studioConfig.dataSourceModes ?? ['mock']).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`studio-chip ${selectedMode === mode ? 'studio-chip--active' : ''}`}
              onClick={() => setSelectedMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="preview-grid">
          <PreviewFrame title="Desktop" width={1440} component={Component} />
          <PreviewFrame title="Tablet" width={768} scale={0.92} component={Component} />
          <PreviewFrame title="Mobile" width={390} scale={0.86} component={Component} />
        </div>
      </section>

      <aside className="studio-panel studio-panel--right">
        <section className="studio-card">
          <p className="studio-card__label">Pipeline</p>
          <ul className="checklist">
            {selectedArtifact.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </section>

        <section className="studio-card">
          <p className="studio-card__label">Actions</p>
          <div className="studio-actions">
            <button type="button" className="studio-action" onClick={() => void runAction('test')}>
              Run Tests
            </button>
            <button type="button" className="studio-action" onClick={() => void runAction('build')}>
              Build Package
            </button>
            <button type="button" className="studio-action" onClick={() => void runAction('validate')}>
              Validate
            </button>
            <button type="button" className="studio-action studio-action--primary" onClick={() => void publishToMarketplace()} disabled={publishState === 'publishing'}>
              {publishState === 'publishing' ? 'Publishing...' : 'Publish to Marketplace'}
            </button>
          </div>
          <p className={`studio-publish__status studio-publish__status--${publishState}`}>
            {publishMessage}
          </p>
        </section>

        <section className="studio-card">
          <p className="studio-card__label">Errors</p>
          <div className={`studio-operation studio-operation--${operation.kind}`}>
            <strong>{operation.label}</strong>
            <span>{operation.message}</span>
          </div>
        </section>

        <section className="studio-card">
          <p className="studio-card__label">Marketplace</p>
          <div className="marketplace-summary">
            <div>
              <span>Product ID</span>
              <strong>{componentConfig.id}</strong>
            </div>
            <div>
              <span>Version</span>
              <strong>{componentConfig.version}</strong>
            </div>
            <div>
              <span>Channel</span>
              <strong>stable</strong>
            </div>
            <div>
              <span>Release notes</span>
              <strong>{releaseNotes}</strong>
            </div>
            <div>
              <span>Last Publish</span>
              <strong>{lastPublish ? formatTimestamp(lastPublish.published_at ?? lastPublish.created_at) : 'No publish yet'}</strong>
            </div>
            <div>
              <span>Last Event</span>
              <strong>{lastAudit ? `${statusLabel(lastAudit.status)} · ${formatTimestamp(lastAudit.created_at)}` : 'No audit yet'}</strong>
            </div>
          </div>
        </section>

        <section className="studio-card">
          <p className="studio-card__label">History</p>
          <ul className="history-list">
            {(marketplace?.audits ?? []).slice(-5).reverse().map((audit) => (
              <li key={audit.id}>
                <div>
                  <strong>{statusLabel(audit.status)}</strong>
                  <span>{audit.message}</span>
                </div>
                <time>{formatTimestamp(audit.created_at)}</time>
              </li>
            ))}
            {(marketplace?.audits ?? []).length === 0 ? <li className="history-list__empty">No history yet</li> : null}
          </ul>
        </section>
      </aside>
    </main>
  )
}
