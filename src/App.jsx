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
      
      {/* Number Input */}
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-describedby={`${id}-help ${id}-slider`}
        />
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

// Color scheme for consistent financial component coding
const COLORS = {
  faceValue: "#000000",      // Black for face value/principal
  coupon: "#4476FF",         // Blue for coupon payments  
  yield: "#7C3AED",          // Purple for yield/interest rates
  periods: "#6B7280",        // Gray for time periods
  presentValue: "#10B981",   // Green for present values
  purchase: "#fca5a5"        // Light red for purchase/negative flows
};
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two Column Layout Above Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Left Column: Calculation Details */}
          <Card title="Bond Valuation Results" className="md:col-span-1">
            {bondCalculations ? (
              <div className="space-y-4">
                {/* Bond Price Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Bond Price</h4>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(bondCalculations.bondPrice)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Price per $100 par: {formatCurrency(bondCalculations.bondPrice * 100 / faceValue)}
                  </p>
                </div>

                {/* Detailed Calculations */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Periodic Coupon Payment:</span>
                    <span className="font-semibold" style={{ color: COLORS.coupon }}>
                      {formatCurrency(bondCalculations.periodicCoupon)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Number of Payments:</span>
                    <span className="font-semibold" style={{ color: COLORS.periods }}>
                      {bondCalculations.periods}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Periodic Yield:</span>
                    <span className="font-semibold" style={{ color: COLORS.yield }}>
                      {(bondCalculations.periodicYield * 100).toFixed(3)}%
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span>Present Value of Coupons:</span>
                      <span className="font-semibold" style={{ color: COLORS.presentValue }}>
                        {formatCurrency(bondCalculations.pvCoupons)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Present Value of Face Value:</span>
                      <span className="font-semibold" style={{ color: COLORS.presentValue }}>
                        {formatCurrency(bondCalculations.pvFaceValue)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1 font-semibold">
                      <span>Total Bond Price:</span>
                      <span style={{ color: COLORS.presentValue }}>
                        {formatCurrency(bondCalculations.bondPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Analysis */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Price Analysis</h4>
                  <div className="text-xs">
                    {Math.abs(bondCalculations.bondPrice - faceValue) < 0.01 ? (
                      <p>
                        <strong>Par Bond:</strong> Trading at approximately par value ({formatCurrency(bondCalculations.bondPrice)}). 
                        The coupon rate ({couponRate.toFixed(2)}%) approximately equals the yield to maturity ({ytm.toFixed(2)}%).
                      </p>
                    ) : bondCalculations.bondPrice > faceValue ? (
                      <p>
                        <strong>Premium Bond:</strong> Trading at {formatCurrency(bondCalculations.bondPrice)}, 
                        which is {formatCurrency(bondCalculations.bondPrice - faceValue)} above par value. 
                        The coupon rate ({couponRate.toFixed(2)}%) exceeds the yield to maturity ({ytm.toFixed(2)}%).
                      </p>
                    ) : (
                      <p>
                        <strong>Discount Bond:</strong> Trading at {formatCurrency(bondCalculations.bondPrice)}, 
                        which is {formatCurrency(faceValue - bondCalculations.bondPrice)} below par value. 
                        The yield to maturity ({ytm.toFixed(2)}%) exceeds the coupon rate ({couponRate.toFixed(2)}%).
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-600">Complete the bond parameters below to see valuation results</p>
              </div>
            )}
          </Card>

          {/* Right Column: Chart */}
          <Card title="Bond Cash Flows" className="md:col-span-3">
            {bondCalculations ? (
              <div>
                {/* Custom Legend with Consistent Colors */}
                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center">
                    <span className="w-4 h-4 mr-2" style={{backgroundColor: COLORS.purchase}}></span>
                    Initial Purchase
                  </span>
                  <span className="flex items-center">
                    <span className="w-4 h-4 mr-2" style={{backgroundColor: COLORS.coupon}}></span>
                    Coupon Payment
                  </span>
                  <span className="flex items-center">
                    <span className="w-4 h-4 mr-2" style={{backgroundColor: COLORS.faceValue}}></span>
                    Principal Repayment
                  </span>
                </div>
                
                {/* Chart Title */}
                <div className="text-left text-sm text-gray-600 mb-2 font-medium">
                  Cash Flow ($)
                </div>
                
                <div className="h-80" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bondCalculations.cashFlows}
                      margin={{ top: 20, right: 30, left: 50, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="yearLabel" 
                        label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      
                      {/* Principal/Face Value (includes negative initial purchase) */}
                      <Bar 
                        dataKey="principalPayment" 
                        name="Principal/Initial Purchase" 
                        stackId="cashflow"
                      >
                        {bondCalculations.cashFlows.map((entry, index) => (
                          <Cell key={`cell-principal-${index}`} fill={entry.principalPayment >= 0 ? COLORS.faceValue : COLORS.purchase} />
                        ))}
                      </Bar>
                      
                      {/* Coupon Payments */}
                      <Bar 
                        dataKey="couponPayment" 
                        name="Coupon Payment" 
                        fill={COLORS.coupon} 
                        stackId="cashflow"
                      >
                        <LabelList 
                          dataKey="total" 
                          position="top" 
                          formatter={(value) => {
                            if (value !== null && Math.abs(value) >= 0.01) {
                              return formatCurrency(value, true);
                            }
                            return '';
                          }}
                          style={{ fontSize: '11px', fontWeight: '600', fill: '#1f2937' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Formula Below Chart with Curriculum Equation */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3">Bond Valuation Formula</h4>
                  <div className="text-center font-mono text-sm mb-3 bg-white p-3 rounded border">
                    <div className="flex items-center justify-center gap-1 flex-wrap text-base">
                      <span className="font-bold" style={{ color: COLORS.presentValue }}>PV</span>
                      <sub className="text-xs">coupon bond</sub>
                      <span>=</span>
                      <div className="flex flex-col items-center mx-2">
                        <div className="flex items-center gap-1 border-b-2 border-gray-400 pb-1">
                          <span className="font-bold" style={{ color: COLORS.coupon }}>PMT</span>
                          <span>/</span>
                          <span className="font-bold" style={{ color: COLORS.yield }}>r</span>
                        </div>
                      </div>
                      <span>×</span>
                      <span>[</span>
                      <span>1 -</span>
                      <div className="flex flex-col items-center mx-1">
                        <div className="border-b border-gray-400 px-1">1</div>
                        <div className="flex items-center text-xs">
                          <span>(1+</span>
                          <span className="font-bold" style={{ color: COLORS.yield }}>r</span>
                          <span>)<sup className="font-bold italic" style={{ color: COLORS.periods }}>T</sup></span>
                        </div>
                      </div>
                      <span>]</span>
                      <span>+</span>
                      <div className="flex flex-col items-center mx-1">
                        <div className="border-b border-gray-400 px-1">
                          <span className="font-bold" style={{ color: COLORS.faceValue }}>FV</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span>(1+</span>
                          <span className="font-bold" style={{ color: COLORS.yield }}>r</span>
                          <span>)<sup className="font-bold italic" style={{ color: COLORS.periods }}>T</sup></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Variable Definitions with Current Values */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.coupon }}></span>
                      <span><strong>PMT:</strong> {formatCurrency(bondCalculations.periodicCoupon)} (periodic coupon)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.faceValue }}></span>
                      <span><strong>FV:</strong> {formatCurrency(faceValue)} (face value)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.yield }}></span>
                      <span><strong>r:</strong> {(bondCalculations.periodicYield * 100).toFixed(3)}% (periodic yield)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.periods }}></span>
                      <span><strong><em>T</em>:</strong> {bondCalculations.periods} (number of periods)</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    First term: Present value of coupon annuity • Second term: Present value of face value
                  </div>
                </div>

                {/* Screen Reader Data Table */}
                <div className="sr-only">
                  <h4 id="chart-title">Bond Cash Flow Timeline Chart</h4>
                  <p id="chart-description">
                    Bar chart showing cash flows over time, with light red bar for initial purchase, 
                    blue bars for coupon payments, and black bars for principal repayment.
                  </p>
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
                          <td>{formatCurrency(Math.abs(cf.couponPayment))}</td>
                          <td>{formatCurrency(cf.principalPayment, true)}</td>
                          <td>{formatCurrency(cf.totalCashFlow, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Complete the bond parameters below to see cash flows</p>
              </div>
            )}
          </Card>
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

        {/* Full Width Bond Parameters */}
        <Card title="Bond Parameters">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            
            {/* Payment Frequency Selector - First */}
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

            <EnhancedNumberInput
              id="face-value-input"
              label="Face Value"
              value={faceValue}
              onChange={setFaceValue}
              min={0.01}
              max={100000}
              step={1}
              suffix=""
              rangeHint="$0.01 - $100,000"
              helpText="The bond's face value or par value"
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
          </div>
        </Card>

      
      </div>
    </div>
  );
}