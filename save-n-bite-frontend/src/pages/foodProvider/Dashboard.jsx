import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  TrendingUpIcon,
  UsersIcon,
  StarIcon,
  ShoppingBagIcon,
  LeafIcon,
  HelpCircleIcon,
  DownloadIcon,
} from 'lucide-react'
import { Button } from '../../components/foodProvider/Button'
import {
  monthlyOrdersData,
  salesDonationData,
  followersData,
  sustainabilityData,
} from '../../utils/MockData'

import SideBar from '../../components/foodProvider/SideBar';


function Dashboard() {
  const COLORS = ['#2563eb', '#60a5fa']
  return (
    <div className="w-full flex min-h-screen">
         <SideBar onNavigate={() => {}} currentPage="dashboard" />
             <div className="flex-1 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Business Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your performance and impact
          </p>
        </div>
        <Button variant="secondary" icon={<DownloadIcon className="h-4 w-4" />}>
          Export Data
        </Button>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total Orders Fulfilled</p>
              <h3 className="text-2xl font-bold mt-1">482</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-md">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">+12.5%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Number of Donations</p>
              <h3 className="text-2xl font-bold mt-1">135</h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-md">
              <LeafIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">+8.3%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Profile Followers</p>
              <h3 className="text-2xl font-bold mt-1">45</h3>
            </div>
            <div className="p-2 bg-amber-100 rounded-md">
              <UsersIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">+15.2%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Average Rating</p>
              <h3 className="text-2xl font-bold mt-1">4.8</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-md">
              <StarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-4 w-4 ${star <= 4.8 ? 'text-amber-400' : 'text-gray-300'}`}
                  fill={star <= 4.8 ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="text-gray-500 ml-1">based on 68 reviews</span>
          </div>
        </div>
      </div>
      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Orders per Month</h3>
            <div className="relative group">
              <HelpCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                This chart shows the total number of orders received each month.
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyOrdersData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Sales vs Donations Chart */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Sales vs Donations Split</h3>
            <div className="relative group">
              <HelpCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                This chart shows the percentage split between items sold and
                items donated.
              </div>
            </div>
          </div>
          <div className="h-72 flex items-center justify-center">
            <div className="w-full max-w-xs">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={salesDonationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {salesDonationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {salesDonationData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded-full"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    ></div>
                    <span className="text-sm text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Followers Chart */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">New Followers Over Time</h3>
            <div className="relative group">
              <HelpCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                This chart shows how many new followers you've gained each
                month.
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={followersData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="followers" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Sustainability Metrics */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Sustainability Impact</h3>
            <div className="relative group">
              <HelpCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                These metrics show your environmental impact through food waste
                reduction.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-green-50 rounded-lg p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <LeafIcon className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-3xl font-bold text-green-600">
                {sustainabilityData.mealsSaved}
              </h4>
              <p className="text-green-700 mt-1">Meals Saved</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <LeafIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-3xl font-bold text-blue-600">
                {sustainabilityData.co2Reduced} kg
              </h4>
              <p className="text-blue-700 mt-1">CO₂ Reduced</p>
            </div>
          </div>
        </div>
      </div>
      {/* Benchmark & AI Suggestion Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-5 text-white">
          <h3 className="text-lg font-medium mb-2">Your Benchmark</h3>
          <p className="text-xl font-bold mb-3">
            You're in the top 10% of food savers this month! 🎉
          </p>
          <p>
            Your commitment to reducing food waste is making a real difference
            in our community.
          </p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-5 text-white">
          <h3 className="text-lg font-medium mb-2">AI Suggestion</h3>
          <p className="text-xl font-bold mb-3">
            List items before 4PM to get more views
          </p>
          <p>
            Our data shows that listings posted earlier in the day receive 35%
            more engagement.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
export default Dashboard;