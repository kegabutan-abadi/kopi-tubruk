/**
 * KOPI TUBRUK - Crossword (TTS) Core Engine
 */

class TTSEngine {
  constructor() {
    this.currentLevelKey = 'level1';
    this.levelData = null;
    this.gridMatrix = [];     // Stores current user inputs
    this.solutionMatrix = []; // Stores solution letters
    this.selectedRow = -1;
    this.selectedCol = -1;
    this.direction = 'across'; // 'across' or 'down'
    this.hintsLeft = 3;
    this.score = 0;
    this.timerSeconds = 0;
    this.timerInterval = null;

    // DOM Elements
    this.gridContainer = document.getElementById('ttsGrid');
    this.activeClueBadge = document.getElementById('clueBadge');
    this.activeClueText = document.getElementById('clueText');
    this.acrossList = document.getElementById('acrossCluesList');
    this.downList = document.getElementById('downCluesList');
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.timerDisplay = document.getElementById('timerDisplay');
    this.hintCountDisplay = document.getElementById('hintCount');
  }

  loadLevel(levelKey) {
    this.currentLevelKey = levelKey;
    this.levelData = TTS_DATA[levelKey];
    if (!this.levelData) return;

    this.solutionMatrix = this.levelData.solutionClean;
    const rows = this.levelData.rows;
    const cols = this.levelData.cols;

    // Initialize user grid matrix
    this.gridMatrix = Array.from({ length: rows }, () => Array(cols).fill(''));

    this.hintsLeft = 3;
    this.updateScoreDisplay();
    this.hintCountDisplay.textContent = this.hintsLeft;

    this.resetTimer();
    this.startTimer();

    this.renderGrid();
    this.renderClues();
    
    // Select first interactive cell
    this.selectFirstCell();
  }

  startTimer() {
    this.stopTimer();
    this.timerSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const mins = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
      const secs = String(this.timerSeconds % 60).padStart(2, '0');
      this.timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer() {
    this.stopTimer();
    this.timerDisplay.textContent = '00:00';
  }

  renderGrid() {
    this.gridContainer.innerHTML = '';
    const rows = this.levelData.rows;
    const cols = this.levelData.cols;

    this.gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const solLetter = this.solutionMatrix[r][c];
        const cellEl = document.createElement('div');
        cellEl.className = 'grid-cell';
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;

        if (solLetter === null) {
          cellEl.classList.add('black-cell');
        } else {
          // Check if this cell starts a numbered clue
          const numObj = this.levelData.numbers.find(n => n.row === r && n.col === c);
          if (numObj) {
            const numSpan = document.createElement('span');
            numSpan.className = 'cell-number';
            numSpan.textContent = numObj.num;
            cellEl.appendChild(numSpan);
          }

          cellEl.addEventListener('click', () => this.handleCellClick(r, c));
        }

        this.gridContainer.appendChild(cellEl);
      }
    }
  }

  renderClues() {
    this.acrossList.innerHTML = '';
    this.downList.innerHTML = '';

    // Across Clues
    this.levelData.clues.across.forEach(item => {
      const li = document.createElement('li');
      li.dataset.num = item.num;
      li.dataset.dir = 'across';
      li.innerHTML = `<strong>${item.num}.</strong> ${item.clue} <em>(${item.len} huruf)</em>`;
      li.addEventListener('click', () => {
        this.direction = 'across';
        this.selectCell(item.row, item.col);
      });
      this.acrossList.appendChild(li);
    });

    // Down Clues
    this.levelData.clues.down.forEach(item => {
      const li = document.createElement('li');
      li.dataset.num = item.num;
      li.dataset.dir = 'down';
      li.innerHTML = `<strong>${item.num}.</strong> ${item.clue} <em>(${item.len} huruf)</em>`;
      li.addEventListener('click', () => {
        this.direction = 'down';
        this.selectCell(item.row, item.col);
      });
      this.downList.appendChild(li);
    });
  }

  selectFirstCell() {
    const rows = this.levelData.rows;
    const cols = this.levelData.cols;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.solutionMatrix[r][c] !== null) {
          this.selectCell(r, c);
          return;
        }
      }
    }
  }

  handleCellClick(r, c) {
    if (this.solutionMatrix[r][c] === null) return;

    if (this.selectedRow === r && this.selectedCol === c) {
      // Toggle direction if clicking the same selected cell
      this.direction = this.direction === 'across' ? 'down' : 'across';
    } else {
      this.selectedRow = r;
      this.selectedCol = c;
    }

    this.updateHighlighting();
    window.soundEngine.playKey();
  }

  selectCell(r, c) {
    this.selectedRow = r;
    this.selectedCol = c;
    this.updateHighlighting();
  }

  updateHighlighting() {
    // Clear previous cell classes
    const allCells = this.gridContainer.querySelectorAll('.grid-cell');
    allCells.forEach(cell => {
      cell.classList.remove('selected-cell', 'active-word');
    });

    if (this.selectedRow < 0 || this.selectedCol < 0) return;

    // Find active clue for current cell & direction
    const activeClue = this.findClueForCell(this.selectedRow, this.selectedCol, this.direction);

    if (activeClue) {
      // Highlight all cells belonging to this word
      const len = activeClue.len;
      for (let i = 0; i < len; i++) {
        const r = activeClue.dir === 'across' ? activeClue.row : activeClue.row + i;
        const c = activeClue.dir === 'across' ? activeClue.col + i : activeClue.col;
        
        const cellEl = this.getCellEl(r, c);
        if (cellEl) cellEl.classList.add('active-word');
      }

      // Update Clue Bar & List highlights
      const dirText = activeClue.dir === 'across' ? 'MENDATAR' : 'MENURUN';
      this.activeClueBadge.textContent = `${activeClue.num} ${dirText}`;
      this.activeClueText.textContent = activeClue.clue;

      this.highlightClueItem(activeClue.num, activeClue.dir);
    } else {
      // Fallback if direction has no clue at cell
      this.direction = this.direction === 'across' ? 'down' : 'across';
      const fallbackClue = this.findClueForCell(this.selectedRow, this.selectedCol, this.direction);
      if (fallbackClue) {
        this.updateHighlighting();
        return;
      }
    }

    // Highlight selected single cell
    const selectedEl = this.getCellEl(this.selectedRow, this.selectedCol);
    if (selectedEl) selectedEl.classList.add('selected-cell');
  }

  findClueForCell(r, c, dir) {
    const cluesList = this.levelData.clues[dir];
    return cluesList.find(clue => {
      if (dir === 'across') {
        return clue.row === r && c >= clue.col && c < clue.col + clue.len;
      } else {
        return clue.col === c && r >= clue.row && r < clue.row + clue.len;
      }
    });
  }

  highlightClueItem(num, dir) {
    document.querySelectorAll('.clues-list li').forEach(li => li.classList.remove('active-clue-item'));
    const list = dir === 'across' ? this.acrossList : this.downList;
    const targetLi = list.querySelector(`li[data-num="${num}"]`);
    if (targetLi) {
      targetLi.classList.add('active-clue-item');
      targetLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  getCellEl(r, c) {
    return this.gridContainer.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
  }

  inputChar(char) {
    if (this.selectedRow < 0 || this.selectedCol < 0) return;
    if (this.solutionMatrix[this.selectedRow][this.selectedCol] === null) return;

    char = char.toUpperCase();
    this.gridMatrix[this.selectedRow][this.selectedCol] = char;

    const cellEl = this.getCellEl(this.selectedRow, this.selectedCol);
    if (cellEl) {
      // Retain cell number span if exists
      const numSpan = cellEl.querySelector('.cell-number');
      cellEl.innerHTML = '';
      if (numSpan) cellEl.appendChild(numSpan);
      
      const charNode = document.createTextNode(char);
      cellEl.appendChild(charNode);
      cellEl.classList.remove('wrong-cell');
    }

    window.soundEngine.playKey();
    this.moveNext();
  }

  backspace() {
    if (this.selectedRow < 0 || this.selectedCol < 0) return;
    
    const currentChar = this.gridMatrix[this.selectedRow][this.selectedCol];
    if (currentChar !== '') {
      this.gridMatrix[this.selectedRow][this.selectedCol] = '';
      const cellEl = this.getCellEl(this.selectedRow, this.selectedCol);
      if (cellEl) {
        const numSpan = cellEl.querySelector('.cell-number');
        cellEl.innerHTML = '';
        if (numSpan) cellEl.appendChild(numSpan);
        cellEl.classList.remove('wrong-cell');
      }
    } else {
      this.movePrev();
    }
    window.soundEngine.playKey();
  }

  moveNext() {
    let nextR = this.selectedRow;
    let nextC = this.selectedCol;

    if (this.direction === 'across') {
      nextC++;
    } else {
      nextR++;
    }

    if (nextR < this.levelData.rows && nextC < this.levelData.cols) {
      if (this.solutionMatrix[nextR][nextC] !== null) {
        this.selectCell(nextR, nextC);
      }
    }
  }

  movePrev() {
    let prevR = this.selectedRow;
    let prevC = this.selectedCol;

    if (this.direction === 'across') {
      prevC--;
    } else {
      prevR--;
    }

    if (prevR >= 0 && prevC >= 0) {
      if (this.solutionMatrix[prevR][prevC] !== null) {
        this.selectCell(prevR, prevC);
      }
    }
  }

  useHint() {
    if (this.hintsLeft <= 0) return false;
    if (this.selectedRow < 0 || this.selectedCol < 0) return false;

    const correctChar = this.solutionMatrix[this.selectedRow][this.selectedCol];
    if (correctChar === null) return false;

    this.hintsLeft--;
    this.hintCountDisplay.textContent = this.hintsLeft;
    this.inputChar(correctChar);
    
    const cellEl = this.getCellEl(this.selectedRow, this.selectedCol);
    if (cellEl) cellEl.classList.add('correct-cell');

    return true;
  }

  checkWord() {
    const activeClue = this.findClueForCell(this.selectedRow, this.selectedCol, this.direction);
    if (!activeClue) return;

    let isWordCorrect = true;
    for (let i = 0; i < activeClue.len; i++) {
      const r = activeClue.dir === 'across' ? activeClue.row : activeClue.row + i;
      const c = activeClue.dir === 'across' ? activeClue.col + i : activeClue.col;
      
      const userChar = this.gridMatrix[r][c];
      const correctChar = this.solutionMatrix[r][c];
      
      const cellEl = this.getCellEl(r, c);
      if (userChar !== correctChar) {
        isWordCorrect = false;
        if (cellEl) cellEl.classList.add('wrong-cell');
      } else {
        if (cellEl) cellEl.classList.add('correct-cell');
      }
    }

    if (!isWordCorrect) {
      window.soundEngine.playWrong();
      window.appController.showWrongModal();
    } else {
      window.soundEngine.playCorrect();
      this.score += 50;
      this.updateScoreDisplay();
    }
  }

  checkAll() {
    let hasError = false;
    let isComplete = true;

    const rows = this.levelData.rows;
    const cols = this.levelData.cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.solutionMatrix[r][c] !== null) {
          const userChar = this.gridMatrix[r][c];
          const correctChar = this.solutionMatrix[r][c];
          const cellEl = this.getCellEl(r, c);

          if (userChar === '' || userChar !== correctChar) {
            hasError = true;
            isComplete = false;
            if (cellEl && userChar !== '') {
              cellEl.classList.add('wrong-cell');
            }
          } else {
            if (cellEl) cellEl.classList.add('correct-cell');
          }
        }
      }
    }

    if (hasError) {
      window.soundEngine.playWrong();
      window.appController.showWrongModal();
    } else if (isComplete) {
      this.stopTimer();
      window.soundEngine.playVictory();
      this.score += 200;
      this.updateScoreDisplay();
      window.appController.showVictoryModal(this.timerDisplay.textContent, this.score);
    }
  }

  updateScoreDisplay() {
    this.scoreDisplay.textContent = this.score;
  }
}

window.ttsEngine = new TTSEngine();
