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

// Accessible tooltip component
const HelpTooltip = ({ id, text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-700 text-xs font-bold 
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-describedby={visible ? `${id}-help` : undefined}
        aria-label="Help information"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        ?
      </button>
      {visible && (
        <span
          id={`${id}-help`}
          role="tooltip"
          className="absolute left-5 top-1 z-10 w-56 p-2 text-xs text-white bg-gray-800 
                     rounded shadow-lg pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  );
};

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

// Simplified Input Component (no sliders)
function SimpleNumberInput({ 
  id, 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  prefix = "",
  suffix = "", 
  helpText,
  rangeHint
}) {
  const handleInputChange = (e) => {
    const newValue = safeParseFloat(e.target.value);
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center">
        {label} 
        {helpText && <HelpTooltip id={id} text={helpText} />}
        {rangeHint && <span className="ml-1 text-gray-500 text-xs">({rangeHint})</span>}
      </label>
      
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm font-medium">
            {prefix}
          </span>
        )}
        
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          className={`w-full rounded-lg border py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            prefix ? 'pl-8' : 'pl-3'
          } ${suffix ? 'pr-12' : 'pr-3'}`}
          aria-describedby={helpText ? `${id}-help` : undefined}
        />
        
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">
            {suffix}
          </span>
        )}
      </div>
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
  // Fixed values per SME requirements
  const faceValue = 100; // Standard face value
  const frequency = 2;   // Semi-annual coupons (standard)
  
  // User inputs with realistic ranges
  const [couponRate, setCouponRate] = useState(8.6);
  const [ytm, setYtm] = useState(6.5);
  const [years, setYears] = useState(5);

  // Input validation
  const validateInputs = () => {
    const errors = [];
    
    if (couponRate < 0 || couponRate > 10) {
      errors.push("Coupon Rate must be between 0% and 10%");
    }
    if (ytm < 0 || ytm > 10) {
      errors.push("Yield to Maturity must be between 0% and 10%");
    }
    if (years < 1 || years > 5) {
      errors.push("Years to Maturity must be between 1 and 5");
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
      yearLabel: 0,
      couponPayment: 0,
      principalPayment: -bondPrice,
      totalCashFlow: -bondPrice,
      total: -bondPrice
    });

    // Periodic cash flows
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

    return {
      bondPrice,
      periodicCoupon,
      periodicYield,
      periods,
      cashFlows,
      pvCoupons,
      pvFaceValue
    };
  }, [couponRate, ytm, years, inputErrors]);

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
        
        {/* Error Messages at Top */}
        {inputErrors.length > 0 && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
            <div className="text-red-800 text-sm">
              <strong>Input Validation Errors:</strong>
              <ul className="mt-1 list-disc list-inside">
                {inputErrors.map((error, i) => (
                  <li key={i} role="listitem">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Main Layout: Formula + Results on Left, Chart + Parameters on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Formula and Results */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Bond Valuation Formula */}
            <Card title="Bond Valuation Formula">
              {/* Accessible formula description */}
              <div className="sr-only">
                <p>Bond valuation formula: Present value of coupon bond equals PMT subscript 1 divided by the quantity 1 plus r raised to the power 1, plus PMT subscript 2 divided by the quantity 1 plus r raised to the power 2, and so on, plus PMT subscript N plus FV subscript N, all divided by the quantity 1 plus r raised to the power N.</p>
                <p>Where PMT is the periodic coupon payment, r is the periodic yield rate, N is the number of periods, and FV is the face value.</p>
              </div>
              
              {/* Visual formula display */}
              <div className="text-center font-mono text-sm mb-3 bg-white p-3 rounded border" aria-hidden="true">
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
                      <sub className="text-xs" style={{ color: COLORS.periods }}>N</sub>
                      <span> + </span>
                      <span className="font-bold" style={{ color: COLORS.faceValue }}>FV</span>
                      <sub className="text-xs" style={{ color: COLORS.periods }}>N</sub>
                      <span>)</span>
                    </div>
                    <div className="flex items-center text-xs pt-1">
                      <span>(1+</span>
                      <span className="font-bold" style={{ color: COLORS.yield }}>r</span>
                      <span>)<sup style={{ color: COLORS.periods }}>N</sup></span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Variable Definitions with Live Updates */}
              {bondCalculations && (
                <div className="grid grid-cols-2 gap-2 text-xs" role="region" aria-label="Formula variables with current values">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.coupon }} aria-hidden="true"></span>
                    <span><strong>PMT:</strong> <span aria-live="polite">{formatCurrency(bondCalculations.periodicCoupon)}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.faceValue }} aria-hidden="true"></span>
                    <span><strong>FV:</strong> <span aria-live="polite">{formatCurrency(faceValue)}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.yield }} aria-hidden="true"></span>
                    <span><strong>r:</strong> <span aria-live="polite">{(bondCalculations.periodicYield * 100).toFixed(3)}%</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.periods }} aria-hidden="true"></span>
                    <span><strong><em>N</em>:</strong> <span aria-live="polite">{bondCalculations.periods}</span></span>
                  </div>
                </div>
              )}
              
              <div className="mt-3 text-xs text-gray-600">
                <p>The bond price equals the sum of present values of all future cash flows. Each payment is discounted by (1+r) raised to its period number.</p>
              </div>
            </Card>

            {/* Bond Valuation Results */}
            <Card title="Bond Valuation Results">
              {bondCalculations ? (
                <div className="space-y-4">
                  {/* Bond Price Summary with Live Updates */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Bond Price</h4>
                    <p className="text-2xl font-bold text-blue-700" aria-live="polite" aria-label={`Current bond price: ${formatCurrency(bondCalculations.bondPrice)}`}>
                      {formatCurrency(bondCalculations.bondPrice)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1" aria-live="polite">
                      Price per $100 par
                    </p>
                  </div>

                  {/* Detailed Calculations */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Periodic Coupon:</span>
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
                        <span>PV of Coupons:</span>
                        <span className="font-semibold" style={{ color: COLORS.presentValue }}>
                          {formatCurrency(bondCalculations.pvCoupons)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>PV of Face Value:</span>
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
                  <p className="text-gray-600 text-sm">Adjust parameters to see valuation results</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Chart and Parameters */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bond Cash Flows Chart */}
            <Card title="Bond Cash Flows">
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
                  
                  <div className="h-96" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={bondCalculations.cashFlows}
                        margin={{ top: 20, right: 30, left: 50, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="yearLabel"
                          tickFormatter={(val) => Number.isInteger(val) ? val.toString() : ""}
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
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Adjust parameters to see cash flows</p>
                </div>
              )}
            </Card>

            {/* Bond Parameters - Below Chart */}
            <Card title="Bond Parameters">
              <div className="space-y-4">
                
                {/* Fixed Parameters Display */}
                <div className="p-3 bg-blue-50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Face Value:</span>
                    <span className="font-semibold" style={{ color: COLORS.faceValue }}>
                      {formatCurrency(faceValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Payment Frequency:</span>
                    <span className="font-semibold" style={{ color: COLORS.periods }}>
                      Semi-annual
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 italic">
                    * Standard bond parameters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SimpleNumberInput
                    id="coupon-rate-input"
                    label="Annual Coupon Rate"
                    value={couponRate}
                    onChange={setCouponRate}
                    min={0}
                    max={10}
                    step={0.1}
                    suffix="%"
                    rangeHint="0% - 10%"
                    helpText="The annual coupon rate as a percentage"
                  />

                  <SimpleNumberInput
                    id="ytm-input"
                    label="Yield to Maturity"
                    value={ytm}
                    onChange={setYtm}
                    min={0}
                    max={10}
                    step={0.1}
                    suffix="%"
                    rangeHint="0% - 10%"
                    helpText="The bond's yield to maturity as a percentage"
                  />

                  <SimpleNumberInput
                    id="years-input"
                    label="Years to Maturity"
                    value={years}
                    onChange={setYears}
                    min={1}
                    max={5}
                    step={0.5}
                    suffix=" yrs"
                    rangeHint="1 - 5 years"
                    helpText="Number of years until bond maturity"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}