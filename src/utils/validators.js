export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isValidPassword = (pw) => pw.length >= 8

export const isValidPhone = (phone) =>
  /^01[0-9]-\d{3,4}-\d{4}$/.test(phone)
