import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

// ============================
// CFA-branded color palette
// ============================
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
  mint: "#49b2b8",
  darkText: "#06005a",
  faceValue: "#06005a",
  coupon: "#4476ff",
  yield: "#7a46ff",
  presentValue: "#50037f",
  purchase: "#f2af81",
};

// ============================
// CARD WRAPPER
// ============================
function Card({ title, children, className = "" }) {
  return (
    <section className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h2 className="font-serif text-xl text-slate-800 mb-3">{title}</h2>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </section>
  );
}

// ============================
// VALIDATION MESSAGE
// ============================
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

// ============================
// UTILS
// ============================
const formatCurrency = (amount, showNegativeAsParens = false) => {
  if (isNaN(amount)) return "$0.00";
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (amount < 0 && showNegativeAsParens) return `(${formattedAmount})`;
  if (amount < 0) return `-${formattedAmount}`;
  return formattedAmount;
};

// Exported helper for internal tests (not used by UI directly)
const computeBondPrice = ({ faceValue, couponRate, ytm, years, frequency }) => {
  const periods = years * frequency;
  const periodicCouponRate = couponRate / 100 / frequency;
  const periodicYield = ytm / 100 / frequency;
  const periodicCoupon = faceValue * periodicCouponRate;
  let pvCoupons = 0;
  for (let t = 1; t <= periods; t++) {
    pvCoupons += periodicCoupon / Math.pow(1 + periodicYield, t);
  }
  const pvFaceValue = faceValue / Math.pow(1 + periodicYield, periods);
  return { price: pvCoupons + pvFaceValue, pvCoupons, pvFaceValue };
};

// ============================
// EQUATION SECTION (Card 1)
// ============================
function EquationSection() {
  return (
    <div
      className="p-4 bg-white rounded-lg border border-gray-200 overflow-x-auto xl:overflow-x-visible"
      aria-describedby="equation-description"
    >
      {/* Screen-reader description of the formula */}
      <p className="sr-only" id="equation-description">
        Bond valuation equation: Present value of a coupon bond equals the coupon payment divided by the rate,
        multiplied by one minus one divided by the quantity one plus the rate raised to the power T,
        plus the face value divided by the quantity one plus the rate raised to the power T.
      </p>
      <div className="flex justify-center">
        <div
          className="font-mono text-sm p-3 rounded inline-block whitespace-normal break-words text-center max-w-full"
          aria-hidden="true"
        >
          <span className="font-bold" style={{ color: COLORS.orange }}>PV</span>
          <sub style={{ color: COLORS.orange }}>coupon bond</sub>
          <span className="mx-1">=</span>
          <span className="inline-flex flex-col items-center mx-1">
            <span className="border-b border-gray-400 px-1 pb-0.5">
              <span className="font-bold" style={{ color: COLORS.coupon }}>PMT</span>
            </span>
            <span className="text-xs pt-0.5" style={{ color: COLORS.yield }}>r</span>
          </span>
          <span className="mx-1">×</span>
          <span className="inline-flex items-stretch align-middle mx-1">
            <span className="flex flex-col justify-center text-base leading-none font-semibold">[</span>
            <span className="inline-flex items-center px-1">
              1 −
              <span className="inline-flex flex-col items-center mx-1">
                <span className="border-b border-gray-400 px-1 pb-0.5">1</span>
                <span className="text-xs pt-0.5">
                  (1 + <span style={{ color: COLORS.yield }}>r</span>)<sup>T</sup>
                </span>
              </span>
            </span>
            <span className="flex flex-col justify-center text-base leading-none font-semibold">]</span>
          </span>
          <span className="mx-1">+</span>
          <span className="inline-flex flex-col items-center justify-center mx-1 align-middle">
            <span className="border-b border-gray-400 px-1 pb-0.5 flex justify-center">
              <span className="font-bold" style={{ color: COLORS.mint }}>FV</span>
            </span>
            <span className="text-xs pt-0.5">
              (1 + <span style={{ color: COLORS.yield }}>r</span>)<sup>T</sup>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================
// MISC SECTION (Card 2)
// ============================
function MiscSection({ bondCalculations, faceValue, couponRate, ytm, years }) {
  if (!bondCalculations) return null;
  return (
    <div className="space-y-6">
      {/* PV Bond Price box - orange to match initial purchase */}
      <div className="p-4 rounded-lg border" style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa" }}>
        <div className="font-semibold text-sm" style={{ color: COLORS.orange }}>PV Bond Price</div>
        <div className="text-3xl font-serif" style={{ color: COLORS.orange }}>
          <div aria-live="polite">{formatCurrency(bondCalculations.bondPrice)}</div>{" "}
          <span className="text-sm text-gray-700 font-sans">per $100 par</span>
        </div>
      </div>

      {/* Premium–Discount Analysis */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="font-semibold text-sm text-purple-800 mb-2">Premium–Discount Analysis</div>
        <div className="text-xs text-purple-700 space-y-2" aria-live="polite">
          <div className="font-semibold">
            {Math.abs(bondCalculations.bondPrice - faceValue) < 0.01
              ? "Par bond"
              : bondCalculations.bondPrice > faceValue
              ? "Premium bond"
              : "Discount bond"}
          </div>
          <div>
            {Math.abs(bondCalculations.bondPrice - faceValue) < 0.01 ? (
              <>Trading at par. Coupon rate ≈ YTM ({ytm.toFixed(2)}%)</>
            ) : bondCalculations.bondPrice > faceValue ? (
              <>Trading {formatCurrency(bondCalculations.bondPrice - faceValue)} above par. Coupon ({couponRate.toFixed(2)}%) &gt; YTM ({ytm.toFixed(2)}%)</>
            ) : (
              <>Trading {formatCurrency(faceValue - bondCalculations.bondPrice)} below par. YTM ({ytm.toFixed(2)}%) &gt; coupon ({couponRate.toFixed(2)}%)</>
            )}
          </div>
          <div className="text-xs pt-2 border-t border-purple-300 space-y-1">
            <div>PV coupons: {formatCurrency(bondCalculations.pvCoupons)}</div>
            <div>PV face: {formatCurrency(bondCalculations.pvFaceValue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================
// VISUALIZER SECTION (Card 3)
// ============================
function BondChart({ bondCalculations }) {
  if (!bondCalculations) return null;
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    const handleResize = () => setShowLabels(window.innerWidth > 860);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow text-gray-800">
          <p className="font-medium">{`Period: ${data.yearLabel} years`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value, true)}`}
            </p>
          ))}
          <p className="text-sm mt-1">{`Total: ${formatCurrency(data.totalCashFlow, true)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Accessible captioning for the chart */}
      <div className="sr-only" id="bond-chart-desc">
        <h3 id="bond-chart-title">Bond cash flows</h3>
        <p>Stacked bars display coupon payments and the final principal repayment over time. The initial purchase appears as a negative bar at period 0.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center">
          <span className="w-4 h-4 mr-2 rounded" style={{ backgroundColor: COLORS.purchase }}></span>
          Initial purchase
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 mr-2 rounded" style={{ backgroundColor: COLORS.coupon }}></span>
          Coupon payment
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 mr-2 rounded" style={{ backgroundColor: COLORS.mint }}></span>
          Principal repayment
        </span>
      </div>

      <div className="h-96" role="img" aria-labelledby="bond-chart-title" aria-describedby="bond-chart-desc">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bondCalculations.cashFlows} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="yearLabel" label={{ value: "Years", position: "insideBottom", offset: -10 }} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="principalPayment" name="Principal repayment" stackId="cashflow">
              {bondCalculations.cashFlows.map((entry, index) => (
                <Cell key={`cell-principal-${index}`} fill={entry.principalPayment >= 0 ? COLORS.mint : COLORS.purchase} />
              ))}
            </Bar>
            <Bar dataKey="couponPayment" name="Coupon payment" fill={COLORS.coupon} stackId="cashflow">
              {showLabels && (
                <LabelList
                  dataKey="totalCashFlow"
                  position="top"
                  formatter={(value) => (value && Math.abs(value) >= 0.01 ? formatCurrency(value, true) : "")}
                  style={{ fontSize: "11px", fontWeight: "600", fill: COLORS.darkText }}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ============================
// MAIN APP
// ============================
export default function App() {
  const faceValue = 100;
  const frequency = 2;
  const [couponRate, setCouponRate] = useState(8.6);
  const [ytm, setYtm] = useState(6.5);
  const [years, setYears] = useState(5);

  // --- simple internal test cases (console only) ---
  useEffect(() => {
    const approxEq = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;
    const t1 = computeBondPrice({ faceValue: 100, couponRate: 6, ytm: 6, years: 5, frequency: 2 });
    console.assert(approxEq(t1.price, 100, 0.2), "Test 1 failed: par pricing should be about 100");
    const t2 = computeBondPrice({ faceValue: 100, couponRate: 8, ytm: 6, years: 5, frequency: 2 });
    console.assert(t2.price > 100, "Test 2 failed: price should be premium (>100)");
    const t3 = computeBondPrice({ faceValue: 100, couponRate: 4, ytm: 6, years: 5, frequency: 2 });
    console.assert(t3.price < 100, "Test 3 failed: price should be discount (<100)");
  }, []);

  const validateInputs = () => {
    const errors = {};
    if (couponRate < 0 || couponRate > 10) errors.couponRate = "Coupon rate must be between 0% and 10%";
    if (ytm < 0 || ytm > 10) errors.ytm = "Yield-to-maturity must be between 0% and 10%";
    if (years < 1 || years > 5) errors.years = "Years-to-maturity must be between 1 and 5";
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

    const cashFlows = [
      { period: 0, yearLabel: 0, couponPayment: 0, principalPayment: -bondPrice, totalCashFlow: -bondPrice },
    ];

    for (let t = 1; t <= periods; t++) {
      const couponPayment = periodicCoupon;
      const principalPayment = t === periods ? faceValue : 0;
      const totalCashFlow = couponPayment + principalPayment;
      cashFlows.push({
        period: t,
        yearLabel: t / frequency,
        couponPayment,
        principalPayment,
        totalCashFlow,
      });
    }

    return { bondPrice, periodicCoupon, periodicYield, periods, cashFlows, pvCoupons, pvFaceValue };
  }, [couponRate, ytm, years, inputErrors]);

  // IDs for validation aria-describedby
  const couponErrId = "couponError";
  const ytmErrId = "ytmError";
  const yearsErrId = "yearsError";

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* 1️⃣ Equation Card */}
        <Card title="Bond Valuation Equation">
          <p className="mb-4 text-sm text-gray-700">Equation 6 shows the price of a coupon bond expressed as:</p>
          <EquationSection />
        </Card>

        {/* 2️⃣ + 3️⃣ Results and Chart */}
        {bondCalculations && (
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-2">
              <Card title="Results and Analysis">
                <MiscSection
                  bondCalculations={bondCalculations}
                  faceValue={faceValue}
                  couponRate={couponRate}
                  ytm={ytm}
                  years={years}
                />
              </Card>
            </div>
            <div className="col-span-6 sm:col-span-4">
              <Card title="Bond Cash Flows">
                <BondChart bondCalculations={bondCalculations} />
              </Card>
            </div>
          </div>
        )}

        {/* 4️⃣ Data Entry Card */}
        <Card title="Bond Cash Flow Calculator">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
            <div className="flex flex-wrap justify-between items-center gap-x-8 gap-y-2">
              <div className="flex items-center">
                <span className="text-gray-700 mr-2">Face value:</span>
                <span className="font-semibold">{formatCurrency(faceValue)}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700 mr-2">Payment frequency:</span>
                <span className="font-semibold">Semi-annual</span>
              </div>
            </div>
          </div>

          {/* Input controls */}
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4" aria-describedby="inputHelp">
            {/* Coupon Rate */}
            <div className="flex items-center gap-2">
              <label htmlFor="coupon" className="font-medium text-gray-700 text-sm">
                Coupon rate <span className="text-gray-500 font-normal">(0 - 10)</span> <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative w-24">
                <input
                  id="coupon"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={couponRate}
                  onChange={(e) => setCouponRate(+e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm pr-6 ${inputErrors.couponRate ? "border-red-300" : "border-gray-300"} focus:border-blue-500 focus:ring-blue-600`}
                  aria-invalid={!!inputErrors.couponRate}
                  aria-describedby={inputErrors.couponRate ? couponErrId : undefined}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
            </div>
            {inputErrors.couponRate && (
              <p id={couponErrId} className="text-xs text-red-700 w-full">{inputErrors.couponRate}</p>
            )}

            {/* Yield-to-Maturity */}
            <div className="flex items-center gap-2">
              <label htmlFor="ytm" className="font-medium text-gray-700 text-sm">
                Yield-to-maturity <span className="text-gray-500 font-normal">(0 - 10)</span> <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative w-24">
                <input
                  id="ytm"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={ytm}
                  onChange={(e) => setYtm(+e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm pr-6 ${inputErrors.ytm ? "border-red-300" : "border-gray-300"} focus:border-blue-500 focus:ring-blue-600`}
                  aria-invalid={!!inputErrors.ytm}
                  aria-describedby={inputErrors.ytm ? ytmErrId : undefined}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
            </div>
            {inputErrors.ytm && (
              <p id={ytmErrId} className="text-xs text-red-700 w-full">{inputErrors.ytm}</p>
            )}

            {/* Years-to-Maturity */}
            <div className="flex items-center gap-2">
              <label htmlFor="years" className="font-medium text-gray-700 text-sm">
                Years-to-maturity <span className="text-gray-500 font-normal">(1 - 5)</span> <span className="text-red-500 ml-1">*</span>
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
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${inputErrors.years ? "border-red-300" : "border-gray-300"} focus:border-blue-500 focus:ring-blue-600`}
                  aria-invalid={!!inputErrors.years}
                  aria-describedby={inputErrors.years ? yearsErrId : undefined}
                />
              </div>
            </div>
            {inputErrors.years && (
              <p id={yearsErrId} className="text-xs text-red-700 w-full">{inputErrors.years}</p>
            )}

            <p id="inputHelp" className="sr-only">Enter values and the calculator updates results and the chart automatically.</p>
          </div>

          <ValidationMessage errors={inputErrors} />
        </Card>
      </main>
    </div>
  );
}