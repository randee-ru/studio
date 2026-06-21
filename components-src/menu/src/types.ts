export type MenuItem = {
  label: string
  href: string
  active?: boolean
}

export type MenuProps = {
  title: string
  subtitle: string
  items: MenuItem[]
}
