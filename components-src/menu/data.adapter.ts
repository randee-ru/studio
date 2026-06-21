export type MenuItem = {
  label: string
  href: string
  active?: boolean
}

export type MenuData = {
  title: string
  subtitle: string
  items: MenuItem[]
}

export type MenuProps = MenuData

export function mapBitrixToMenuProps(data: MenuData): MenuProps {
  return {
    title: data.title,
    subtitle: data.subtitle,
    items: data.items.map((item) => ({
      label: item.label,
      href: item.href,
      active: item.active
    }))
  }
}

export function mapMockToMenuProps(data: MenuData): MenuProps {
  return mapBitrixToMenuProps(data)
}

export function mapJsonToMenuProps(data: MenuData): MenuProps {
  return mapBitrixToMenuProps(data)
}

export function mapConnectorToMenuProps(data: { items?: Array<{ NAME?: string; URL?: string; ACTIVE?: boolean }>; title?: string; subtitle?: string }): MenuProps {
  return {
    title: data.title ?? 'Randee Menu',
    subtitle: data.subtitle ?? 'Connector data source',
    items: (data.items ?? []).map((item) => ({
      label: item.NAME ?? 'Menu item',
      href: item.URL ?? '#',
      active: item.ACTIVE
    }))
  }
}

export function mapBitrixSiteToMenuProps(data: { arResult?: { TITLE?: string; SUBTITLE?: string; ITEMS?: Array<{ NAME?: string; LINK?: string; SELECTED?: boolean }> } }): MenuProps {
  return {
    title: data.arResult?.TITLE ?? 'Randee Menu',
    subtitle: data.arResult?.SUBTITLE ?? 'Bitrix site data source',
    items: (data.arResult?.ITEMS ?? []).map((item) => ({
      label: item.NAME ?? 'Menu item',
      href: item.LINK ?? '#',
      active: item.SELECTED
    }))
  }
}

export function mapBitrixIblockToMenuProps(data: { items?: Array<{ NAME?: string; DETAIL_PAGE_URL?: string; ACTIVE?: boolean }> }): MenuProps {
  return {
    title: 'Randee Menu',
    subtitle: 'Iblock data source',
    items: (data.items ?? []).map((item) => ({
      label: item.NAME ?? 'Menu item',
      href: item.DETAIL_PAGE_URL ?? '#',
      active: item.ACTIVE
    }))
  }
}
