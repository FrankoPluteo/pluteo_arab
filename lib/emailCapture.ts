/**
 * Newsletter signup shared by the EmailModal popup and the /jesen signup line.
 * Both post to /api/emails, so they get the same validation, EmailCapture row,
 * Resend audience sync and duplicate handling.
 */

// /api/emails rejects anything that fails this, after trimming and lowercasing.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Posts the address and sets the 'email_captured' flag that keeps the popup from
 * showing again. Returns whether the server accepted the address.
 */
export async function captureEmail(email: string): Promise<boolean> {
  const res = await fetch('/api/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  localStorage.setItem('email_captured', email);
  return res.ok;
}
