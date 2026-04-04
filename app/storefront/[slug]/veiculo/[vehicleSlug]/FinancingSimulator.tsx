'use client'

import { useState, useMemo } from 'react'

interface FinancingSimulatorProps {
  price: number
  primaryColor: string
  squared?: boolean
}

export function FinancingSimulator({ price, primaryColor, squared = false }: FinancingSimulatorProps) {
  const [open, setOpen] = useState(false)
  const [downPaymentPct, setDownPaymentPct] = useState(20)
  const [months, setMonths] = useState(48)
  const [rate, setRate] = useState(1.49) // % a.m.

  const { downPayment, financed, installment } = useMemo(() => {
    const downPayment = (price * downPaymentPct) / 100
    const financed = price - downPayment
    // Price of Money (PMT) formula: PMT = PV * i / (1 - (1 + i)^-n)
    const i = rate / 100
    const installment = financed > 0 && months > 0
      ? (financed * i) / (1 - Math.pow(1 + i, -months))
      : 0
    return { downPayment, financed, installment }
  }, [price, downPaymentPct, months, rate])

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className={`bg-white border border-gray-100 overflow-hidden ${squared ? '' : 'rounded-xl shadow-sm'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
          </svg>
          <span className="font-semibold text-gray-900 text-sm sm:text-base">Simulador de financiamento</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24"
          strokeWidth={2} stroke="currentColor"
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          {/* Down payment */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-gray-500 font-medium">Entrada</label>
              <span className="text-xs font-semibold text-gray-800">{fmt(downPayment)} ({downPaymentPct}%)</span>
            </div>
            <input
              type="range" min={0} max={80} step={5}
              value={downPaymentPct}
              onChange={e => setDownPaymentPct(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200"
              style={{ accentColor: primaryColor }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0%</span><span>80%</span>
            </div>
          </div>

          {/* Months */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-gray-500 font-medium">Prazo</label>
              <span className="text-xs font-semibold text-gray-800">{months}x</span>
            </div>
            <input
              type="range" min={12} max={84} step={12}
              value={months}
              onChange={e => setMonths(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200"
              style={{ accentColor: primaryColor }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>12x</span><span>84x</span>
            </div>
          </div>

          {/* Rate */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-gray-500 font-medium">Taxa de juros (a.m.)</label>
              <span className="text-xs font-semibold text-gray-800">{rate.toFixed(2)}%</span>
            </div>
            <input
              type="range" min={0.5} max={3} step={0.01}
              value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200"
              style={{ accentColor: primaryColor }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0,50%</span><span>3,00%</span>
            </div>
          </div>

          {/* Result */}
          <div className={`p-4 text-center ${squared ? '' : 'rounded-xl'}`} style={{ backgroundColor: primaryColor + '12' }}>
            <p className="text-xs text-gray-500 mb-1">Parcela estimada</p>
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>{fmt(installment)}/mês</p>
            <p className="text-xs text-gray-400 mt-1">
              {months}x de {fmt(installment)} — financiado: {fmt(financed)}
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center">
            * Simulação meramente ilustrativa. Consulte a loja para condições reais.
          </p>
        </div>
      )}
    </div>
  )
}
