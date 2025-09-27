import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { UserPlusIcon } from 'lucide-react';

const AnalyticsChart = ({
  title,
  subtitle,
  type,
  data,
  dataKeys,
  colors,
  height = 300,
  stacked = false,
  layout = 'horizontal',
  nameKey = 'name',
  donut = false,
}) => {
  // Custom label for pie chart
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, value, index
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip for better data display
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' 
              ? entry.value.toLocaleString()
              : entry.value}
          </p>
        ))}
      </div>
    );
  };

  // Line chart specific configurations
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }} // Increased margins
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey={nameKey}
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          padding={{ left: 10, right: 10 }} // Added padding
        />
        <YAxis 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={value => value.toLocaleString()}
          width={60} // Fixed width for Y-axis
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom"  // Changed from top to bottom
          height={36}
          iconType="circle"
          wrapperStyle={{ paddingTop: 20 }} // Added padding
        />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index]}
            strokeWidth={2}
            dot={{ r: 3 }} // Smaller dots
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  // Bar chart specific configurations
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          type={layout === 'vertical' ? 'number' : 'category'}
          dataKey={layout === 'vertical' ? undefined : nameKey}
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          type={layout === 'vertical' ? 'category' : 'number'}
          dataKey={layout === 'vertical' ? nameKey : undefined}
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={layout === 'vertical' ? undefined : value => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="top" 
          height={36}
          iconType="circle"
        />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index]}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  // Pie chart specific configurations
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="35%" // Moved left to make room for legend
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          innerRadius={donut ? '50%' : 0} // Smaller donut
          outerRadius={donut ? '70%' : '70%'} // Smaller overall size
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || colors[index % colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="middle" 
          align="right"
          layout="vertical"
          iconType="circle"
          wrapperStyle={{ right: 10 }} // Added right margin
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        {subtitle && (
          <div className="flex items-center text-sm text-gray-500">
            <UserPlusIcon size={16} className="mr-1" />
            {subtitle}
          </div>
        )}
      </div>
      <div className="p-6">
        {type === 'line' && renderLineChart()}
        {type === 'bar' && renderBarChart()}
        {type === 'pie' && renderPieChart()}
      </div>
    </div>
  );
};

export default AnalyticsChart;