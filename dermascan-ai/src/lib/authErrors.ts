export function getFriendlyError(error: any): string {
  const code: string = error?.code || error?.message || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Invalid email or password. Please check your credentials and try again.';
  if (code.includes('email-already-in-use'))
    return 'This email is already registered. Please use a different email or log in.';
  if (code.includes('weak-password'))
    return 'Password is too weak. Please use at least 8 characters.';
  if (code.includes('invalid-email'))
    return 'Please enter a valid email address.';
  if (code.includes('too-many-requests'))
    return 'Too many failed attempts. Please wait a few minutes and try again.';
  if (code.includes('network-request-failed'))
    return 'Network error. Please check your internet connection.';
  if (code.includes('user-disabled'))
    return 'This account has been disabled. Please contact support.';
  if (code.includes('expired-action-code') || code.includes('invalid-action-code'))
    return 'This reset link has expired or already been used. Please request a new one.';
  return error?.message || 'Something went wrong. Please try again.';
}
