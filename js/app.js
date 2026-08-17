/**
 * KOPI TUBRUK - Main Application Controller
 */

class AppController {
  constructor() {
    this.tickerTextEl = document.getElementById('tickerText');
    this.themeBtn = document.getElementById('themeBtn');
    this.soundBtn = document.getElementById('soundBtn');
    this.securityBtn = document.getElementById('securityBtn');
    this.categorySelect = document.getElementById('categorySelect');
    
    // Modals
    this.wrongModal = document.getElementById('wrongModal');
    this.securityModal = document.getElementById('securityModal');
    this.victoryModal = document.getElementById('victoryModal');
    
    this.init();
  }

  init() {
    // Event Listeners for top controls
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
      this.securityBtn.addEventListener('click', () => this.showSecurityModal());
    }

    if (this.categorySelect) {
      this.categorySelect.addEventListener('change', (e) => {
        window.ttsEngine.loadLevel(e.target.value);
        this.updateTickerForCategory(e.target.value);
      });
    }

    // Modal Close Listeners
    document.getElementById('closeWrongModalBtn').addEventListener('click', () => {
      this.wrongModal.classList.add('hidden');
    });

    document.getElementById('closeSecurityModalBtn').addEventListener('click', () => {
      this.securityModal.classList.add('hidden');
    });

    document.getElementById('nextLevelBtn').addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.loadNextCategory();
    });

    // Action Buttons
    document.getElementById('checkWordBtn').addEventListener('click', () => {
      window.ttsEngine.checkWord();
    });

    document.getElementById('checkAllBtn').addEventListener('click', () => {
      window.ttsEngine.checkAll();
    });

    document.getElementById('hintBtn').addEventListener('click', () => {
      window.ttsEngine.useHint();
    });

    // Clue Tabs (Mendatar / Menurun)
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.clues-list').forEach(l => l.classList.remove('active'));

        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById(`${tab}CluesList`).classList.add('active');
        window.ttsEngine.direction = tab;
        window.ttsEngine.updateHighlighting();
      });
    });

    // Virtual Keyboard setup
    document.querySelectorAll('.virtual-keyboard .kb-key').forEach(key => {
      key.addEventListener('click', (e) => {
        const keyVal = key.textContent.trim();
        if (key.id === 'kbBackspace' || keyVal === '⌫') {
          window.ttsEngine.backspace();
        } else if (key.id === 'kbDirToggle') {
          window.ttsEngine.direction = window.ttsEngine.direction === 'across' ? 'down' : 'across';
          window.ttsEngine.updateHighlighting();
        } else if (/^[A-Z]$/i.test(keyVal)) {
          window.ttsEngine.inputChar(keyVal);
        }
      });
    });

    // Physical Hardware Keyboard Input
    window.addEventListener('keydown', (e) => {
      // Don't intercept if typing in an input field or select dropdown
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === 'Backspace') {
        window.ttsEngine.backspace();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (e.key === 'ArrowRight') window.ttsEngine.moveNext();
        if (e.key === 'ArrowLeft') window.ttsEngine.movePrev();
      } else if (e.key === ' ' || e.key === 'Tab') {
        e.preventDefault();
        window.ttsEngine.direction = window.ttsEngine.direction === 'across' ? 'down' : 'across';
        window.ttsEngine.updateHighlighting();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        window.ttsEngine.inputChar(e.key);
      }
    });

    // Load initial level
    window.ttsEngine.loadLevel('level1');
  }

  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', nextTheme);
    this.themeBtn.textContent = nextTheme === 'dark' ? '🌙' : '☀️';
  }

  updateTickerForCategory(catKey) {
    const level = TTS_DATA[catKey];
    if (!level) return;
    this.tickerTextEl.textContent = `✨ Modus Bermain: ${level.icon} ${level.title}! ☕ Pertajam Substansi Pemikiran Anda! 💡 TTS KOPI TUBRUK Smart Version.`;
  }

  showWrongModal() {
    this.wrongModal.classList.remove('hidden');
  }

  showSecurityModal() {
    this.securityModal.classList.remove('hidden');
  }

  showVictoryModal(timeStr, scoreVal) {
    document.getElementById('vicTime').textContent = timeStr;
    document.getElementById('vicScore').textContent = scoreVal;
    this.victoryModal.classList.remove('hidden');
  }

  loadNextCategory() {
    const categories = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7', 'level8'];
    const currIdx = categories.indexOf(window.ttsEngine.currentLevelKey);
    const nextIdx = (currIdx + 1) % categories.length;
    const nextCatKey = categories[nextIdx];

    this.categorySelect.value = nextCatKey;
    window.ttsEngine.loadLevel(nextCatKey);
    this.updateTickerForCategory(nextCatKey);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
