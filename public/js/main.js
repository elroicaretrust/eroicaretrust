/**
 * ELROI CARE TRUST - Global Interactive JavaScript
 * www.elroicaretrust.in
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        if (navMenu.classList.contains('open')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target) && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });
  }

  // 2. Sticky Header Shadow on Scroll
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.style.boxShadow = '0 6px 20px rgba(7, 25, 47, 0.12)';
      } else {
        header.style.boxShadow = 'var(--shadow-md)';
      }
    });
  }

  // 3. Impact Counters Animation
  const counters = document.querySelectorAll('.animate-counter');
  if (counters.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10) || 0;
          const suffix = el.getAttribute('data-suffix') || '';
          let count = 0;
          const duration = 1800;
          const stepTime = 30;
          const totalSteps = duration / stepTime;
          const stepVal = Math.ceil(target / totalSteps);

          const timer = setInterval(() => {
            count += stepVal;
            if (count >= target) {
              el.innerText = target.toLocaleString('en-IN') + suffix;
              clearInterval(timer);
            } else {
              el.innerText = count.toLocaleString('en-IN') + suffix;
            }
          }, stepTime);

          obs.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    counters.forEach(counter => observer.observe(counter));
  }

  // 4. Hero Background Slideshow
  const bgSlides = document.querySelectorAll('.hero-bg-slide');
  const bgDots = document.querySelectorAll('.hero-dot');
  if (bgSlides.length > 0) {
    let currentSlide = 0;
    let slideInterval = null;

    function goToSlide(index) {
      bgSlides.forEach((s, i) => {
        if (i === index) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });

      bgDots.forEach((d, i) => {
        if (i === index) {
          d.classList.add('active');
        } else {
          d.classList.remove('active');
        }
      });
      currentSlide = index;
    }

    function nextSlide() {
      const next = (currentSlide + 1) % bgSlides.length;
      goToSlide(next);
    }

    function startAutoSlide() {
      if (slideInterval) clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 5000);
    }

    bgDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        goToSlide(idx);
        startAutoSlide();
      });
    });

    startAutoSlide();
  }
});

/**
 * Global Toast Notification
 */
function showToast(message, isSuccess = true) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  const icon = isSuccess ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' : '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>';
  toast.innerHTML = `${icon} <span>${message}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

/**
 * Copy text to clipboard with feedback
 */
function copyToClipboard(text, label = 'Information') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard!`);
    }).catch(() => {
      fallbackCopy(text, label);
    });
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast(`${label} copied to clipboard!`);
  } catch (err) {
    prompt(`Copy ${label}:`, text);
  }
  document.body.removeChild(textArea);
}

