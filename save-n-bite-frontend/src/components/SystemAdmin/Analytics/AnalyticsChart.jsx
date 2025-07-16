import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
} from 'recharts'
import { UserPlusIcon } from 'lucide-react'

const AnalyticsChart = ({
  title,
  subtitle,
  type,
  data,
  dataKeys,
  colors,
  height,
  stacked = false,
  layout = 'horizontal',
  nameKey = 'name',
  donut = false,
}) => {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              layout={layout}
              margin={{
                top: 20,
                right: 30,
                left: layout === 'vertical' ? 60 : 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              {layout === 'horizontal' ? (
                <>
                  <XAxis dataKey={nameKey} />
                  <YAxis />
                </>
              ) : (
                <>
                  <XAxis type="number" />
                  <YAxis dataKey={nameKey} type="category" width={100} />
                </>
              )}
              <Tooltip />
              <Legend />
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId={stacked ? 'a' : undefined}
                  fill={colors[index % colors.length]}
                  name={key.charAt(0).toUpperCase() + key.slice(1)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                  name={key.charAt(0).toUpperCase() + key.slice(1)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={donut ? 60 : 0}
                fill="#8884d8"
                dataKey={dataKeys[0]}
                nameKey={nameKey}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length] + '40'}
                  name={key.charAt(0).toUpperCase() + key.slice(1)}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )
      case 'radialBar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="10%"
              outerRadius="80%"
              barSize={10}
              data={data}
            >
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                clockWise
                dataKey={dataKeys[0]}
              />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                align="right"
              />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        )
      default:
        return <div>Chart type not supported</div>
    }
  }

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
      <div className="p-6">{renderChart()}</div>
    </div>
  )
}

export default AnalyticsChart
