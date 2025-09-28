import React, { useState, useEffect } from 'react'
import AnalyticsHeader from '../../components/SystemAdmin/Analytics/AnalyticsHeader'
import KpiCard from '../../components/SystemAdmin/AdminDashboard/KpiCard'
import AnalyticsChart from '../../components/SystemAdmin/Analytics/AnalyticsChart'
import ImpactSummary from '../../components/SystemAdmin/Analytics/ImpactSummary'
import AdminAPI from '../../services/AdminAPI'
import { apiClient } from '../../services/FoodAPI.js'
import { toast } from 'sonner'
import {
  UsersIcon,
  ShoppingBagIcon,
  LeafIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  BarChart3Icon,
  PieChartIcon,
  StarIcon,
  RefreshCwIcon
} from 'lucide-react'

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('Last 6 Months')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Authentication setup
  useEffect(() => {
    setupAuthAndFetchAnalytics()
  }, [])

  const setupAuthAndFetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      await fetchAnalyticsData()
      
    } catch (error) {
      console.error('Authentication setup error:', error)
      setError('Authentication failed. Please log in again.')
      setLoading(false)
    }
  }

  /**
   * Fetch analytics data from backend using correct AdminAPI method
   */
  const fetchAnalyticsData = async () => {
    try {
      setError(null)
      
      // Use correct AdminAPI method
      const analyticsResponse = await AdminAPI.getAnalytics()
      
      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalyticsData(analyticsResponse.data)
      } else {
        throw new Error(analyticsResponse.error || 'Failed to fetch analytics data')
      }
      
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add auto-refresh effect
  useEffect(() => {
    // Initial fetch
    fetchAnalyticsData()
    
    // Set up interval for auto-refresh every 30 seconds (reduced from 3 seconds)
    const intervalId = setInterval(fetchAnalyticsData, 30000)
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  /**
   * Handle retry when there's an error
   */
  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    await fetchAnalyticsData()
  }

  /**
   * Transform user distribution data for pie chart - FIXED
   */
  const getUserTypeData = () => {
    if (!analyticsData?.user_distribution) {
      console.log('No user distribution data available')
      return []
    }
    
    const distribution = analyticsData.user_distribution
    console.log('User distribution raw data:', distribution)
    
    const data = []
    
    // FIXED: Consistent color scheme and better labels
    const userTypeMapping = [
      { key: 'customer', name: 'Customers', color: '#3B82F6' },
      { key: 'provider', name: 'Food Providers', color: '#8B5CF6' },
      { key: 'ngo', name: 'NGOs', color: '#10B981' },
      { key: 'admin', name: 'Admins', color: '#F59E0B' }
    ]
    
    userTypeMapping.forEach(({ key, name, color }) => {
      if (distribution[key]) {
        const value = parseFloat(distribution[key].replace('%', ''))
        if (value > 0) {
          data.push({ 
            name: name, 
            value: value, 
            color: color,
            percentage: distribution[key] // Keep original percentage string
          })
        }
      }
    })
    
    console.log('Transformed user type data:', data)
    return data
  }

  /**
   * Transform top providers data for bar chart - FIXED
   */
  const getTopProvidersChartData = () => {
    if (!analyticsData?.top_providers || analyticsData.top_providers.length === 0) {
      console.log('No top providers data available')
      return [
        { name: 'No Data Available', listings: 0, transactions: 0 }
      ]
    }
    
    console.log('Top providers raw data:', analyticsData.top_providers)
    
    const transformedData = analyticsData.top_providers.map(provider => ({
      name: provider.name && provider.name.length > 20 ? 
            provider.name.substring(0, 20) + '...' : 
            provider.name || 'Unknown Provider',
      listings: provider.listings || 0,
      transactions: provider.completed_transactions || provider.transactions || 0
    }))
    
    console.log('Transformed top providers data:', transformedData)
    return transformedData
  }

 
const getUserGrowthData = () => {
  // Check if we have real monthly data from backend
  if (analyticsData?.monthly_user_growth && analyticsData.monthly_user_growth.length > 0) {
    console.log('✅ Using REAL monthly user growth data:', analyticsData.monthly_user_growth);
    
    return analyticsData.monthly_user_growth.map(month => ({
      name: month.name,        // e.g., "Jul 2024"
      users: month.total_users, // Running total
      new_users: month.new_users // New registrations that month
    }));
  }

  // Fallback: If no monthly data, show at least current total
  if (analyticsData?.total_users) {
    const currentMonth = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    
    console.log('⚠️ Using fallback data - no monthly growth available');
    return [{
      name: currentMonth,
      users: analyticsData.total_users,
      new_users: analyticsData.new_users_month || 0
    }];
  }

  // Last resort: No data message
  console.log('❌ No user data available');
  return [{
    name: 'No Data',
    users: 0,
    new_users: 0
  }];
};

/**
 * Get real platform activity data from backend - FIXED and SIMPLIFIED
 */
const getPlatformActivityData = () => {
  // Check if we have real monthly activity data
  if (analyticsData?.monthly_activity_growth && analyticsData.monthly_activity_growth.length > 0) {
    console.log('✅ Using REAL monthly activity data:', analyticsData.monthly_activity_growth);
    
    return analyticsData.monthly_activity_growth.map(month => ({
      name: month.name,
      listings: month.listings,
      transactions: month.transactions
    }));
  }

  // Fallback: Current totals only
  if (analyticsData?.total_listings || analyticsData?.total_transactions) {
    const currentMonth = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    
    console.log('⚠️ Using fallback data - no monthly activity available');
    return [{
      name: currentMonth,
      listings: analyticsData.total_listings || 0,
      transactions: analyticsData.total_transactions || 0
    }];
  }

  // Last resort
  console.log('❌ No activity data available');
  return [{
    name: 'No Data',
    listings: 0,
    transactions: 0
  }];
};

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Real-time insights and platform metrics
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Real-time insights and platform metrics
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">Error: {error}</div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Real-time insights and platform metrics
          </p>
        </div>
      </div>

      {/* Add a subtle loading indicator when refreshing */}
      {refreshing && (
        <div className="flex items-center text-sm text-gray-500">
          <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
          Updating data...
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Users"
          value={analyticsData?.total_users?.toLocaleString() || '0'}
          change={`+${analyticsData?.new_users_month || 0} this month`}
          icon={<UsersIcon className="w-6 h-6" />}
          trend={analyticsData?.user_growth_percentage >= 0 ? 'up' : 'down'}
          percentage={Math.abs(analyticsData?.user_growth_percentage || 0)}
        />
        
        <KpiCard
          title="Active Listings"
          value={analyticsData?.active_listings?.toLocaleString() || '0'}
          change={`+${analyticsData?.new_listings_week || 0} this week`}
          icon={<ShoppingBagIcon className="w-6 h-6" />}
          trend={analyticsData?.listing_growth_percentage >= 0 ? 'up' : 'down'}
          percentage={Math.abs(analyticsData?.listing_growth_percentage || 0)}
        />
        
        <KpiCard
          title="Completed Transactions"
          value={analyticsData?.completed_transactions?.toLocaleString() || '0'}
          change={`${analyticsData?.transaction_success_rate?.toFixed(1) || 0}% success rate`}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          trend="up"
          percentage={analyticsData?.transaction_success_rate || 0}
        />
        
        <KpiCard
          title="Total Transactions"
          value={analyticsData?.total_transactions?.toLocaleString() || '0'}
          change="All time"
          icon={<BarChart3Icon className="w-6 h-6" />}
          trend="neutral"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
  <AnalyticsChart
    title="User Growth"
    subtitle="Monthly user registration and totals"
    type="line"
    data={getUserGrowthData()}
    dataKeys={['users', 'new_users']} // Show both total and new users
    colors={['#3B82F6', '#10B981']}   // Blue for total, Green for new
    height={300}
  />
</div>

        {/* User Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <AnalyticsChart
            title="User Distribution"
            subtitle="Breakdown by user type"
            type="pie"
            data={getUserTypeData()}
            dataKeys={['value']}
            colors={['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']}
            height={300}
            donut={true}
          />
        </div>

        {/* Platform Activity */}
<div className="bg-white rounded-lg shadow-sm border p-6">
  <AnalyticsChart
    title="Platform Activity"
    subtitle="Monthly listings and transactions"
    type="line"
    data={getPlatformActivityData()}
    dataKeys={['listings', 'transactions']}
    colors={['#8B5CF6', '#F59E0B']}
    height={300}
  />
</div>

        {/* Top Providers */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <AnalyticsChart
            title="Top Providers"
            subtitle="Most active food providers"
            type="bar"
            data={getTopProvidersChartData()}
            dataKeys={['listings', 'transactions']}
            colors={['#3B82F6', '#F59E0B']}
            height={300}
            layout="vertical"
          />
        </div>
      </div>

      {/* Additional Stats Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution Table */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Users:</span>
              <span className="font-semibold">{analyticsData?.total_users?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">New This Week:</span>
              <span className="font-semibold text-green-600">
                +{analyticsData?.new_users_week || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">New This Month:</span>
              <span className="font-semibold text-green-600">
                +{analyticsData?.new_users_month || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Growth Rate:</span>
              <span className={`font-semibold ${
                (analyticsData?.user_growth_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(analyticsData?.user_growth_percentage || 0) >= 0 ? '+' : ''}
                {analyticsData?.user_growth_percentage?.toFixed(1) || '0'}%
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Statistics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-semibold">{analyticsData?.total_transactions?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-semibold text-green-600">
                {analyticsData?.completed_transactions?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate:</span>
              <span className="font-semibold text-green-600">
                {analyticsData?.transaction_success_rate?.toFixed(1) || '0'}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Listings:</span>
              <span className="font-semibold">
                {analyticsData?.active_listings?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Connection Status */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <div className="flex items-center text-sm text-gray-600">
          <div className={`w-2 h-2 rounded-full mr-2 ${analyticsData ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {analyticsData ? 'Connected to analytics API' : 'API connection failed'}
        </div>
      </div>
    </div>
  )
}

export default Analytics