export function VegBadge({ isVeg, size = 14 }: { isVeg: boolean; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[3px] border p-[1.5px]"
      style={{ width: size, height: size, borderColor: isVeg ? '#15803d' : '#b91c1c' }}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span className="h-full w-full rounded-full" style={{ backgroundColor: isVeg ? '#15803d' : '#b91c1c' }} />
    </span>
  )
}
