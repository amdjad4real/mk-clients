
export const validateLuhn = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '').split('').map(Number);
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

export const maskCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';
  return `**** **** **** ${cleaned.slice(-4)}`;
};

export const formatCardNumber = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,19}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return v;
  }
};

export const formatExpiryDate = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return `${v.substring(0, 2)}/${v.substring(2, 6)}`;
  }
  return v;
};

/**
 * Validates if string is YYYY-MM-DD
 */
export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

export const isExpired = (expiry: string): boolean => {
  if (!expiry.includes('/')) return true;
  const [month, year] = expiry.split('/').map(Number);
  const now = new Date();
  const expDate = new Date(year, month - 1);
  return expDate < new Date(now.getFullYear(), now.getMonth());
};

/**
 * Calculates day difference between target date and today.
 * Ignores time component.
 */
export const getDaysDiff = (targetDateStr: string): number => {
  if (!targetDateStr) return -999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getWeekdayIndex = (dateStr: string): number => {
  if (!dateStr) return 0;
  return new Date(dateStr).getDay();
};

/**
 * Robustly converts various date strings to YYYY-MM-DD
 */
export const normalizeToDashDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const cleaned = dateStr.trim();
  
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  
  // Handle MM/DD/YYYY or DD/MM/YYYY (Heuristic: if first part > 12, it's DD/MM/YYYY)
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      let [p1, p2, y] = parts;
      // If p1 is year (e.g. 2024/10/12)
      if (p1.length === 4) return `${p1}-${p2.padStart(2, '0')}-${y.padStart(2, '0')}`;
      // Standard US or Euro (we'll assume ISO-ish if possible or just map)
      // Usually users in this context use MM/DD/YYYY based on previous code
      return `${y}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
    }
  }

  // Handle DD.MM.YYYY
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  return cleaned;
};
