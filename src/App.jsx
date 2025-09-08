import { useState, useMemo } from "react";
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

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h2 className="font-serif text-xl text-slate-800 mb-3">{title}</h2>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function safeParseFloat(value, fallback = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

// Custom label component for displaying values above/below bars
const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;
  
  if (!value || Math.abs(value) < 0.01) return null;
  
  const isNegative = value < 0;
  const labelY = isNegative ? y + height + 15 : y - 8;
  
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fill="#000"
      fontSize="11"
      fontWeight="bold"
    >
      ${Math.abs(value).toFixed(2)}
    </text>
  );
};

export default function BondCashFlowCalculator() {
  const [faceValue, setFaceValue] = useState(100);
  const [couponRate, setCouponRate] = useState(8.6);
  const [ytm, setYtm] = useState(6.5);
  const [years, setYears] = useState(5);
  const [frequency, setFrequency] = useState(2);

  // Input validation
  const validateInputs = () => {
    const errors = [];
    
    if (faceValue <= 0 || faceValue > 100000) {
      errors.push("Face Value must be between $0.01 and $100,000");
    }
    if (couponRate < 0 || couponRate > 50) {
      errors.push("Coupon Rate must be between 0% and 50%");
    }
    if (ytm < 0 || ytm > 50) {
      errors.push("Yield to Maturity must be between 0% and 50%");
    }
    if (years <= 0 || years > 50) {
      errors.push("Years to Maturity must be between 1 and 50");
    }
    if (![1, 2, 4, 12].includes(frequency)) {
      errors.push("Payment Frequency must be 1, 2, 4, or 12 times per year");
    }
    
    return errors;
  };

  const inputErrors = validateInputs();

  // Bond calculations using useMemo for performance
  const bondCalculations = useMemo(() => {
    if (inputErrors.length > 0) return null;

    const periods = years * frequency;
    const periodicCouponRate = couponRate / 100 / frequency;
    const periodicYield = ytm / 100 / frequency;
    const periodicCoupon = faceValue * periodicCouponRate;

    // Calculate bond price (present value of all cash flows)
    let pvCoupons = 0;
    for (let t = 1; t <= periods; t++) {
      pvCoupons += periodicCoupon / Math.pow(1 + periodicYield, t);
    }
    const pvFaceValue = faceValue / Math.pow(1 + periodicYield, periods);
    const bondPrice = pvCoupons + pvFaceValue;

    // Build cash flow data for chart
    const cashFlows = [];
    
    // Initial purchase (negative cash flow)
cashFlows.push({
  period: 0,
  periodLabel: "0",
  yearLabel: "0.0",
  couponPayment: 0,
  principalPayment: -bondPrice,
  totalCashFlow: -bondPrice,
  total: null  // null prevents label from showing
});

// Periodic cash flows
for (let t = 1; t <= periods; t++) {
  const yearEquivalent = t / frequency;
  const couponPayment = periodicCoupon;
  const principalPayment = (t === periods) ? faceValue : 0;
  const totalCashFlow = couponPayment + principalPayment;

  cashFlows.push({
    period: t,
    periodLabel: t.toString(),
    yearLabel: yearEquivalent.toFixed(1),
    couponPayment,
    principalPayment,
    totalCashFlow,
    total: totalCashFlow  // Add this line
  });
}

    return {
      bondPrice,
      periodicCoupon,
      periodicYield,
      periods,
      cashFlows,
      pvCoupons,
      pvFaceValue
    };
  }, [faceValue, couponRate, ytm, years, frequency, inputErrors]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{`Period: ${data.yearLabel} years`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: $${Math.abs(entry.value).toFixed(2)}`}
            </p>
          ))}
          <p className="text-sm text-gray-600 mt-1">
            {`Total: $${Math.abs(data.totalCashFlow).toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4">
        <Card title="Bond Cash Flow Analysis" className="w-full">
          
          {/* Input Section */}
          <div className="mb-6">
            <h3 className="font-serif text-lg text-slate-700 mb-4">Bond Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <label className="flex flex-col" htmlFor="face-value-input">
                Face Value ($) <span className="text-gray-500 text-xs">(0.01 - 100,000)</span>
                <input
                  id="face-value-input"
                  type="number"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  value={faceValue}
                  onChange={e => setFaceValue(safeParseFloat(e.target.value))}
                  className="mt-1 rounded-lg border px-3 py-2"
                  aria-describedby="face-value-help"
                />
                <span id="face-value-help" className="sr-only">
                  Enter the bond's face value or par value in dollars
                </span>
              </label>

              <label className="flex flex-col" htmlFor="coupon-rate-input">
                Annual Coupon Rate (%) <span className="text-gray-500 text-xs">(0 - 50)</span>
                <input
                  id="coupon-rate-input"
                  type="number"
                  min="0"
                  max="50"
                  step="0.01"
                  value={couponRate}
                  onChange={e => setCouponRate(safeParseFloat(e.target.value))}
                  className="mt-1 rounded-lg border px-3 py-2"
                  aria-describedby="coupon-rate-help"
                />
                <span id="coupon-rate-help" className="sr-only">
                  Enter the annual coupon rate as a percentage
                </span>
              </label>

              <label className="flex flex-col" htmlFor="ytm-input">
                Yield to Maturity (%) <span className="text-gray-500 text-xs">(0 - 50)</span>
                <input
                  id="ytm-input"
                  type="number"
                  min="0"
                  max="50"
                  step="0.01"
                  value={ytm}
                  onChange={e => setYtm(safeParseFloat(e.target.value))}
                  className="mt-1 rounded-lg border px-3 py-2"
                  aria-describedby="ytm-help"
                />
                <span id="ytm-help" className="sr-only">
                  Enter the bond's yield to maturity as a percentage
                </span>
              </label>

              <label className="flex flex-col" htmlFor="years-input">
                Years to Maturity <span className="text-gray-500 text-xs">(1 - 50)</span>
                <input
                  id="years-input"
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={years}
                  onChange={e => setYears(safeParseFloat(e.target.value, 1))}
                  className="mt-1 rounded-lg border px-3 py-2"
                  aria-describedby="years-help"
                />
                <span id="years-help" className="sr-only">
                  Enter number of years until bond maturity
                </span>
              </label>

              <label className="flex flex-col" htmlFor="frequency-select">
                Payment Frequency <span className="text-gray-500 text-xs">(per year)</span>
                <select
                  id="frequency-select"
                  value={frequency}
                  onChange={e => setFrequency(parseInt(e.target.value))}
                  className="mt-1 rounded-lg border px-3 py-2"
                  aria-describedby="frequency-help"
                >
                  <option value={1}>Annual (1)</option>
                  <option value={2}>Semi-annual (2)</option>
                  <option value={4}>Quarterly (4)</option>
                  <option value={12}>Monthly (12)</option>
                </select>
                <span id="frequency-help" className="sr-only">
                  Select how many coupon payments are made per year
                </span>
              </label>

              {/* Calculation Summary */}
              {bondCalculations && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Bond Price</h4>
                  <p className="text-2xl font-bold text-blue-700">
                    ${bondCalculations.bondPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Per $100 face value: ${(bondCalculations.bondPrice * 100 / faceValue).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Messages */}
          {inputErrors.length > 0 && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <div className="text-red-800 text-sm">
                <strong>Input Errors:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {inputErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Cash Flow Chart */}
          {bondCalculations && (
            <>
              <div className="mb-6">
                <h3 className="font-serif text-lg text-slate-700 mb-2">Bond Cash Flow Timeline</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bondCalculations.cashFlows}
                      margin={{ top: 60, right: 30, left: 30, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="yearLabel" 
                        label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        label={{ value: 'Cash Flow ($)', angle: -90, position: 'insideLeft', offset: 10 }}
                        tickFormatter={(value) => value.toFixed(0)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
  verticalAlign="top" 
  align="center" 
  height={60}
  wrapperStyle={{ paddingBottom: '20px' }}
/>
                      
                      {/* Principal/Face Value (includes negative initial purchase) */}
                      <Bar 
                        dataKey="principalPayment" 
                        name="Principal/Initial Purchase" 
                        stackId="cashflow"
                      >
                        {bondCalculations.cashFlows.map((entry, index) => (
                          <Cell key={`cell-principal-${index}`} fill={entry.principalPayment >= 0 ? "#000000" : "#dc2626"} />
                        ))}
                      </Bar>
                      
                      {/* Coupon Payments - add label to top bar of stack */}
                     <Bar 
  dataKey="couponPayment" 
  name="Coupon Payment" 
  fill="#4476FF" 
  stackId="cashflow"
>
  <LabelList 
    dataKey="total" 
    position="top" 
    formatter={(value) => value !== null ? `$${Math.abs(value).toFixed(2)}` : ''}
    style={{ fontSize: '11px', fontWeight: '500', fill: '#374151' }}
  />
</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Red bar at time 0 shows initial bond purchase (outflow). Black bars show principal repayment, 
                  blue bars show coupon payments. Final period combines coupon and face value repayment.
                </p>
              </div>

              {/* Detailed Calculation Breakdown */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-serif text-lg text-slate-700 mb-3">Calculation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="mb-1">
                      <strong>Periodic Coupon Payment:</strong> ${bondCalculations.periodicCoupon.toFixed(2)}
                    </p>
                    <p className="mb-1">
                      <strong>Number of Payments:</strong> {bondCalculations.periods}
                    </p>
                    <p className="mb-1">
                      <strong>Periodic Yield:</strong> {(bondCalculations.periodicYield * 100).toFixed(3)}%
                    </p>
                  </div>
                  <div>
                    <p className="mb-1">
                      <strong>Present Value of Coupons:</strong> ${bondCalculations.pvCoupons.toFixed(2)}
                    </p>
                    <p className="mb-1">
                      <strong>Present Value of Face Value:</strong> ${bondCalculations.pvFaceValue.toFixed(2)}
                    </p>
                    <p className="mb-1">
                      <strong>Total Bond Price:</strong> ${bondCalculations.bondPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  <p><strong>Formula:</strong> Bond Price = PV(Coupons) + PV(Face Value)</p>
                  <p>Where PV = Payment ÷ (1 + periodic yield)^period</p>
                </div>
              </div>

              {/* Price Premium/Discount Analysis */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-serif text-lg text-slate-700 mb-3">Price Analysis</h3>
                <div className="text-sm">
                  {bondCalculations.bondPrice > faceValue ? (
                    <p className="text-blue-800">
                      <strong>Premium Bond:</strong> Trading at ${bondCalculations.bondPrice.toFixed(2)}, 
                      which is ${(bondCalculations.bondPrice - faceValue).toFixed(2)} above par value. 
                      The coupon rate ({couponRate.toFixed(2)}%) exceeds the yield to maturity ({ytm.toFixed(2)}%).
                    </p>
                  ) : bondCalculations.bondPrice < faceValue ? (
                    <p className="text-blue-800">
                      <strong>Discount Bond:</strong> Trading at ${bondCalculations.bondPrice.toFixed(2)}, 
                      which is ${(faceValue - bondCalculations.bondPrice).toFixed(2)} below par value. 
                      The yield to maturity ({ytm.toFixed(2)}%) exceeds the coupon rate ({couponRate.toFixed(2)}%).
                    </p>
                  ) : (
                    <p className="text-blue-800">
                      <strong>Par Bond:</strong> Trading at par value (${faceValue.toFixed(2)}). 
                      The coupon rate equals the yield to maturity ({ytm.toFixed(2)}%).
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Educational Note */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Bond Valuation Principles:</strong> A bond's price equals the present value of all future 
              cash flows (coupons plus face value) discounted at the yield to maturity. When the YTM exceeds 
              the coupon rate, the bond trades at a discount. When the coupon rate exceeds the YTM, the bond 
              trades at a premium. This relationship reflects the time value of money and interest rate risk.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}