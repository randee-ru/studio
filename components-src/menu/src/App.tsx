import type { CSSProperties } from 'react'
import mockData from '../mock/data.json'
import { mapMockToMenuProps } from '../data.adapter'
import type { MenuProps } from './types'
import './index.css'

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

export default function App() {
  const props = mapMockToMenuProps(mockData)
  return <Menu {...props} />
}
