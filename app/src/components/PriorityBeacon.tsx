import { PRIORITY_LABELS } from '@/lib/types'
import type { ItemPriority } from '@/lib/types'

interface Props {
  priority: ItemPriority
}

export default function PriorityBeacon({ priority }: Props) {
  return (
    <span
      className={`prio-beacon prio-${priority}`}
      title={`Prioritet: ${PRIORITY_LABELS[priority]}`}
      aria-label={`Prioritet: ${PRIORITY_LABELS[priority]}`}
    >
      <span className="prio-core" />
    </span>
  )
}
