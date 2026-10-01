// SMS Go Gateway Integration Service for Sri Lanka (smsgo.lk)
// Sandbox API Key: sg_test_fe28512bacb07b152babeaf139659d7d

const SMSGO_BASE_URL = 'https://api.smsgo.lk';
const DEFAULT_API_KEY = process.env.SMSGO_API_KEY || 'sg_live_4d7529fbbcd1cef109cf20aacadec5c3';
const DEFAULT_SENDER_MASK = process.env.SMSGO_SENDER_MASK || 'LaundroPOS';

export interface SMSGatewayStatus {
  online: boolean;
  provider: string;
  isSandbox: boolean;
  apiKeyPreview: string;
  balance: number | null;
  currency: string;
  masks: string[];
  error?: string;
}

export interface SendSMSResult {
  success: boolean;
  provider: string;
  phone: string;
  message: string;
  reason?: 'SUCCESS' | 'MASK_REQUIRED' | 'API_ERROR' | 'NETWORK_ERROR';
  error?: string;
  response?: any;
}

/**
 * Normalizes phone numbers to Sri Lankan standard format (e.g., 94771234567)
 * Handles inputs like '0771234567', '+94771234567', '771234567', '94771234567'
 * Also supports sandbox test phone numbers like '94770000000'
 */
export function normalizeSriLankanPhone(phone: string): string {
  if (!phone) return '';
  // Remove non-digit characters except leading +
  let clean = phone.trim().replace(/[^0-9+]/g, '');
  if (clean.startsWith('+')) {
    clean = clean.slice(1);
  }
  if (clean.startsWith('0')) {
    clean = '94' + clean.slice(1);
  } else if (clean.length === 9 && (clean.startsWith('7') || clean.startsWith('1') || clean.startsWith('2') || clean.startsWith('3') || clean.startsWith('4') || clean.startsWith('5') || clean.startsWith('6') || clean.startsWith('8') || clean.startsWith('9'))) {
    clean = '94' + clean;
  }
  return clean;
}

/**
 * Queries SMSGo account balance and approved sender masks
 */
export async function getSMSGoStatus(apiKey: string = DEFAULT_API_KEY): Promise<SMSGatewayStatus> {
  const isSandbox = apiKey.startsWith('sg_test_');
  const apiKeyPreview = apiKey.length > 10 ? `${apiKey.slice(0, 11)}...${apiKey.slice(-6)}` : apiKey;

  try {
    const [balanceRes, masksRes] = await Promise.all([
      fetch(`${SMSGO_BASE_URL}/api/v1/account/balance`, {
        method: 'GET',
        headers: { 'X-API-Key': apiKey }
      }),
      fetch(`${SMSGO_BASE_URL}/api/v1/account/masks`, {
        method: 'GET',
        headers: { 'X-API-Key': apiKey }
      })
    ]);

    let balance: number | null = null;
    let currency = 'LKR';
    let masks: string[] = [];

    if (balanceRes.ok) {
      const bData = await balanceRes.json();
      if (bData && bData.data) {
        balance = bData.data.balance;
        currency = bData.data.currency || 'LKR';
      }
    }

    if (masksRes.ok) {
      const mData = await masksRes.json();
      if (mData && Array.isArray(mData.data)) {
        masks = mData.data.map((m: any) => (typeof m === 'string' ? m : m.name || m.mask || String(m)));
      }
    }

    return {
      online: true,
      provider: 'SMSGo.lk Gateway',
      isSandbox,
      apiKeyPreview,
      balance,
      currency,
      masks
    };
  } catch (err: any) {
    return {
      online: false,
      provider: 'SMSGo.lk Gateway',
      isSandbox,
      apiKeyPreview,
      balance: null,
      currency: 'LKR',
      masks: [],
      error: err.message || 'Could not connect to SMSGo.lk API'
    };
  }
}

/**
 * Sends an SMS message to a customer via the SMSGo gateway
 */
export async function sendSMSGoMessage(params: {
  to: string;
  message: string;
  mask?: string;
  campaignName?: string;
  apiKey?: string;
}): Promise<SendSMSResult> {
  const apiKey = params.apiKey || DEFAULT_API_KEY;
  const normalizedPhone = normalizeSriLankanPhone(params.to);

  if (!normalizedPhone) {
    return {
      success: false,
      provider: 'SMSGo.lk',
      phone: params.to,
      message: params.message,
      reason: 'API_ERROR',
      error: 'Invalid recipient phone number format'
    };
  }

  // Determine if a sender mask is available or specified
  let maskToUse = params.mask || DEFAULT_SENDER_MASK || 'LaundroPOS';
  if (maskToUse.toLowerCase().includes('wash')) {
    maskToUse = 'LaundroPOS';
  }

  const payload: any = {
    to: normalizedPhone,
    message: params.message,
    campaignName: params.campaignName || 'Supervisor_Scan'
  };

  if (maskToUse) {
    payload.mask = maskToUse;
  }

  try {
    const response = await fetch(`${SMSGO_BASE_URL}/api/v1/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    // Auto-retry if SMSGo indicates another approved mask is available
    if (!response.ok && data?.message && data.message.includes('Available masks:')) {
      const match = data.message.match(/Available masks:\s*([A-Za-z0-9_-]+)/);
      if (match && match[1] && match[1] !== maskToUse) {
        return sendSMSGoMessage({
          ...params,
          mask: match[1]
        });
      }
    }

    if (response.ok && (data.success !== false)) {
      return {
        success: true,
        provider: 'SMSGo.lk',
        phone: normalizedPhone,
        message: params.message,
        reason: 'SUCCESS',
        response: data
      };
    }

    // Handle known error cases
    const errorMessage = data.message || data.error || 'Failed to dispatch SMS';
    const isMaskError = errorMessage.toLowerCase().includes('mask') || 
                        errorMessage.toLowerCase().includes('sender');

    return {
      success: false,
      provider: 'SMSGo.lk',
      phone: normalizedPhone,
      message: params.message,
      reason: isMaskError ? 'MASK_REQUIRED' : 'API_ERROR',
      error: isMaskError 
        ? `SMSGo Account Notice: No approved sender mask found. Please add & approve a Sender Mask (e.g., 'WashHub' or 'Cycleon') in your smsgo.lk dashboard under Settings > Sender Masks.`
        : errorMessage,
      response: data
    };
  } catch (err: any) {
    return {
      success: false,
      provider: 'SMSGo.lk',
      phone: normalizedPhone,
      message: params.message,
      reason: 'NETWORK_ERROR',
      error: err.message || 'Network error reaching api.smsgo.lk',
      response: null
    };
  }
}
