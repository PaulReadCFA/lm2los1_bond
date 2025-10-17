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
  faceValue: "#06005a",      // CFA Dark Blue (18.18:1)
  coupon: "#4476ff",         // CFA Bright Blue
  yield: "#7a46ff",          // CFA Purple
  presentValue: "#50037f",   // CFA Eggplant
  purchase: "#f2af81",       // CFA Orange 60%
};

// ============================
// CARD WRAPPER
// ============================
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h2 className="font-serif text-xl text-slate-800 mb-3">{title}</h2>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
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
  const absAmount = Math.abs(amount);
  const formattedAmount = `$${absAmount.toFixed(2)}`;
  if (amount < 0 && showNegativeAsParens) return `(${formattedAmount})`;
  if (amount < 0) return `-${formattedAmount}`;
  return formattedAmount;
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
      
      <p className="sr-only" id="equation-description">
        Bond valuation equation: Present value of a coupon bond equals the coupon payment divided by the rate,
        multiplied by open bracket one minus one divided by the quantity one plus the rate raised to the power T,
        close bracket, plus the face value divided by the quantity one plus the rate raised to the power T.
      </p>
      <div className="flex justify-center">
        <div
          className="font-mono text-sm p-3 rounded inline-block whitespace-normal break-words text-center max-w-full"
          aria-hidden="true"
        >
          <span className="font-bold" style={{ color: COLORS.presentValue }}>
            PV
          </span>
          <sub style={{ color: COLORS.darkText }}>coupon bond</sub>
          <span className="mx-1">=</span>
          <span className="inline-flex flex-col items-center mx-1">
            <span className="border-b border-gray-400 px-1 pb-0.5">
              <span className="font-bold" style={{ color: COLORS.coupon }}>PMT</span>
            </span>
            <span className="text-xs pt-0.5" style={{ color: COLORS.yield }}>r</span>
          </span>
          <span className="mx-1">×</span>
          <span className="inline-flex items-stretch align-middle mx-1">
            <span className="flex flex-col justify-center text-base leading-none"
              style={{ fontSize: "1.2em", fontWeight: "600", lineHeight: "1" }}>
              [
            </span>
            <span className="inline-flex items-center px-1">
              1 −
              <span className="inline-flex flex-col items-center mx-1">
                <span className="border-b border-gray-400 px-1 pb-0.5">1</span>
                <span className="text-xs pt-0.5">
                  (1 + <span style={{ color: COLORS.yield }}>r</span>)<sup>T</sup>
                </span>
              </span>
            </span>
            <span className="flex flex-col justify-center text-base leading-none"
              style={{ fontSize: "1.2em", fontWeight: "600", lineHeight: "1" }}>
              ]
            </span>
          </span>
          <span className="mx-1">+</span>
          <span className="inline-flex flex-col items-center justify-center mx-1 align-middle">
            <span className="border-b border-gray-400 px-1 pb-0.5 flex justify-center">
              <span className="font-bold" style={{ color: COLORS.faceValue }}>FV</span>
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
      {/* Legend */}
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
          <span><strong>T:</strong> {bondCalculations.periods}</span>
        </div>
      </div>

      {/* PV Bond Price */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="font-semibold text-sm text-blue-800 mb-1">PV bond price</div>
        <div className="text-3xl font-serif text-blue-600">
          {formatCurrency(bondCalculations.bondPrice)}{" "}
          <span className="text-sm text-gray-700 font-sans">per $100 par</span>
        </div>
      </div>

      {/* Premium–Discount Analysis */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="font-semibold text-sm text-purple-800 mb-2">Premium–discount analysis</div>
        <div className="text-xs text-purple-700 space-y-2">
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
    const handleResize = () => setShowLabels(window.innerWidth > 640);
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
          <span className="w-4 h-4 mr-2 rounded" style={{ backgroundColor: COLORS.faceValue }}></span>
          Principal repayment
        </span>
      </div>

      <div className="h-96" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
        <div className="sr-only">
          <h3 id="chart-title">Bond cash flow timeline chart</h3>
          <p id="chart-description">
            Bar chart showing cash flows over time, with orange bar for initial purchase, blue bars for coupon payments,
            and dark blue bars for principal repayment.
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bondCalculations.cashFlows} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="yearLabel" label={{ value: "Years", position: "insideBottom", offset: -10 }} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="principalPayment" name="Principal/Initial Purchase" stackId="cashflow">
              {bondCalculations.cashFlows.map((entry, index) => (
                <Cell key={`cell-principal-${index}`} fill={entry.principalPayment >= 0 ? COLORS.faceValue : COLORS.purchase} />
              ))}
            </Bar>
            <Bar dataKey="couponPayment" name="Coupon Payment" fill={COLORS.coupon} stackId="cashflow">
              {showLabels && (
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(value) =>
                    value !== null && Math.abs(value) >= 0.01 ? formatCurrency(value, true) : ""
                  }
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
      {
        period: 0,
        yearLabel: 0,
        couponPayment: 0,
        principalPayment: -bondPrice,
        totalCashFlow: -bondPrice,
        total: -bondPrice
      }
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
        total: totalCashFlow
      });
    }
    return { bondPrice, periodicCoupon, periodicYield, periods, cashFlows, pvCoupons, pvFaceValue };
  }, [couponRate, ytm, years, inputErrors]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* 1️⃣ Equation Card */}
        <Card title="Bond valuation equation">
          <p className="mb-4 text-sm text-gray-700">
        Equation 6 shows the price of a coupon bond expressed as:
      </p>
          <EquationSection />
        </Card>

        {/* 2️⃣ + 3️⃣ Desktop grid */}
        {bondCalculations && (
          <>
            {/* Mobile (stacked) */}
            <div className="lg:hidden space-y-6">

              <Card title="Results and analysis">
                <MiscSection bondCalculations={bondCalculations} faceValue={faceValue} couponRate={couponRate} ytm={ytm} years={years} />
              </Card>
              <Card title="Bond cash flows">
                <BondChart bondCalculations={bondCalculations} />
              </Card>
            </div>

            {/* Desktop side-by-side */}
            <div className="hidden lg:grid xl:grid-cols-6 gap-6">
              <div className="lg:col-span-2">
                <Card title="Results and analysis">
                  <MiscSection bondCalculations={bondCalculations} faceValue={faceValue} couponRate={couponRate} ytm={ytm} years={years} />
                </Card>
              </div>
              <div className="lg:col-span-4">
                <Card title="Bond cash flows">
                  <BondChart bondCalculations={bondCalculations} />
                </Card>
              </div>
            </div>
          </>
        )}

        {/* 4️⃣ Data Entry Card */}
        <Card title="Bond cash flow calculator">
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

          {/* Inputs */}
<div className="flex flex-wrap items-end gap-x-6 gap-y-4">

  {/* Coupon Rate */}
  <div className="flex items-center gap-2">
    {/* Tooltip icon (left of input) */}
    <div className="relative inline-block">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 focus:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
        onMouseEnter={(e) => e.currentTarget.nextSibling.classList.remove('hidden')}
        onMouseLeave={(e) => e.currentTarget.nextSibling.classList.add('hidden')}
        onFocus={(e) => e.currentTarget.nextSibling.classList.remove('hidden')}
        onBlur={(e) => e.currentTarget.nextSibling.classList.add('hidden')}
        aria-describedby="coupon-tooltip"
        aria-label="Coupon rate information"
      >
        ?
      </button>
      <div
        id="coupon-tooltip"
        role="tooltip"
        className="hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 max-w-xs"
      >
        Enter a value between 0% and 10%.
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
      </div>
    </div>

    {/* Label and input */}
    <label htmlFor="coupon" className="font-medium text-gray-700 text-sm">
      Coupon rate <span className="text-red-500 ml-1">*</span>
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
        className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm pr-6 ${
          inputErrors.couponRate ? "border-red-300" : "border-gray-300"
        } focus:border-blue-500 focus:ring-blue-600`}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
    </div>
  </div>

  {/* Yield-to-maturity */}
  <div className="flex items-center gap-2">
    {/* Tooltip icon */}
    <div className="relative inline-block">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 focus:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
        onMouseEnter={(e) => e.currentTarget.nextSibling.classList.remove('hidden')}
        onMouseLeave={(e) => e.currentTarget.nextSibling.classList.add('hidden')}
        onFocus={(e) => e.currentTarget.nextSibling.classList.remove('hidden')}
        onBlur={(e) => e.currentTarget.nextSibling.classList.add('hidden')}
        aria-describedby="ytm-tooltip"
        aria-label="Yield to maturity information"
      >
        ?
      </button>
      <div
        id="ytm-tooltip"
        role="tooltip"
        className="hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 max-w-xs"
      >
        Enter a value between 0% and 10%.
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
      </div>
    </div>

    <label htmlFor="ytm" className="font-medium text-gray-700 text-sm">
      Yield-to-maturity <span className="text-red-500 ml-1">*</span>
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
        className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm pr-6 ${
          inputErrors.ytm ? "border-red-300" : "border-gray-300"
        } focus:border-blue-500 focus:ring-blue-600`}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
    </div>
  </div>

  {/* Years-to-maturity */}
  <div className="flex items-center gap-2">
    {/* Tooltip icon */}
    <div className="relative inline-block">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 focus:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
        onMouseEnter={(e) => e.currentTarget.nextSibling.classList.remove('hidden')}
        onMouseLeave={(e) => e.currentTarget.nextSibling.classList.add('hidden')}
        onFocus={(e) => e.currentTarget.nextSibling.classList.remove('hidden')}
        onBlur={(e) => e.currentTarget.nextSibling.classList.add('hidden')}
        aria-describedby="years-tooltip"
        aria-label="Years to maturity information"
      >
        ?
      </button>
      <div
        id="years-tooltip"
        role="tooltip"
        className="hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 max-w-xs"
      >
        Enter a value between 1 and 5 years.
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
      </div>
    </div>

    <label htmlFor="years" className="font-medium text-gray-700 text-sm">
      Years-to-maturity <span className="text-red-500 ml-1">*</span>
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
          inputErrors.years ? "border-red-300" : "border-gray-300"
        } focus:border-blue-500 focus:ring-blue-600`}
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
