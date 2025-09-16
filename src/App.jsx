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

// Enhanced Input Component with slider and stepper controls
function EnhancedNumberInput({ 
  id, 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  suffix = "", 
  helpText,
  rangeHint
}) {
  const handleStepUp = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleStepDown = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleSliderChange = (e) => {
    onChange(parseFloat(e.target.value));
  };

  const handleInputChange = (e) => {
    const newValue = safeParseFloat(e.target.value);
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} {rangeHint && <span className="text-gray-500 text-xs">({rangeHint})</span>}
      </label>
      
      {/* Number Input with Stepper Controls */}
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          className="w-full rounded-lg border px-3 py-2 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-describedby={`${id}-help ${id}-slider`}
        />
        <div className="absolute right-1 top-1 flex flex-col">
          <button
            type="button"
            onClick={handleStepUp}
            disabled={value >= max}
            className="px-1 py-0.5 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            aria-label={`Increase ${label}`}
            tabIndex={0}
          >
            ▲
          </button>
          <button
            type="button"
            onClick={handleStepDown}
            disabled={value <= min}
            className="px-1 py-0.5 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            aria-label={`Decrease ${label}`}
            tabIndex={0}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Range Slider */}
      <div className="px-1">
        <input
          id={`${id}-slider`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            background: `linear-gradient(to right, #4476FF 0%, #4476FF ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
          }}
          aria-label={`${label} slider`}
          aria-describedby={`${id}-help`}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{min}{suffix}</span>
          <span className="font-medium text-blue-600">{value}{suffix}</span>
          <span>{max}{suffix}</span>
        </div>
      </div>

      {/* Help Text */}
      {helpText && (
        <span id={`${id}-help`} className="text-xs text-gray-600">
          {helpText}
        </span>
      )}
    </div>
  );
}

// Smart label component that uses different colors for red vs other bars
const SmartLabel = ({ x, y, width, payload }) => {
  if (!payload || !payload.total || Math.abs(payload.total) < 0.01) return null;
  
  const totalValue = payload.total;
  const isNegative = totalValue < 0; // This identifies the red initial purchase bar
  const labelText = `$${Math.abs(totalValue).toFixed(2)}`;
  
  if (isNegative) {
    // For the red bar: use white text with black outline for maximum contrast
    return (
      <g>
        <text
          x={x + width / 2}
          y={y - 8}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="white"
          stroke="black"
          strokeWidth="1"
        >
          {labelText}
        </text>
      </g>
    );
  } else {
    // For blue/black bars: use normal dark text
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="#1f2937"
      >
        {labelText}
      </text>
    );
  }
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
      total: -bondPrice
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
        total: totalCashFlow
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
        <Card title="Bond Cash Flow Analysis - Smart Label Contrast" className="w-full">
          
          {/* Input Section */}
          <div className="mb-6">
            <h3 className="font-serif text-lg text-slate-700 mb-4">Bond Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <EnhancedNumberInput
                id="face-value-input"
                label="Face Value"
                value={faceValue}
                onChange={setFaceValue}
                min={0.01}
                max={100000}
                step={1}
                suffix="$"
                rangeHint="$0.01 - $100,000"
                helpText="The bond's face value or par value in dollars"
              />

              <EnhancedNumberInput
                id="coupon-rate-input"
                label="Annual Coupon Rate"
                value={couponRate}
                onChange={setCouponRate}
                min={0}
                max={50}
                step={0.1}
                suffix="%"
                rangeHint="0% - 50%"
                helpText="The annual coupon rate as a percentage"
              />

              <EnhancedNumberInput
                id="ytm-input"
                label="Yield to Maturity"
                value={ytm}
                onChange={setYtm}
                min={0}
                max={50}
                step={0.1}
                suffix="%"
                rangeHint="0% - 50%"
                helpText="The bond's yield to maturity as a percentage"
              />

              <EnhancedNumberInput
                id="years-input"
                label="Years to Maturity"
                value={years}
                onChange={setYears}
                min={1}
                max={50}
                step={1}
                suffix=" yrs"
                rangeHint="1 - 50 years"
                helpText="Number of years until bond maturity"
              />

              {/* Payment Frequency Selector */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="frequency-select" className="text-sm font-medium text-gray-700">
                  Payment Frequency <span className="text-gray-500 text-xs">(per year)</span>
                </label>
                <select
                  id="frequency-select"
                  value={frequency}
                  onChange={e => setFrequency(parseInt(e.target.value))}
                  className="rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-describedby="frequency-help"
                >
                  <option value={1}>Annual (1)</option>
                  <option value={2}>Semi-annual (2)</option>
                  <option value={4}>Quarterly (4)</option>
                  <option value={12}>Monthly (12)</option>
                </select>
                <span id="frequency-help" className="text-xs text-gray-600">
                  Select how many coupon payments are made per year
                </span>
              </div>

              {/* Calculation Summary */}
              {bondCalculations && (
                <div className="bg-blue-50 p-4 rounded-lg lg:col-span-1">
                  <h4 className="font-semibold text-sm mb-2">Bond Price</h4>
                  <p className="text-2xl font-bold text-blue-700">
                    ${bondCalculations.bondPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Price per $100 par: ${(bondCalculations.bondPrice * 100 / faceValue).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    (Standard bond quotation)
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
                
                {/* Custom Legend - Updated Colors */}
                <div className="mb-4 flex flex-wrap items-center gap-6 text-sm">
                  <span className="flex items-center">
                    <span className="w-4 h-4 mr-2" style={{backgroundColor: '#fca5a5'}}></span>
                    Initial Purchase
                  </span>
                  <span className="flex items-center">
                    <span className="w-4 h-4 mr-2" style={{backgroundColor: '#4476FF'}}></span>
                    Coupon Payment
                  </span>
                  <span className="flex items-center">
                    <span className="w-4 h-4 bg-black mr-2"></span>
                    Principal Repayment
                  </span>
                </div>
                
                <div className="h-96" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bondCalculations.cashFlows}
                      margin={{ top: 40, right: 30, left: 30, bottom: 80 }}
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
                      
                      {/* Principal/Face Value (includes negative initial purchase) */}
                      <Bar 
                        dataKey="principalPayment" 
                        name="Principal/Initial Purchase" 
                        stackId="cashflow"
                      >
                        {bondCalculations.cashFlows.map((entry, index) => (
                          <Cell key={`cell-principal-${index}`} fill={entry.principalPayment >= 0 ? "#000000" : "#fca5a5"} />
                        ))}
                      </Bar>
                      
                      {/* Coupon Payments - SIMPLE LABELS THAT WORK */}
                      <Bar 
                        dataKey="couponPayment" 
                        name="Coupon Payment" 
                        fill="#4476FF" 
                        stackId="cashflow"
                      >
                        <LabelList 
                          dataKey="total" 
                          position="top" 
                          formatter={(value) => value !== null ? `${Math.abs(value).toFixed(2)}` : ''}
                          style={{ fontSize: '11px', fontWeight: '600', fill: '#1f2937' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Screen Reader Data Table */}
                <div className="sr-only">
                  <h4 id="chart-title">Bond Cash Flow Timeline Chart</h4>
                  <p id="chart-description">Bar chart showing cash flows over time, with light red bar for initial purchase, blue bars for coupon payments, and black bars for principal repayment.</p>
                  <table>
                    <caption>Bond cash flow data by time period</caption>
                    <thead>
                      <tr>
                        <th scope="col">Time (Years)</th>
                        <th scope="col">Coupon Payment</th>
                        <th scope="col">Principal Payment</th>
                        <th scope="col">Total Cash Flow</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bondCalculations.cashFlows.map(cf => (
                        <tr key={cf.period}>
                          <th scope="row">{cf.yearLabel}</th>
                          <td>${Math.abs(cf.couponPayment).toFixed(2)}</td>
                          <td>{cf.principalPayment < 0 ? '-$' : '$'}{Math.abs(cf.principalPayment).toFixed(2)}</td>
                          <td>{cf.totalCashFlow < 0 ? '-$' : '$'}{Math.abs(cf.totalCashFlow).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <p className="text-xs text-gray-600 mt-2">
                  Light red bar at time 0 shows initial bond purchase (outflow). The final period typically shows 
                  both coupon payment (blue) and principal repayment (black), combining the final coupon with face value repayment.
                  All labels use dark text for optimal readability.
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
                  {Math.abs(bondCalculations.bondPrice - faceValue) < 0.01 ? (
                    <p className="text-blue-800">
                      <strong>Par Bond:</strong> Trading at approximately par value (${bondCalculations.bondPrice.toFixed(2)}). 
                      The coupon rate ({couponRate.toFixed(2)}%) approximately equals the yield to maturity ({ytm.toFixed(2)}%).
                    </p>
                  ) : bondCalculations.bondPrice > faceValue ? (
                    <p className="text-blue-800">
                      <strong>Premium Bond:</strong> Trading at ${bondCalculations.bondPrice.toFixed(2)}, 
                      which is ${(bondCalculations.bondPrice - faceValue).toFixed(2)} above par value. 
                      The coupon rate ({couponRate.toFixed(2)}%) exceeds the yield to maturity ({ytm.toFixed(2)}%).
                    </p>
                  ) : (
                    <p className="text-blue-800">
                      <strong>Discount Bond:</strong> Trading at ${bondCalculations.bondPrice.toFixed(2)}, 
                      which is ${(faceValue - bondCalculations.bondPrice).toFixed(2)} below par value. 
                      The yield to maturity ({ytm.toFixed(2)}%) exceeds the coupon rate ({couponRate.toFixed(2)}%).
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