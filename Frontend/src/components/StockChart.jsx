import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isPred = payload[0].payload.isPrediction || !payload[0].payload.Price;
    const val = payload[0].value;

    return (
      <div className="bg-[#121217] border border-gray-800 p-3 rounded-xl shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${isPred ? 'bg-green-400' : 'bg-blue-400'}`}></span>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {isPred ? 'AI Forecast' : 'Market Price'}
          </p>
        </div>
        <p className="text-[10px] text-gray-400 mb-1">{label}</p>
        <p className={`text-sm font-mono font-bold ${isPred ? 'text-green-400' : 'text-blue-400'}`}>
          ${typeof val === 'number' ? val.toFixed(2) : val}
        </p>
      </div>
    );
  }
  return null;
};

const StockChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          // Right margin ko thoda aur badhaya taaki aakhri label na kate
          margin={{ top: 20, right: 40, left: -20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

          <XAxis
            dataKey="Date"
            axisLine={false}
            tickLine={false}
            // 'interval' ko hatane se aakhri point force-render hota hai
            minTickGap={40}
            padding={{ left: 10, right: 10 }}
            tick={{ fontSize: 10, fill: '#6b7280' }}
          />

          <YAxis
            domain={['auto', 'auto']}
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Area Chart: Isme connectNulls=true zaroori hai */}
          <Area
            type="monotone"
            dataKey="Price"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorPrice)"
            connectNulls={true}
            isAnimationActive={false}
          />

          {/* Prediction Line: Force dots on last points */}
          <Line
            type="monotone"
            dataKey="Predicted"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            connectNulls={true}
            isAnimationActive={false}
            // Isse aakhri 5-10 points par dots dikhenge taaki line visible rahe
            dot={(props) => {
              const { cx, cy, index } = props;
              // Agar data bada hai (5 years), toh sirf aakhri point pe dot dikhao
              if (index === data.length - 1) {
                return <circle key={index} cx={cx} cy={cy} r={4} fill="#10b981" stroke="white" strokeWidth={1} />;
              }
              return null;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;