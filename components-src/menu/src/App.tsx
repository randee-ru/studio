import type { CSSProperties } from 'react'
import mockData from '../mock/data.json'
import {
  mapBitrixIblockToMenuProps,
  mapBitrixSiteToMenuProps,
  mapBitrixToMenuProps,
  mapConnectorToMenuProps,
  mapJsonToMenuProps,
  mapMockToMenuProps
} from '../data.adapter'
import type { MenuProps } from './types'
import './index.css'

export type MenuStudioPreviewProps = {
  previewData?: unknown
  previewMode?: 'mock' | 'json' | 'bitrix-connector' | 'bitrix-site' | 'bitrix-iblock'
}

function Menu({ title, subtitle, items }: MenuProps) {
  return (
    <section className="randee-menu-shell">
      <div className="randee-menu__hero">
        <p className="randee-menu__eyebrow">Randee Module</p>
        <h1>{title}</h1>
        <p className="randee-menu__subtitle">{subtitle}</p>
      </div>

      <nav className="randee-menu__nav">
        {items.map((item, index) => (
          <a
            key={`${item.label}-${index}`}
            className={`randee-menu__item ${item.active ? 'randee-menu__item--active' : ''}`}
            href={item.href}
            style={{ '--menu-accent': item.active ? 'rgba(141, 209, 255, 0.18)' : 'rgba(255,255,255,0.04)' } as CSSProperties}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.label}</strong>
          </a>
        ))}
      </nav>
    </section>
  )
}

function resolvePreviewProps(previewData: unknown, previewMode?: MenuStudioPreviewProps['previewMode']): MenuProps {
  if (!previewData) {
    return mapMockToMenuProps(mockData)
  }

  if (previewMode === 'json') {
    return mapJsonToMenuProps(previewData as MenuProps)
  }

  if (previewMode === 'bitrix-connector') {
    return mapConnectorToMenuProps(previewData as { items?: Array<{ NAME?: string; URL?: string; ACTIVE?: boolean }>; title?: string; subtitle?: string })
  }

  if (previewMode === 'bitrix-site') {
    return mapBitrixSiteToMenuProps(previewData as { arResult?: { TITLE?: string; SUBTITLE?: string; ITEMS?: Array<{ NAME?: string; LINK?: string; SELECTED?: boolean }> } })
  }

  if (previewMode === 'bitrix-iblock') {
    return mapBitrixIblockToMenuProps(previewData as { items?: Array<{ NAME?: string; DETAIL_PAGE_URL?: string; ACTIVE?: boolean }> })
  }

  return mapBitrixToMenuProps(previewData as MenuProps)
}

export default function App(props: MenuStudioPreviewProps = {}) {
  const previewProps = resolvePreviewProps(props.previewData, props.previewMode)
  return <Menu {...previewProps} />
}
