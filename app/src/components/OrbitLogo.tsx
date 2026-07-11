interface Props {
  size?: 'sm' | 'lg'
}

export default function OrbitLogo({ size = 'sm' }: Props) {
  const box = size === 'lg' ? 'w-16 h-16' : 'w-9 h-9'
  const core = size === 'lg' ? 'w-6 h-6' : 'w-3.5 h-3.5'

  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${box}`}>
      <span className="orbit-ring" />
      <span className="orbit-spinner">
        <span className="orbit-satellite" />
      </span>
      <span className={`orbit-core ${core}`} />
    </span>
  )
}
