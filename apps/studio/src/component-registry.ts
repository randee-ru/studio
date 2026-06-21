import type { ComponentType } from 'react'
import componentConfig from '../../../components-src/slider/component.config.json'
import studioConfig from '../../../components-src/slider/studio.config.json'
import mockData from '../../../components-src/slider/mock/data.json'
import SliderApp from '../../../components-src/slider/src/App'
import type { SliderSourceMode } from '../../../components-src/slider/data.adapter'

export type ArtifactKind = 'component' | 'module' | 'template'

export type StudioArtifactEntry = {
  kind: ArtifactKind
  componentConfig: typeof componentConfig
  studioConfig: typeof studioConfig
  component: ComponentType
  mockData: typeof mockData
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
  }
]

export const registry = Object.fromEntries(artifacts.map((artifact) => [artifact.componentConfig.code, artifact])) as Record<string, StudioArtifactEntry>

export function artifactsByKind(kind: ArtifactKind): StudioArtifactEntry[] {
  return artifacts.filter((artifact) => artifact.kind === kind)
}
