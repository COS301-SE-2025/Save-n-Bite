import React, { useState, useEffect } from 'react'
import AnalyticsHeader from '../../components/SystemAdmin/Analytics/AnalyticsHeader'
import KpiCard from '../../components/SystemAdmin/AdminDashboard/KpiCard'
import AnalyticsChart from '../../components/SystemAdmin/Analytics/AnalyticsChart'
import ImpactSummary from '../../components/SystemAdmin/Analytics/ImpactSummary'
import {
  UsersIcon,
  ShoppingBagIcon,
  LeafIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  BarChart3Icon,
  PieChartIcon,
  StarIcon
} from 'lucide-react'

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('Last 6 Months')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [impactData, setImpactData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch analytics data from backend
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        
        // Fetch main analytics
        const analyticsResponse = await fetch('/api/admin_panel/analytics/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!analyticsResponse.ok) {
          throw new Error('Failed to fetch analytics data')
        }
        
        const analyticsResult = await analyticsResponse.json()
        setAnalyticsData(analyticsResult.analytics)
        
        // Fetch impact summary if endpoint exists
        try {
          const impactResponse = await fetch('/api/admin_panel/analytics/impact/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (impactResponse.ok) {
            const impactResult = await impactResponse.json()
            setImpactData(impactResult.impact_summary)
          }
        } catch (impactError) {
          console.warn('Impact summary not available:', impactError)
        }
        
      } catch (err) {
        console.error('Analytics fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [timeframe])

  // Transform user distribution data for pie chart
  const getUserTypeData = () => {
    if (!analyticsData?.user_distribution) return []
    
    const distribution = analyticsData.user_distribution
    return [
      { name: 'Customers', value: distribution.customer || 0, color: '#3B82F6' },
      { name: 'Food Providers', value: distribution.provider || 0, color: '#8B5CF6' },
      { name: 'NGOs', value: distribution.ngo || 0, color: '#10B981' }
    ]
  }

  // Transform top providers data for bar chart
  const getTopProvidersChartData = () => {
    if (!analyticsData?.top_providers) return []
    
    return analyticsData.top_providers.map(provider => ({
      name: provider.name.length > 20 ? 
        provider.name.substring(0, 20) + '...' : 
        provider.name,
      listings: provider.listings,
      transactions: provider.completed_transactions
    }))
  }

  // Mock data for growth charts (replace with real data when available)
  const userGrowthData = [
    { name: 'Jan', users: 1450 },
    { name: 'Feb', users: 1650 },
    { name: 'Mar', users: 1900 },
    { name: 'Apr', users: 2100 },
    { name: 'May', users: 2300 },
    { name: 'Jun', users: 2550 },
    { name: 'Jul', users: analyticsData?.total_users || 2700 },
  ]

  const platformActivityData = [
    { name: 'Jan', listings: 450, transactions: 380 },
    { name: 'Feb', listings: 520, transactions: 420 },
    { name: 'Mar', listings: 580, transactions: 470 },
    { name: 'Apr', listings: 620, transactions: 510 },
    { name: 'May', listings: 700, transactions: 580 },
    { name: 'Jun', listings: 780, transactions: 650 },
    { name: 'Jul', listings: analyticsData?.total_listings || 850, 
      transactions: analyticsData?.total_transactions || 720 },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <AnalyticsHeader timeframe={timeframe} setTimeframe={setTimeframe} />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AnalyticsHeader timeframe={timeframe} setTimeframe={setTimeframe} />
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error loading analytics: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader timeframe={timeframe} setTimeframe={setTimeframe} />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Users"
          value={analyticsData?.total_users?.toLocaleString() || '0'}
          change={`+${analyticsData?.new_users_month || 0} this month`}
          icon={UsersIcon}
          trend={analyticsData?.user_growth_percentage >= 0 ? 'up' : 'down'}
          percentage={Math.abs(analyticsData?.user_growth_percentage || 0)}
        />
        
        <KpiCard
          title="Active Listings"
          value={analyticsData?.active_listings?.toLocaleString() || '0'}
          change={`+${analyticsData?.new_listings_week || 0} this week`}
          icon={ShoppingBagIcon}
          trend={analyticsData?.listing_growth_percentage >= 0 ? 'up' : 'down'}
          percentage={Math.abs(analyticsData?.listing_growth_percentage || 0)}
        />
        
        <KpiCard
          title="Completed Transactions"
          value={analyticsData?.completed_transactions?.toLocaleString() || '0'}
          change={`${analyticsData?.transaction_success_rate || 0}% success rate`}
          icon={CheckCircleIcon}
          trend="up"
          percentage={analyticsData?.transaction_success_rate || 0}
        />
        
        <KpiCard
          title="Total Transactions"
          value={analyticsData?.total_transactions?.toLocaleString() || '0'}
          change="All time"
          icon={BarChart3Icon}
          trend="neutral"
        />
      </div>

      {/* Impact Summary */}
      {impactData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Impact Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {impactData.total_meals_saved?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Meals Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {impactData.active_partnerships || '0'}
              </div>
              <div className="text-sm text-gray-600">Active Partnerships</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {impactData.organizations_served || '0'}
              </div>
              <div className="text-sm text-gray-600">Organizations Served</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <AnalyticsChart
            title="User Growth"
            subtitle="Total users over time"
            type="line"
            data={userGrowthData}
            dataKeys={['users']}
            colors={['#3B82F6']}
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
            colors={['#3B82F6', '#8B5CF6', '#10B981']}
            height={300}
            donut={true}
          />
        </div>

        {/* Platform Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <AnalyticsChart
            title="Platform Activity"
            subtitle="Listings and transactions over time"
            type="bar"
            data={platformActivityData}
            dataKeys={['listings', 'transactions']}
            colors={['#8B5CF6', '#10B981']}
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
    </div>
  )
}

export default Analytics