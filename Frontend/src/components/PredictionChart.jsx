import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PredictionChart = ({ forecastData }) => {
  if (!forecastData) return <div className="text-gray-500 italic">No prediction data available.</div>;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={forecastData}>
        <defs>
          <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis 
          dataKey="Date" 
          stroke="#4b5563" 
          fontSize={10} 
          tickFormatter={(str) => str.split('-')[2] + " May"} 
        />
        <YAxis 
          domain={['auto', 'auto']} 
          orientation="right" 
          stroke="#4b5563" 
          fontSize={10}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #10b981', borderRadius: '12px' }}
          itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
        />
        <Area 
          type="monotone" 
          dataKey="Predicted" 
          stroke="#10b981" 
          connectNulls={true}
          strokeWidth={3} 
          fillOpacity={1} 
          fill="url(#colorPredict)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default PredictionChart;