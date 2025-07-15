import React, { useState } from 'react'
import AnalyticsHeader from '../components/analytics/AnalyticsHeader'
import KpiCard from '../components/dashboard/KpiCard'
import AnalyticsChart from '../components/analytics/AnalyticsChart'
import ImpactSummary from '../components/analytics/ImpactSummary'
import {
  UsersIcon,
  ShoppingBagIcon,
  LeafIcon,
  CheckCircleIcon,
} from 'lucide-react'

const userGrowthData = [
  { name: 'Jan', users: 1450 },
  { name: 'Feb', users: 1650 },
  { name: 'Mar', users: 1900 },
  { name: 'Apr', users: 2100 },
  { name: 'May', users: 2300 },
  { name: 'Jun', users: 2550 },
  { name: 'Jul', users: 2700 },
  { name: 'Aug', users: 2845 },
]

const newSignupsData = [
  { name: 'Mon', consumers: 12, providers: 3, ngos: 1 },
  { name: 'Tue', consumers: 15, providers: 2, ngos: 0 },
  { name: 'Wed', consumers: 18, providers: 5, ngos: 2 },
  { name: 'Thu', consumers: 22, providers: 4, ngos: 1 },
  { name: 'Fri', consumers: 25, providers: 6, ngos: 0 },
  { name: 'Sat', consumers: 30, providers: 8, ngos: 3 },
  { name: 'Sun', consumers: 20, providers: 4, ngos: 2 },
]

const userTypeData = [
  { name: 'Individual Consumers', value: 1823, color: '#3B82F6' },
  { name: 'NGOs', value: 142, color: '#10B981' },
  { name: 'Food Providers', value: 880, color: '#8B5CF6' },
]

const platformActivityData = [
  { name: 'Jan', listings: 450, transactions: 380 },
  { name: 'Feb', listings: 520, transactions: 420 },
  { name: 'Mar', listings: 580, transactions: 470 },
  { name: 'Apr', listings: 620, transactions: 510 },
  { name: 'May', listings: 700, transactions: 580 },
  { name: 'Jun', listings: 780, transactions: 650 },
  { name: 'Jul', listings: 850, transactions: 720 },
  { name: 'Aug', listings: 920, transactions: 780 },
]

const impactData = [
  { name: 'Jan', meals: 1200, weight: 600 },
  { name: 'Feb', meals: 1900, weight: 950 },
  { name: 'Mar', meals: 2100, weight: 1050 },
  { name: 'Apr', meals: 2400, weight: 1200 },
  { name: 'May', meals: 2800, weight: 1400 },
  { name: 'Jun', meals: 3500, weight: 1750 },
  { name: 'Jul', meals: 3800, weight: 1900 },
  { name: 'Aug', meals: 4200, weight: 2100 },
]

const successRateData = [
  { name: 'Completed', value: 78 },
  { name: 'Cancelled', value: 12 },
  { name: 'Failed', value: 10 },
]

const successRateColors = ['#10B981', '#F59E0B', '#EF4444']

const topProvidersData = [
  { name: 'Fresh Harvest Market', listings: 156, donations: 42 },
  { name: 'Local Bakery', listings: 124, donations: 78 },
  { name: 'Green Grocers', listings: 98, donations: 25 },
  { name: 'City Supermarket', listings: 87, donations: 12 },
  { name: 'Farm to Table', listings: 76, donations: 38 },
]

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
  const newListingsThisWeek = 156 // Mock data

  return (
    <div className="space-y-6">
      <AnalyticsHeader timeframe={timeframe} setTimeframe={setTimeframe} />

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          title="User Growth"
          subtitle={`Total: ${totalUsers.toLocaleString()}`}
          type="area"
          data={userGrowthData}
          dataKeys={['users']}
          colors={['#3B82F6']}
          height={320}
        />
        <AnalyticsChart
          title="New Signups This Week"
          subtitle={`Total: ${newUsersThisWeek}`}
          type="bar"
          data={newSignupsData}
          dataKeys={['consumers', 'providers', 'ngos']}
          colors={['#3B82F6', '#8B5CF6', '#10B981']}
          height={320}
          stacked
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnalyticsChart
          title="User Distribution"
          type="pie"
          data={userTypeData}
          dataKeys={['value']}
          colors={userTypeData.map((item) => item.color)}
          height={320}
          nameKey="name"
        />
        <AnalyticsChart
          title="Transaction Success Rate"
          type="pie"
          data={successRateData}
          dataKeys={['value']}
          colors={successRateColors}
          height={320}
          nameKey="name"
          donut
        />
        <AnalyticsChart
          title="Impact Metrics Growth"
          type="radialBar"
          data={[
            { name: 'Meals Rescued', value: 100, fill: '#10B981' },
            { name: 'Food Weight (kg)', value: 85, fill: '#3B82F6' },
            { name: 'CO₂ Reduced', value: 70, fill: '#F59E0B' },
            { name: 'Water Saved', value: 55, fill: '#8B5CF6' },
          ]}
          dataKeys={['value']}
          height={320}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          title="Platform Activity"
          type="line"
          data={platformActivityData}
          dataKeys={['listings', 'transactions']}
          colors={['#8B5CF6', '#F59E0B']}
          height={320}
        />
        <AnalyticsChart
          title="Top Food Providers"
          type="bar"
          data={topProvidersData}
          dataKeys={['listings', 'donations']}
          colors={['#8B5CF6', '#10B981']}
          height={320}
          layout="vertical"
        />
      </div>

      <ImpactSummary totalMeals={totalMeals} totalWeight={totalWeight} />
    </div>
  )
}

export default Analytics
