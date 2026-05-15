export function formatInt(value: number | string | null | undefined) {
  const numericValue = typeof value === "number" ? value : Number(value || 0)

  if (!Number.isFinite(numericValue)) return "0"

  const rounded = Math.round(numericValue)
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function formatCurrency(value: number | string | null | undefined) {
  return `EUR ${formatInt(value)}`
}
