// Small helper functions shared by several components.

// "Dr. Priya Mehta" -> "PM"
export function initials(name) {
  return name
    .replace('Dr. ', '')
    .replace('Ms. ', '')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}