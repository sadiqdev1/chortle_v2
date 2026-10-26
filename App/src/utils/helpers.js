export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

export function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function truncateText(text = "", maxLength = 100) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Extracts a human-friendly error message from any thrown value.
 * Handles Axios errors, custom network errors, and plain Error objects.
 */
export function normalizeError(error) {
  // Custom network error (set by our interceptor)
  if (error?.isNetworkError) {
    return error.message || "Network error. Check your connection.";
  }

  // Rate limit
  if (error?.isRateLimited) {
    return "You're doing that too fast. Wait a moment and try again.";
  }

  // Server error
  if (error?.isServerError) {
    return error.message || "Server error. Try again shortly.";
  }

  // Laravel validation response
  const responseData = error?.response?.data;
  if (responseData?.errors) {
    // Flatten all field errors into a single readable string
    const fieldErrors = Object.values(responseData.errors).flat();
    if (fieldErrors.length > 0) return fieldErrors[0];
  }

  return (
    responseData?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

/**
 * Formats a count number to a short human-readable string.
 * e.g. 1234 → "1.2k", 1500000 → "1.5M"
 */
export function fmtCount(n) {
  if (n == null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
