import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import KpiCard from '../../components/SystemAdmin/AdminDashboard/KpiCard'
import ActivityItem from '../../components/SystemAdmin/AdminDashboard/ActivityItem'
import QuickLinkCard from '../../components/SystemAdmin/AdminDashboard/QuickLinkCard'
import AdminAPI from '../../services/AdminAPI'
import {
  UsersIcon,
  ShoppingBagIcon,
  AlertOctagonIcon,
  LeafIcon,
} from 'lucide-react'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await AdminAPI.getDashboard()
      
      if (response.success) {
        setDashboardData(response.data)
        setError(null)
      } else {
        setError(response.error)
        toast.error(response.error || 'Failed to load dashboard data')
      }
    } catch (error) {
      setError('Failed to fetch dashboard data')
      toast.error('Failed to load dashboard data')
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatChange = (current, previous) => {
    if (!previous || previous === 0) return '+0%'
    const change = ((current - previous) / previous) * 100
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  const getChangeColor = (current, previous) => {
    if (!previous || previous === 0) return false
    return current < previous
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertOctagonIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={fetchDashboardData}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.dashboard_stats || {}
  const recentActivity = dashboardData?.recent_activity || []

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, Admin</h1>
          <p className="text-gray-500">
            Here's what's happening with your platform today.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <p className="text-sm text-gray-500">
            Today: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Active Users"
          value={stats.users?.active?.toString() || '0'}
          change={formatChange(stats.users?.active, stats.users?.previous_period)}
          icon={<UsersIcon className="text-blue-600" />}
          color="blue"
          isNegative={getChangeColor(stats.users?.active, stats.users?.previous_period)}
        />
        <KpiCard
          title="Active Listings"
          value={stats.listings?.active?.toString() || '0'}
          change={formatChange(stats.listings?.active, stats.listings?.previous_period)}
          icon={<ShoppingBagIcon className="text-purple-600" />}
          color="purple"
          isNegative={getChangeColor(stats.listings?.active, stats.listings?.previous_period)}
        />
        <KpiCard
          title="Pending Issues"
          value={stats.system_health?.open_issues?.toString() || '0'}
          change={formatChange(stats.system_health?.open_issues, stats.system_health?.previous_issues)}
          icon={<AlertOctagonIcon className="text-amber-600" />}
          color="amber"
          isNegative={!getChangeColor(stats.system_health?.open_issues, stats.system_health?.previous_issues)}
        />
        <KpiCard
          title="Total Transactions"
          value={stats.transactions?.completed?.toString() || '0'}
          change={formatChange(stats.transactions?.completed, stats.transactions?.previous_period)}
          icon={<LeafIcon className="text-green-600" />}
          color="green"
          isNegative={getChangeColor(stats.transactions?.completed, stats.transactions?.previous_period)}
        />
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <ActivityItem
                key={index}
                title={activity.title}
                description={activity.description}
                time={activity.time_ago || 'Just now'}
                type={activity.activity_type || 'info'}
              />
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No recent activity to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLinkCard
          title="View Verification Requests"
          description={`${stats.verifications?.pending || 0} pending verification requests`}
          link="/verifications"
          color="blue"
        />
        <QuickLinkCard
          title="Send Platform Notification"
          description="Reach all users with important updates"
          link="/admin-notifications"
          color="blue"
        />
        <QuickLinkCard
          title="View Audit Logs"
          description={`${stats.logs?.recent_admin_actions || 0} recent admin activities`}
          link="/audit-logs"
          color="blue"
        />
      </div>
    </div>
  )
}

export default Dashboard