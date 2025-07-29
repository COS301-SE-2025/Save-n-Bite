import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { XIcon, HelpCircleIcon } from 'lucide-react'

const HelpMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [helpContent, setHelpContent] = useState({
    title: '',
    content: null,
  })
  const location = useLocation()

  useEffect(() => {
    // Update help content based on current path
    const path = location.pathname
    if (path === '/' || path === '/dashboard') {
      setHelpContent({
        title: 'Dashboard Help',
        content: <DashboardHelp />,
      })
    } else if (path === '/users') {
      setHelpContent({
        title: 'User Management Help',
        content: <UserManagementHelp />,
      })
    } else if (path === '/verifications') {
      setHelpContent({
        title: 'Verification Requests Help',
        content: <VerificationsHelp />,
      })
    } else if (path === '/listings') {
      setHelpContent({
        title: 'Listings & Reports Help',
        content: <ListingsHelp />,
      })
    } else if (path === '/transactions') {
      setHelpContent({
        title: 'Transactions Help',
        content: <TransactionsHelp />,
      })
    } else if (path === '/analytics') {
      setHelpContent({
        title: 'Analytics Help',
        content: <AnalyticsHelp />,
      })
    } else if (path === '/settings') {
      setHelpContent({
        title: 'Settings Help',
        content: <SettingsHelp />,
      })
    } else {
      setHelpContent({
        title: 'Help Center',
        content: <GeneralHelp />,
      })
    }
  }, [location])

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg z-30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open Help Menu"
      >
        <HelpCircleIcon size={24} />
      </button>
      {/* Help Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          <div
            className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {helpContent.title}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {helpContent.content}
            </div>
            <div className="border-t border-gray-200 p-4">
              <p className="text-sm text-gray-500">
                Need more help? Contact{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  admin support
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Help content components for different pages

const DashboardHelp = () => (
  <div className="space-y-4">
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Dashboard Overview</h3>
      <p className="text-gray-600">
        The dashboard provides a quick overview of your platform's key metrics
        and recent activity.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">KPI Cards</h3>
      <p className="text-gray-600">
        The cards at the top show important metrics like active users and meals
        rescued. The percentage indicates change from the previous period.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Recent Activity</h3>
      <p className="text-gray-600">
        This section shows the latest actions and events on the platform,
        helping you stay up-to-date with what's happening.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Quick Links</h3>
      <p className="text-gray-600">
        These cards provide shortcuts to important areas that may need your
        attention.
      </p>
    </section>
    <section className="bg-blue-50 p-3 rounded-md">
      <h3 className="font-medium text-blue-800 mb-2">Pro Tip</h3>
      <p className="text-blue-700 text-sm">
        Click on any KPI card to see more detailed analytics for that specific
        metric.
      </p>
    </section>
  </div>
)

const UserManagementHelp = () => (
  <div className="space-y-4">
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Managing Users</h3>
      <p className="text-gray-600">
        This page allows you to view, search, and manage all users on the
        platform.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">User Actions</h3>
      <ul className="list-disc pl-5 text-gray-600 space-y-1">
        <li>
          <strong>View</strong> - See detailed user information
        </li>
        <li>
          <strong>Deactivate/Activate</strong> - Toggle user account status
        </li>
        <li>
          <strong>Reset Password</strong> - Send a password reset email to the
          user
        </li>
      </ul>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Suspicious Activity</h3>
      <p className="text-gray-600">
        Users flagged for suspicious activity are marked with a warning icon.
        Review these accounts promptly.
      </p>
    </section>
    <section className="bg-blue-50 p-3 rounded-md">
      <h3 className="font-medium text-blue-800 mb-2">Pro Tip</h3>
      <p className="text-blue-700 text-sm">
        Use the filters to quickly find specific user types or account statuses
        when managing a large user base.
      </p>
    </section>
  </div>
)

const VerificationsHelp = () => (
  <div className="space-y-4">
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Verification Requests</h3>
      <p className="text-gray-600">
        Review and process verification requests from providers and NGOs who
        want to be verified on the platform.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Verification Process</h3>
      <ol className="list-decimal pl-5 text-gray-600 space-y-1">
        <li>Review the submitted documentation</li>
        <li>Check the organization's legitimacy</li>
        <li>Approve or reject the verification request</li>
        <li>Add notes explaining your decision if needed</li>
      </ol>
    </section>
    <section className="bg-yellow-50 p-3 rounded-md">
      <h3 className="font-medium text-yellow-800 mb-2">Important</h3>
      <p className="text-yellow-700 text-sm">
        Verification is crucial for platform integrity. Always thoroughly check
        documentation before approving verification requests.
      </p>
    </section>
  </div>
)

const ListingsHelp = () => (
  <div className="space-y-4">
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Listings & Reports</h3>
      <p className="text-gray-600">
        This page allows you to manage food listings and handle user reports
        about problematic listings.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Managing Listings</h3>
      <ul className="list-disc pl-5 text-gray-600 space-y-1">
        <li>
          <strong>View</strong> - See listing details and images
        </li>
        <li>
          <strong>Remove</strong> - Take down inappropriate listings
        </li>
        <li>
          <strong>Mark as Safe</strong> - Clear reports on a listing
        </li>
        <li>
          <strong>Feature</strong> - Highlight quality listings on the platform
        </li>
      </ul>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Handling Reports</h3>
      <p className="text-gray-600">
        Review user reports about listings that may have issues. You can either
        remove the listing or mark it as safe if the report is unfounded.
      </p>
    </section>
    <section className="bg-red-50 p-3 rounded-md">
      <h3 className="font-medium text-red-800 mb-2">Warning</h3>
      <p className="text-red-700 text-sm">
        Pay special attention to listings with multiple reports or food safety
        concerns, as these may pose health risks to users.
      </p>
    </section>
  </div>
)

const TransactionsHelp = () => (
  <div className="space-y-4">
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Transactions</h3>
      <p className="text-gray-600">
        Monitor and manage all transactions that occur on the platform.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Dispute Resolution</h3>
      <p className="text-gray-600">
        When users report issues with transactions, you can review the details
        and help resolve the dispute.
      </p>
    </section>
  </div>
)

const AnalyticsHelp = () => (
  <div className="space-y-4">
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
      <p className="text-gray-600">
        This page provides insights into platform performance, user behavior,
        and impact metrics.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Reading Charts</h3>
      <p className="text-gray-600">
        Hover over data points in any chart to see specific values. Use the
        timeframe selector to adjust the date range for all charts.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Exporting Data</h3>
      <p className="text-gray-600">
        Use the Export button to download analytics data as CSV or PDF for
        reporting purposes.
      </p>
    </section>
    <section className="bg-blue-50 p-3 rounded-md">
      <h3 className="font-medium text-blue-800 mb-2">Pro Tip</h3>
      <p className="text-blue-700 text-sm">
        Regular analysis of these metrics can help identify trends and
        opportunities for platform improvement.
      </p>
    </section>
  </div>
)

const SettingsHelp = () => (
  <div className="space-y-4">
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Settings</h3>
      <p className="text-gray-600">
        Configure your account and system-wide settings from this page.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Profile Settings</h3>
      <p className="text-gray-600">
        Update your personal information, contact details, and avatar.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Security Settings</h3>
      <p className="text-gray-600">
        Change your password and configure two-factor authentication for
        enhanced account security.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">System Settings</h3>
      <p className="text-gray-600">
        Configure platform-wide behavior like maintenance mode, verification
        requirements, and listing durations.
      </p>
    </section>
    <section className="bg-yellow-50 p-3 rounded-md">
      <h3 className="font-medium text-yellow-800 mb-2">Important</h3>
      <p className="text-yellow-700 text-sm">
        Changes to system settings affect all users. Consider the impact
        carefully before making changes.
      </p>
    </section>
  </div>
)

const GeneralHelp = () => (
  <div className="space-y-4">
    <section>
      <h3 className="font-medium text-gray-900 mb-2">
        Welcome to the Help Center
      </h3>
      <p className="text-gray-600">
        This help menu provides contextual guidance based on the page you're
        currently viewing.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Navigation</h3>
      <p className="text-gray-600">
        Use the sidebar to navigate between different sections of the admin
        dashboard.
      </p>
    </section>
    <section>
      <h3 className="font-medium text-gray-900 mb-2">Info Icons</h3>
      <p className="text-gray-600">
        Look for info icons (ⓘ) throughout the interface for additional context
        about specific features.
      </p>
    </section>
    <section className="bg-blue-50 p-3 rounded-md">
      <h3 className="font-medium text-blue-800 mb-2">Pro Tip</h3>
      <p className="text-blue-700 text-sm">
        You can collapse the sidebar using the menu button in the header to get
        more screen space.
      </p>
    </section>
  </div>
)

export default HelpMenu
