/**
 * Normalizes Indian & general phone numbers to a standard 10-digit format for strict duplicate checks.
 * Examples:
 * "+91 98765 43210" -> "9876543210"
 * "09876543210"      -> "9876543210"
 * "919876543210"     -> "9876543210"
 * "98765-43210"      -> "9876543210"
 */
export function normalizePhoneNumber(rawInput: string): string {
  if (!rawInput) return "";

  // Remove all non-numeric characters
  const digits = rawInput.replace(/\D/g, "");

  // If 12 digits starting with 91 (Indian country code)
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  // If 11 digits starting with 0
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  // If 10 digits, return directly
  if (digits.length === 10) {
    return digits;
  }

  // Fallback for other formats
  return digits;
}

/**
 * Formats a normalized 10-digit mobile number for UI display.
 * e.g., "9876543210" -> "+91 98765 43210"
 */
export function formatPhoneNumber(mobile: string): string {
  const norm = normalizePhoneNumber(mobile);
  if (norm.length === 10) {
    return `+91 ${norm.slice(0, 5)} ${norm.slice(5)}`;
  }
  return mobile;
}
