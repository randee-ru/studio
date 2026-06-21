import type { ComponentType } from 'react'
import componentConfig from '../../../components-src/slider/component.config.json'
import studioConfig from '../../../components-src/slider/studio.config.json'
import mockData from '../../../components-src/slider/mock/data.json'
import SliderApp from '../../../components-src/slider/src/App'
import menuComponentConfig from '../../../components-src/menu/component.config.json'
import menuStudioConfig from '../../../components-src/menu/studio.config.json'
import menuMockData from '../../../components-src/menu/mock/data.json'
import MenuApp from '../../../components-src/menu/src/App'
import legacyComponentConfig from '../../../components-src/legacy/component.config.json'
import legacyStudioConfig from '../../../components-src/legacy/studio.config.json'
import legacyMockData from '../../../components-src/legacy/mock/data.json'
import LegacyApp from '../../../components-src/legacy/src/App'
import type { SliderSourceMode } from '../../../components-src/slider/data.adapter'

export type ArtifactKind = 'component' | 'module' | 'template'
export type StudioPreviewProps = {
  previewData?: unknown
  previewMode?: SliderSourceMode
}

export type StudioArtifactEntry = {
  kind: ArtifactKind
  componentConfig: typeof componentConfig
  studioConfig: typeof studioConfig
  component: ComponentType<StudioPreviewProps>
  mockData: unknown
  dataSourceModes: SliderSourceMode[]
  checks: string[]
}

export const artifacts: StudioArtifactEntry[] = [
  {
    kind: componentConfig.type as ArtifactKind,
    componentConfig,
    studioConfig,
    component: SliderApp,
    mockData,
    dataSourceModes: (studioConfig.dataSourceModes ?? ['mock']) as SliderSourceMode[],
    checks: [
      'Responsive',
      'Accessibility',
      'Overflow',
      'Contrast',
      'Spacing',
      'Viewport',
      'TypeScript',
      'Build',
      'Bitrix Structure',
      'Package Validation'
    ]
  },
  {
    kind: menuComponentConfig.type as ArtifactKind,
    componentConfig: menuComponentConfig,
    studioConfig: menuStudioConfig,
    component: MenuApp,
    mockData: menuMockData,
    dataSourceModes: (menuStudioConfig.dataSourceModes ?? ['mock']) as SliderSourceMode[],
    checks: [
      'Responsive',
      'Accessibility',
      'Overflow',
      'Contrast',
      'Spacing',
      'Viewport',
      'TypeScript',
      'Build',
      'Bitrix Structure',
      'Package Validation'
    ]
  },
  {
    kind: legacyComponentConfig.type as ArtifactKind,
    componentConfig: legacyComponentConfig,
    studioConfig: legacyStudioConfig,
    component: LegacyApp,
    mockData: legacyMockData,
    dataSourceModes: (legacyStudioConfig.dataSourceModes ?? ['mock']) as SliderSourceMode[],
    checks: [
      'Responsive',
      'Accessibility',
      'Overflow',
      'Contrast',
      'Spacing',
      'Viewport',
      'TypeScript',
      'Build',
      'Bitrix Structure',
      'Package Validation'
    ]
  }
]

export const registry = Object.fromEntries(artifacts.map((artifact) => [artifact.componentConfig.code, artifact])) as Record<string, StudioArtifactEntry>

export function artifactsByKind(kind: ArtifactKind): StudioArtifactEntry[] {
  return artifacts.filter((artifact) => artifact.kind === kind)
}
