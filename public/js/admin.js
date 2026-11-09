/**
 * ELROI CARE TRUST - Admin Dashboard Controller
 * Supports Vercel Blob Cloud Storage & Local File Management
 * www.elroicaretrust.in
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('adminLoginSection');
  const dashboardSection = document.getElementById('adminDashboardSection');
  const loginForm = document.getElementById('adminLoginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  // Check existing session
  const token = sessionStorage.getItem('elroi_admin_token');
  if (token) {
    showDashboard();
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUser').value;
      const password = document.getElementById('adminPass').value;

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('elroi_admin_token', data.token);
          if (loginError) loginError.style.display = 'none';
          showDashboard();
          showToast('Welcome, Administrator!', true);
        } else {
          if (loginError) {
            loginError.innerText = data.message || 'Invalid credentials';
            loginError.style.display = 'block';
          }
        }
      } catch (err) {
        // Fallback offline admin check
        if (username === 'admin' && password === 'elroicaretrust@2026') {
          sessionStorage.setItem('elroi_admin_token', 'local_token');
          showDashboard();
        } else {
          if (loginError) {
            loginError.innerText = 'Invalid username or password';
            loginError.style.display = 'block';
          }
        }
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('elroi_admin_token');
      window.location.reload();
    });
  }

  function showDashboard() {
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    setupTabs();
    loadDashboardData();
  }

  // Tab Switching
  function setupTabs() {
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const tabPanes = document.querySelectorAll('.admin-tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  // Load Dashboard Data
  async function loadDashboardData() {
    loadEnquiries();
    loadDonations();
    loadAdminGallery();
    loadStorageStatus();
  }

  // Photo Upload Handler
  const uploadForm = document.getElementById('photoUploadForm');
  const fileInput = document.getElementById('photoFile');
  const imagePreview = document.getElementById('uploadPreview');

  if (fileInput && imagePreview) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.style.display = 'none';
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
      if (!file) {
        showToast('Please select a photo to upload', false);
        return;
      }

      const submitBtn = uploadForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('title', document.getElementById('photoTitle').value);
      formData.append('category', document.getElementById('photoCategory').value);
      formData.append('description', document.getElementById('photoDesc').value);
      formData.append('date', document.getElementById('photoDate').value || new Date().toISOString().split('T')[0]);
      formData.append('passcode', 'elroicaretrust@2026');

      const accessEl = document.getElementById('photoAccess');
      if (accessEl) formData.append('access', accessEl.value);
      else formData.append('access', 'auto');

      const adminToken = sessionStorage.getItem('elroi_admin_token');
      if (adminToken) formData.append('admin_token', adminToken);

      try {
        const res = await fetch('/api/photos', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Photo uploaded successfully into gallery!', true);
          uploadForm.reset();
          if (imagePreview) imagePreview.style.display = 'none';
          loadAdminGallery();
        } else {
          showToast(data.message || 'Upload failed', false);
        }
      } catch (err) {
        showToast('Error uploading photo: ' + err.message, false);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // ==========================================
  // STORAGE & VERCEL BLOB INTEGRATION
  // ==========================================
  const adminStorageBadge = document.getElementById('adminStorageBadge');
  const adminStorageTargetText = document.getElementById('adminStorageTargetText');
  const tabVercelStatusBadge = document.getElementById('tabVercelStatusBadge');
  const vercelBlobTokenInput = document.getElementById('vercelBlobTokenInput');
  const saveVercelTokenBtn = document.getElementById('saveVercelTokenBtn');
  const testVercelConnectionBtn = document.getElementById('testVercelConnectionBtn');
  const toggleTokenVisibilityBtn = document.getElementById('toggleTokenVisibilityBtn');
  const vercelTestResult = document.getElementById('vercelTestResult');

  async function loadStorageStatus() {
    try {
      const res = await fetch('/api/storage/status');
      const data = await res.json();

      if (data.configured && data.engine === 'vercel_blob') {
        const activeHtml = '<i class="fas fa-cloud"></i> Vercel Blob Cloud Storage (Active)';
        if (adminStorageBadge) {
          adminStorageBadge.innerHTML = activeHtml;
          adminStorageBadge.style.background = '#dbeafe';
          adminStorageBadge.style.color = '#1d4ed8';
          adminStorageBadge.style.borderColor = '#93c5fd';
        }
        if (tabVercelStatusBadge) {
          tabVercelStatusBadge.innerHTML = activeHtml;
          tabVercelStatusBadge.style.background = '#dbeafe';
          tabVercelStatusBadge.style.color = '#1d4ed8';
          tabVercelStatusBadge.style.borderColor = '#93c5fd';
        }
        if (adminStorageTargetText) {
          adminStorageTargetText.innerText = 'Vercel Blob Global Cloud CDN';
        }
        if (vercelBlobTokenInput && data.token_preview && !vercelBlobTokenInput.value) {
          vercelBlobTokenInput.placeholder = data.token_preview;
        }
      } else {
        const localHtml = '<i class="fas fa-server"></i> Local Server Disk (Vercel Ready)';
        if (adminStorageBadge) {
          adminStorageBadge.innerHTML = localHtml;
          adminStorageBadge.style.background = '#ecfdf5';
          adminStorageBadge.style.color = '#047857';
          adminStorageBadge.style.borderColor = '#a7f3d0';
        }
        if (tabVercelStatusBadge) {
          tabVercelStatusBadge.innerHTML = localHtml;
          tabVercelStatusBadge.style.background = '#ecfdf5';
          tabVercelStatusBadge.style.color = '#047857';
          tabVercelStatusBadge.style.borderColor = '#a7f3d0';
        }
        if (adminStorageTargetText) {
          adminStorageTargetText.innerText = 'Local Server Disk (public/uploads/)';
        }
      }
    } catch (e) { }
  }

  // Toggle Token Visibility
  if (toggleTokenVisibilityBtn && vercelBlobTokenInput) {
    toggleTokenVisibilityBtn.addEventListener('click', () => {
      const isPass = vercelBlobTokenInput.type === 'password';
      vercelBlobTokenInput.type = isPass ? 'text' : 'password';
      toggleTokenVisibilityBtn.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
  }

  // Save Vercel Token
  if (saveVercelTokenBtn) {
    saveVercelTokenBtn.addEventListener('click', async () => {
      const tokenVal = vercelBlobTokenInput ? vercelBlobTokenInput.value.trim() : '';
      if (!tokenVal) {
        showToast('Please enter your Vercel BLOB_READ_WRITE_TOKEN', false);
        return;
      }

      saveVercelTokenBtn.disabled = true;
      saveVercelTokenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      try {
        const res = await fetch('/api/storage/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vercel_blob_token: tokenVal, storage_mode: 'vercel_blob' })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Vercel Blob Storage Token saved successfully!', true);
          loadStorageStatus();
        } else {
          showToast(data.message || 'Failed to save token', false);
        }
      } catch (err) {
        showToast('Error saving configuration: ' + err.message, false);
      } finally {
        saveVercelTokenBtn.disabled = false;
        saveVercelTokenBtn.innerHTML = '<i class="fas fa-save"></i> Save Storage Token';
      }
    });
  }

  // Test Vercel Connection
  if (testVercelConnectionBtn) {
    testVercelConnectionBtn.addEventListener('click', async () => {
      testVercelConnectionBtn.disabled = true;
      testVercelConnectionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing Connection...';
      if (vercelTestResult) vercelTestResult.style.display = 'none';

      try {
        const res = await fetch('/api/storage/test', { method: 'POST' });
        const data = await res.json();

        if (vercelTestResult) {
          vercelTestResult.style.display = 'block';
          if (data.success) {
            vercelTestResult.style.color = '#047857';
            vercelTestResult.innerHTML = `<strong><i class="fas fa-check-circle"></i> Connection Verified:</strong> ${data.message} <br><small><a href="${data.url}" target="_blank" style="color: #0284c7;">View test blob file &rarr;</a></small>`;
            showToast('Vercel Blob connection active & verified!', true);
            loadStorageStatus();
          } else {
            vercelTestResult.style.color = '#b91c1c';
            vercelTestResult.innerHTML = `<strong><i class="fas fa-exclamation-triangle"></i> Verification Failed:</strong> ${data.message}`;
            showToast('Vercel connection failed', false);
          }
        }
      } catch (err) {
        if (vercelTestResult) {
          vercelTestResult.style.display = 'block';
          vercelTestResult.style.color = '#b91c1c';
          vercelTestResult.innerHTML = `<strong><i class="fas fa-exclamation-triangle"></i> Error:</strong> ${err.message}`;
        }
        showToast('Error testing connection', false);
      } finally {
        testVercelConnectionBtn.disabled = false;
        testVercelConnectionBtn.innerHTML = '<i class="fas fa-vial"></i> Test Vercel Connection';
      }
    });
  }

  // Load Enquiries
  async function loadEnquiries() {
    const list = document.getElementById('adminEnquiriesList');
    if (!list) return;

    try {
      const res = await fetch('/api/enquiries');
      const data = await res.json();
      if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No enquiries received yet.</td></tr>';
        return;
      }

      list.innerHTML = data.map(item => `
        <tr>
          <td><strong>${item.id}</strong></td>
          <td>${item.date}</td>
          <td>${item.name}</td>
          <td><a href="tel:${item.phone}">${item.phone}</a><br><small>${item.email || ''}</small></td>
          <td><strong>${item.subject}</strong><br><small>${item.message}</small></td>
          <td><span class="badge" style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:12px; font-size:0.8rem;">${item.status}</span></td>
        </tr>
      `).join('');
    } catch (e) {
      list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Could not load enquiries.</td></tr>';
    }
  }

  // Load Donations
  async function loadDonations() {
    const list = document.getElementById('adminDonationsList');
    if (!list) return;

    try {
      const res = await fetch('/api/donations');
      const data = await res.json();
      if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No donations recorded yet.</td></tr>';
        return;
      }

      list.innerHTML = data.map(item => `
        <tr>
          <td><strong>${item.id}</strong></td>
          <td>${item.date}</td>
          <td>${item.donor_name}<br><small>PAN: ${item.pan || 'N/A'}</small></td>
          <td><strong style="color: #0b2545;">₹ ${Number(item.amount).toLocaleString('en-IN')}</strong></td>
          <td><small>${item.payment_mode}</small><br><small style="color:#64748b;">Ref: ${item.txn_ref}</small></td>
          <td><small>${item.cause}</small></td>
          <td>
            <a href="/receipt.html?id=${item.id}" target="_blank" class="btn btn-sm btn-outline" style="padding:4px 8px; font-size:0.75rem;">
              <i class="fas fa-receipt"></i> View 80G
            </a>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      list.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Could not load donation records.</td></tr>';
    }
  }

  // Load Admin Gallery with Photo Delete Option for ALL Photos
  async function loadAdminGallery() {
    const list = document.getElementById('adminGalleryGrid');
    const countBadge = document.getElementById('adminGalleryCountBadge');
    if (!list) return;

    try {
      const res = await fetch('/api/photos');
      const photos = await res.json();

      if (countBadge) {
        countBadge.innerHTML = `<i class="fas fa-camera"></i> ${photos.length} Active Photos`;
      }

      if (!photos || photos.length === 0) {
        list.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px;">
            <i class="fas fa-images" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
            <p style="font-size: 1rem; font-weight: 600; margin-bottom: 4px;">No photographs in gallery</p>
            <p style="font-size: 0.85rem; margin: 0;">Use the "Upload New Photos" tab above to add photos.</p>
          </div>
        `;
        return;
      }

      list.innerHTML = photos.map(p => {
        const photoKey = p.filename || p.id;
        const deleteBtn = `
          <button type="button" class="btn-delete-photo" data-id="${encodeURIComponent(photoKey)}" title="Delete this photo from gallery" style="border: 1px solid #fca5a5; background: #fef2f2; color: #b91c1c; font-size: 0.78rem; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s;">
            <i class="fas fa-trash-alt"></i> Delete
          </button>
        `;

        const storageIndicator = p.storage === 'vercel_blob'
          ? `<span style="position: absolute; top: 8px; right: 8px; background: rgba(15, 23, 42, 0.85); color: #38bdf8; font-size: 0.7rem; padding: 3px 8px; border-radius: 4px; font-weight: 600;"><i class="fas fa-cloud"></i> Cloud</span>`
          : '';

        return `
          <div class="admin-photo-card" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); position: relative; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;">
            ${storageIndicator}
            <div style="width: 100%; height: 160px; background: #f1f5f9; overflow: hidden;">
              <img src="${p.url}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='/logo.jpg';">
            </div>
            <div style="padding: 12px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
              <div>
                <p style="font-weight: 700; font-size: 0.88rem; color: #0b2545; margin: 0 0 4px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${p.title}">${p.title}</p>
                <span style="font-size: 0.72rem; background: #f1f5f9; color: #475569; padding: 2px 7px; border-radius: 4px; display: inline-block; margin-bottom: 8px; font-weight: 600;">${p.category}</span>
              </div>
              <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 8px;">
                <small style="color: #64748b; font-size: 0.75rem;"><i class="far fa-calendar-alt"></i> ${p.date || 'Active'}</small>
                ${deleteBtn}
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Attach Delete Handlers
      list.querySelectorAll('.btn-delete-photo').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const photoId = btn.getAttribute('data-id');
          if (!confirm('Are you sure you want to delete this photo from the website gallery? This cannot be undone.')) {
            return;
          }

          const origContent = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

          try {
            const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
              showToast('Photo deleted from gallery successfully!', true);
              loadAdminGallery();
            } else {
              showToast(data.message || 'Could not delete photo', false);
              btn.disabled = false;
              btn.innerHTML = origContent;
            }
          } catch (err) {
            showToast('Delete error: ' + err.message, false);
            btn.disabled = false;
            btn.innerHTML = origContent;
          }
        });
      });
    } catch (e) {
      if (list) list.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #b91c1c;">Could not load photos. Please refresh.</div>';
    }
  }

  // Refresh gallery button listener
  const refreshGalleryBtn = document.getElementById('refreshAdminGalleryBtn');
  if (refreshGalleryBtn) {
    refreshGalleryBtn.addEventListener('click', () => {
      loadAdminGallery();
      showToast('Photo gallery refreshed', true);
    });
  }
});
