/**
 * NX Downloader — Modern YouTube Resolver Integration
 * Developer: Dev by Rx Coder </>
 * Brand: Powered by Nxona LLC
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  const downloadForm = document.getElementById('downloadForm');
  const videoUrlInput = document.getElementById('videoUrlInput');
  const clearBtn = document.getElementById('clearBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const resultContainer = document.getElementById('resultContainer');
  const toastContainer = document.getElementById('toastContainer');

  // UPDATED: Point to your deployed Vercel proxy endpoint URL
  // Example format: 'https://nx-downloader-api.vercel.app/api/resolve'
  const PROXY_API_URL = 'https://YOUR_VERCEL_APP_NAME.vercel.app/api/resolve';

  let isResolving = false;

  // ==========================================
  // 1. Theme Management
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('nx_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeIcons(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', initialTheme);
      updateThemeIcons(initialTheme);
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('nx_theme', newTheme);
    updateThemeIcons(newTheme);
  }

  function updateThemeIcons(theme) {
    if (theme === 'dark') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }

  themeToggleBtn.addEventListener('click', toggleTheme);

  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // ==========================================
  // 2. Toast Notification System
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="hero-icon-sm toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg class="hero-icon-sm toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg class="hero-icon-sm toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
    } else {
      iconSvg = `<svg class="hero-icon-sm toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
  }

  // ==========================================
  // 3. Input Actions (Paste & Clear)
  // ==========================================
  videoUrlInput.addEventListener('input', () => {
    if (videoUrlInput.value.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  });

  clearBtn.addEventListener('click', () => {
    videoUrlInput.value = '';
    clearBtn.classList.add('hidden');
    videoUrlInput.focus();
    resetResultUI();
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        showToast('Clipboard access unavailable.', 'warning');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        videoUrlInput.value = text.trim();
        clearBtn.classList.remove('hidden');
        showToast('URL pasted from clipboard', 'info');
      } else {
        showToast('Clipboard is empty', 'warning');
      }
    } catch (err) {
      showToast('Unable to access clipboard', 'error');
    }
  });

  // ==========================================
  // 4. Validation & Helpers
  // ==========================================
  function validateYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    const ytPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
    return ytPattern.test(trimmed);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '';
    const secs = parseInt(seconds, 10);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // ==========================================
  // 5. Proxy API Request Logic
  // ==========================================
  async function resolveVideo(url) {
    const targetEndpoint = `${PROXY_API_URL}?url=${encodeURIComponent(url)}`;

    const response = await fetch(targetEndpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Proxy status: ${response.status}`);
    }

    return await response.json();
  }

  downloadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isResolving) return;

    const inputUrl = videoUrlInput.value.trim();

    if (!inputUrl) {
      showToast('Please enter a YouTube URL.', 'warning');
      return;
    }

    if (!validateYouTubeUrl(inputUrl)) {
      showToast('Invalid YouTube URL format.', 'error');
      return;
    }

    setLoadingState(true);
    resetResultUI();

    try {
      const data = await resolveVideo(inputUrl);

      if (!data || data.error || data.status === 'error') {
        const errorMsg = data?.message || data?.error || 'Unable to resolve this video.';
        showToast(errorMsg, 'error');
      } else {
        showToast('Video resolved successfully!', 'success');
        renderResult(data);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      showToast('Unable to connect to proxy service. Please try again.', 'error');
    } finally {
      setLoadingState(false);
    }
  });

  function setLoadingState(loading) {
    isResolving = loading;
    if (loading) {
      submitBtn.disabled = true;
      btnText.textContent = 'Resolving video...';
      btnSpinner.classList.remove('hidden');
    } else {
      submitBtn.disabled = false;
      btnText.textContent = 'Download';
      btnSpinner.classList.add('hidden');
    }
  }

  function resetResultUI() {
    resultContainer.innerHTML = '';
    resultContainer.classList.add('hidden');
  }

  // ==========================================
  // 6. Result Renderer
  // ==========================================
  function renderResult(data) {
    const title = data.title || data.videoTitle || data.heading || 'Resolved Video';
    const thumbnail = data.thumbnail || data.thumb || data.image || '';
    const rawDuration = data.duration || data.lengthSeconds || '';
    const formattedDuration = formatDuration(rawDuration) || rawDuration;

    let streams = [];
    if (Array.isArray(data.formats)) {
      streams = data.formats;
    } else if (Array.isArray(data.downloads)) {
      streams = data.downloads;
    } else if (Array.isArray(data.urls)) {
      streams = data.urls;
    } else if (data.url || data.downloadUrl) {
      streams = [{
        quality: data.quality || 'Default',
        format: data.format || 'MP4',
        url: data.url || data.downloadUrl
      }];
    }

    let formatOptionsHtml = '';
    if (streams.length > 0) {
      streams.forEach((item, index) => {
        const label = item.quality || item.qualityLabel || item.format || `Option ${index + 1}`;
        const streamUrl = item.url || item.downloadUrl || '#';
        formatOptionsHtml += `<option value="${escapeHtml(streamUrl)}">${escapeHtml(label)}</option>`;
      });
    }

    const cardHtml = `
      <div class="glass-card result-card">
        ${thumbnail ? `
          <div class="result-thumb-wrapper">
            <img src="${escapeHtml(thumbnail)}" alt="Thumbnail" class="result-thumb" />
          </div>
        ` : ''}
        
        <div class="result-info">
          <h3>${escapeHtml(title)}</h3>
          
          <div class="meta-row">
            ${formattedDuration ? `<span>⏱ ${escapeHtml(formattedDuration)}</span>` : ''}
            <span> Ready to Download</span>
          </div>

          ${streams.length > 0 ? `
            <div class="selectors-grid">
              <div class="select-group">
                <label for="formatSelect">Available Formats</label>
                <select id="formatSelect" class="custom-select">
                  ${formatOptionsHtml}
                </select>
              </div>
            </div>
            
            <div class="result-actions">
              <button id="triggerDownloadBtn" class="primary-btn">
                <span>Download Now</span>
              </button>
              <button id="resetCardBtn" class="reset-btn">Download Another</button>
            </div>
          ` : `
            <p style="color: var(--toast-warning); font-size: 0.9rem; margin-bottom: 1rem;">
              No direct stream links returned in the API payload.
            </p>
            <button id="resetCardBtn" class="reset-btn">Try Another URL</button>
          `}
        </div>
      </div>
    `;

    resultContainer.innerHTML = cardHtml;
    resultContainer.classList.remove('hidden');

    const triggerDownloadBtn = document.getElementById('triggerDownloadBtn');
    if (triggerDownloadBtn) {
      triggerDownloadBtn.addEventListener('click', () => {
        const selectEl = document.getElementById('formatSelect');
        const downloadTargetUrl = selectEl ? selectEl.value : null;

        if (!downloadTargetUrl || downloadTargetUrl === '#') {
          showToast('A downloadable file URL was not found.', 'error');
          return;
        }

        showToast('Initiating download action...', 'info');
        window.open(downloadTargetUrl, '_blank', 'noopener,noreferrer');
      });
    }

    const resetCardBtn = document.getElementById('resetCardBtn');
    if (resetCardBtn) {
      resetCardBtn.addEventListener('click', () => {
        videoUrlInput.value = '';
        clearBtn.classList.add('hidden');
        resetResultUI();
        videoUrlInput.focus();
      });
    }
  }

  initTheme();
});
