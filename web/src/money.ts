const CENTS_PER_EURO = 100;
const EURO_DECIMAL_PLACES = 2;

const PRICE_FORMAT = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  trailingZeroDisplay: "stripIfInteger",
});

export function formatPrice(cents: number) {
  return PRICE_FORMAT.format(cents / CENTS_PER_EURO);
}

export function formatEurosInput(cents: number) {
  return (cents / CENTS_PER_EURO).toFixed(EURO_DECIMAL_PLACES);
}

export function parseEurosToCents(eurosInput: string) {
  return Math.round(Number(eurosInput) * CENTS_PER_EURO);
}
