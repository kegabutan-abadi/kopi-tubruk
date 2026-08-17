/**
 * KOPI TUBRUK - Main Controller (Native Keyboard & Touch Handling)
 */

class AppController {
  constructor() {
    this.themeBtn = document.getElementById('themeBtn');
    this.soundBtn = document.getElementById('soundBtn');
    this.hiddenInput = document.getElementById('hiddenInput');
    
    // Modals
    this.wrongModal = document.getElementById('wrongModal');
    this.defeatModal = document.getElementById('defeatModal');
    this.victoryModal = document.getElementById('victoryModal');

    this.init();
  }

  init() {
    // Theme & Sound Buttons
    if (this.themeBtn) {
      this.themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        this.soundBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Direction Toggle
    const dirToggleBtn = document.getElementById('dirToggleBtn');
    if (dirToggleBtn) {
      dirToggleBtn.addEventListener('click', () => window.ttsEngine.toggleDirection());
    }

    // Modal Close Buttons
    const closeWrongBtn = document.getElementById('closeWrongModalBtn');
    if (closeWrongBtn) {
      closeWrongBtn.addEventListener('click', () => {
        if (this.wrongModal) this.wrongModal.classList.add('hidden');
        window.ttsEngine.focusNativeInput();
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

    // Action Bar
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

    // Native Android Keyboard Input Handler via hidden input
    if (this.hiddenInput) {
      this.hiddenInput.addEventListener('input', (e) => {
        const val = this.hiddenInput.value;
        if (val) {
          const char = val.slice(-1);
          if (/^[a-zA-Z]$/.test(char)) {
            window.ttsEngine.inputChar(char);
          }
          this.hiddenInput.value = '';
        }
      });
    }

    // Global Keydown Handler for Backspace & Arrow Keys
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        window.ttsEngine.backspaceChar();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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

    // Load Level 1
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
