# US Federal Tax Bracket Calculator

An interactive visualization that demystifies how US progressive tax brackets actually work. Built to address the common misconception that moving into a higher tax bracket means all your income is taxed at that higher rate.

## Features

- **Income Slider** - Adjust gross income from $0 to $500K and see tax calculations update in real time
- **Bracket Fill View** - Watch how income progressively fills each tax bracket from lowest to highest
- **Bar Chart** - See how much income falls into each bracket side by side
- **Effective vs Marginal Rate Curves** - Visualize why your effective rate is always lower than your marginal rate
- **Summary Stats** - Total federal tax, take-home pay, effective rate, and marginal rate at a glance

Uses 2024 federal tax brackets for single filers.

## Tech Stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Recharts](https://recharts.org/) for charts
- [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) for UI components
- [TypeScript](https://www.typescriptlang.org/)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
| ------------ | -------------------------------- |
| `pnpm dev` | Start development server |
| `pnpm build` | Create production build |
| `pnpm start` | Run production server |
| `pnpm lint` | Run ESLint |
