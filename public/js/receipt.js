/**
 * ELROI CARE TRUST - 80G Tax Receipt Engine
 * www.elroicaretrust.in
 */

function numberToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  num = parseInt(num, 10);
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  return 'Rupees ' + inWords(num).trim() + ' Only';
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const receiptId = urlParams.get('id');
  const isLocal = urlParams.get('local') === 'true';

  let receiptData = null;

  if (receiptId) {
    if (isLocal) {
      try {
        const raw = localStorage.getItem('temp_receipt');
        if (raw) receiptData = JSON.parse(raw);
      } catch (e) { }
    }

    if (!receiptData) {
      try {
        const res = await fetch(`/api/receipt/${encodeURIComponent(receiptId)}`);
        if (res.ok) {
          receiptData = await res.json();
        }
      } catch (err) {
        console.warn('Could not fetch receipt from server:', err);
      }
    }
  }

  // Fallback demo sample receipt if no ID provided
  if (!receiptData) {
    receiptData = {
      id: receiptId || 'ECT-2026-1042',
      donor_name: 'Kind Donor / Well Wisher',
      pan: 'ABCDE1234F',
      email: 'donor@example.com',
      phone: '+91 98400 12345',
      address: 'Chennai, Tamil Nadu, India',
      amount: 5000,
      amount_words: 'Rupees Five Thousand Only',
      payment_mode: 'UPI / Bank Transfer',
      txn_ref: '4110607232042',
      date: new Date().toISOString().split('T')[0],
      cause: 'Monthly Grocery Provisions & Welfare for Blind and Widows'
    };
  }

  // Populate HTML elements
  setText('rReceiptNo', receiptData.id);
  setText('rDate', receiptData.date);
  setText('rDonorName', receiptData.donor_name);
  setText('rDonorPan', receiptData.pan || 'N/A (Not Provided)');
  setText('rDonorPhone', receiptData.phone || 'N/A');
  setText('rDonorEmail', receiptData.email || 'N/A');
  setText('rDonorAddress', receiptData.address || 'India');
  setText('rAmountNum', '₹ ' + (receiptData.amount || 0).toLocaleString('en-IN') + '/-');
  setText('rAmountWords', receiptData.amount_words || numberToWords(receiptData.amount));
  setText('rPaymentMode', receiptData.payment_mode || 'UPI / Bank Transfer');
  setText('rTxnRef', receiptData.txn_ref || 'VERIFIED');
  setText('rCause', receiptData.cause || 'General Charitable Corpus Fund');

  const printBtn = document.getElementById('printReceiptBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

