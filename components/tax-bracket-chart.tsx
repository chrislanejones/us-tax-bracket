"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Percent, PiggyBank } from "lucide-react";

// 2024 Federal Tax Brackets (Single Filer)
const TAX_BRACKETS = [
  { min: 0, max: 11600, rate: 0.1, label: "10%" },
  { min: 11600, max: 47150, rate: 0.12, label: "12%" },
  { min: 47150, max: 100525, rate: 0.22, label: "22%" },
  { min: 100525, max: 191950, rate: 0.24, label: "24%" },
  { min: 191950, max: 243725, rate: 0.32, label: "32%" },
  { min: 243725, max: 609350, rate: 0.35, label: "35%" },
  { min: 609350, max: Infinity, rate: 0.37, label: "37%" },
];

// Modern gradient colors for brackets - teal to amber to coral
const BRACKET_COLORS = [
  "#2dd4bf", // teal-400
  "#4ade80", // green-400
  "#a3e635", // lime-400
  "#facc15", // yellow-400
  "#fb923c", // orange-400
  "#f87171", // red-400
  "#ef4444", // red-500
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

interface TaxBreakdown {
  bracket: number;
  incomeInBracket: number;
  taxInBracket: number;
  rate: number;
  bracketMin: number;
  bracketMax: number;
  cumulativeIncome: number;
  cumulativeTax: number;
}

function calculateTaxBreakdown(income: number): TaxBreakdown[] {
  const breakdown: TaxBreakdown[] = [];
  let remainingIncome = income;
  let cumulativeIncome = 0;
  let cumulativeTax = 0;

  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const bracket = TAX_BRACKETS[i];
    const bracketSize = bracket.max - bracket.min;
    const incomeInBracket = Math.max(0, Math.min(remainingIncome, bracketSize));
    const taxInBracket = incomeInBracket * bracket.rate;

    if (incomeInBracket > 0) {
      cumulativeIncome += incomeInBracket;
      cumulativeTax += taxInBracket;

      breakdown.push({
        bracket: i + 1,
        incomeInBracket,
        taxInBracket,
        rate: bracket.rate,
        bracketMin: bracket.min,
        bracketMax: bracket.max,
        cumulativeIncome,
        cumulativeTax,
      });
    }

    remainingIncome -= incomeInBracket;
    if (remainingIncome <= 0) break;
  }

  return breakdown;
}

function calculateTotalTax(income: number): number {
  return calculateTaxBreakdown(income).reduce(
    (sum, b) => sum + b.taxInBracket,
    0,
  );
}

function getMarginalRate(income: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (income <= bracket.max) return bracket.rate;
  }
  return TAX_BRACKETS[TAX_BRACKETS.length - 1].rate;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: TaxBreakdown;
  }>;
}

function StackedTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm p-4 shadow-2xl">
      <p className="font-semibold text-foreground text-lg">
        {(data.rate * 100).toFixed(0)}% Tax Bracket
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Range: {formatCurrency(data.bracketMin)} -{" "}
        {data.bracketMax === Infinity
          ? "No limit"
          : formatCurrency(data.bracketMax)}
      </p>
      <div className="mt-3 space-y-2 text-sm border-t border-border/50 pt-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Income in bracket</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(data.incomeInBracket)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax from bracket</span>
          <span className="font-mono font-medium text-primary">
            {formatCurrency(data.taxInBracket)}
          </span>
        </div>
      </div>
    </div>
  );
}

function WaterfallChart({ income }: { income: number }) {
  const breakdown = calculateTaxBreakdown(income);

  const data = breakdown.map((b, i) => ({
    name: `${(b.rate * 100).toFixed(0)}%`,
    incomeInBracket: b.incomeInBracket,
    taxInBracket: b.taxInBracket,
    rate: b.rate,
    bracketMin: b.bracketMin,
    bracketMax: b.bracketMax,
    fill: BRACKET_COLORS[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
      >
        <XAxis
          dataKey="name"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)", strokeWidth: 1 }}
          tickLine={{ stroke: "var(--color-border)" }}
        />
        <YAxis
          tickFormatter={formatCompact}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)", strokeWidth: 1 }}
          tickLine={{ stroke: "var(--color-border)" }}
        />
        <Tooltip
          content={<StackedTooltip />}
          cursor={{ fill: "rgba(128,128,128,0.1)" }}
        />
        <Bar dataKey="incomeInBracket" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EffectiveRateChart({ income }: { income: number }) {
  const dataPoints = [];
  const maxIncome = Math.max(income * 1.2, 250000);
  const step = maxIncome / 50;

  for (let i = step; i <= maxIncome; i += step) {
    const totalTax = calculateTotalTax(i);
    const effectiveRate = (totalTax / i) * 100;
    const marginalRate = getMarginalRate(i) * 100;
    dataPoints.push({
      income: i,
      effectiveRate: parseFloat(effectiveRate.toFixed(2)),
      marginalRate: parseFloat(marginalRate.toFixed(2)),
    });
  }

  const currentEffectiveRate =
    income > 0 ? (calculateTotalTax(income) / income) * 100 : 0;
  const currentMarginalRate = getMarginalRate(income) * 100;

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={dataPoints}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="effectiveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="marginalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="income"
            tickFormatter={formatCompact}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            tickLine={{ stroke: "var(--color-border)" }}
          />
          <YAxis
            domain={[0, 40]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            tickLine={{ stroke: "var(--color-border)" }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}%`,
              name === "effectiveRate" ? "Effective Rate" : "Marginal Rate",
            ]}
            labelFormatter={(label) => `Income: ${formatCurrency(label)}`}
            contentStyle={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              backdropFilter: "blur(8px)",
            }}
            itemStyle={{ color: "var(--color-foreground)" }}
            labelStyle={{ color: "var(--color-muted-foreground)", marginBottom: "8px" }}
          />
          <ReferenceLine
            x={income}
            stroke="#a78bfa"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          <Area
            type="stepAfter"
            dataKey="marginalRate"
            stroke="#f87171"
            fill="url(#marginalGradient)"
            strokeWidth={2}
            name="marginalRate"
          />
          <Area
            type="monotone"
            dataKey="effectiveRate"
            stroke="#2dd4bf"
            fill="url(#effectiveGradient)"
            strokeWidth={2}
            name="effectiveRate"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#2dd4bf]" />
          <span className="text-muted-foreground">
            Effective Rate{" "}
            <span className="text-foreground font-medium">
              ({currentEffectiveRate.toFixed(1)}%)
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#f87171]" />
          <span className="text-muted-foreground">
            Marginal Rate{" "}
            <span className="text-foreground font-medium">
              ({currentMarginalRate.toFixed(0)}%)
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#a78bfa]" />
          <span className="text-muted-foreground">Your Income</span>
        </div>
      </div>
    </div>
  );
}

function BracketVisualizer({ income }: { income: number }) {
  const breakdown = calculateTaxBreakdown(income);

  return (
    <div className="space-y-4">
      {TAX_BRACKETS.map((bracket, index) => {
        const bracketData = breakdown.find((b) => b.rate === bracket.rate);
        const incomeInBracket = bracketData?.incomeInBracket || 0;
        const taxInBracket = bracketData?.taxInBracket || 0;
        const bracketSize =
          bracket.max === Infinity ? 500000 : bracket.max - bracket.min;
        const fillPercentage = Math.min(
          100,
          (incomeInBracket / bracketSize) * 100,
        );
        const isActive = incomeInBracket > 0;

        return (
          <div key={index} className="group">
            <div className="flex justify-between items-center text-sm mb-2">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-6 rounded-md flex items-center justify-center text-xs font-bold text-background"
                  style={{ backgroundColor: BRACKET_COLORS[index] }}
                >
                  {bracket.label}
                </span>
                <span
                  className={`transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {formatCurrency(bracket.min)} -{" "}
                  {bracket.max === Infinity
                    ? "No limit"
                    : formatCurrency(bracket.max)}
                </span>
              </div>
              {isActive && (
                <div className="text-right">
                  <span className="text-muted-foreground">
                    {formatCurrency(incomeInBracket)}
                  </span>
                  <span className="mx-2 text-muted-foreground/50">{"→"}</span>
                  <span
                    className="font-mono font-medium"
                    style={{ color: BRACKET_COLORS[index] }}
                  >
                    {formatCurrency(taxInBracket)}
                  </span>
                </div>
              )}
            </div>
            <div className="h-3 w-full rounded-full bg-secondary/50 overflow-hidden">
              <div
                className="h-full transition-all duration-700 ease-out rounded-full relative"
                style={{
                  width: `${fillPercentage}%`,
                  backgroundColor: BRACKET_COLORS[index],
                  opacity: isActive ? 1 : 0.2,
                  boxShadow: isActive
                    ? `0 0 20px ${BRACKET_COLORS[index]}40`
                    : "none",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 group hover:border-border transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p
        className="text-2xl md:text-3xl font-bold font-mono tracking-tight"
        style={{ color }}
      >
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
}

export default function TaxBracketChart() {
  const [income, setIncome] = useState(75000);

  const { totalTax, effectiveRate, marginalRate, takeHome } = useMemo(() => {
    const tax = calculateTotalTax(income);
    return {
      totalTax: tax,
      effectiveRate: income > 0 ? (tax / income) * 100 : 0,
      marginalRate: getMarginalRate(income) * 100,
      takeHome: income - tax,
    };
  }, [income]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}

      <div className="max-w-6xl mx-auto px-4 pt-10 md:py-10 pb-2 md:pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            2024 Tax Year
          </span>
          <span>Single Filer Brackets</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
          How US Federal Tax Brackets
          <br />
          <span className="text-primary">Actually Work</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground  text-pretty">
          A common misconception is that moving into a higher tax bracket means
          all your income is taxed at that rate. In reality, only the income{" "}
          <em className="text-foreground not-italic font-medium">within</em>{" "}
          each bracket is taxed at that bracket&apos;s rate.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3 md:py-5 space-y-8">
        {/* Income Slider Card */}
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Your Gross Income
              </label>
              <div className="text-4xl md:text-5xl font-bold font-mono tracking-tight text-foreground mt-1">
                {formatCurrency(income)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-muted-foreground">
                Drag to adjust
              </span>
            </div>
          </div>
          <Slider
            value={[income]}
            onValueChange={(value) => setIncome(value[0])}
            min={0}
            max={500000}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-3">
            <span>$0</span>
            <span>$100K</span>
            <span>$200K</span>
            <span>$300K</span>
            <span>$400K</span>
            <span>$500K</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Total Federal Tax"
            value={formatCurrency(totalTax)}
            color="#f87171"
          />
          <StatCard
            icon={PiggyBank}
            label="Take Home Pay"
            value={formatCurrency(takeHome)}
            subValue={`${((takeHome / income) * 100 || 0).toFixed(1)}% of gross`}
            color="#2dd4bf"
          />
          <StatCard
            icon={Percent}
            label="Effective Tax Rate"
            value={`${effectiveRate.toFixed(1)}%`}
            subValue="What you actually pay"
            color="#60a5fa"
          />
          <StatCard
            icon={TrendingUp}
            label="Marginal Tax Rate"
            value={`${marginalRate.toFixed(0)}%`}
            subValue="Your top bracket"
            color="#fbbf24"
          />
        </div>

        {/* Charts Section */}
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
          <Tabs defaultValue="brackets" className="w-full">
            <div className="border-b border-border/50 px-6 py-3 flex items-center">
              <TabsList>
                <TabsTrigger value="brackets">Bracket Fill</TabsTrigger>
                <TabsTrigger value="waterfall">By Bracket</TabsTrigger>
                <TabsTrigger value="rates">Rate Curves</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="brackets" className="mt-0">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground">
                      How Your Income Fills Each Bracket
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Watch how your income progressively fills up each tax
                      bracket from lowest to highest
                    </p>
                  </div>
                  <BracketVisualizer income={income} />
                </div>
              </TabsContent>

              <TabsContent value="waterfall" className="mt-0">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground">
                      Income Taxed at Each Rate
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bar height shows how much of your income falls into each
                      tax bracket
                    </p>
                  </div>
                  <WaterfallChart income={income} />
                </div>
              </TabsContent>

              <TabsContent value="rates" className="mt-0">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground">
                      Effective vs Marginal Rate
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your effective rate is always lower than your marginal
                      rate
                    </p>
                  </div>
                  <EffectiveRateChart income={income} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Key Insight Card */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                The Key Insight
              </h3>
              <p className="text-muted-foreground mt-2 text-pretty leading-relaxed">
                Even at{" "}
                <span className="text-foreground font-semibold">
                  {formatCurrency(income)}
                </span>{" "}
                income, your effective tax rate is only{" "}
                <span className="text-primary font-semibold">
                  {effectiveRate.toFixed(1)}%
                </span>
                , not {marginalRate.toFixed(0)}%. That&apos;s because the first
                $11,600 is always taxed at 10%, the next ~$35,550 at 12%, and so
                on. You only pay higher rates on income{" "}
                <em className="not-italic font-medium text-foreground">
                  above
                </em>{" "}
                each threshold.
              </p>
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    2024 Single Filer Brackets:
                  </span>{" "}
                  10% (up to $11,600) → 12% ($11,601-$47,150) → 22%
                  ($47,151-$100,525) → 24% ($100,526-$191,950) → 32%
                  ($191,951-$243,725) → 35% ($243,726-$609,350) → 37% (over
                  $609,350)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
