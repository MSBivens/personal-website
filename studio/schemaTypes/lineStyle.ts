// How relationship lines can look. The map reads the stored values
// (personal_site/one-for-all/lines.js), so keep the values in step with it.

// Picked to stay readable on the map's parchment, forests and water (each line also gets
// a pale outline). Navy is left out: it's the colour of the OFA network lines.
export const COLOURS = [
  {title: 'Crimson', value: '#c8102e'},
  {title: 'Orange', value: '#e06000'},
  {title: 'Gold', value: '#b58500'},
  {title: 'Green', value: '#1f8a3a'},
  {title: 'Teal', value: '#00818a'},
  {title: 'Sky blue', value: '#1e88e5'},
  {title: 'Purple', value: '#7e3fbf'},
  {title: 'Magenta', value: '#c2185b'},
  {title: 'Brown', value: '#7a4a1e'},
  {title: 'Black', value: '#222222'},
]

export const PATTERNS = [
  {title: 'Solid', value: 'solid'},
  {title: 'Dashed', value: 'dashed'},
  {title: 'Dotted', value: 'dotted'},
  {title: 'Dash-dot', value: 'dashDot'},
  {title: 'Long dash', value: 'longDash'},
]

export const WIDTHS = [
  {title: 'Thin', value: 'thin'},
  {title: 'Normal', value: 'normal'},
  {title: 'Thick', value: 'thick'},
]

export const DIRECTIONS = [
  {title: 'None', value: 'none'},
  {title: 'Arrow', value: 'arrow'},
  {title: 'Flowing', value: 'flow'},
]

export const SHAPES = [
  {title: 'Straight', value: 'straight'},
  {title: 'Curved', value: 'curved'},
]

export const titleOf = (list: {title: string; value: string}[], value?: string) =>
  list.find((item) => item.value === value)?.title

// Same dash maths as the map, so the Studio previews match.
export const WIDTH_PX: Record<string, number> = {thin: 2, normal: 3, thick: 5}
export function dashFor(pattern: string | undefined, w: number): number[] | null {
  switch (pattern) {
    case 'dashed':
      return [w * 4, w * 3]
    case 'dotted':
      return [0, w * 3]
    case 'dashDot':
      return [w * 4, w * 2.5, 0, w * 2.5]
    case 'longDash':
      return [w * 8, w * 3]
    default:
      return null
  }
}
