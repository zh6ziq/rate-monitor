# Rate Monitor

Vue 3 PWA with two tools:
- **Gold Price** (`/gold`): gold spot price in MYR vs yesterday, 1 week, 1 month, 3 months and 6 months.
- **Currency Converter** (`/converter`): converts any amount between currencies.

## Data
- Live: [gold-api.com](https://gold-api.com) (USD/oz) × USD→MYR
- History/FX: [fawazahmed0/currency-api](https://github.com/fawazahmed0/exchange-api) (daily XAU→MYR)
- FX: [Bank Negara Malaysia OpenAPI](https://apikijangportal.bnm.gov.my/) (official, updated 09:00/11:30/12:00/17:00 MYT); currency-api fills in currencies BNM doesn't cover, or all of them if BNM is unreachable.
- Data loads on open and on refresh only (no live polling).
- Historical gold days are cached in `localStorage`; refresh only fetches new days.

## Dev
```bash
npm install
npm run dev
npm run build && npm run preview
```

## Deploy (Vercel)
Import the repo in Vercel (Vite preset, output `dist`), or:
```bash
npx vercel --prod
```
