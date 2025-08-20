import React, { useState } from 'react'
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
import {
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  LeafIcon,
  UsersIcon,
  TrendingUpIcon,
  BuildingIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  ScaleIcon,
  UserPlusIcon,
  CheckCircleIcon,
} from 'lucide-react'

// Mock data
const userGrowthData = [/* ...same as before... */]
const newSignupsData = [/* ... */]
const userTypeData = [/* ... */]
const platformActivityData = [/* ... */]
const impactData = [/* ... */]
const successRateData = [/* ... */]
const successRateColors = ['#10B981', '#F59E0B', '#EF4444']
const topProvidersData = [/* ... */]

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('Last 6 Months')

  const totalUsers = userGrowthData[userGrowthData.length - 1].users
  const totalMeals = impactData.reduce((sum, item) => sum + item.meals, 0)
  const totalWeight = impactData.reduce((sum, item) => sum + item.weight, 0)
  const successRate =
    successRateData.find((item) => item.name === 'Completed')?.value || 0

  const newUsersThisWeek = newSignupsData.reduce(
    (sum, item) => sum + item.consumers + item.providers + item.ngos,
    0
  )
  const newListingsThisWeek = 156 // mock

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <div className="relative inline-flex">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon size={18} className="text-gray-400" />
            </div>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="Year to Date">Year to Date</option>
              <option value="All Time">All Time</option>
            </select>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <DownloadIcon size={18} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          change="+12.5%"
          icon={<UsersIcon className="text-blue-600" />}
          color="blue"
          subtitle={`+${newUsersThisWeek} this week`}
        />
        <KpiCard
          title="Active Listings"
          value="920"
          change="+8.2%"
          icon={<ShoppingBagIcon className="text-purple-600" />}
          color="purple"
          subtitle={`+${newListingsThisWeek} this week`}
        />
        <KpiCard
          title="Meals Rescued"
          value={totalMeals.toLocaleString()}
          change="+18.2%"
          icon={<LeafIcon className="text-green-600" />}
          color="green"
          subtitle={`${totalWeight.toLocaleString()} kg of food`}
        />
        <KpiCard
          title="Transaction Success"
          value={`${successRate}%`}
          change="+5.3%"
          icon={<CheckCircleIcon className="text-amber-600" />}
          color="amber"
          subtitle="Completion rate"
        />
      </div>

       {/* Charts - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">User Growth</h2>
            <div className="flex items-center text-sm text-gray-500">
              <UserPlusIcon size={16} className="mr-1" />
              Total: {totalUsers.toLocaleString()}
            </div>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={userGrowthData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#3B82F6"
                  fill="#93C5FD"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Signups This Week */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              New Signups This Week
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <UserPlusIcon size={16} className="mr-1" />
              Total: {newUsersThisWeek}
            </div>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={newSignupsData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="consumers"
                  stackId="a"
                  fill="#3B82F6"
                  name="Consumers"
                />
                <Bar
                  dataKey="providers"
                  stackId="a"
                  fill="#8B5CF6"
                  name="Providers"
                />
                <Bar dataKey="ngos" stackId="a" fill="#10B981" name="NGOs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Distribution */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              User Distribution
            </h2>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Success Rate */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Transaction Success Rate
            </h2>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {successRateData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={successRateColors[index]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Impact Metrics Growth
            </h2>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="10%"
                outerRadius="80%"
                barSize={10}
                data={[
                  {
                    name: 'Meals Rescued',
                    value: 100,
                    fill: '#10B981',
                  },
                  {
                    name: 'Food Weight (kg)',
                    value: 85,
                    fill: '#3B82F6',
                  },
                  {
                    name: 'CO₂ Reduced',
                    value: 70,
                    fill: '#F59E0B',
                  },
                  {
                    name: 'Water Saved',
                    value: 55,
                    fill: '#8B5CF6',
                  },
                ]}
              >
                <RadialBar
                  minAngle={15}
                  label={{
                    position: 'insideStart',
                    fill: '#fff',
                  }}
                  background
                  clockWise
                  dataKey="value"
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
          </div>
        </div>
      </div>

      {/* Charts - Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Activity */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Platform Activity
            </h2>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={platformActivityData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="listings"
                  stroke="#8B5CF6"
                  activeDot={{
                    r: 8,
                  }}
                  name="Active Listings"
                />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#F59E0B"
                  name="Completed Transactions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Providers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Top Food Providers
            </h2>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProvidersData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="listings" fill="#8B5CF6" name="Total Listings" />
                <Bar dataKey="donations" fill="#10B981" name="Donations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Platform Impact Summary
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <LeafIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Meals Rescued
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalMeals.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Since launch</p>
              </div>
            </div>
          </div>
          <div className="p-6 border-b md:border-b-0 lg:border-r border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <ScaleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Food Weight Saved
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalWeight.toLocaleString()} kg
                </p>
                <p className="text-sm text-gray-500">Total rescued food</p>
              </div>
            </div>
          </div>
          <div className="p-6 border-b lg:border-b-0 md:border-r border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <CreditCardIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Completed Transactions
                </h3>
                <p className="text-2xl font-semibold text-gray-900">5,782</p>
                <p className="text-sm text-gray-500">Successful exchanges</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <BuildingIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Active Providers
                </h3>
                <p className="text-2xl font-semibold text-gray-900">880</p>
                <p className="text-sm text-gray-500">Contributing businesses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Converted JSX version of KpiCard (no TypeScript types)
const KpiCard = ({ title, value, change, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    amber: 'bg-amber-50',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div
          className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}
        >
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="ml-2 text-sm font-medium text-green-600">{change}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

export default Analytics
