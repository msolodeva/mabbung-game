(() => {
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status-text');
  const moveListEl = document.getElementById('move-list');
  const evalFillEl = document.getElementById('eval-fill');
  const evalScoreEl = document.getElementById('eval-score');
  const depthEl = document.getElementById('info-depth');
  const npsEl = document.getElementById('info-nps');
  const pvEl = document.getElementById('info-pv');
  const eloDisplay = document.getElementById('elo-display');
  const eloValue = document.getElementById('elo-value');
  const depthValue = document.getElementById('depth-value');
  
  const modalEloSlider = document.getElementById('modal-elo');
  const modalDepthSlider = document.getElementById('modal-depth');
  const modalEloValue = document.getElementById('modal-elo-value');
  const modalDepthValue = document.getElementById('modal-depth-value');

  const game = new Chess();
  let orientation = 'w';
  let playerColor = null;
  let selectedSquare = null;
  let legalTargets = new Set();
  let lastMove = null;
  let engineBusy = false;
  let capturedPieces = { w: [], b: [] };
  let gameEnded = false;
  let gameElo = 800;
  let gameDepth = 5;

  const unicodePieces = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
  };

  // Convert Elo rating to Stockfish skill level (0-20)
  function eloToSkill(elo) {
    // Approximation based on Stockfish skill levels
    // Elo 400 = Skill 0, Elo 2850 = Skill 20
    const skill = Math.round((elo - 400) / 122.5);
    return Math.max(0, Math.min(20, skill));
  }

  // Sound effects using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  function playSelectSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  function playMoveSound(isCapture = false) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (isCapture) {
      // Capture sound - lower and more dramatic
      oscillator.frequency.value = 400;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } else {
      // Regular move sound
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.12);
    }
  }

  function buildBoard() {
    boardEl.innerHTML = '';
    const ranks = orientation === 'w' ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8];
    const files = orientation === 'w' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];

    ranks.forEach((rank, rIdx) => {
      files.forEach((file, fIdx) => {
        const squareName = `${file}${rank}`;
        const square = document.createElement('div');
        square.className = `square ${ (rIdx + fIdx) % 2 === 0 ? 'light' : 'dark' }`;
        square.dataset.square = squareName;
        square.addEventListener('click', () => onSquareClick(squareName));

        // Add rank coordinate on the left edge
        if (fIdx === 0) {
          const rankLabel = document.createElement('div');
          rankLabel.className = 'coord rank-coord';
          rankLabel.textContent = rank;
          square.appendChild(rankLabel);
        }

        // Add file coordinate on the bottom edge
        if (rIdx === ranks.length - 1) {
          const fileLabel = document.createElement('div');
          fileLabel.className = 'coord file-coord';
          fileLabel.textContent = file;
          square.appendChild(fileLabel);
        }

        boardEl.appendChild(square);
      });
    });
  }

  function animatePieceMove(from, to, callback) {
    const fromSquare = boardEl.querySelector(`[data-square="${from}"]`);
    const toSquare = boardEl.querySelector(`[data-square="${to}"]`);

    if (!fromSquare || !toSquare) {
      callback();
      return;
    }

    // Get piece from the from square
    const pieceText = Array.from(fromSquare.childNodes).find(
      node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );

    if (!pieceText) {
      callback();
      return;
    }

    // Create a flying piece element
    const flyingPiece = document.createElement('div');
    flyingPiece.className = 'flying-piece';
    flyingPiece.textContent = pieceText.textContent;
    
    // Add color class based on piece color
    const pieceColor = fromSquare.getAttribute('data-piece-color');
    if (pieceColor === 'w') {
      flyingPiece.classList.add('white-piece');
    } else if (pieceColor === 'b') {
      flyingPiece.classList.add('black-piece');
    }

    const fromRect = fromSquare.getBoundingClientRect();
    const toRect = toSquare.getBoundingClientRect();

    flyingPiece.style.left = fromRect.left + 'px';
    flyingPiece.style.top = fromRect.top + 'px';
    flyingPiece.style.width = fromRect.width + 'px';
    flyingPiece.style.height = fromRect.height + 'px';

    document.body.appendChild(flyingPiece);

    // Hide the original piece
    pieceText.textContent = '';

    // Animate after a frame
    requestAnimationFrame(() => {
      flyingPiece.style.left = toRect.left + 'px';
      flyingPiece.style.top = toRect.top + 'px';

      setTimeout(() => {
        document.body.removeChild(flyingPiece);
        callback();
      }, 300);
    });
  }

  function renderBoard(skipAnimation = false) {
    const squares = boardEl.querySelectorAll('.square');
    squares.forEach((squareEl) => {
      const square = squareEl.dataset.square;
      const piece = game.get(square);

      // Find existing piece text (not coord labels)
      const existingPiece = Array.from(squareEl.childNodes).find(
        node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
      );
      const newPieceText = piece ? unicodePieces[piece.color][piece.type] : '';

      // Update piece text
      if (existingPiece) {
        existingPiece.textContent = newPieceText;
      } else if (newPieceText) {
        squareEl.appendChild(document.createTextNode(newPieceText));
      }

      // Set piece color data attribute for styling
      if (piece) {
        squareEl.setAttribute('data-piece-color', piece.color);
      } else {
        squareEl.removeAttribute('data-piece-color');
      }

      const isLegal = legalTargets.has(square);
      squareEl.classList.toggle('legal', isLegal);
      squareEl.classList.toggle('capture', isLegal && piece);
      squareEl.classList.toggle('selected', square === selectedSquare);
      squareEl.classList.toggle(
        'last-move',
        lastMove && (square === lastMove.from || square === lastMove.to),
      );
      
      // Highlight king in check
      const isKingInCheck = game.in_check() && piece && piece.type === 'k' && piece.color === game.turn();
      squareEl.classList.toggle('in-check', isKingInCheck);
    });
  }

  function onSquareClick(square) {
    if (engineBusy || gameEnded || !playerColor) {
      return;
    }

    const piece = game.get(square);
    const playerTurn = game.turn() === playerColor;

    if (selectedSquare && legalTargets.has(square)) {
      attemptMove(selectedSquare, square);
      return;
    }

    if (!piece || piece.color !== playerColor || !playerTurn) {
      clearSelection();
      renderBoard();
      return;
    }

    if (selectedSquare === square) {
      clearSelection();
      renderBoard();
      return;
    }

    selectedSquare = square;
    updateLegalTargets(square);
    renderBoard();
    playSelectSound();
  }

  function updateLegalTargets(fromSquare) {
    legalTargets.clear();
    const moves = game.moves({ square: fromSquare, verbose: true });
    moves.forEach((move) => {
      legalTargets.add(move.to);
    });
  }

  function clearSelection() {
    selectedSquare = null;
    legalTargets.clear();
  }

  function attemptMove(from, to) {
    const promotion = determinePromotion(from, to);
    const move = game.move({ from, to, promotion });
    if (!move) {
      return;
    }

    // Undo the move temporarily to animate
    game.undo();

    // Animate the piece movement
    animatePieceMove(from, to, () => {
      // Re-apply the move after animation
      game.move({ from, to, promotion });

      // Play sound effect
      playMoveSound(!!move.captured);

      // Track captured piece
      if (move.captured) {
        capturedPieces[move.color].push(move.captured);
        updateCapturedPieces();
      }

      lastMove = { from: move.from, to: move.to };
      clearSelection();
      renderBoard();
      updateMoveList();
      updateStatus();

      if (!checkForGameEnd()) {
        requestEngineMove();
      }
    });
  }

  function determinePromotion(from, to) {
    const move = game.moves({ square: from, verbose: true }).find((m) => m.to === to);
    if (move && move.promotion) {
      return move.promotion;
    }
    const piece = game.get(from);
    if (piece && piece.type === 'p') {
      if ((piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1'))) {
        return 'q';
      }
    }
    return undefined;
  }

  function requestEngineMove() {
    engineBusy = true;
    statusEl.textContent = 'Stockfish가 생각 중입니다…';
    toggleControls(true);

    const skill = eloToSkill(gameElo);

    const payload = {
      fen: game.fen(),
      skill: skill,
      depth: gameDepth,
    };

    fetch('/api/best-move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`엔진 오류: ${res.status}`);
        }
        return res.json();
      })
      .then(handleEngineResponse)
      .catch((error) => {
        console.error(error);
        statusEl.textContent = '엔진과 통신할 수 없습니다.';
      })
      .finally(() => {
        engineBusy = false;
        toggleControls(false);
      });
  }

  function handleEngineResponse(result) {
    if (!result || result.error) {
      statusEl.textContent = result?.error || '엔진 오류';
      return;
    }

    const { move, info } = result;
    if (!move || move === '(none)') {
      statusEl.textContent = '엔진이 수를 찾지 못했습니다.';
      return;
    }

    const from = move.slice(0, 2);
    const to = move.slice(2, 4);
    const promotion = move.length > 4 ? move.slice(4) : undefined;
    const played = game.move({ from, to, promotion });
    if (!played) {
      statusEl.textContent = '엔진 수를 적용할 수 없습니다.';
      return;
    }

    // Undo the move temporarily to animate
    game.undo();

    // Animate the piece movement
    animatePieceMove(from, to, () => {
      // Re-apply the move after animation
      const replayed = game.move({ from, to, promotion });

      // Play sound effect
      playMoveSound(!!replayed.captured);

      // Track captured piece
      if (replayed.captured) {
        capturedPieces[replayed.color].push(replayed.captured);
        updateCapturedPieces();
      }

      lastMove = { from: replayed.from, to: replayed.to };
      renderBoard();
      updateMoveList();
      updateStatus();
      applyEngineInfo(info);
      checkForGameEnd();
    });
  }

  function applyEngineInfo(info = {}) {
    const depthValue = info.depth || '-';
    const npsValue = info.nps ? formatNps(info.nps) : '-';
    const pvValue = info.pv || '-';

    depthEl.textContent = depthValue;
    npsEl.textContent = npsValue;
    pvEl.textContent = pvValue;

    let scoreDisplay = '0.0';
    let percent = 50;
    if (info.mate) {
      const mateIn = Number(info.mate);
      scoreDisplay = `M${Math.abs(mateIn)}`;
      percent = mateIn > 0 ? 95 : 5;
    } else if (info.score) {
      const score = Number(info.score);
      if (!Number.isNaN(score)) {
        scoreDisplay = score.toFixed(2);
        percent = Math.max(0, Math.min(100, 50 + score * 12));
      }
    }
    evalScoreEl.textContent = scoreDisplay;
    evalFillEl.style.width = `${percent}%`;
  }

  function formatNps(value) {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}k`;
    }
    return num.toString();
  }

  function updateCapturedPieces() {
    const capturedWhiteEl = document.getElementById('captured-white');
    const capturedBlackEl = document.getElementById('captured-black');

    // Sort pieces by value: p, n, b, r, q
    const pieceOrder = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    const sortPieces = (pieces) => pieces.sort((a, b) => pieceOrder[a] - pieceOrder[b]);

    // White pieces captured by black (shown in black's area)
    capturedWhiteEl.innerHTML = sortPieces([...capturedPieces.b])
      .map(type => `<span>${unicodePieces.w[type]}</span>`)
      .join('');

    // Black pieces captured by white (shown in white's area)
    capturedBlackEl.innerHTML = sortPieces([...capturedPieces.w])
      .map(type => `<span>${unicodePieces.b[type]}</span>`)
      .join('');
  }

  function updateMoveList() {
    const history = game.history({ verbose: true });
    moveListEl.innerHTML = '';
    history.forEach((move, index) => {
      const turn = Math.floor(index / 2) + 1;
      const prefix = index % 2 === 0 ? `${turn}.` : `${turn}…`;
      const li = document.createElement('li');
      li.textContent = `${prefix} ${move.san}`;
      if (index === history.length - 1) {
        li.classList.add('current');
      }
      moveListEl.appendChild(li);
    });
    moveListEl.scrollTop = moveListEl.scrollHeight;
  }

  function updateStatus() {
    if (game.in_checkmate()) {
      const winner = game.turn() === playerColor ? 'Stockfish' : '당신';
      statusEl.textContent = `체크메이트! ${winner} 승`;
      statusEl.style.color = '#ff5252';
      return;
    }
    if (game.in_draw()) {
      statusEl.textContent = '무승부';
      statusEl.style.color = 'var(--muted)';
      return;
    }
    if (game.in_check()) {
      statusEl.textContent = '⚠️ 체크! 왕을 보호하세요!';
      statusEl.style.color = '#ff5252';
      return;
    }
    statusEl.style.color = 'var(--muted)';
    statusEl.textContent = game.turn() === playerColor ? '당신의 차례입니다.' : 'Stockfish가 생각 중입니다…';
  }

  function checkForGameEnd() {
    if (game.game_over()) {
      gameEnded = true;
      updateStatus();
      showGameOverModal();
      return true;
    }
    return false;
  }

  function showGameOverModal() {
    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');
    
    if (game.in_checkmate()) {
      const winner = game.turn() === playerColor ? 'Stockfish' : '당신';
      title.textContent = '체크메이트!';
      message.textContent = `${winner}이(가) 승리했습니다!`;
    } else if (game.in_draw()) {
      title.textContent = '무승부';
      message.textContent = '게임이 무승부로 종료되었습니다.';
    } else if (game.in_stalemate()) {
      title.textContent = '스테일메이트';
      message.textContent = '더 이상 유효한 수가 없습니다.';
    }
    
    modal.classList.remove('hidden');
  }

  function toggleControls(disabled) {
    document.getElementById('new-game').disabled = disabled;
    document.getElementById('undo').disabled = disabled;
    document.getElementById('resign').disabled = disabled;
    document.getElementById('flip').disabled = disabled;
    document.getElementById('hint').disabled = disabled;
  }

  function newGame() {
    game.reset();
    lastMove = null;
    capturedPieces = { w: [], b: [] };
    gameEnded = false;
    playerColor = null;
    clearSelection();
    renderBoard(true);
    updateMoveList();
    updateCapturedPieces();
    applyEngineInfo();
    showColorSelectionModal();
  }

  function showColorSelectionModal() {
    const modal = document.getElementById('color-selection-modal');
    modal.classList.remove('hidden');
  }

  function selectColor(color) {
    playerColor = color;
    orientation = color;
    
    // Save game settings from modal
    gameElo = Number(modalEloSlider.value);
    gameDepth = Number(modalDepthSlider.value);
    
    // Update display
    eloValue.textContent = gameElo;
    depthValue.textContent = gameDepth;
    eloDisplay.textContent = gameElo;
    
    const modal = document.getElementById('color-selection-modal');
    modal.classList.add('hidden');
    
    updatePlayerCards();
    buildBoard();
    renderBoard();
    updateStatus();
    
    if (playerColor === 'b') {
      requestEngineMove();
    }
  }

  function updatePlayerCards() {
    const playerWhite = document.getElementById('player-white');
    const playerBlack = document.getElementById('player-black');
    
    if (playerColor === 'w') {
      playerWhite.querySelector('.avatar').textContent = 'YOU';
      playerWhite.querySelector('.avatar').classList.remove('bot');
      playerWhite.querySelector('.avatar').classList.add('human');
      playerWhite.querySelector('.name').textContent = 'You';
      
      playerBlack.querySelector('.avatar').textContent = 'SF';
      playerBlack.querySelector('.avatar').classList.remove('human');
      playerBlack.querySelector('.avatar').classList.add('bot');
      playerBlack.querySelector('.name').textContent = 'Stockfish';
    } else {
      playerBlack.querySelector('.avatar').textContent = 'YOU';
      playerBlack.querySelector('.avatar').classList.remove('bot');
      playerBlack.querySelector('.avatar').classList.add('human');
      playerBlack.querySelector('.name').textContent = 'You';
      
      playerWhite.querySelector('.avatar').textContent = 'SF';
      playerWhite.querySelector('.avatar').classList.remove('human');
      playerWhite.querySelector('.avatar').classList.add('bot');
      playerWhite.querySelector('.name').textContent = 'Stockfish';
    }
  }

  function undoMove() {
    if (engineBusy) return;
    const last1 = game.undo();
    const last2 = game.undo();
    if (!last1) return;

    // Remove captured pieces for undone moves
    if (last1?.captured) {
      const idx = capturedPieces[last1.color].lastIndexOf(last1.captured);
      if (idx !== -1) capturedPieces[last1.color].splice(idx, 1);
    }
    if (last2?.captured) {
      const idx = capturedPieces[last2.color].lastIndexOf(last2.captured);
      if (idx !== -1) capturedPieces[last2.color].splice(idx, 1);
    }

    lastMove = null;
    renderBoard(true);
    updateMoveList();
    updateStatus();
    updateCapturedPieces();
  }

  function flipBoard() {
    orientation = orientation === 'w' ? 'b' : 'w';
    buildBoard();
    renderBoard();
  }

  function resignGame() {
    if (engineBusy || gameEnded) return;

    const confirmResign = confirm('정말 기권하시겠습니까?');
    if (!confirmResign) return;

    gameEnded = true;
    statusEl.textContent = '당신이 기권했습니다. Stockfish 승!';
    clearSelection();
    renderBoard();
    
    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');
    title.textContent = '기권';
    message.textContent = '당신이 기권했습니다. Stockfish가 승리했습니다!';
    modal.classList.remove('hidden');
  }

  function requestHint() {
    if (engineBusy) return;
    engineBusy = true;
    statusEl.textContent = '힌트를 계산 중입니다…';
    toggleControls(true);

    const skill = eloToSkill(gameElo);

    const payload = {
      fen: game.fen(),
      skill: skill,
      depth: gameDepth,
    };
    fetch('/api/best-move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error('힌트를 불러오지 못했습니다.');
        return res.json();
      })
      .then((result) => {
        engineBusy = false;
        toggleControls(false);
        if (result?.move) {
          statusEl.textContent = `추천 수: ${result.move}`;
        } else {
          statusEl.textContent = '힌트를 제공할 수 없습니다.';
        }
      })
      .catch((error) => {
        console.error(error);
        statusEl.textContent = '힌트를 가져오지 못했습니다.';
      })
      .finally(() => {
        engineBusy = false;
        toggleControls(false);
      });
  }

  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('undo').addEventListener('click', undoMove);
  document.getElementById('resign').addEventListener('click', resignGame);
  document.getElementById('flip').addEventListener('click', () => {
    flipBoard();
  });
  document.getElementById('hint').addEventListener('click', requestHint);

  document.getElementById('select-white').addEventListener('click', () => selectColor('w'));
  document.getElementById('select-black').addEventListener('click', () => selectColor('b'));
  
  document.getElementById('rematch-btn').addEventListener('click', () => {
    document.getElementById('game-over-modal').classList.add('hidden');
    newGame();
  });
  
  document.getElementById('review-btn').addEventListener('click', () => {
    document.getElementById('game-over-modal').classList.add('hidden');
    gameEnded = false;
  });

  modalEloSlider.addEventListener('input', () => {
    modalEloValue.textContent = modalEloSlider.value;
  });

  modalDepthSlider.addEventListener('input', () => {
    modalDepthValue.textContent = modalDepthSlider.value;
  });

  buildBoard();
  renderBoard(true);
  updateMoveList();
  updateCapturedPieces();
  applyEngineInfo();
  showColorSelectionModal();
})();
