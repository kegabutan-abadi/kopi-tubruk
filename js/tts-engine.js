/**
 * KOPI TUBRUK - Crossword (TTS) Core Interactive Engine
 * Features:
 * - 60-Second Countdown Timer
 * - 11x11 Auto-fitting Grid for Android
 * - Input validation & checking
 * - Custom notifications & modals:
 *   * Wrong Answer: "Makanya belajar, biasakan membahas substansi."
 *   * Defeat (Time out): "Harus banyak belajar lagi dan biasakan membahas substansi."
 *   * Victory: "SELAMAT! USER ADALAH PEMENANG SUBSTANSIAL!"
 */

class TTSEngine {
  constructor() {
    this.currentLevelKey = 'level1';
    this.levelData = null;
    this.gridMatrix = [];     // User inputs
    this.solutionMatrix = []; // Target solution letters
    this.selectedRow = -1;
    this.selectedCol = -1;
    this.direction = 'across'; // 'across' or 'down'
    this.hintsLeft = 3;
    this.score = 0;
    
    // 60-Second Countdown Timer
    this.targetSeconds = 60;
    this.timerLeft = 60;
    this.timerInterval = null;
    this.isGameOver = false;

    // DOM References
    this.gridContainer = document.getElementById('ttsGrid');
    this.activeClueBadge = document.getElementById('clueBadge');
    this.activeClueText = document.getElementById('clueText');
    this.acrossList = document.getElementById('acrossCluesList');
    this.downList = document.getElementById('downCluesList');
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.timerDisplay = document.getElementById('timerDisplay');
    this.hintCountDisplay = document.getElementById('hintCount');
    this.dirToggleBtn = document.getElementById('dirToggleBtn');
  }

  loadLevel(levelKey = 'level1') {
    this.currentLevelKey = levelKey;
    this.levelData = TTS_DATA[levelKey];
    if (!this.levelData) return;

    this.solutionMatrix = this.levelData.solutionClean;
    const rows = this.levelData.rows;
    const cols = this.levelData.cols;

    // Initialize blank user grid
    this.gridMatrix = Array.from({ length: rows }, () => Array(cols).fill(''));

    this.hintsLeft = 3;
    this.isGameOver = false;
    this.updateScoreDisplay();
    if (this.hintCountDisplay) this.hintCountDisplay.textContent = this.hintsLeft;

    this.renderGrid();
    this.renderClues();
    this.selectFirstCell();

    // Start 60-Second Countdown
    this.start60sTimer();
  }

  start60sTimer() {
    this.stopTimer();
    this.timerLeft = 60;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (this.isGameOver) return;
      this.timerLeft--;
      this.updateTimerDisplay();

      if (this.timerLeft <= 0) {
        this.stopTimer();
        this.handleTimeOut();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    if (!this.timerDisplay) return;
    const secs = String(Math.max(0, this.timerLeft)).padStart(2, '0');
    this.timerDisplay.textContent = `00:${secs}`;
    
    // Warning visual pulse when <= 15s
    const container = document.getElementById('timerContainer');
    if (container) {
      if (this.timerLeft <= 15) {
        container.classList.add('timer-warning');
      } else {
        container.classList.remove('timer-warning');
      }
    }
  }

  handleTimeOut() {
    this.isGameOver = true;
    if (window.soundEngine) window.soundEngine.playWrong();
    
    const defeatModal = document.getElementById('defeatModal');
    if (defeatModal) {
      defeatModal.classList.remove('hidden');
    }
  }

  renderGrid() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';
    
    const rows = this.levelData.rows;
    const cols = this.levelData.cols;

    // Set grid CSS template
    this.gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Map cell numbers
    const numberMap = {};
    if (this.levelData.numbers) {
      this.levelData.numbers.forEach(item => {
        numberMap[`${item.row}_${item.col}`] = item.num;
      });
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'grid-cell';
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;

        const isBlack = (this.solutionMatrix[r][c] === null);
        if (isBlack) {
          cellEl.classList.add('black-cell');
        } else {
          // Number badge
          const num = numberMap[`${r}_${c}`];
          if (num) {
            const numEl = document.createElement('span');
            numEl.className = 'cell-num';
            numEl.textContent = num;
            cellEl.appendChild(numEl);
          }

          // Text element
          const textEl = document.createElement('span');
          textEl.className = 'cell-text';
          textEl.textContent = this.gridMatrix[r][c] || '';
          cellEl.appendChild(textEl);

          // Click & Touch events
          cellEl.addEventListener('click', () => this.handleCellClick(r, c));
        }

        this.gridContainer.appendChild(cellEl);
      }
    }
  }

  selectFirstCell() {
    for (let r = 0; r < this.levelData.rows; r++) {
      for (let c = 0; c < this.levelData.cols; c++) {
        if (this.solutionMatrix[r][c] !== null) {
          this.selectCell(r, c);
          return;
        }
      }
    }
  }

  handleCellClick(r, c) {
    if (this.isGameOver) return;
    if (this.solutionMatrix[r][c] === null) return;

    if (this.selectedRow === r && this.selectedCol === c) {
      // Toggle direction if clicking same cell
      this.direction = (this.direction === 'across') ? 'down' : 'across';
    } else {
      this.selectedRow = r;
      this.selectedCol = c;
    }
    this.updateHighlighting();
    this.updateActiveClueDisplay();
  }

  selectCell(r, c) {
    this.selectedRow = r;
    this.selectedCol = c;
    this.updateHighlighting();
    this.updateActiveClueDisplay();
  }

  toggleDirection() {
    this.direction = (this.direction === 'across') ? 'down' : 'across';
    if (this.dirToggleBtn) {
      this.dirToggleBtn.textContent = (this.direction === 'across') ? '➡️ MTR' : '⬇️ MNR';
    }
    this.updateHighlighting();
    this.updateActiveClueDisplay();
  }

  updateHighlighting() {
    const cells = this.gridContainer.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
      cell.classList.remove('selected-cell', 'active-word');
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);

      if (r === this.selectedRow && c === this.selectedCol) {
        cell.classList.add('selected-cell');
      } else if (this.belongsToActiveWord(r, c)) {
        cell.classList.add('active-word');
      }
    });
  }

  belongsToActiveWord(r, c) {
    if (this.selectedRow < 0 || this.selectedCol < 0) return false;
    if (this.solutionMatrix[r][c] === null) return false;

    if (this.direction === 'across') {
      if (r !== this.selectedRow) return false;
      let startC = this.selectedCol;
      while (startC > 0 && this.solutionMatrix[r][startC - 1] !== null) startC--;
      let endC = this.selectedCol;
      while (endC < this.levelData.cols - 1 && this.solutionMatrix[r][endC + 1] !== null) endC++;
      return c >= startC && c <= endC;
    } else {
      if (c !== this.selectedCol) return false;
      let startR = this.selectedRow;
      while (startR > 0 && this.solutionMatrix[startR - 1][c] !== null) startR--;
      let endR = this.selectedRow;
      while (endR < this.levelData.rows - 1 && this.solutionMatrix[endR + 1][c] !== null) endR++;
      return r >= startR && r <= endR;
    }
  }

  updateActiveClueDisplay() {
    if (this.selectedRow < 0 || this.selectedCol < 0) return;
    const clueObj = this.findClueForSelectedCell();
    
    if (clueObj) {
      const dirText = (this.direction === 'across') ? 'MENDATAR' : 'MENURUN';
      if (this.activeClueBadge) this.activeClueBadge.textContent = `${clueObj.num}-${dirText}`;
      if (this.activeClueText) this.activeClueText.textContent = clueObj.clue;
      this.highlightClueInList(clueObj.num, this.direction);
    }
  }

  findClueForSelectedCell() {
    const list = (this.direction === 'across') ? this.levelData.clues.across : this.levelData.clues.down;
    let found = null;
    
    list.forEach(item => {
      if (this.direction === 'across') {
        if (item.row === this.selectedRow && this.selectedCol >= item.col && this.selectedCol < item.col + item.len) {
          found = item;
        }
      } else {
        if (item.col === this.selectedCol && this.selectedRow >= item.row && this.selectedRow < item.row + item.len) {
          found = item;
        }
      }
    });
    return found;
  }

  renderClues() {
    if (this.acrossList) {
      this.acrossList.innerHTML = '';
      this.levelData.clues.across.forEach(c => {
        const li = document.createElement('li');
        li.dataset.num = c.num;
        li.dataset.dir = 'across';
        li.innerHTML = `<strong>${c.num}.</strong> ${c.clue}`;
        li.addEventListener('click', () => {
          this.direction = 'across';
          this.selectCell(c.row, c.col);
        });
        this.acrossList.appendChild(li);
      });
    }

    if (this.downList) {
      this.downList.innerHTML = '';
      this.levelData.clues.down.forEach(c => {
        const li = document.createElement('li');
        li.dataset.num = c.num;
        li.dataset.dir = 'down';
        li.innerHTML = `<strong>${c.num}.</strong> ${c.clue}`;
        li.addEventListener('click', () => {
          this.direction = 'down';
          this.selectCell(c.row, c.col);
        });
        this.downList.appendChild(li);
      });
    }
  }

  highlightClueInList(num, dir) {
    document.querySelectorAll('.clues-list li').forEach(el => el.classList.remove('active-clue-item'));
    const selector = `.clues-list li[data-num="${num}"][data-dir="${dir}"]`;
    const activeEl = document.querySelector(selector);
    if (activeEl) {
      activeEl.classList.add('active-clue-item');
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  inputChar(char) {
    if (this.isGameOver) return;
    if (this.selectedRow < 0 || this.selectedCol < 0) return;
    if (this.solutionMatrix[this.selectedRow][this.selectedCol] === null) return;

    this.gridMatrix[this.selectedRow][this.selectedCol] = char.toUpperCase();
    
    // Play keystroke sound
    if (window.soundEngine) window.soundEngine.playKey();

    // Update DOM
    const selector = `.grid-cell[data-row="${this.selectedRow}"][data-col="${this.selectedCol}"] .cell-text`;
    const textEl = document.querySelector(selector);
    if (textEl) textEl.textContent = char.toUpperCase();

    // Move to next cell
    this.moveNextCell();

    // Check full completion automatically
    this.checkAutoCompletion();
  }

  backspaceChar() {
    if (this.isGameOver) return;
    if (this.selectedRow < 0 || this.selectedCol < 0) return;

    if (this.gridMatrix[this.selectedRow][this.selectedCol]) {
      this.gridMatrix[this.selectedRow][this.selectedCol] = '';
      const selector = `.grid-cell[data-row="${this.selectedRow}"][data-col="${this.selectedCol}"] .cell-text`;
      const textEl = document.querySelector(selector);
      if (textEl) textEl.textContent = '';
    } else {
      this.movePrevCell();
      this.gridMatrix[this.selectedRow][this.selectedCol] = '';
      const selector = `.grid-cell[data-row="${this.selectedRow}"][data-col="${this.selectedCol}"] .cell-text`;
      const textEl = document.querySelector(selector);
      if (textEl) textEl.textContent = '';
    }
  }

  moveNextCell() {
    let r = this.selectedRow;
    let c = this.selectedCol;

    if (this.direction === 'across') {
      c++;
      while (c < this.levelData.cols && this.solutionMatrix[r][c] === null) c++;
      if (c < this.levelData.cols) this.selectCell(r, c);
    } else {
      r++;
      while (r < this.levelData.rows && this.solutionMatrix[r][c] === null) r++;
      if (r < this.levelData.rows) this.selectCell(r, c);
    }
  }

  movePrevCell() {
    let r = this.selectedRow;
    let c = this.selectedCol;

    if (this.direction === 'across') {
      c--;
      while (c >= 0 && this.solutionMatrix[r][c] === null) c--;
      if (c >= 0) this.selectCell(r, c);
    } else {
      r--;
      while (r >= 0 && this.solutionMatrix[r][c] === null) r--;
      if (r >= 0) this.selectCell(r, c);
    }
  }

  giveHint() {
    if (this.isGameOver) return;
    if (this.hintsLeft <= 0) {
      alert("Kesempatan Bantuan (Hint) Sudah Habis!");
      return;
    }
    if (this.selectedRow < 0 || this.selectedCol < 0) return;

    const correctChar = this.solutionMatrix[this.selectedRow][this.selectedCol];
    if (correctChar !== null) {
      this.hintsLeft--;
      if (this.hintCountDisplay) this.hintCountDisplay.textContent = this.hintsLeft;

      this.gridMatrix[this.selectedRow][this.selectedCol] = correctChar;
      const selector = `.grid-cell[data-row="${this.selectedRow}"][data-col="${this.selectedCol}"] .cell-text`;
      const textEl = document.querySelector(selector);
      if (textEl) textEl.textContent = correctChar;

      const cellEl = document.querySelector(`.grid-cell[data-row="${this.selectedRow}"][data-col="${this.selectedCol}"]`);
      if (cellEl) cellEl.classList.add('correct-cell');
    }
  }

  checkWord() {
    if (this.isGameOver) return;
    let hasMistake = false;
    let isFullyFilled = true;

    for (let r = 0; r < this.levelData.rows; r++) {
      for (let c = 0; c < this.levelData.cols; c++) {
        const sol = this.solutionMatrix[r][c];
        if (sol !== null) {
          const userVal = this.gridMatrix[r][c];
          if (!userVal) {
            isFullyFilled = false;
          } else if (userVal !== sol) {
            hasMistake = true;
          }
        }
      }
    }

    if (hasMistake) {
      if (window.soundEngine) window.soundEngine.playWrong();
      const wrongModal = document.getElementById('wrongModal');
      if (wrongModal) wrongModal.classList.remove('hidden');
    } else if (isFullyFilled) {
      this.handleVictory();
    } else {
      alert("Jawaban sejauh ini sudah BENAR! Lanjutkan mengisi seluruh 15 pertanyaan!");
    }
  }

  checkAutoCompletion() {
    let isComplete = true;
    for (let r = 0; r < this.levelData.rows; r++) {
      for (let c = 0; c < this.levelData.cols; c++) {
        const sol = this.solutionMatrix[r][c];
        if (sol !== null && this.gridMatrix[r][c] !== sol) {
          isComplete = false;
          break;
        }
      }
    }
    if (isComplete) {
      this.handleVictory();
    }
  }

  handleVictory() {
    this.isGameOver = true;
    this.stopTimer();

    this.score += 1500 + (this.timerLeft * 50);
    this.updateScoreDisplay();

    if (window.soundEngine) window.soundEngine.playCorrect();

    const victoryModal = document.getElementById('victoryModal');
    const vicTime = document.getElementById('vicTime');
    const vicScore = document.getElementById('vicScore');

    if (vicTime) vicTime.textContent = `${this.timerLeft}s`;
    if (vicScore) vicScore.textContent = `${this.score}`;

    if (victoryModal) victoryModal.classList.remove('hidden');
  }

  updateScoreDisplay() {
    if (this.scoreDisplay) this.scoreDisplay.textContent = this.score;
  }
}

window.ttsEngine = new TTSEngine();
