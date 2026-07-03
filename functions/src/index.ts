import * as functions from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();

const TELEGRAM_BOT_TOKEN = '8984634848:AAHb13iSKVz5cdnekBnvdEJtXjYOpPnfuy8';
const TELEGRAM_CHAT_ID = '@mkclientsnotif';
const ADMIN_EMAIL = 'admin@mkservice.com';

const db = admin.firestore();

const getUserEmail = async (userId: string): Promise<string> => {
  try {
    const snap = await db.collection('users').doc(userId).get();
    return snap.data()?.email || userId;
  } catch {
    return userId;
  }
};

const sendTelegram = async (message: string) => {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' })
    });
  } catch (err) {
    console.error('Telegram send failed:', err);
  }
};

const maskCard = (num: string): string => {
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';
  return `**** **** **** ${cleaned.slice(-4)}`;
};

const fieldLabels: Record<string, string> = {
  last_name: 'Nom', first_name: 'Prénom', phone_number: 'Tél',
  dob: 'DN', passport_number: 'Passeport', issue_date: 'Délivrance',
  expiry_date: 'Expiration', place_of_issue: 'Lieu', category: 'Catégorie',
  appointment_date: 'RDV', previous_visa_number: 'Visa préc.'
};

export const onClientUpdated = functions.onDocumentUpdated('clients/{docId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;

  const userId = after.user_id;
  if (!userId) return;
  const agentEmail = await getUserEmail(userId);
  if (agentEmail === ADMIN_EMAIL) return;

  const changes: string[] = [];
  for (const [key, label] of Object.entries(fieldLabels)) {
    const oldVal = (before[key] || '').toString();
    const newVal = (after[key] || '').toString();
    if (oldVal !== newVal) changes.push(`<b>${label}:</b> ${oldVal} → ${newVal}`);
  }

  const oldPay = before.payment || {};
  const newPay = after.payment || {};
  if ((oldPay.cardNumber || '') !== (newPay.cardNumber || '')) {
    changes.push(`<b>Carte:</b> ${maskCard(oldPay.cardNumber || '')} → ${maskCard(newPay.cardNumber || '')}`);
  }
  if ((oldPay.paymentStatus || '') !== (newPay.paymentStatus || '')) {
    changes.push(`<b>Statut:</b> ${oldPay.paymentStatus || '-'} → ${newPay.paymentStatus}`);
  }

  if (changes.length === 0) return;

  const clientName = `${after.last_name || ''} ${after.first_name || ''}`.trim();
  const msg = `<b>✏️ MODIFICATION</b>\n<b>Agence:</b> ${agentEmail}\n<b>Client:</b> ${clientName} (${after.passport_number || ''})\n${changes.join('\n')}`;
  await sendTelegram(msg);
});

export const onClientDeleted = functions.onDocumentDeleted('clients/{docId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const userId = data.user_id;
  if (!userId) return;
  const agentEmail = await getUserEmail(userId);
  if (agentEmail === ADMIN_EMAIL) return;

  const clientName = `${data.last_name || ''} ${data.first_name || ''}`.trim();
  const payStatus = data.payment?.paymentStatus || '-';
  const msg = `<b>🗑️ SUPPRESSION</b>\n<b>Agence:</b> ${agentEmail}\n<b>Client:</b> ${clientName} (${data.passport_number || ''})\n<b>Statut:</b> ${payStatus}`;
  await sendTelegram(msg);
});
