/**
 * KOPI TUBRUK - Main Application Controller
 */

class AppController {
  constructor() {
    this.themeBtn = document.getElementById('themeBtn');
    this.soundBtn = document.getElementById('soundBtn');
    this.securityBtn = document.getElementById('securityBtn');
    
    // Modals
    this.wrongModal = document.getElementById('wrongModal');
    this.defeatModal = document.getElementById('defeatModal');
    this.victoryModal = document.getElementById('victoryModal');
    this.securityModal = document.getElementById('securityModal');

    this.init();
  }

  init() {
    // Top Bar Buttons
    if (this.themeBtn) {
      this.themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        this.soundBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    if (this.securityBtn) {
      this.securityBtn.addEventListener('click', () => {
        if (this.securityModal) this.securityModal.classList.remove('hidden');
      });
    }

    // Modal Action Buttons
    const closeWrongBtn = document.getElementById('closeWrongModalBtn');
    if (closeWrongBtn) {
      closeWrongBtn.addEventListener('click', () => {
        if (this.wrongModal) this.wrongModal.classList.add('hidden');
      });
    }

    const closeSecBtn = document.getElementById('closeSecurityModalBtn');
    if (closeSecBtn) {
      closeSecBtn.addEventListener('click', () => {
        if (this.securityModal) this.securityModal.classList.add('hidden');
      });
    }

    const retryDefeatBtn = document.getElementById('retryDefeatBtn');
    if (retryDefeatBtn) {
      retryDefeatBtn.addEventListener('click', () => {
        if (this.defeatModal) this.defeatModal.classList.add('hidden');
        window.ttsEngine.loadLevel('level1');
      });
    }

    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        if (this.victoryModal) this.victoryModal.classList.add('hidden');
        window.ttsEngine.loadLevel('level1');
      });
    }

    // Action Toolbar
    const checkBtn = document.getElementById('checkWordBtn');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => window.ttsEngine.checkWord());
    }

    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => window.ttsEngine.giveHint());
    }

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => window.ttsEngine.loadLevel('level1'));
    }

    const dirToggleBtn = document.getElementById('dirToggleBtn');
    if (dirToggleBtn) {
      dirToggleBtn.addEventListener('click', () => window.ttsEngine.toggleDirection());
    }

    // Virtual Keyboard Binding
    document.querySelectorAll('.kb-key').forEach(keyEl => {
      keyEl.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.key;
        if (!key) return;

        if (key === 'BACKSPACE') {
          window.ttsEngine.backspaceChar();
        } else if (key === 'DIR') {
          window.ttsEngine.toggleDirection();
        } else {
          window.ttsEngine.inputChar(key);
        }
      });
    });

    // Hardware Keyboard binding
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        window.ttsEngine.backspaceChar();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Direction change
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          window.ttsEngine.direction = 'across';
        } else {
          window.ttsEngine.direction = 'down';
        }
        window.ttsEngine.updateHighlighting();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        window.ttsEngine.inputChar(e.key);
      }
    });

    // Load initial level
    window.ttsEngine.loadLevel('level1');
  }

  toggleTheme() {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = (currentTheme === 'light') ? 'dark' : 'light';
    htmlEl.setAttribute('data-theme', newTheme);
    if (this.themeBtn) {
      this.themeBtn.textContent = (newTheme === 'light') ? '☀️' : '🌙';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
