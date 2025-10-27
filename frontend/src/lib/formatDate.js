/**
 * Format ISO timestamp to readable format
 * @param {string} timestamp - ISO 8601 timestamp (e.g., "2025-10-21T04:09:17.686000+00:00")
 * @param {string} format - Format type: "full", "short", "relative"
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp, format = "full") {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return timestamp; // Return original if invalid
  }

  switch (format) {
    case "full":
      // Oct 21, 2025 at 4:09 AM
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

    case "short":
      // Oct 21, 2025
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    case "relative":
      // "2 hours ago", "3 days ago", etc.
      return getRelativeTime(date);

    case "time":
      // 4:09 AM
      return date.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

    default:
      return date.toLocaleString();
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
function getRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}
