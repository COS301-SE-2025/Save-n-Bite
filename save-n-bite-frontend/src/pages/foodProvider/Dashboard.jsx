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
} from 'lucide-react'
import { Button } from '../../components/foodProvider/Button'
import { analyticsAPI, transformAnalyticsData, getAISuggestion } from '../../services/analyticsAPI'
import SideBar from '../../components/foodProvider/SideBar'

function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const COLORS = ['#2563eb', '#60a5fa']

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  // Check if dashboard needs refresh (from PickupCoordination)
  useEffect(() => {
    const needsRefresh = localStorage.getItem('dashboardNeedsRefresh');
    if (needsRefresh === 'true') {
      const refreshData = async () => {
        await fetchAnalyticsData();
        localStorage.removeItem('dashboardNeedsRefresh');
      };
      refreshData();
    }
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Get provider-specific analytics data
      const data = await analyticsAPI.getProviderAnalytics();
      console.log('Provider Analytics returned:', data)
      setAnalyticsData(data)
      setError(null)
    } catch (err) {
      setError('Failed to load analytics data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
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
        <span className="text-gray-500 ml-1">from last month</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full flex min-h-screen">
        <SideBar onNavigate={() => {}} currentPage="dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full flex min-h-screen">
        <SideBar onNavigate={() => {}} currentPage="dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalyticsData}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  // Transform the data using your utility functions
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
    : { mealsSaved: 0, co2Reduced: 0 }

  const topSaverMessage = analyticsData?.top_saver_percentile
    ? transformAnalyticsData.formatTopSaverBadge(analyticsData.top_saver_percentile)
    : "Keep going! You're making a difference in reducing food waste! 💪"

  const aiSuggestion = getAISuggestion(analyticsData)

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
            {analyticsData?.total_orders_fulfilled > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Provider Analytics:</strong> Showing data for your completed orders
                </p>
              </div>
            )}
          </div>
          <Button variant="secondary" icon={<DownloadIcon className="h-4 w-4" />}>
            Export Data
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-4" data-onboarding="dashboard-stats">
          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Total Orders Fulfilled</p>
                <h3 className="text-2xl font-bold mt-1">
                  {analyticsData?.total_orders_fulfilled || 0}
                </h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-md">
                <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {renderKPIChange(analyticsData?.orders_change_percent)}
          </div>

          {/* Number of Donations */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Number of Donations</p>
                <h3 className="text-2xl font-bold mt-1">
                  {analyticsData?.total_donations || 0}
                </h3>
              </div>
              <div className="p-2 bg-purple-100 rounded-md">
                <LeafIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            {renderKPIChange(analyticsData?.donations_change_percent)}
          </div>

          {/* Profile Followers */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Profile Followers</p>
                <h3 className="text-2xl font-bold mt-1">
                  {analyticsData?.total_followers || 0}
                </h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-md">
                <UsersIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            {renderKPIChange(analyticsData?.followers_change_percent)}
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Average Rating</p>
                <h3 className="text-2xl font-bold mt-1">
                  {analyticsData?.average_rating || 0}
                </h3>
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
                    className={`h-4 w-4 ${
                      star <= (analyticsData?.average_rating || 0) 
                        ? 'text-amber-400' 
                        : 'text-gray-300'
                    }`}
                    fill={star <= (analyticsData?.average_rating || 0) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="text-gray-500 ml-1">
                based on {analyticsData?.total_reviews || 0} reviews
              </span>
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
                <div className="flex items-center justify-center h-full text-gray-500">
                  No order data available
                </div>
              )}
            </div>
          </div>

          {/* Sales vs Donations Chart */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Sales vs Donations Split</h3>
              <div className="relative group">
                <HelpCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                  This chart shows the percentage split between items sold and items donated.
                </div>
              </div>
            </div>
            <div className="h-72 flex items-center justify-center">
              {salesDonationData.length > 0 ? (
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
              ) : (
                <div className="text-gray-500">No sales/donation data available</div>
              )}
            </div>
          </div>

          {/* Followers Chart */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">New Followers Over Time</h3>
              <div className="relative group">
                <HelpCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                  This chart shows how many new followers you've gained each month.
                </div>
              </div>
            </div>
            <div className="h-72">
              {followersData.length > 0 ? (
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
                <div className="flex items-center justify-center h-full text-gray-500">
                  No follower data available
                </div>
              )}
            </div>
          </div>

          {/* Sustainability Metrics */}
          <div className="bg-white rounded-lg shadow-md p-5" data-onboarding="impact-section">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Sustainability Impact</h3>
              <div className="relative group">
                <HelpCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                  These metrics show your environmental impact through food waste reduction.
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
            <p className="text-xl font-bold mb-3">{topSaverMessage}</p>
            <p>
              Your commitment to reducing food waste is making a real difference
              in our community.
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-5 text-white">
            <h3 className="text-lg font-medium mb-2">AI Suggestion</h3>
            <p className="text-xl font-bold mb-3">{aiSuggestion}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard