import React, { useState, useEffect } from 'react'
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
  TrendingDownIcon,
  UsersIcon,
  StarIcon,
  ShoppingBagIcon,
  LeafIcon,
  HelpCircleIcon,
  DownloadIcon,
  LoaderIcon,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '../../components/foodProvider/Button'
import { analyticsAPI, transformAnalyticsData, getAISuggestion } from '../../services/analyticsAPI'
import SideBar from '../../components/foodProvider/SideBar'

function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const COLORS = ['#2563eb', '#60a5fa']

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Get business analytics from real API
      const data = await analyticsAPI.getBusinessAnalytics();
      console.log('Business Analytics returned:', data)
      setAnalyticsData(data)
      setError(null)
    } catch (err) {
      setError('Failed to load analytics data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const renderKPIChange = (changePercent) => {
    if (!changePercent && changePercent !== 0) return null
    
    const change = transformAnalyticsData.formatPercentChange(changePercent)
    const Icon = change.isPositive ? TrendingUpIcon : TrendingDownIcon
    
    return (
      <div className="mt-3 flex items-center text-sm">
        <Icon className={`h-4 w-4 ${change.color} mr-1`} />
        <span className={`${change.color} font-medium`}>
          {change.sign}{change.value}%
        </span>
        <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <SideBar onNavigate={() => {}} currentPage="dashboard" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <SideBar onNavigate={() => {}} currentPage="dashboard" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchAnalyticsData}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  // Transform the data using utility functions
  const monthlyOrdersData = analyticsData?.orders_per_month 
    ? transformAnalyticsData.formatMonthlyOrders(analyticsData.orders_per_month)
    : []

  const salesDonationData = analyticsData?.sales_vs_donations
    ? transformAnalyticsData.formatSalesDonations(analyticsData.sales_vs_donations)
    : []

  const followersData = analyticsData?.follower_growth
    ? transformAnalyticsData.formatFollowerGrowth(analyticsData.follower_growth)
    : []

  const sustainabilityData = analyticsData?.sustainability_impact
    ? transformAnalyticsData.formatSustainabilityData(analyticsData.sustainability_impact)
    : { mealsSaved: 0, co2Reduced: 0, waterSavedLitres: 0 }

  const topSaverMessage = analyticsData?.top_saver_badge_percent
    ? transformAnalyticsData.formatTopSaverBadge(analyticsData.top_saver_badge_percent)
    : "Keep going! You're making a difference in reducing food waste! "

  const aiSuggestion = getAISuggestion(analyticsData)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex">
        <SideBar onNavigate={() => {}} currentPage="dashboard" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleMobileSidebar}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 z-50">
            <SideBar 
              onNavigate={() => setIsMobileSidebarOpen(false)} 
              currentPage="dashboard" 
              onClose={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-colors duration-300">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <div className="w-10" />
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6">
            <div>
              <h1 className="hidden md:block text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Business Dashboard</h1>
              <h2 className="md:hidden text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                Track your performance and impact
              </p>
              {analyticsData?.total_orders_fulfilled > 0 && (
                <div className="mt-2 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                    <strong>Your Analytics:</strong> {(analyticsData.total_orders_fulfilled || 0)} orders fulfilled with {analyticsData.sustainability_impact?.meals_saved || 0} meals saved
                  </p>
                </div>
              )}
            </div>
            {/* <Button variant="secondary" icon={<DownloadIcon className="h-4 w-4" />}>
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </Button> */}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 mb-6 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 card-responsive transition-colors duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total Orders Fulfilled</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                    {(analyticsData.total_orders_fulfilled || 0)}
                  </h3>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                  <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              {renderKPIChange(analyticsData?.order_change_percent)}
            </div>

            {/* Number of Donations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 card-responsive transition-colors duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Number of Donations</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                    {analyticsData?.donations || 0}
                  </h3>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-md">
                  <LeafIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              {renderKPIChange(analyticsData?.donation_change_percent)}
            </div>

            {/* Profile Followers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 card-responsive transition-colors duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Profile Followers</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                    {analyticsData?.total_followers || 0}
                  </h3>
                </div>
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-md">
                  <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              {renderKPIChange(analyticsData?.follower_change_percent)}
            </div>

            {/* Meals Saved */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 transition-colors duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Meals Saved</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                    {sustainabilityData.mealsSaved}
                  </h3>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md">
                  <LeafIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {sustainabilityData.waterSavedLitres ? 
                  `${sustainabilityData.waterSavedLitres}L water saved` : 
                  'Environmental impact'
                }
              </div>
            </div>
          </div>

          {/* Charts Section - Responsive grid */}
          <div className="grid grid-cols-1 gap-6 mb-8 xl:grid-cols-2">
            {/* Orders Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">Orders per Month</h3>
                <div className="relative group">
                  <HelpCircleIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help" />
                  <div className="absolute right-0 w-64 p-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                    This chart shows the total number of orders received each month.
                  </div>
                </div>
              </div>
              <div className="h-48 sm:h-72">
                {monthlyOrdersData.length > 0 ? (
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
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    No order data available
                  </div>
                )}
              </div>
            </div>

            {/* Sales vs Donations Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">Sales vs Donations Split</h3>
                <div className="relative group">
                  <HelpCircleIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help" />
                  <div className="absolute right-0 w-64 p-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                    This chart shows the split between items sold and items donated.
                  </div>
                </div>
              </div>
              <div className="h-48 sm:h-72 flex items-center justify-center">
                {salesDonationData.length > 0 && (salesDonationData[0].value > 0 || salesDonationData[1].value > 0) ? (
                  <div className="w-full">
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
                    <div className="flex justify-center gap-2 sm:gap-6 mt-2">
                      {salesDonationData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center">
                          <div
                            className="w-3 h-3 mr-1 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></div>
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-center">
                    <p>No sales or donation data available</p>
                    <p className="text-sm mt-1">Start fulfilling orders to see your impact!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Followers Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">Followers Growth</h3>
                <div className="relative group">
                  <HelpCircleIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help" />
                  <div className="absolute right-0 w-64 p-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                    This chart shows your follower growth over time.
                  </div>
                </div>
              </div>
              <div className="h-48 sm:h-72">
                {followersData.some(item => item.followers > 0) ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center">
                    <div>
                      <p>No follower data available</p>
                      <p className="text-sm mt-1">Build your community by engaging with customers!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sustainability Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">Sustainability Impact</h3>
                <div className="relative group">
                  <HelpCircleIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help" />
                  <div className="absolute right-0 w-64 p-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                    These metrics show your environmental impact through food waste reduction.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 sm:p-5 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-800 mb-2 sm:mb-4">
                    <LeafIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                    {sustainabilityData.mealsSaved}
                  </h4>
                  <p className="text-green-700 dark:text-green-300 mt-1 text-sm sm:text-base">Meals Saved</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 sm:p-5 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-800 mb-2 sm:mb-4">
                    <LeafIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {sustainabilityData.waterSavedLitres}L
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 mt-1 text-sm sm:text-base">Water Saved</p>
                </div>
              </div>
              {sustainabilityData.mealsSaved > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Equivalent to preventing {Math.round(sustainabilityData.mealsSaved * 2.5)}kg of CO₂ emissions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Benchmark & AI Suggestion Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-4 sm:p-5 text-white">
              <h3 className="text-base sm:text-lg font-medium mb-2">Your Impact Ranking</h3>
              <p className="text-lg sm:text-xl font-bold mb-3">{topSaverMessage}</p>
              <p className="text-sm sm:text-base">
                Your commitment to reducing food waste is making a real difference
                in our community.
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-4 sm:p-5 text-white">
              <h3 className="text-base sm:text-lg font-medium mb-2">Suggestion</h3>
              <p className="text-lg sm:text-xl font-bold mb-3">{aiSuggestion}</p>
              <p className="text-purple-100 text-xs sm:text-sm">
                Based on your current performance and platform trends
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard