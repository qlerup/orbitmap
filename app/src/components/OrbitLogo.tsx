interface Props {
  size?: 'sm' | 'lg'
}

export default function OrbitLogo({ size = 'sm' }: Props) {
  const box = size === 'lg' ? 'w-16 h-16' : 'w-9 h-9'
  return (
    // The same approved artwork is used in the app and FjordHub catalog.
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/hub-icon.png?v=brand-20261005" alt="OrbitMap" width={size === 'lg' ? 64 : 36} height={size === 'lg' ? 64 : 36} className={`shrink-0 object-contain ${box}`} />
  )
}
