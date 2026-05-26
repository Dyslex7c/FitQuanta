const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes': string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify a Cloudflare Turnstile token server-side.
 * @param token  The token received from the client-side Turnstile widget.
 * @param ip     Optional remote IP address for additional validation.
 * @returns      An object with `success` and optional `errorCodes`.
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string | null,
): Promise<{ success: boolean; errorCodes: string[] }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error('[TURNSTILE] TURNSTILE_SECRET_KEY is not set in environment variables');
    return { success: false, errorCodes: ['missing-secret-key'] };
  }

  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  try {
    const body: Record<string, string> = {
      secret: secretKey,
      response: token,
    };
    if (ip) {
      body.remoteip = ip;
    }

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data: TurnstileVerifyResponse = await res.json();

    return {
      success: data.success,
      errorCodes: data['error-codes'] ?? [],
    };
  } catch (error) {
    console.error('[TURNSTILE] Verification request failed:', error);
    return { success: false, errorCodes: ['internal-error'] };
  }
}
