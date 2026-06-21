export type LegacySection = {
  title: string
  text: string
}

export type LegacyData = {
  title: string
  subtitle: string
  sections: LegacySection[]
}

export type LegacyProps = LegacyData

export function mapBitrixToLegacyProps(data: LegacyData): LegacyProps {
  return {
    title: data.title,
    subtitle: data.subtitle,
    sections: data.sections.map((section) => ({
      title: section.title,
      text: section.text
    }))
  }
}

export function mapMockToLegacyProps(data: LegacyData): LegacyProps {
  return mapBitrixToLegacyProps(data)
}

export function mapJsonToLegacyProps(data: LegacyData): LegacyProps {
  return mapBitrixToLegacyProps(data)
}

export function mapConnectorToLegacyProps(data: { sections?: Array<{ NAME?: string; PREVIEW_TEXT?: string }>; title?: string; subtitle?: string }): LegacyProps {
  return {
    title: data.title ?? 'Randee Legacy Template',
    subtitle: data.subtitle ?? 'Connector data source',
    sections: (data.sections ?? []).map((section) => ({
      title: section.NAME ?? 'Section',
      text: section.PREVIEW_TEXT ?? ''
    }))
  }
}

export function mapBitrixSiteToLegacyProps(data: { arResult?: { TITLE?: string; SUBTITLE?: string; SECTIONS?: Array<{ NAME?: string; DETAIL_TEXT?: string }> } }): LegacyProps {
  return {
    title: data.arResult?.TITLE ?? 'Randee Legacy Template',
    subtitle: data.arResult?.SUBTITLE ?? 'Bitrix site data source',
    sections: (data.arResult?.SECTIONS ?? []).map((section) => ({
      title: section.NAME ?? 'Section',
      text: section.DETAIL_TEXT ?? ''
    }))
  }
}

export function mapBitrixIblockToLegacyProps(data: { sections?: Array<{ NAME?: string; PREVIEW_TEXT?: string }> }): LegacyProps {
  return {
    title: 'Randee Legacy Template',
    subtitle: 'Iblock data source',
    sections: (data.sections ?? []).map((section) => ({
      title: section.NAME ?? 'Section',
      text: section.PREVIEW_TEXT ?? ''
    }))
  }
}
