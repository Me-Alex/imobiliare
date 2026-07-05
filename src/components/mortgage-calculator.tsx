'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Euro, Percent, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatPrice } from '@/lib/api'

interface AmortizationRow {
  month: number
  payment: number
  principal: number
  interest: number
  remainingBalance: number
}

function calculateMortgage(
  propertyPrice: number,
  downPaymentPercent: number,
  loanYears: number,
  annualRate: number
) {
  const downPayment = propertyPrice * (downPaymentPercent / 100)
  const loanAmount = propertyPrice - downPayment
  const monthlyRate = annualRate / 100 / 12
  const totalPayments = loanYears * 12

  let monthlyPayment = 0
  if (monthlyRate > 0) {
    monthlyPayment =
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
  } else {
    monthlyPayment = loanAmount / totalPayments
  }

  const totalCost = monthlyPayment * totalPayments
  const totalInterest = totalCost - loanAmount

  // Amortization schedule (first 12 months)
  const amortization: AmortizationRow[] = []
  let balance = loanAmount
  for (let i = 1; i <= 12; i++) {
    const interestPortion = balance * monthlyRate
    const principalPortion = monthlyPayment - interestPortion
    balance = Math.max(0, balance - principalPortion)
    amortization.push({
      month: i,
      payment: monthlyPayment,
      principal: principalPortion,
      interest: interestPortion,
      remainingBalance: balance,
    })
  }

  return {
    downPayment,
    loanAmount,
    monthlyPayment,
    totalInterest,
    totalCost,
    amortization,
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function MortgageCalculator() {
  const [propertyPrice, setPropertyPrice] = useState(150000)
  const [downPaymentPercent, setDownPaymentPercent] = useState(20)
  const [loanYears, setLoanYears] = useState(25)
  const [annualRate, setAnnualRate] = useState(5.5)

  const results = useMemo(
    () => calculateMortgage(propertyPrice, downPaymentPercent, loanYears, annualRate),
    [propertyPrice, downPaymentPercent, loanYears, annualRate]
  )

  const principalPercent =
    results.totalCost > 0
      ? (results.loanAmount / results.totalCost) * 100
      : 50
  const interestPercent = 100 - principalPercent

  // SVG donut chart params
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const principalStroke = (principalPercent / 100) * circumference
  const interestStroke = (interestPercent / 100) * circumference

  return (
    <section id="calculator" className="scroll-mt-20 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Calculator Ipotecar
            </h2>
            <p className="text-muted-foreground mt-1">
              Estimeaza rata lunara si costul total al creditului tau imobiliar.
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 lg:grid-cols-2"
        >
          {/* LEFT COLUMN — Inputs */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Parametrii Creditului
                </CardTitle>
                <CardDescription>
                  Ajusteaza valorile pentru a calcula rata lunara
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Property Price */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2" htmlFor="property-price">
                      <Euro className="h-4 w-4 text-primary" />
                      Pret proprietate
                    </Label>
                    <div className="relative w-28">
                      <Input
                        id="property-price"
                        type="number"
                        value={propertyPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val >= 50000 && val <= 1000000) setPropertyPrice(val)
                        }}
                        className="h-8 text-right text-sm pr-7"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        €
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[propertyPrice]}
                    onValueChange={([v]) => setPropertyPrice(v)}
                    min={50000}
                    max={1000000}
                    step={5000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>€50.000</span>
                    <span>€1.000.000</span>
                  </div>
                </div>

                {/* Down Payment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2" htmlFor="down-payment">
                      <Percent className="h-4 w-4 text-primary" />
                      Avans
                    </Label>
                    <div className="relative w-20">
                      <Input
                        id="down-payment"
                        type="number"
                        value={downPaymentPercent}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val >= 5 && val <= 50) setDownPaymentPercent(val)
                        }}
                        className="h-8 text-right text-sm pr-7"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[downPaymentPercent]}
                    onValueChange={([v]) => setDownPaymentPercent(v)}
                    min={5}
                    max={50}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5%</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* Loan Term */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2" htmlFor="loan-term">
                      <Clock className="h-4 w-4 text-primary" />
                      Perioada
                    </Label>
                    <div className="relative w-24">
                      <Input
                        id="loan-term"
                        type="number"
                        value={loanYears}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val >= 5 && val <= 35) setLoanYears(val)
                        }}
                        className="h-8 text-right text-sm pr-14"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        ani
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[loanYears]}
                    onValueChange={([v]) => setLoanYears(v)}
                    min={5}
                    max={35}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 ani</span>
                    <span>35 ani</span>
                  </div>
                </div>

                {/* Annual Interest Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2" htmlFor="interest-rate">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Dobanda anuala
                    </Label>
                    <div className="relative w-20">
                      <Input
                        id="interest-rate"
                        type="number"
                        value={annualRate}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val >= 2 && val <= 10) setAnnualRate(val)
                        }}
                        step={0.1}
                        className="h-8 text-right text-sm pr-7"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[annualRate]}
                    onValueChange={([v]) => setAnnualRate(v)}
                    min={2}
                    max={10}
                    step={0.1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>2%</span>
                    <span>10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* RIGHT COLUMN — Results */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rezumat Credit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    key={`dp-${downPaymentPercent}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="rounded-lg bg-primary/10 p-3"
                  >
                    <p className="text-xs text-muted-foreground">Avansul</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(results.downPayment)}
                    </p>
                  </motion.div>
                  <motion.div
                    key={`loan-${propertyPrice}-${downPaymentPercent}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="rounded-lg bg-primary/10 p-3"
                  >
                    <p className="text-xs text-muted-foreground">Suma imprumutata</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(results.loanAmount)}
                    </p>
                  </motion.div>
                  <motion.div
                    key={`monthly-${propertyPrice}-${downPaymentPercent}-${loanYears}-${annualRate}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="col-span-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-center"
                  >
                    <p className="text-sm text-muted-foreground">Rata lunara</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(results.monthlyPayment)}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      / luna
                    </Badge>
                  </motion.div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Dobanda totala</p>
                    <p className="text-base font-semibold">
                      {formatPrice(results.totalInterest)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Cost total</p>
                    <p className="text-base font-semibold">
                      {formatPrice(results.totalCost)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donut Chart + Amortization Tabs */}
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="grafic">
                  <TabsList className="w-full">
                    <TabsTrigger value="grafic" className="flex-1">
                      Grafic
                    </TabsTrigger>
                    <TabsTrigger value="amortizare" className="flex-1">
                      Amortizare
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="grafic" className="mt-4">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                      {/* SVG Donut */}
                      <div className="relative flex-shrink-0">
                        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
                          {/* Interest arc (background) */}
                          <circle
                            cx="90"
                            cy="90"
                            r={radius}
                            fill="none"
                            stroke="hsl(var(--muted))"
                            strokeWidth="18"
                            strokeDasharray={`${interestStroke} ${circumference - interestStroke}`}
                            strokeDashoffset={0}
                            className="transition-all duration-500"
                          />
                          {/* Principal arc */}
                          <circle
                            cx="90"
                            cy="90"
                            r={radius}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="18"
                            strokeDasharray={`${principalStroke} ${circumference - principalStroke}`}
                            strokeDashoffset={-interestStroke}
                            className="transition-all duration-500"
                          />
                        </svg>
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs text-muted-foreground">Total</span>
                          <span className="text-sm font-bold">
                            {formatPrice(results.totalCost)}
                          </span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
                          <span className="text-muted-foreground">Capital</span>
                          <span className="ml-auto font-semibold">
                            {formatPrice(results.loanAmount)}
                          </span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {principalPercent.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-sm bg-muted-foreground/40" />
                          <span className="text-muted-foreground">Dobanda</span>
                          <span className="ml-auto font-semibold">
                            {formatPrice(results.totalInterest)}
                          </span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {interestPercent.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="amortizare" className="mt-4">
                    <div className="max-h-96 overflow-y-auto rounded-lg border amortization-table">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Luna
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Rata
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Capital
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Dobanda
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Sold
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {results.amortization.map((row) => (
                            <tr
                              key={row.month}
                              className="transition-colors hover:bg-muted/50"
                            >
                              <td className="px-3 py-2">{row.month}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatPrice(row.payment)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-primary font-medium">
                                {formatPrice(row.principal)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                {formatPrice(row.interest)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatPrice(row.remainingBalance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                      Previzualizare primele 12 luni din {loanYears * 12} luni total
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}