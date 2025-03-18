import { format } from "date-fns"

/**
 * Formats a date string with the correct day of week
 * @param dateString - Date string in ISO format (YYYY-MM-DD)
 * @returns Formatted date string with correct day of week
 */
export function formatDateWithDay(dateString: string): string {
  const date = new Date(dateString)

  if (isDateToday(date)) {
    return "Today"
  }

  if (isDateTomorrow(date)) {
    return "Tomorrow"
  }

  // Ensure we're using the correct day of week
  return format(date, "EEEE, MMMM d, yyyy")
}

/**
 * Formats a date and time for display in event cards
 * @param dateString - Date string in ISO format
 * @returns Formatted date and time string
 */
export function formatEventDateTime(dateString: string): string {
  const date = new Date(dateString)
  return format(date, "MMM d, h:mm a") // e.g. "Mar 17, 7:30 PM"
}

/**
 * Groups events by date and ensures correct date display
 * @param events - Array of events with commence_time property
 * @returns Object with dates as keys and arrays of events as values
 */
export function groupEventsByDate(events: any[]): Record<string, any[]> {
  return events.reduce(
    (acc, event) => {
      // Ensure we're using the correct date
      const eventDate = new Date(event.commence_time)
      const dateKey = format(eventDate, "yyyy-MM-dd")

      if (!acc[dateKey]) {
        acc[dateKey] = []
      }

      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, any[]>,
  )
}

/**
 * Checks if a date is today by comparing year, month, and day
 * @param date - Date to check
 * @returns Boolean indicating if the date is today
 */
export function isDateToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

/**
 * Checks if a date is tomorrow by comparing year, month, and day
 * @param date - Date to check
 * @returns Boolean indicating if the date is tomorrow
 */
export function isDateTomorrow(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  )
}

