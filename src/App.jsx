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
          <span className="font-bold" style={{ color: COLORS.presentValue }}>PV</span>
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
            <span className="flex flex-col justify-center text-base leading-none" style={{ fontWeight: "600" }}>
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
            <span className="flex flex-col justify-center text-base leading-none" style={{ fontWeight: "600" }}>
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
      {/* PV Bond Price */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="font-semibold text-sm text-blue-800 mb-1">PV Bond Price</div>
        <div className="text-3xl font-serif text-blue-600">
          {formatCurrency(bondCalculations.bondPrice)}{" "}
          <span className="text-sm text-gray-700 font-sans">per $100 par</span>
        </div>
      </div>

      {/* Premium–Discount Analysis */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="font-semibold text-sm text-purple-800 mb-2">Premium–Discount Analysis</div>
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

      <div className="h-96" role="img" aria-label="Bond cash flow timeline chart">
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
      },
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* 1️⃣ Equation Card */}
        <Card title="Bond Valuation Equation">
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
              <Card title="Results and Analysis">
                <MiscSection bondCalculations={bondCalculations} faceValue={faceValue} couponRate={couponRate} ytm={ytm} years={years} />
              </Card>
              <Card title="Bond Cash Flows">
                <BondChart bondCalculations={bondCalculations} />
              </Card>
            </div>

            {/* Desktop side-by-side */}
            <div className="hidden lg:grid xl:grid-cols-6 gap-6">
              <div className="lg:col-span-2">
                <Card title="Results and Analysis">
                  <MiscSection bondCalculations={bondCalculations} faceValue={faceValue} couponRate={couponRate} ytm={ytm} years={years} />
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
          <ValidationMessage errors={inputErrors} />
        </Card>
      </main>
    </div>
  );
}
