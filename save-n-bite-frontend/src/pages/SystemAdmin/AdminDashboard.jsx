import React from 'react'
import KpiCard from '../../components/SystemAdmin/AdminDashboard/KpiCard'
import ActivityItem from '../../components/SystemAdmin/AdminDashboard/ActivityItem'
import QuickLinkCard from '../../components/SystemAdmin/AdminDashboard/QuickLinkCard'
import {
  UsersIcon,
  ShoppingBagIcon,
  AlertOctagonIcon,
  LeafIcon,
} from 'lucide-react'
const Dashboard = () => {
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
          value="2,845"
          change="+12.5%"
          icon={<UsersIcon className="text-blue-600" />}
          color="blue"
        />
        <KpiCard
          title="New Listings This Week"
          value="156"
          change="+23.1%"
          icon={<ShoppingBagIcon className="text-purple-600" />}
          color="purple"
        />
        <KpiCard
          title="Resolved Disputes"
          value="24"
          change="-4.5%"
          icon={<AlertOctagonIcon className="text-amber-600" />}
          color="amber"
          isNegative
        />
        <KpiCard
          title="Meals Rescued"
          value="12,582"
          change="+18.2%"
          icon={<LeafIcon className="text-green-600" />}
          color="green"
        />
      </div>
      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          <ActivityItem
            title="New Provider Registration"
            description="Fresh Harvest Market has registered as a food provider"
            time="5 minutes ago"
            type="user"
          />
          <ActivityItem
            title="Flagged Listing"
            description="A listing has been flagged for inappropriate content"
            time="23 minutes ago"
            type="warning"
          />
          <ActivityItem
            title="Successful Pickup"
            description="Food Rescue NGO has completed a pickup of 25kg of food"
            time="1 hour ago"
            type="success"
          />
          <ActivityItem
            title="New User Registration"
            description="Jane Doe has joined as an individual consumer"
            time="2 hours ago"
            type="user"
          />
          <ActivityItem
            title="Verification Request"
            description="Community Food Bank has requested NGO verification"
            time="3 hours ago"
            type="info"
          />
        </div>
      </div>
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLinkCard
          title="View Verification Requests"
          description="5 pending verification requests"
          link="/verifications"
          color="blue"
        />
        <QuickLinkCard
          title="Send Platform Notification"
          description="Reach all users with important updates"
          link="/notifications"
          color="blue"
        />
        <QuickLinkCard
          title="View Audit Logs"
          description="Review recent admin activities"
          link="/audit-logs"
          color="blue"
        />
      </div>
    </div>
  )
}
export default Dashboard
