import {WIDTH_PX, dashFor} from '../schemaTypes/lineStyle'

// A small picture of a relationship line, for Studio list previews.
export function LineSample({
  color = '#888888',
  pattern,
  width,
  direction,
}: {
  color?: string
  pattern?: string
  width?: string
  direction?: string
}) {
  const w = WIDTH_PX[width ?? 'normal'] ?? 3
  const dash = dashFor(pattern, w)
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
      <line
        x1="3"
        y1="16"
        x2={direction === 'arrow' ? 22 : 29}
        y2="16"
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeDasharray={dash ? dash.join(' ') : undefined}
      />
      {direction === 'arrow' && <path d="M20,9 L30,16 L20,23 z" fill={color} />}
      {direction === 'flow' && <path d="M24,11 L30,16 L24,21" fill="none" stroke={color} strokeWidth="2" />}
    </svg>
  )
}
