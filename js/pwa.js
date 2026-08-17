/**
 * KOPI TUBRUK - PWA Installer Handler
 */

class PWAHandler {
  constructor() {
    this.deferredPrompt = null;
    this.pwaBanner = document.getElementById('pwaBanner');
    this.installBtn = document.getElementById('installPwaBtn');
    this.closeBtn = document.getElementById('closePwaBtn');
    
    this.init();
  }

  init() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // Capture install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (this.pwaBanner) {
        this.pwaBanner.classList.remove('hidden');
      }
    });

    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => this.installPWA());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        if (this.pwaBanner) this.pwaBanner.classList.add('hidden');
      });
    }
  }

  installPWA() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted installation prompt');
      }
      this.deferredPrompt = null;
      if (this.pwaBanner) this.pwaBanner.classList.add('hidden');
    });
  }
}

window.pwaHandler = new PWAHandler();
