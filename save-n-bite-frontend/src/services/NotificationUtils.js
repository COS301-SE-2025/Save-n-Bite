/**
 * Utility functions for notification management
 */

export class NotificationUtils {
  /**
   * Map frontend audience values to backend expected values
   */
  static mapAudienceToBackend = {
    'All': 'all',
    'Customers': 'customers', 
    'Businesses': 'businesses',
    'NGOs': 'organisations'
  }

  /**
   * Map backend audience values to frontend display values
   */
  static mapAudienceToFrontend = {
    'all': 'All',
    'customers': 'Customers',
    'businesses': 'Businesses', 
    'organisations': 'NGOs'
  }

  /**
   * Validate notification data before sending
   * @param {Object} notification - Notification object to validate
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  static validateNotification(notification) {
    const errors = []

    if (!notification.title || notification.title.trim().length === 0) {
      errors.push('Title is required')
    }

    if (!notification.message || notification.message.trim().length === 0) {
      errors.push('Message is required')
    }

    if (notification.title && notification.title.length > 100) {
      errors.push('Title must be less than 100 characters')
    }

    if (notification.message && notification.message.length > 1000) {
      errors.push('Message must be less than 1000 characters')
    }

    if (!notification.audience || !this.mapAudienceToBackend[notification.audience]) {
      errors.push('Valid audience is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Format notification stats for display
   * @param {Object} stats - Stats object from backend
   * @returns {string} Formatted stats string
   */
  static formatNotificationStats(stats) {
    if (!stats) return 'No stats available'

    const { total_users, emails_sent, emails_failed } = stats
    let result = `Reached ${total_users || 0} users`
    
    if (emails_sent || emails_failed) {
      const totalEmails = (emails_sent || 0) + (emails_failed || 0)
      const successRate = totalEmails > 0 ? ((emails_sent || 0) / totalEmails * 100).toFixed(1) : 0
      result += `, ${emails_sent || 0}/${totalEmails} emails sent (${successRate}% success rate)`
    }

    return result
  }

  /**
   * Transform backend notification data to frontend format
   * @param {Array} backendNotifications - Array of backend notification objects
   * @returns {Array} Array of frontend notification objects
   */
  static transformBackendNotifications(backendNotifications) {
    return backendNotifications.map(notification => ({
      id: notification.id,
      title: notification.subject || notification.title,
      message: notification.body || notification.message,
      audience: this.mapAudienceToFrontend[notification.target_audience] || 'All',
      type: notification.notification_type || 'system_announcement',
      sender: notification.sender?.name || 'Admin',
      date: new Date(notification.created_at).toISOString().split('T')[0],
      status: this.mapStatusToFrontend(notification.status),
      readCount: notification.stats?.notifications_sent || 0,
      scheduledFor: notification.scheduled_for || null,
      emailsSent: notification.stats?.emails_sent || 0,
      emailsFailed: notification.stats?.emails_failed || 0
    }))
  }

  /**
   * Map backend status to frontend status
   * @param {string} backendStatus - Status from backend
   * @returns {string} Frontend status
   */
  static mapStatusToFrontend(backendStatus) {
    const statusMap = {
      'sent': 'Sent',
      'pending': 'Pending',
      'scheduled': 'Scheduled',
      'failed': 'Failed',
      'cancelled': 'Cancelled'
    }
    return statusMap[backendStatus] || 'Sent'
  }

  /**
   * Generate a temporary ID for local notifications
   * @returns {string} Temporary ID
   */
  static generateTempId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Calculate time ago from a date
   * @param {string} dateString - ISO date string
   * @returns {string} Human readable time ago
   */
  static timeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInMins = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMins < 1) return 'Just now'
    if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  /**
   * Debounce function for search input
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * Check if a notification is scheduled for the future
   * @param {Object} notification - Notification object
   * @returns {boolean} True if scheduled for future
   */
  static isScheduledForFuture(notification) {
    if (!notification.scheduledFor) return false
    return new Date(notification.scheduledFor) > new Date()
  }
}

  /**
   * Get notification type icon
   * @param {string} type - Notification type
   * @returns {string} Icon name or emoji
   */
  // static getNotificationTypeIcon(type) {
  //   const iconMa