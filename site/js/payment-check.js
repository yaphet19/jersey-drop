// Cross-checks what a customer claimed against the Telebirr SMS the shop got
// from Ethio Telecom. The SMS is the trustworthy side: it arrives from Ethio
// Telecom, not from the customer, so anything that disagrees with it loses.
//
// Nothing here ever reports a match it isn't sure about — a field it cannot
// read comes back 'unknown', never 'match', so a parsing gap can't be mistaken
// for a verified payment.

export function normalizeAmount(text) {
  if (!text) return null;
  const match = String(text).replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Math.round(parseFloat(match[0])) : null;
}

export function normalizeName(text) {
  if (!text) return null;
  return String(text).trim().toLowerCase().replace(/\s+/g, ' ') || null;
}

export function normalizeTxn(text) {
  if (!text) return null;
  return String(text).trim().toUpperCase().replace(/\s+/g, '') || null;
}

// Reads the order message this site generates, so the shop can paste the
// WhatsApp/Telegram text straight in.
export function parseOrderMessage(text) {
  const grab = (re) => {
    const m = String(text || '').match(re);
    return m ? m[1].trim() : null;
  };
  return {
    // Anchored to the line start so "Subtotal:" can't be mistaken for the total.
    total: normalizeAmount(grab(/^TOTAL(?:\s*\(before delivery\))?:\s*([\d,.]+)\s*ETB/im)),
    payerName: grab(/Paid by:\s*(.+)/i),
    payerPhone: grab(/Telebirr number:\s*(.+)/i),
    transactionNumber: grab(/Transaction number:\s*(\S+)/i),
  };
}

// Telebirr's SMS wording varies, so each field is matched independently and
// anything unreadable is left null rather than guessed at.
export function parseTelebirrSms(text) {
  const body = String(text || '');
  const grab = (re) => {
    const m = body.match(re);
    return m ? m[1].trim() : null;
  };
  return {
    amount: normalizeAmount(
      grab(/(?:ETB|Birr)\s*([\d,]+(?:\.\d+)?)/i) || grab(/([\d,]+(?:\.\d+)?)\s*(?:ETB|Birr)/i)
    ),
    payerName: grab(/from\s+([A-Za-z][A-Za-z .'-]{1,60}?)(?=\s*[,(\d]|\s+(?:on|with|your)\b|\.|$)/i),
    transactionNumber: grab(/(?:transaction|txn|reference|ref)(?:\s*(?:number|no\.?|id))?\s*(?:is|:)?\s*([A-Za-z0-9]{6,})/i),
  };
}

function compare(label, expected, found) {
  if (expected === null || expected === undefined || found === null || found === undefined) {
    return { label, status: 'unknown', expected, found };
  }
  return { label, status: expected === found ? 'match' : 'mismatch', expected, found };
}

export function crossCheck(order, sms) {
  const checks = [
    compare('Amount', order.total, sms.amount),
    compare('Transaction number', normalizeTxn(order.transactionNumber), normalizeTxn(sms.transactionNumber)),
    compare('Payer name', normalizeName(order.payerName), normalizeName(sms.payerName)),
  ];

  let verdict = 'match';
  if (checks.some((c) => c.status === 'mismatch')) verdict = 'mismatch';
  else if (checks.some((c) => c.status === 'unknown')) verdict = 'incomplete';

  return { checks, verdict };
}
