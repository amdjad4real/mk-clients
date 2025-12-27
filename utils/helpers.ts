
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

export const formatDateInput = (value: string): string => {
  const v = value.replace(/[^0-9]/gi, '').substring(0, 8);
  if (v.length > 4) {
    return `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4, 8)}`;
  } else if (v.length > 2) {
    return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
  }
  return v;
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
  const [m, d, y] = dateStr.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
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
  
  // Create date object from YYYY-MM-DD
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getWeekdayIndex = (dateStr: string): number => {
  if (!dateStr) return 0;
  return new Date(dateStr).getDay();
};

export const convertSlashToDash = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('/')) return dateStr;
  const [m, d, y] = dateStr.split('/');
  return `${y}-${m}-${d}`;
};

export const convertDashToSlash = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}/${y}`;
};
