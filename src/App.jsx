import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";

/**
 * CFA Institute – Quantitative Methods: LOS 1
 * 1) Coupon Bond Cash Flows & Price
 * 2) Mortgage Amortization (stacked Interest + Principal)
 * 3) Dividend Discount Models (no growth, Gordon, two-stage)
 */

const CHART_MARGINS = { top: 50, right: 12, left: 72, bottom: 36 };

// ---- CFA palette & helpers ----
const CFA = { primary: "#4476FF", dark: "#06005A" };
const fmtUSD = (x) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(x);
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

/* -------------------------------------------------------------------------- */
/*                             Compact calculator UI                           */
/* -------------------------------------------------------------------------- */

const Card = ({ title, children }) => (
  <section className="bg-white rounded-2xl shadow-md border border-gray-200">
    <header className="px-6 pt-6 pb-3 border-b border-gray-100">
      <h2 className="text-2xl font-georgia text-cfa-dark">{title}</h2>
    </header>
    <div className="p-6">{children}</div>
  </section>
);

// Label left, compact input(s) right
const InlineRow = ({ label, children }) => (
  <div className="flex items-center gap-4 py-1.5">
    <label className="grow text-sm font-arial text-gray-700">{label}</label>
    <div className="shrink-0 flex items-center gap-2">{children}</div>
  </div>
);

// Base input: fixed width, readable text/caret
const InputBase = ({ className = "", style, ...props }) => (
  <input
    {...props}
    className={
      "shrink-0 w-32 rounded-lg border border-gray-300 bg-white px-3 py-1.5 " +
      "text-right text-sm text-gray-900 caret-cfa-blue font-arial shadow-sm " +
      "focus:outline-none focus:ring-2 focus:ring-cfa-blue/40 focus:border-cfa-blue " +
      className
    }
    style={{ width: "8rem", ...style }}
  />
);

// Handles $/% adornment without blocking caret; adds padding automatically
function InputWithAdorn({ left, right, inputClassName = "", ...props }) {
  const padLeft = left ? "pl-6" : "";
  const padRight = right ? "pr-8" : ""; // reserve space so text/caret never sit under adorn
  return (
    <div className="relative shrink-0">
      {left && (
        <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-gray-500 text-sm font-arial">
          {left}
        </span>
      )}
      <InputBase {...props} className={`${padLeft} ${padRight} ${inputClassName}`} />
      {right && (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500 text-sm font-arial">
          {right}
        </span>
      )}
    </div>
  );
}

// Currency ($ shown, stores raw number)
function CurrencyField({ value, onChange }) {
  const display = Number.isFinite(value) ? value.toFixed(2) : "";
  return (
    <InputWithAdorn
      left="$"
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(Number.isFinite(v) ? v : 0);
      }}
      onBlur={(e) => {
        const v = parseFloat(e.target.value);
        e.target.value = Number.isFinite(v) ? v.toFixed(2) : "0.00";
        onChange(Number.isFinite(v) ? v : 0);
      }}
      placeholder="0.00"
    />
  );
}

// Percent (% shown, stores decimal 0–1)
function PercentField({ value, onChange }) {
  const display = Number.isFinite(value) ? (value * 100).toFixed(2) : "";
  return (
    <InputWithAdorn
      right="%"
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(Number.isFinite(v) ? v / 100 : 0);
      }}
      onBlur={(e) => {
        const v = parseFloat(e.target.value);
        e.target.value = Number.isFinite(v) ? v.toFixed(2) : "0.00";
        onChange(Number.isFinite(v) ? v / 100 : 0);
      }}
      placeholder="0.00"
    />
  );
}

// Integer years / frequency
function IntField({ value, onChange }) {
  const display = Number.isFinite(value) ? String(value) : "";
  return (
    <InputBase
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={display}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        onChange(Number.isFinite(v) ? v : 0);
      }}
      onBlur={(e) => {
        const v = parseInt(e.target.value, 10);
        e.target.value = Number.isFinite(v) ? String(v) : "0";
        onChange(Number.isFinite(v) ? v : 0);
      }}
      placeholder="0"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                Calculations                                */
/* -------------------------------------------------------------------------- */

// Bond cash flows - Include initial purchase but control labeling
function buildBondCashFlows({ face = 100, years = 5, couponRate = 0.086, ytm = 0.065, freq = 2 }) {
  const n = years * freq;
  const c = (couponRate * face) / freq;
  const r = ytm / freq;
  const flows = [];
  
  // Initial outflow (bond purchase) - with null total to prevent labeling
  const pvCoupons = Array.from({ length: n }, (_, k) => c / Math.pow(1 + r, k + 1)).reduce((a, b) => a + b, 0);
  const pvRedemption = face / Math.pow(1 + r, n);
  const price = pvCoupons + pvRedemption;
  
  flows.push({ 
    period: 0, 
    periodLabel: "0.0", 
    coupon: 0, 
    principal: -price,
    total: null  // null prevents label from showing
  });
  
  // Cash inflows for each period
  for (let t = 1; t <= n; t++) {
    const periodYears = t / freq;
    const couponFlow = c;
    const principalFlow = t === n ? face : 0;
    const totalFlow = couponFlow + principalFlow;
    
    flows.push({ 
      period: periodYears,
      periodLabel: periodYears.toString(),
      coupon: couponFlow, 
      principal: principalFlow, 
      total: totalFlow 
    });
  }
  
  return { flows, price, c, r, n };
}



/* -------------------------------------------------------------------------- */
/*                                   App                                      */
/* -------------------------------------------------------------------------- */

export default function App() {
  // Bond state
  const [couponRate, setCouponRate] = useState(0.086);
  const [ytm, setYtm] = useState(0.065);
  const [years, setYears] = useState(5);
  const [freq, setFreq] = useState(2);
  const bond = useMemo(() => buildBondCashFlows({ face: 100, years, couponRate, ytm, freq }), [years, couponRate, ytm, freq]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* 1) Bonds */}
        <Card title="Coupon Bond Cash Flows (Face $100)">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-georgia text-cfa-blue mb-2">Inputs</h3>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <InlineRow label="Coupon Rate (annual)"><PercentField value={couponRate} onChange={setCouponRate} /></InlineRow>
                <InlineRow label="Yield to Maturity (annual)"><PercentField value={ytm} onChange={setYtm} /></InlineRow>
                <InlineRow label="Years to Maturity"><IntField value={years} onChange={setYears} /></InlineRow>
                <InlineRow label="Payments / Year"><IntField value={freq} onChange={setFreq} /></InlineRow>
                <div className="h-px bg-gray-200 my-3" />
                <p className="text-sm font-arial text-gray-700">
                  <strong>Price:</strong> {fmtUSD(bond.price)} <span className="text-gray-500">(PV of coupons + redemption)</span>
                </p>
                <p className="text-sm font-arial text-gray-700">
                  <strong>Coupon/period:</strong> {fmtUSD(bond.c)} ({freq}×/yr) &nbsp;|&nbsp; <strong>Yield/period:</strong> {(bond.r * 100).toFixed(3)}%
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                {/* Price display above chart */}
                <div className="mb-2 text-left">
                  <span className="text-sm font-arial text-gray-700">
                    <strong>Bond Price:</strong> {fmtUSD(bond.price)}
                  </span>
                </div>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bond.flows} margin={CHART_MARGINS}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="periodLabel" 
                        tickMargin={10} 
                        label={{ value: "Years", position: "insideBottom", offset: -20 }}
                        type="category"
                      />
                      <YAxis tickFormatter={fmtUSD} width={80} />
                      <Tooltip 
                        formatter={(value, name) => [fmtUSD(value), name === 'coupon' ? 'Coupon' : 'Principal/Price']} 
                        contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }} 
                      />
                      <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ paddingBottom: 6 }} />
                      <Bar dataKey="principal" name="Principal/Price" fill={CFA.dark} stackId="cashflow" />
                      <Bar dataKey="coupon" name="Coupon" fill={CFA.primary} stackId="cashflow">
                        <LabelList 
                          dataKey="total" 
                          position="top" 
                          formatter={(value) => value !== null ? fmtUSD(Math.abs(value)) : ''}
                          style={{ fontSize: '11px', fontWeight: '500', fill: '#374151' }}
                        />
                      </Bar>
                      {/* Custom positioned label for the negative (first) bar */}
                      {bond.flows[0] && bond.flows[0].total < 0 && (
                        <text 
                          x="12%" 
                          y="25%" 
                          textAnchor="middle" 
                          fontSize="11" 
                          fontWeight="500" 
                          fill="#374151"
                        >
                          {fmtUSD(Math.abs(bond.flows[0].total))}
                        </text>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-600 mt-2 font-arial">
                  Negative bar at t=0 reflects the bond purchase price of {fmtUSD(bond.price)}. Subsequent periods show stacked coupon and principal payments.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}