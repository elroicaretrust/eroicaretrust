/**
 * ELROI CARE TRUST - Gallery Engine & Lightbox Viewer
 * www.elroicaretrust.in
 */

let allPhotos = [];
let currentFiltered = [];
let currentLightboxIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  const galleryGrid = document.getElementById('galleryGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxDate = document.getElementById('lightboxDate');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  // Load photos
  async function loadPhotos() {
    try {
      const res = await fetch('/api/photos');
      allPhotos = await res.json();
      currentFiltered = allPhotos;
      renderGallery(allPhotos);
    } catch (err) {
      console.warn('API fetch failed, rendering fallback static images', err);
      renderFallbackPhotos();
    }
  }

  function renderGallery(photos) {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    if (!photos || photos.length === 0) {
      galleryGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #64748b;">
        <i class="far fa-images" style="font-size: 3rem; margin-bottom: 12px; color: #cbd5e1;"></i>
        <p>No photos found in this category.</p>
      </div>`;
      return;
    }

    photos.forEach((photo, idx) => {
      const card = document.createElement('div');
      card.className = 'gallery-card';

      // Storage indicator tag if stored in Vercel Cloud
      const storageTag = photo.storage === 'vercel_blob' 
        ? `<span style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.65); color: #6ee7b7; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; z-index: 2; backdrop-filter: blur(4px);"><i class="fas fa-cloud"></i> Vercel</span>` 
        : '';

      card.innerHTML = `
        ${storageTag}
        <img src="${photo.url}" alt="${photo.title}" loading="lazy" onerror="this.onerror=null; this.src='/logo.jpg';">
        <div class="gallery-card-overlay">
          <h4>${photo.title}</h4>
          <p>${photo.description || 'ELROI CARE TRUST Humanitarian Service'}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        openLightbox(idx);
      });

      galleryGrid.appendChild(card);
    });
  }

  function openLightbox(index) {
    if (!currentFiltered || currentFiltered.length === 0) return;
    currentLightboxIndex = index;
    const item = currentFiltered[index];

    if (lightboxImg) lightboxImg.src = item.url;
    if (lightboxTitle) lightboxTitle.innerText = item.title;
    if (lightboxDesc) lightboxDesc.innerText = item.description || '';
    if (lightboxDate) lightboxDate.innerText = item.date || 'Tiruvallur District, Tamil Nadu';

    if (lightboxModal) lightboxModal.classList.add('active');
  }

  function closeLightbox() {
    if (lightboxModal) lightboxModal.classList.remove('active');
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLightboxIndex = (currentLightboxIndex - 1 + currentFiltered.length) % currentFiltered.length;
      openLightbox(currentLightboxIndex);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLightboxIndex = (currentLightboxIndex + 1) % currentFiltered.length;
      openLightbox(currentLightboxIndex);
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightboxModal && lightboxModal.classList.contains('active')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft' && lightboxPrev) lightboxPrev.click();
      if (e.key === 'ArrowRight' && lightboxNext) lightboxNext.click();
    }
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-filter');

      if (category === 'all') {
        currentFiltered = allPhotos;
      } else {
        currentFiltered = allPhotos.filter(p => p.category === category);
      }
      renderGallery(currentFiltered);
    });
  });

  // Fallback for direct offline file browsing
  function renderFallbackPhotos() {
    allPhotos = [
      { id: 1, url: '/photos/WhatsApp%20Image%202026-11-03%20at%202.54.36%20AM.jpeg', title: 'Support for Differently Abled Person', category: 'blind_disabled', description: 'Monthly ration provisions for wheelchair-bound individual' },
      { id: 2, url: '/photos/WhatsApp%20Image%202026-11-03%20at%202.54.37%20AM.jpeg', title: 'Provisions for Elderly Widow', category: 'widows_seniors', description: 'Handing over monthly rice and provisions' },
      { id: 3, url: '/photos/WhatsApp%20Image%202026-11-04%20at%209.21.17%20PM.jpeg', title: 'Grocery Provisions Packing', category: 'groceries', description: 'High quality pulses and food items' },
      { id: 4, url: '/photos/WhatsApp%20Image%202026-11-04%20at%209.34.43%20PM.jpeg', title: 'Joyful Children Camp Feasts', category: 'children', description: 'Nutritious meals and children program' },
      { id: 5, url: '/photos/WhatsApp%20Image%202026-11-04%20at%209.41.42%20PM.jpeg', title: 'Rural Community Relief', category: 'tribal', description: 'Serving tribal and remote families' }
    ];
    currentFiltered = allPhotos;
    renderGallery(allPhotos);
  }

  loadPhotos();
});
