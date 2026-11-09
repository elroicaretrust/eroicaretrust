/**
 * ELROI CARE TRUST - Donation & Payment System
 * www.elroicaretrust.in
 */

const UPI_ID = 'imman.pk80@okicici';
const PAYEE_NAME = 'Immanuel Nesakumar Official';
const OFFICIAL_QR_SRC = '/elroi-upi-qr.jpg';

document.addEventListener('DOMContentLoaded', () => {
  let currentAmount = 1500;
  const qrImage = document.getElementById('upiQrImage');
  const customAmountInput = document.getElementById('customAmount');
  const amountPills = document.querySelectorAll('.amount-pill');
  const payUpiBtn = document.getElementById('payUpiBtn');
  const donationForm = document.getElementById('donationForm');

  // Update QR Code & UPI Link
  function updateQr(amount) {
    currentAmount = amount;
    const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amount}&cu=INR&tn=ELROI%20CARE%20TRUST%20Donation`;
    
    // Default to the official verified Google Pay QR code provided by founder
    if (qrImage) {
      qrImage.src = OFFICIAL_QR_SRC;
    }

    if (payUpiBtn) {
      payUpiBtn.href = upiUri;
      payUpiBtn.innerText = `Pay ₹${amount.toLocaleString('en-IN')} via UPI App`;
    }
  }

  // Amount Presets
  amountPills.forEach(pill => {
    pill.addEventListener('click', () => {
      amountPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const val = parseInt(pill.getAttribute('data-amount'), 10);
      if (customAmountInput) customAmountInput.value = val;
      updateQr(val);
    });
  });

  // Custom Amount Input
  if (customAmountInput) {
    customAmountInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val && val > 0) {
        amountPills.forEach(p => p.classList.remove('active'));
        updateQr(val);
      }
    });
  }

  // Initial QR Load
  updateQr(currentAmount);

  // Donation Submission Form (Record payment & generate 80G Receipt)
  if (donationForm) {
    donationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = donationForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Receipt...';

      const formData = {
        donor_name: document.getElementById('donorName').value,
        phone: document.getElementById('donorPhone').value,
        email: document.getElementById('donorEmail').value,
        pan: document.getElementById('donorPan').value,
        amount: document.getElementById('donorAmount').value,
        txn_ref: document.getElementById('donorTxnRef').value,
        date: document.getElementById('donorDate').value,
        cause: document.getElementById('donorCause').value,
        address: document.getElementById('donorAddress').value
      };

      try {
        const res = await fetch('/api/donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();
        if (data.success && data.receipt) {
          showToast('Donation recorded! Opening your official 80G Tax Receipt...', true);
          setTimeout(() => {
            window.location.href = `/receipt.html?id=${data.receipt.id}`;
          }, 1200);
        } else {
          showToast(data.message || 'Failed to submit donation details', false);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      } catch (err) {
        // If running in static file mode (without node server active), generate client-side receipt
        const fallbackReceiptId = 'ECT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        localStorage.setItem('temp_receipt', JSON.stringify({
          id: fallbackReceiptId,
          ...formData,
          amount: parseFloat(formData.amount),
          date: formData.date || new Date().toISOString().split('T')[0]
        }));
        showToast('Receipt generated successfully!', true);
        setTimeout(() => {
          window.location.href = `/receipt.html?id=${fallbackReceiptId}&local=true`;
        }, 1000);
      }
    });
  }
});

