import type { ComponentType } from 'react'
import { registry } from './component-registry'

type PreviewFrameProps = {
  title: string
  width: number
  scale?: number
  component: ComponentType
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

export function StudioApp() {
  const componentCode = (import.meta.env.VITE_STUDIO_COMPONENT || 'slider') as keyof typeof registry
  const entry = registry[componentCode] ?? registry.slider
  const Component = entry.component
  const { componentConfig, studioConfig } = entry

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
          <button className="studio-nav__item studio-nav__item--active" type="button">Components</button>
          <button className="studio-nav__item" type="button">Modules</button>
          <button className="studio-nav__item" type="button">Templates</button>
        </nav>

        <section className="studio-card">
          <p className="studio-card__label">Current component</p>
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
      </aside>

      <section className="studio-center">
        <header className="studio-topbar">
          <div>
            <p>Preview</p>
            <h2>{studioConfig.title}</h2>
          </div>
          <div className="studio-status">Hot reload ready</div>
        </header>

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
            <li>Design Preview</li>
            <li>Content Preview</li>
            <li>QA Mode</li>
            <li>Package Mode</li>
          </ul>
        </section>

        <section className="studio-card">
          <p className="studio-card__label">Marketplace</p>
          <div className="marketplace-summary">
            <div>
              <span>Product ID</span>
              <strong>{componentConfig.id}</strong>
            </div>
            <div>
              <span>Channel</span>
              <strong>stable</strong>
            </div>
            <div>
              <span>Release</span>
              <strong>{componentConfig.version}</strong>
            </div>
          </div>
        </section>
      </aside>
    </main>
  )
}

