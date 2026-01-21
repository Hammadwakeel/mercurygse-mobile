// components/utils.js

export const cls = (...c) => c.filter(Boolean).join(" ");

export function timeAgo(date) {
  // 1. Validate date input
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Check if the date is valid. If not, return a placeholder.
  if (!d || isNaN(d.getTime())) return "just now";

  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);

  // 2. Manual Interval Calculation (Works on all RN devices)
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  
  interval = seconds / 604800; // Weeks
  if (interval > 1) {
      return Math.floor(interval) + " weeks ago";
  }

  interval = seconds / 86400; // Days
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  
  interval = seconds / 3600; // Hours
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  
  interval = seconds / 60; // Minutes
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  
  return "just now";
}

export const makeId = (p) => `${p}${Math.random().toString(36).slice(2, 10)}`;