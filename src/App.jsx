import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";

// CFA-branded color palette
const COLORS = {
  primary: "#4476ff",
  dark: "#06005a",
  darkAlt: "#38337b",
  positive: "#6991ff",
  negative: "#ea792d",
  purple: "#7a46ff",
  purpleAlt: "#50037f",
  lightBlue: "#4476ff",
  orange: "#ea792d",
  darkText: "#06005a",
  faceValue: "#06005a",      // CFA Dark Blue (18.18:1) - was black
   coupon: "#4476ff",         // CFA Bright Blue (OK for large text/graphics)
  yield: "#7a46ff",          // CFA Purple (5.06:1) - was #7C3AED
  presentValue: "#50037f",   // CFA Eggplant (12.65:1) - was green
  purchase: "#f2af81",       // CFA Orange 60% (better contrast) - was light red
};

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h2 className="font-serif text-xl text-slate-800 mb-3">{title}</h2>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function InfoIcon({ children, id }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 focus:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-describedby={`${id}-tooltip`}
        aria-label="More information"
      >
        ?
      </button>
      
      {showTooltip && (
        <div
          id={`${id}-tooltip`}
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 max-w-xs"
        >
          {children}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

function ValidationMessage({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return (
    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <h3 className="text-red-800 font-semibold text-sm mb-2">Please correct the following:</h3>
      <ul className="text-red-800 text-sm space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>• {error}</li>
        ))}
      </ul>
    </div>
  );
}

const formatCurrency = (amount, showNegativeAsParens = false) => {
  const absAmount = Math.abs(amount);
  const formattedAmount = `$${absAmount.toFixed(2)}`;
  
  if (amount < 0 && showNegativeAsParens) {
    return `(${formattedAmount})`;
  } else if (amount < 0) {
    return `-${formattedAmount}`;
  } else {
    return formattedAmount;
  }
};

function ResultsSection({ bondCalculations, faceValue, couponRate, ytm, years }) {
  if (!bondCalculations) return null;

  return (
    <div className="space-y-6">
      {/* Bond Valuation Formula */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="font-semibold mb-3 text-sm">Bond Valuation Formula</div>
        
        {/* Accessible formula description */}
        <div className="sr-only">
          <p>Bond valuation formula: Present value of coupon bond equals PMT subscript 1 divided by the quantity 1 plus r raised to the power 1, plus PMT subscript 2 divided by the quantity 1 plus r raised to the power 2, and so on, plus PMT subscript N plus FV subscript N, all divided by the quantity 1 plus r raised to the power N.</p>
          <p>Where PMT is the periodic coupon payment, r is the periodic yield rate, N is the number of periods, and FV is the face value.</p>
        </div>
        
        {/* Visual formula display */}
        <div className="text-center font-mono text-sm mb-3 bg-gray-50 p-3 rounded" aria-hidden="true">
          <div className="flex items-center justify-center gap-1 flex-wrap text-sm">
            <span className="font-bold" style={{ color: COLORS.presentValue }}>PV</span>
            <sub className="text-xs">coupon bond</sub>
            <span className="mx-1">=</span>
            
            {/* First term */}
            <div className="flex flex-col items-center mx-1">
              <div className="border-b border-gray-400 px-2 pb-1">
                <span className="font-bold" style={{ color: COLORS.coupon }}>PMT</span>
                <sub className="text-xs">1</sub>
              </div>
              <div className="flex items-center text-xs pt-1">
                <span>(1+</span>
                <span className="font-bold" style={{ color: COLORS.yield }}>r</span>
                <span>)<sup>1</sup></span>
              </div>
            </div>
            
            <span>+</span>
            
            {/* Second term */}
            <div className="flex flex-col items-center mx-1">
              <div className="border-b border-gray-400 px-2 pb-1">
                <span className="font-bold" style={{ color: COLORS.coupon }}>PMT</span>
                <sub className="text-xs">2</sub>
              </div>
              <div className="flex items-center text-xs pt-1">
                <span>(1+</span>
                <span className="font-bold" style={{ color: COLORS.yield }}>r</span>
                <span>)<sup>2</sup></span>
              </div>
            </div>
            
            <span className="mx-1">+ ... +</span>
            
            {/* Final term with PMT_N + FV_N */}
            <div className="flex flex-col items-center mx-1">
              <div className="border-b border-gray-400 px-2 pb-1">
                <span>(</span>
                <span className="font-bold" style={{ color: COLORS.coupon }}>PMT</span>
                <sub className="text-xs" style={{ color: COLORS.darkText }}>N</sub>
                <span> + </span>
                <span className="font-bold" style={{ color: COLORS.faceValue }}>FV</span>
                <sub className="text-xs" style={{ color: COLORS.darkText }}>N</sub>
                <span>)</span>
              </div>
              <div className="flex items-center text-xs pt-1">
                <span>(1+</span>
                <span className="font-bold" style={{ color: COLORS.yield }}>r</span>
                <span>)<sup style={{ color: COLORS.darkText }}>N</sup></span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Variable Definitions with Live Updates */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.coupon }} aria-hidden="true"></span>
            <span><strong>PMT:</strong> {formatCurrency(bondCalculations.periodicCoupon)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.faceValue }} aria-hidden="true"></span>
            <span><strong>FV:</strong> {formatCurrency(faceValue)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.yield }} aria-hidden="true"></span>
            <span><strong>r:</strong> {(bondCalculations.periodicYield * 100).toFixed(3)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.darkText }} aria-hidden="true"></span>
            <span><strong>N:</strong> {bondCalculations.periods}</span>
          </div>
        </div>
      </div>

      {/* Bond Price */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-3xl font-serif text-blue-600 mb-2">{formatCurrency(bondCalculations.bondPrice)}</div>
        <div className="text-sm text-gray-700">
          <div><strong>Bond Price</strong> - per $100 par</div>
        </div>
      </div>

      {/* Price Analysis - Combined */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-xs text-purple-700 space-y-2">
          <div className="font-semibold">
            {Math.abs(bondCalculations.bondPrice - faceValue) < 0.01 ? (
              "Par Bond"
            ) : bondCalculations.bondPrice > faceValue ? (
              "Premium Bond"
            ) : (
              "Discount Bond"
            )}
          </div>
          <div>
            {Math.abs(bondCalculations.bondPrice - faceValue) < 0.01 ? (
              <>Trading at par. Coupon rate ≈ YTM ({ytm.toFixed(2)}%)</>
            ) : bondCalculations.bondPrice > faceValue ? (
              <>Trading {formatCurrency(bondCalculations.bondPrice - faceValue)} above par. Coupon ({couponRate.toFixed(2)}%) &gt; YTM ({ytm.toFixed(2)}%)</>
            ) : (
              <>Trading {formatCurrency(faceValue - bondCalculations.bondPrice)} below par. YTM ({ytm.toFixed(2)}%) &gt; Coupon ({couponRate.toFixed(2)}%)</>
            )}
          </div>
          <div className="text-xs pt-2 border-t border-purple-300 space-y-1">
            <div>PV Coupons: {formatCurrency(bondCalculations.pvCoupons)}</div>
            <div>PV Face: {formatCurrency(bondCalculations.pvFaceValue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BondChart({ bondCalculations }) {
  if (!bondCalculations) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{`Period: ${data.yearLabel} years`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value, true)}`}
            </p>
          ))}
          <p className="text-sm text-gray-600 mt-1">
            {`Total: ${formatCurrency(data.totalCashFlow, true)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center">
          <span className="w-4 h-4 mr-2 rounded" style={{backgroundColor: COLORS.purchase}}></span>
          Initial Purchase
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 mr-2 rounded" style={{backgroundColor: COLORS.coupon}}></span>
          Coupon Payment
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 mr-2 rounded" style={{backgroundColor: COLORS.faceValue}}></span>
          Principal Repayment
        </span>
      </div>

      {/* Chart */}
      <div className="h-96" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
        <div className="sr-only">
          <h3 id="chart-title">Bond Cash Flow Timeline Chart</h3>
          <p id="chart-description">
            Bar chart showing cash flows over time, with light red bar for initial purchase, 
            blue bars for coupon payments, and black bars for principal repayment.
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bondCalculations.cashFlows} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="yearLabel"
              tickFormatter={(val) => Number.isInteger(val) ? val.toString() : ""}
              label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar dataKey="principalPayment" name="Principal/Initial Purchase" stackId="cashflow">
              {bondCalculations.cashFlows.map((entry, index) => (
                <Cell key={`cell-principal-${index}`} fill={entry.principalPayment >= 0 ? COLORS.faceValue : COLORS.purchase} />
              ))}
            </Bar>
            
            <Bar dataKey="couponPayment" name="Coupon Payment" fill={COLORS.coupon} stackId="cashflow">
              <LabelList 
                dataKey="total" 
                position="top" 
                formatter={(value) => {
                  if (value !== null && Math.abs(value) >= 0.01) {
                    return formatCurrency(value, true);
                  }
                  return '';
                }}
                style={{ fontSize: '11px', fontWeight: '600', fill: COLORS.darkText }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Educational note */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
        <strong>Bond Cash Flows:</strong> Chart shows the initial purchase (negative cash flow at time 0), periodic coupon payments, and principal repayment at maturity.
      </div>
    </>
  );
}

export default function App() {
  const faceValue = 100;
  const frequency = 2;
  
  const [couponRate, setCouponRate] = useState(8.6);
  const [ytm, setYtm] = useState(6.5);
  const [years, setYears] = useState(5);

  const validateInputs = () => {
    const errors = {};
    if (couponRate < 0 || couponRate > 10) errors.couponRate = "Coupon Rate must be between 0% and 10%";
    if (ytm < 0 || ytm > 10) errors.ytm = "Yield to Maturity must be between 0% and 10%";
    if (years < 1 || years > 5) errors.years = "Years to Maturity must be between 1 and 5";
    return errors;
  };

  const inputErrors = validateInputs();

  const bondCalculations = useMemo(() => {
    if (Object.keys(inputErrors).length > 0) return null;

    const periods = years * frequency;
    const periodicCouponRate = couponRate / 100 / frequency;
    const periodicYield = ytm / 100 / frequency;
    const periodicCoupon = faceValue * periodicCouponRate;

    let pvCoupons = 0;
    for (let t = 1; t <= periods; t++) {
      pvCoupons += periodicCoupon / Math.pow(1 + periodicYield, t);
    }
    const pvFaceValue = faceValue / Math.pow(1 + periodicYield, periods);
    const bondPrice = pvCoupons + pvFaceValue;

    const cashFlows = [];
    cashFlows.push({
      period: 0,
      periodLabel: "0",
      yearLabel: 0,
      couponPayment: 0,
      principalPayment: -bondPrice,
      totalCashFlow: -bondPrice,
      total: -bondPrice
    });

    for (let t = 1; t <= periods; t++) {
      const couponPayment = periodicCoupon;
      const principalPayment = (t === periods) ? faceValue : 0;
      const totalCashFlow = couponPayment + principalPayment;

      cashFlows.push({
        period: t,
        periodLabel: t.toString(),
        yearLabel: t / frequency,
        couponPayment,
        principalPayment,
        totalCashFlow,
        total: totalCashFlow
      });
    }

    return { bondPrice, periodicCoupon, periodicYield, periods, cashFlows, pvCoupons, pvFaceValue };
  }, [couponRate, ytm, years, inputErrors]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6">

        {/* RESULTS AND CHART */}
        {bondCalculations && (
          <>
            {/* MOBILE */}
            <div className="lg:hidden space-y-6">
              <Card title="Results">
                <ResultsSection bondCalculations={bondCalculations} faceValue={faceValue} couponRate={couponRate} ytm={ytm} years={years} />
              </Card>
              <Card title="Bond Cash Flows">
                <BondChart bondCalculations={bondCalculations} />
              </Card>
            </div>

            {/* DESKTOP */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-1">
                <Card title="Results">
                  <ResultsSection bondCalculations={bondCalculations} faceValue={faceValue} couponRate={couponRate} ytm={ytm} years={years} />
                </Card>
              </div>
              <div className="lg:col-span-4">
                <Card title="Bond Cash Flows">
                  <BondChart bondCalculations={bondCalculations} />
                </Card>
              </div>
            </div>
          </>
        )}

        {/* INPUTS */}
        <Card title="Bond Cash Flow Calculator">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Face Value:</span>
              <span className="font-semibold">{formatCurrency(faceValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Payment Frequency:</span>
              <span className="font-semibold">Semi-annual</span>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            
            <div className="flex items-center gap-2">
              <label htmlFor="coupon" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Coupon Rate (%)
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="coupon">Annual coupon rate</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="coupon"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={couponRate}
                  onChange={(e) => setCouponRate(+e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.couponRate ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="ytm" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Yield to Maturity (%)
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="ytm">Market yield</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="ytm"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={ytm}
                  onChange={(e) => setYtm(+e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.ytm ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="years" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Years to Maturity
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="years">Years until bond matures</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="years"
                  type="number"
                  step="0.5"
                  min="1"
                  max="5"
                  value={years}
                  onChange={(e) => setYears(+e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.years ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

          </div>
          
          <ValidationMessage errors={inputErrors} />
        </Card>

      </main>
    </div>
  );
}