/**
 * KOPI TUBRUK - Minimalist Binance 5M Candlestick AI Prediction Terminal
 * Real Binance 5m Kline API + WebSocket Stream + MA(7, 25, 99) Indicators
 * Autonomous Prediction Trading Engine with Fast-Flip Reversal Strategy
 */

(function () {
  'use strict';

  // --- 1. COIN REGISTRY ---
  const COINS = [
    { symbol: 'BTC', name: 'Bitcoin', precision: 2, binancePair: 'BTCUSDT', defaultPrice: 65000 },
    { symbol: 'ETH', name: 'Ethereum', precision: 2, binancePair: 'ETHUSDT', defaultPrice: 3500 },
    { symbol: 'SOL', name: 'Solana', precision: 3, binancePair: 'SOLUSDT', defaultPrice: 150 },
    { symbol: 'XRP', name: 'Ripple', precision: 4, binancePair: 'XRPUSDT', defaultPrice: 0.60 },
    { symbol: 'DOGE', name: 'Dogecoin', precision: 5, binancePair: 'DOGEUSDT', defaultPrice: 0.12 }
  ];

  // --- 2. GLOBAL STATE ---
  const state = {
    selectedCoin: COINS[0],
    roundDurationMinutes: 5,
    currentPrice: null,
    previousPrice: null,
    price24hChange: 0,
    strikePrice: null,
    strikeLockedAt: null,
    currentRoundId: null,
    roundStartTime: null,
    roundEndTime: null,
    currentTheme: 'theme-dark',
    
    // Binance 5m Candlestick Buffer
    candles5m: [], // [{time, open, high, low, close, volume, isClosed, ma7, ma25, ma99}]
    activeKline: null,
    hoveredCandle: null,

    // Implied Polymarket Odds
    marketOddsYes: 0.50,
    marketOddsNo: 0.50,
    bullScore: 50,
    bearScore: 50,

    // Autonomous Portfolio Simulator
    portfolio: {
      startingCapital: 20.00,
      cashBalance: 20.00,
      activePosition: null, // { id, roundId, coin, side, entryPrice, shares, cost, entryTime, isReversed, initialSide, lossIncurred, projectedNetProfit }
      tradeHistory: [],
      totalTrades: 0,
      wins: 0,
      losses: 0,
      cumulativePnl: 0.00
    },

    // Rendering optimization
    needsRender: true,
    canvasDims: { w: 900, h: 420, dpr: 1 }
  };

  // --- 3. DOM ELEMENTS CACHE ---
  const dom = {
    coinTabs: document.querySelectorAll('.coin-tab'),
    headerLivePrice: document.getElementById('headerLivePrice'),
    headerPriceChange: document.getElementById('headerPriceChange'),
    headerStrikePrice: document.getElementById('headerStrikePrice'),
    headerTimerBox: document.getElementById('headerTimerBox'),
    headerTimerVal: document.getElementById('headerTimerVal'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),

    chartPairTitle: document.getElementById('chartPairTitle'),
    ohlcOpen: document.getElementById('ohlcOpen'),
    ohlcHigh: document.getElementById('ohlcHigh'),
    ohlcLow: document.getElementById('ohlcLow'),
    ohlcClose: document.getElementById('ohlcClose'),
    ohlcVol: document.getElementById('ohlcVol'),
    valMa7: document.getElementById('valMa7'),
    valMa25: document.getElementById('valMa25'),
    valMa99: document.getElementById('valMa99'),
    polymarketOddsPill: document.getElementById('polymarketOddsPill'),

    chartContainer: document.getElementById('chartContainer'),
    binanceCandleCanvas: document.getElementById('binanceCandleCanvas'),

    agentStatusBadge: document.getElementById('agentStatusBadge'),
    currentRoundIdTag: document.getElementById('currentRoundIdTag'),
    posSideText: document.getElementById('posSideText'),
    posEntryText: document.getElementById('posEntryText'),
    posSharesText: document.getElementById('posSharesText'),
    posCostText: document.getElementById('posCostText'),
    posCurrentValText: document.getElementById('posCurrentValText'),
    posPnlText: document.getElementById('posPnlText'),
    strategyReasoningText: document.getElementById('strategyReasoningText'),

    inputCapital: document.getElementById('inputCapital'),
    btnResetPort: document.getElementById('btnResetPort'),
    portTotalEquity: document.getElementById('portTotalEquity'),
    portCashBalance: document.getElementById('portCashBalance'),
    portNetPnl: document.getElementById('portNetPnl'),
    portWinRate: document.getElementById('portWinRate'),
    biasBullPct: document.getElementById('biasBullPct'),
    biasBearPct: document.getElementById('biasBearPct'),
    biasFillBar: document.getElementById('biasFillBar'),

    btnClearHistory: document.getElementById('btnClearHistory'),
    tradeHistoryBody: document.getElementById('tradeHistoryBody'),
    localClock: document.getElementById('localClock')
  };

  // --- 4. FORMATTING & MATH UTILITIES ---
  function formatPrice(val, precision = 2) {
    if (val === null || isNaN(val)) return '$--';
    return '$' + Number(val).toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  }

  function formatTime(timestamp, includeSeconds = false) {
    const d = new Date(timestamp);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    if (!includeSeconds) return `${h}:${m}`;
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) p = 1 - p;
    return p;
  }

  function calculateBinaryMarketOdds(spot, strike, remainingMs) {
    if (!spot || !strike || strike <= 0) return { yesOdds: 0.50, noOdds: 0.50 };
    const remainingMins = Math.max(0.05, remainingMs / 60000);
    const sigma = spot * 0.0012 * Math.sqrt(5);
    const zScore = (spot - strike) / (sigma * Math.sqrt(remainingMins / 5) + 0.0001);
    let probYes = normalCDF(zScore);
    probYes = Math.max(0.02, Math.min(0.98, probYes));
    return {
      yesOdds: parseFloat(probYes.toFixed(2)),
      noOdds: parseFloat((1 - probYes).toFixed(2))
    };
  }

  // --- 5. BINANCE 5M KLINE API & WEBSOCKET ENGINE ---
  let wsBinance = null;

  async function loadHistoricalBinanceKlines() {
    const pair = state.selectedCoin.binancePair;
    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=5m&limit=48`);
      if (res.ok) {
        const rawKlines = await res.json();
        state.candles5m = rawKlines.map(k => ({
          time: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
          isClosed: true
        }));

        if (state.candles5m.length > 0) {
          const latest = state.candles5m[state.candles5m.length - 1];
          state.currentPrice = latest.close;
          if (state.strikePrice === null) {
            state.strikePrice = latest.close;
            state.strikeLockedAt = Date.now();
          }
        }
        computeMovingAverages();
        state.needsRender = true;
      }
    } catch (err) {
      console.warn('Failed fetching historical klines:', err);
    }
  }

  function connectBinanceStream() {
    if (wsBinance) { try { wsBinance.close(); } catch (e) {} }

    const pairLower = state.selectedCoin.binancePair.toLowerCase();
    const streamName = `${pairLower}@kline_5m/${pairLower}@ticker`;
    
    try {
      wsBinance = new WebSocket(`https://stream.binance.com:9443/ws/${streamName}`);
      wsBinance.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 24h Ticker Update
          if (data.e === '24hrTicker') {
            state.price24hChange = parseFloat(data.P);
          }
          
          // 5m Kline Live Update
          if (data.e === 'kline') {
            const k = data.k;
            const klineObj = {
              time: k.t,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v),
              isClosed: k.x
            };

            state.currentPrice = klineObj.close;
            if (state.strikePrice === null) {
              state.strikePrice = klineObj.close;
              state.strikeLockedAt = Date.now();
            }

            // Update or push candle in buffer
            const lastIdx = state.candles5m.length - 1;
            if (lastIdx >= 0 && state.candles5m[lastIdx].time === klineObj.time) {
              state.candles5m[lastIdx] = klineObj;
            } else {
              state.candles5m.push(klineObj);
              if (state.candles5m.length > 55) state.candles5m.shift();
            }

            computeMovingAverages();
            state.needsRender = true;
          }
        } catch (err) {}
      };

      wsBinance.onerror = () => setTimeout(connectBinanceStream, 3000);
      wsBinance.onclose = () => setTimeout(connectBinanceStream, 3000);
    } catch (e) {
      setTimeout(connectBinanceStream, 4000);
    }
  }

  // Authentic Binance Moving Average Calculations (MA7, MA25, MA99)
  function computeMovingAverages() {
    const closes = state.candles5m.map(c => c.close);
    const n = closes.length;

    const calcSMA = (period) => {
      const res = new Array(n).fill(null);
      for (let i = period - 1; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += closes[i - j];
        res[i] = sum / period;
      }
      return res;
    };

    const ma7 = calcSMA(7);
    const ma25 = calcSMA(25);
    const ma99 = calcSMA(99);

    for (let i = 0; i < n; i++) {
      state.candles5m[i].ma7 = ma7[i];
      state.candles5m[i].ma25 = ma25[i];
      state.candles5m[i].ma99 = ma99[i];
    }

    const latest = state.candles5m[n - 1];
    const precision = state.selectedCoin.precision;
    if (latest) {
      if (dom.valMa7) dom.valMa7.textContent = latest.ma7 ? formatPrice(latest.ma7, precision) : '--';
      if (dom.valMa25) dom.valMa25.textContent = latest.ma25 ? formatPrice(latest.ma25, precision) : '--';
      if (dom.valMa99) dom.valMa99.textContent = latest.ma99 ? formatPrice(latest.ma99, precision) : '--';
    }
  }

  // --- 6. ROUND BOUNDARIES & 5M TIMER ENGINE ---
  function calculateCurrentRoundBoundaries() {
    const now = Date.now();
    const intervalMs = 5 * 60 * 1000;
    const start = Math.floor(now / intervalMs) * intervalMs;
    const end = start + intervalMs;
    const roundNumber = Math.floor(start / intervalMs) % 10000;

    return { startTime: start, endTime: end, roundId: `5M-${roundNumber}` };
  }

  function syncRoundState() {
    const { startTime, endTime, roundId } = calculateCurrentRoundBoundaries();

    if (state.currentRoundId !== roundId) {
      if (state.currentRoundId !== null && state.strikePrice !== null && state.currentPrice !== null) {
        settleSimPositionAtRoundEnd(state.currentPrice, state.strikePrice);
      }

      state.currentRoundId = roundId;
      state.roundStartTime = startTime;
      state.roundEndTime = endTime;

      state.strikePrice = state.currentPrice || state.selectedCoin.defaultPrice;
      state.strikeLockedAt = startTime;
      state.needsRender = true;
    }

    if (dom.currentRoundIdTag) dom.currentRoundIdTag.textContent = `RONDE #${roundId}`;
    if (dom.headerStrikePrice) dom.headerStrikePrice.textContent = formatPrice(state.strikePrice, state.selectedCoin.precision);
  }

  function updateTimerCountdown() {
    const now = Date.now();
    syncRoundState();

    const remainingMs = Math.max(0, state.roundEndTime - now);
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    const tenths = Math.floor((remainingMs % 1000) / 100);

    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
    if (dom.headerTimerVal) dom.headerTimerVal.textContent = timeStr;

    if (dom.headerTimerBox) {
      if (remainingMs <= 15000) dom.headerTimerBox.style.borderColor = 'var(--binance-red)';
      else if (remainingMs <= 45000) dom.headerTimerBox.style.borderColor = 'var(--binance-gold)';
      else dom.headerTimerBox.style.borderColor = 'var(--border-color)';
    }

    if (dom.localClock) dom.localClock.textContent = `Waktu: ${formatTime(now, true)} WIB`;
  }

  // --- 7. THROTTLED DOM METRICS & AI EVALUATION ---
  function updateThrottledMetrics() {
    if (!state.currentPrice) return;
    const precision = state.selectedCoin.precision;

    // Header Price & Change
    if (dom.headerLivePrice) dom.headerLivePrice.textContent = formatPrice(state.currentPrice, precision);
    if (dom.headerPriceChange) {
      const change = state.price24hChange;
      const isUp = change >= 0;
      dom.headerPriceChange.textContent = `${isUp ? '+' : ''}${change.toFixed(2)}%`;
      dom.headerPriceChange.className = `stat-change ${isUp ? 'text-green' : 'text-red'}`;
    }

    // Update OHLC Header Bar (Active or Hovered Candle)
    const activeC = state.hoveredCandle || (state.candles5m.length > 0 ? state.candles5m[state.candles5m.length - 1] : null);
    if (activeC) {
      if (dom.ohlcOpen) dom.ohlcOpen.textContent = formatPrice(activeC.open, precision);
      if (dom.ohlcHigh) dom.ohlcHigh.textContent = formatPrice(activeC.high, precision);
      if (dom.ohlcLow) dom.ohlcLow.textContent = formatPrice(activeC.low, precision);
      if (dom.ohlcClose) dom.ohlcClose.textContent = formatPrice(activeC.close, precision);
      if (dom.ohlcVol) dom.ohlcVol.textContent = activeC.volume.toFixed(2);
    }

    // AI Evaluation & Polymarket Odds
    evaluateAITradingEngine();
    updateSimulatorMarkToMarket();
  }

  // --- 8. AUTONOMOUS AI PREDICTION & REVERSAL FAST-FLIP ENGINE ---
  function evaluateAITradingEngine() {
    if (!state.currentPrice || !state.strikePrice) return;
    const now = Date.now();
    const remainingMs = Math.max(0, state.roundEndTime - now);
    const totalRoundMs = 5 * 60 * 1000;
    const elapsedPct = ((totalRoundMs - remainingMs) / totalRoundMs) * 100;

    // Implied Polymarket Odds
    const { yesOdds, noOdds } = calculateBinaryMarketOdds(state.currentPrice, state.strikePrice, remainingMs);
    state.marketOddsYes = yesOdds;
    state.marketOddsNo = noOdds;

    if (dom.polymarketOddsPill) {
      dom.polymarketOddsPill.textContent = `Polymarket: YES ${(yesOdds * 100).toFixed(0)}¢ | NO ${(noOdds * 100).toFixed(0)}¢`;
    }

    // Technical Factors on Binance 5M Candle
    const deltaStrike = state.currentPrice - state.strikePrice;
    const deltaStrikePct = (deltaStrike / state.strikePrice) * 100;
    
    let bullScore = 50;
    if (deltaStrikePct > 0) bullScore += Math.min(30, deltaStrikePct * 150);
    else bullScore -= Math.min(30, Math.abs(deltaStrikePct) * 150);

    const latestCandle = state.candles5m[state.candles5m.length - 1];
    if (latestCandle && latestCandle.ma7) {
      if (state.currentPrice > latestCandle.ma7) bullScore += 10;
      else bullScore -= 10;
    }

    bullScore = Math.max(10, Math.min(90, Math.round(bullScore)));
    const bearScore = 100 - bullScore;
    state.bullScore = bullScore;
    state.bearScore = bearScore;

    if (dom.biasBullPct) dom.biasBullPct.textContent = `${bullScore}%`;
    if (dom.biasBearPct) dom.biasBearPct.textContent = `${bearScore}%`;
    if (dom.biasFillBar) dom.biasFillBar.style.width = `${bullScore}%`;

    // Strategy Reasoning Text
    let reasoning = '';
    if (bullScore >= 65) {
      reasoning = `KONSENSUS BULL: Harga berada +${deltaStrikePct.toFixed(3)}% di atas strike baseline ($${state.strikePrice.toFixed(2)}) didukung MA(7). Posisi YES memiliki keunggulan probabilitas.`;
    } else if (bearScore >= 65) {
      reasoning = `KONSENSUS BEAR: Harga tertahan -${Math.abs(deltaStrikePct).toFixed(3)}% di bawah strike baseline. Tekanan jual mendominasi candle 5m. Posisi NO memiliki statistical edge.`;
    } else {
      reasoning = `ANALISIS NETRAL: Harga berosilasi di sekitar strike ($${state.strikePrice.toFixed(2)}). Menunggu breakout konfirmasi.`;
    }
    if (dom.strategyReasoningText) dom.strategyReasoningText.textContent = reasoning;

    // Trading Window: between 6% and 85% of round time
    const isTradingWindowOpen = elapsedPct >= 6 && elapsedPct <= 85;
    if (isTradingWindowOpen) {
      // Check Reversal Flip first
      checkAndExecuteReversalProtection(bullScore, bearScore, yesOdds, noOdds, remainingMs);

      // Open new trade if no position
      if (!state.portfolio.activePosition && state.portfolio.cashBalance >= 1.00) {
        if (bullScore >= 65 && yesOdds <= 0.70) {
          executeSimOrder('YES', yesOdds);
        } else if (bearScore >= 65 && noOdds <= 0.70) {
          executeSimOrder('NO', noOdds);
        }
      }
    }
  }

  function executeSimOrder(side, contractPrice) {
    const p = state.portfolio;
    let alloc = p.cashBalance * 0.25;
    alloc = Math.max(1.00, Math.min(alloc, p.cashBalance));
    const sharePrice = Math.max(0.05, Math.min(0.95, contractPrice));
    const shares = parseFloat((alloc / sharePrice).toFixed(2));

    p.cashBalance = parseFloat((p.cashBalance - alloc).toFixed(2));
    p.activePosition = {
      id: `TR-${Date.now().toString().slice(-4)}`,
      roundId: state.currentRoundId,
      coin: state.selectedCoin.symbol,
      side: side,
      initialSide: side,
      entryPrice: sharePrice,
      shares: shares,
      cost: parseFloat(alloc.toFixed(2)),
      entryTime: Date.now(),
      isReversed: false,
      lossIncurred: 0.00
    };

    updateSimulatorUI();
  }

  // ⚡ FAST-FLIP REVERSAL STRATEGY
  function checkAndExecuteReversalProtection(bullScore, bearScore, yesOdds, noOdds, remainingMs) {
    const p = state.portfolio;
    if (!p.activePosition) return;
    const pos = p.activePosition;
    if (pos.isReversed) return;
    if (remainingMs < 20000) return; // Need at least 20s for profitable reversal flip

    const currentContractPrice = pos.side === 'YES' ? yesOdds : noOdds;
    const currentVal = pos.shares * currentContractPrice;
    const unrealizedLoss = pos.cost - currentVal;
    const drawdownPct = (unrealizedLoss / pos.cost) * 100;

    let shouldReverse = false;
    let targetOppositeSide = '';
    let targetOppositeOdds = 0;

    if (pos.side === 'YES') {
      const isBelowStrike = state.currentPrice < state.strikePrice;
      if (isBelowStrike && bearScore >= 65 && drawdownPct >= 18.0) {
        shouldReverse = true;
        targetOppositeSide = 'NO';
        targetOppositeOdds = noOdds;
      }
    } else if (pos.side === 'NO') {
      const isAboveStrike = state.currentPrice >= state.strikePrice;
      if (isAboveStrike && bullScore >= 65 && drawdownPct >= 18.0) {
        shouldReverse = true;
        targetOppositeSide = 'YES';
        targetOppositeOdds = yesOdds;
      }
    }

    if (!shouldReverse) return;

    // Step 1: Jual Cepat (Fast Cut-Loss)
    const salvagedCash = parseFloat(currentVal.toFixed(2));
    const realizedLossOnFirstLeg = parseFloat((pos.cost - salvagedCash).toFixed(2));
    p.cashBalance = parseFloat((p.cashBalance + salvagedCash).toFixed(2));

    // Step 2: Hitung Lembar Sisi Lawan untuk Target Net Profit Positif
    const flipContractPrice = Math.max(0.08, Math.min(0.92, targetOppositeOdds));
    const desiredSurplus = Math.max(0.50, realizedLossOnFirstLeg * 0.25);
    const targetNetProfit = realizedLossOnFirstLeg + desiredSurplus;
    
    let requiredShares = targetNetProfit / (1.00 - flipContractPrice);
    let requiredFlipCost = requiredShares * flipContractPrice;

    if (requiredFlipCost > p.cashBalance) {
      requiredFlipCost = p.cashBalance;
      requiredShares = requiredFlipCost / flipContractPrice;
    }

    if (requiredFlipCost < 0.50) {
      p.tradeHistory.unshift({
        time: formatTime(Date.now(), true),
        roundId: pos.roundId,
        coin: pos.coin,
        strike: state.strikePrice,
        close: state.currentPrice,
        side: `${pos.side} (CUT-LOSS)`,
        cost: pos.cost,
        won: false,
        netPnl: -realizedLossOnFirstLeg,
        equityAfter: p.cashBalance
      });
      p.activePosition = null;
      renderTradeHistoryTable();
      updateSimulatorUI();
      return;
    }

    p.cashBalance = parseFloat((p.cashBalance - requiredFlipCost).toFixed(2));
    const finalShares = parseFloat(requiredShares.toFixed(2));
    const finalCost = parseFloat(requiredFlipCost.toFixed(2));
    const projectedNetRoundProfit = (finalShares * 1.00) - finalCost - realizedLossOnFirstLeg;

    // Mutate position into REVERSED position
    p.activePosition = {
      id: `FLIP-${Date.now().toString().slice(-4)}`,
      roundId: state.currentRoundId,
      coin: state.selectedCoin.symbol,
      side: targetOppositeSide,
      initialSide: pos.side,
      entryPrice: flipContractPrice,
      shares: finalShares,
      cost: finalCost,
      entryTime: Date.now(),
      isReversed: true,
      lossIncurred: realizedLossOnFirstLeg,
      projectedNetProfit: parseFloat(projectedNetRoundProfit.toFixed(2))
    };

    updateSimulatorUI();
  }

  function updateSimulatorMarkToMarket() {
    const p = state.portfolio;
    if (!p.activePosition) {
      updateSimulatorUI();
      return;
    }

    const pos = p.activePosition;
    const remainingMs = Math.max(0, state.roundEndTime - Date.now());
    const { yesOdds, noOdds } = calculateBinaryMarketOdds(state.currentPrice, state.strikePrice, remainingMs);
    const currentContractPrice = pos.side === 'YES' ? yesOdds : noOdds;

    const currentVal = pos.shares * currentContractPrice;
    const currentLegPnl = currentVal - pos.cost;
    const totalRoundPnl = pos.isReversed ? (currentLegPnl - pos.lossIncurred) : currentLegPnl;

    if (dom.agentStatusBadge) {
      if (pos.isReversed) {
        dom.agentStatusBadge.className = 'pos-badge reversed';
        dom.agentStatusBadge.textContent = `🔄 REVERSAL & FLIP KE ${pos.side} (${pos.shares} Lembar | Target Profit: +$${pos.projectedNetProfit || '0.00'})`;
      } else {
        dom.agentStatusBadge.className = `pos-badge ${pos.side === 'YES' ? 'buy-yes' : 'buy-no'}`;
        dom.agentStatusBadge.textContent = `⚡ POSISI AKTIF: BUY ${pos.side} (${pos.shares} Lembar @ ${(pos.entryPrice * 100).toFixed(0)}¢)`;
      }
    }

    if (dom.posSideText) dom.posSideText.textContent = pos.isReversed ? `${pos.side} (FLIP DARI ${pos.initialSide})` : pos.side;
    if (dom.posEntryText) dom.posEntryText.textContent = `${(pos.entryPrice * 100).toFixed(0)}¢`;
    if (dom.posSharesText) dom.posSharesText.textContent = `${pos.shares} sh`;
    if (dom.posCostText) dom.posCostText.textContent = `$${pos.cost.toFixed(2)}`;
    if (dom.posCurrentValText) dom.posCurrentValText.textContent = `$${currentVal.toFixed(2)} (${(currentContractPrice * 100).toFixed(0)}¢)`;

    const pnlSign = totalRoundPnl >= 0 ? '+' : '-';
    if (dom.posPnlText) {
      dom.posPnlText.className = `p-val ${totalRoundPnl >= 0 ? 'text-green' : 'text-red'}`;
      dom.posPnlText.textContent = `${pnlSign}$${Math.abs(totalRoundPnl).toFixed(2)} (${pnlSign}${Math.abs((totalRoundPnl / pos.cost) * 100).toFixed(1)}%)`;
    }

    const totalEquity = p.cashBalance + currentVal;
    const netPnl = totalEquity - p.startingCapital;
    const netPnlPct = (netPnl / p.startingCapital) * 100;

    if (dom.portTotalEquity) dom.portTotalEquity.textContent = `$${totalEquity.toFixed(2)}`;
    if (dom.portCashBalance) dom.portCashBalance.textContent = `$${p.cashBalance.toFixed(2)}`;
    
    const netSign = netPnl >= 0 ? '+' : '-';
    if (dom.portNetPnl) {
      dom.portNetPnl.className = `port-num ${netPnl >= 0 ? 'text-green' : 'text-red'}`;
      dom.portNetPnl.textContent = `${netSign}$${Math.abs(netPnl).toFixed(2)} (${netSign}${Math.abs(netPnlPct).toFixed(1)}%)`;
    }
  }

  function settleSimPositionAtRoundEnd(roundClosePrice, roundStrikePrice) {
    const p = state.portfolio;
    if (!p.activePosition) return;

    const pos = p.activePosition;
    const isCloseUp = roundClosePrice >= roundStrikePrice;
    const won = (pos.side === 'YES' && isCloseUp) || (pos.side === 'NO' && !isCloseUp);

    const payout = won ? pos.shares * 1.00 : 0.00;
    const netPnl = won 
      ? (payout - pos.cost - (pos.lossIncurred || 0.00))
      : (-pos.cost - (pos.lossIncurred || 0.00));

    p.cashBalance = parseFloat((p.cashBalance + payout).toFixed(2));
    p.cumulativePnl += netPnl;
    p.totalTrades++;
    if (netPnl >= 0) p.wins++;
    else p.losses++;

    p.tradeHistory.unshift({
      time: formatTime(Date.now(), true),
      roundId: pos.roundId,
      coin: pos.coin,
      strike: roundStrikePrice,
      close: roundClosePrice,
      side: pos.isReversed ? `${pos.side} (FLIP)` : pos.side,
      cost: pos.cost,
      won: won,
      netPnl: netPnl,
      equityAfter: p.cashBalance
    });

    if (p.tradeHistory.length > 50) p.tradeHistory.pop();
    p.activePosition = null;
    renderTradeHistoryTable();
    updateSimulatorUI();
  }

  function updateSimulatorUI() {
    const p = state.portfolio;
    const inTradeVal = p.activePosition ? p.activePosition.cost : 0.00;
    const equity = p.cashBalance + inTradeVal;
    const netPnl = equity - p.startingCapital;
    const netPnlPct = (netPnl / p.startingCapital) * 100;

    if (dom.portTotalEquity) dom.portTotalEquity.textContent = `$${equity.toFixed(2)}`;
    if (dom.portCashBalance) dom.portCashBalance.textContent = `$${p.cashBalance.toFixed(2)}`;

    const netSign = netPnl >= 0 ? '+' : '-';
    if (dom.portNetPnl) {
      dom.portNetPnl.className = `port-num ${netPnl >= 0 ? 'text-green' : 'text-red'}`;
      dom.portNetPnl.textContent = `${netSign}$${Math.abs(netPnl).toFixed(2)} (${netSign}${Math.abs(netPnlPct).toFixed(1)}%)`;
    }

    const winRate = p.totalTrades > 0 ? ((p.wins / p.totalTrades) * 100).toFixed(0) : 0;
    if (dom.portWinRate) dom.portWinRate.textContent = `${winRate}% (${p.wins}W / ${p.losses}L)`;

    if (!p.activePosition) {
      if (dom.agentStatusBadge) {
        dom.agentStatusBadge.className = 'pos-badge idle';
        dom.agentStatusBadge.textContent = '⏳ MENGANALISIS PASAR (MENUNGGU KONFIRMASI TREND)';
      }
      if (dom.posSideText) dom.posSideText.textContent = '--';
      if (dom.posEntryText) dom.posEntryText.textContent = '--';
      if (dom.posSharesText) dom.posSharesText.textContent = '--';
      if (dom.posCostText) dom.posCostText.textContent = '--';
      if (dom.posCurrentValText) dom.posCurrentValText.textContent = '--';
      if (dom.posPnlText) {
        dom.posPnlText.className = 'p-val';
        dom.posPnlText.textContent = '--';
      }
    }
  }

  function renderTradeHistoryTable() {
    const p = state.portfolio;
    if (!dom.tradeHistoryBody) return;
    if (p.tradeHistory.length === 0) {
      dom.tradeHistoryBody.innerHTML = `<tr class="empty-row"><td colspan="9">Belum ada trade yang selesai. AI akan otomatis membuka posisi dan mencatat hasil di sini...</td></tr>`;
      return;
    }

    const precision = state.selectedCoin.precision;
    dom.tradeHistoryBody.innerHTML = p.tradeHistory.map(t => {
      const pnlSign = t.netPnl >= 0 ? '+' : '-';
      const pnlClass = t.netPnl >= 0 ? 'text-green' : 'text-red';
      const tagClass = t.won ? 'win' : 'loss';
      const sideTagClass = t.side.includes('YES') ? 'yes' : (t.side.includes('NO') ? 'no' : 'reversed');

      return `
        <tr>
          <td>${t.time}</td>
          <td><strong>${t.coin}</strong> #${t.roundId}</td>
          <td>${formatPrice(t.strike, precision)}</td>
          <td>${formatPrice(t.close, precision)}</td>
          <td><span class="tag ${sideTagClass}">${t.side}</span></td>
          <td>$${t.cost.toFixed(2)}</td>
          <td><span class="tag ${tagClass}">${t.won ? 'WIN' : 'LOSS'}</span></td>
          <td class="${pnlClass}">${pnlSign}$${Math.abs(t.netPnl).toFixed(2)}</td>
          <td><strong>$${t.equityAfter.toFixed(2)}</strong></td>
        </tr>
      `;
    }).join('');
  }

  // --- 9. AUTHENTIC BINANCE 5M CANDLESTICK CANVAS RENDERER ---
  function cacheCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    if (dom.chartContainer && dom.binanceCandleCanvas) {
      const rect = dom.chartContainer.getBoundingClientRect();
      state.canvasDims = { w: rect.width, h: rect.height, dpr };
      dom.binanceCandleCanvas.width = rect.width * dpr;
      dom.binanceCandleCanvas.height = rect.height * dpr;
      state.needsRender = true;
    }
  }

  function renderBinanceCandlestickChart() {
    const canvas = dom.binanceCandleCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h, dpr } = state.canvasDims;
    ctx.save();
    ctx.scale(dpr, dpr);

    const isDark = document.body.classList.contains('theme-dark');
    ctx.fillStyle = isDark ? '#0f141d' : '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (state.candles5m.length < 2) {
      ctx.restore();
      return;
    }

    const axisWidth = 72;
    const chartW = w - axisWidth;
    const chartH = h - 20;

    const highs = state.candles5m.map(c => c.high);
    const lows = state.candles5m.map(c => c.low);
    const volumes = state.candles5m.map(c => c.volume || 1);
    if (state.strikePrice) { highs.push(state.strikePrice); lows.push(state.strikePrice); }

    const minP = Math.min(...lows);
    const maxP = Math.max(...highs);
    const maxVol = Math.max(...volumes, 5);
    const precision = state.selectedCoin.precision;

    const pad = Math.max((maxP - minP) * 0.12, state.currentPrice ? state.currentPrice * 0.0005 : 1);
    const yMin = minP - pad;
    const yMax = maxP + pad;
    const yRange = yMax - yMin;

    const mainPlotH = chartH * 0.78;
    const volPlotH = chartH * 0.18;
    const getY = (val) => mainPlotH - ((val - yMin) / yRange) * (mainPlotH - 24) - 10;
    const numCandles = state.candles5m.length;
    const candleWidth = Math.max(5, Math.min(16, (chartW - 20) / numCandles - 4));
    const stepX = (chartW - 20) / numCandles;

    // Right Y-Axis Divider Line
    ctx.strokeStyle = isDark ? '#26334a' : '#e6e8eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartW, 0);
    ctx.lineTo(chartW, h);
    ctx.stroke();

    // Horizontal Price Grid Lines & Axis Labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 4; i++) {
      const priceVal = yMin + (yRange / 4) * i;
      const gy = getY(priceVal);

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(chartW, gy);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#5e6673' : '#99a1ad';
      ctx.fillText(formatPrice(priceVal, precision), chartW + 6, gy);
    }

    // Draw Volume Bars
    state.candles5m.forEach((c, idx) => {
      const cx = 10 + idx * stepX + stepX / 2;
      const isGreen = c.close >= c.open;
      const volHeight = Math.max(2, (c.volume / maxVol) * volPlotH);
      ctx.fillStyle = isGreen ? 'rgba(14, 203, 129, 0.35)' : 'rgba(246, 70, 93, 0.35)';
      ctx.fillRect(cx - candleWidth / 2, chartH - volHeight, candleWidth, volHeight);
    });

    // Strike Baseline (Golden Amber)
    if (state.strikePrice) {
      const sy = getY(state.strikePrice);
      ctx.save();
      ctx.strokeStyle = '#f0b90b';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(chartW, sy);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#f0b90b';
      ctx.fillRect(chartW, sy - 8, axisWidth, 16);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`K:${formatPrice(state.strikePrice, precision).replace('$', '')}`, chartW + 4, sy);
    }

    // Candlesticks (Binance Green #0ecb81, Red #f6465d)
    state.candles5m.forEach((c, idx) => {
      const cx = 10 + idx * stepX + stepX / 2;
      const isGreen = c.close >= c.open;
      const candleColor = isGreen ? '#0ecb81' : '#f6465d';
      const openY = getY(c.open);
      const closeY = getY(c.close);

      // Wick
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, getY(c.high));
      ctx.lineTo(cx, getY(c.low));
      ctx.stroke();

      // Body
      ctx.fillStyle = candleColor;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2.5, Math.abs(closeY - openY));
      ctx.fillRect(cx - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw Binance Moving Averages (MA7 Yellow, MA25 Purple, MA99 Cyan)
    const drawMALine = (key, color) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      state.candles5m.forEach((c, idx) => {
        if (c[key] !== null && c[key] !== undefined) {
          const cx = 10 + idx * stepX + stepX / 2;
          const cy = getY(c[key]);
          if (!started) { ctx.moveTo(cx, cy); started = true; }
          else ctx.lineTo(cx, cy);
        }
      });
      if (started) ctx.stroke();
      ctx.restore();
    };

    drawMALine('ma7', '#f0b90b');
    drawMALine('ma25', '#9353d3');
    drawMALine('ma99', '#00bcd4');

    // Live Price Line & Tag on Right Y-Axis
    if (state.currentPrice) {
      const cy = getY(state.currentPrice);
      const isAbove = state.strikePrice ? state.currentPrice >= state.strikePrice : true;
      const badgeBg = isAbove ? '#0ecb81' : '#f6465d';

      ctx.save();
      ctx.strokeStyle = badgeBg;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(chartW, cy);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = badgeBg;
      ctx.fillRect(chartW, cy - 9, axisWidth, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(formatPrice(state.currentPrice, precision), chartW + 4, cy);
    }

    // X-Axis Time Markers
    ctx.fillStyle = isDark ? '#5e6673' : '#99a1ad';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const intervalTicks = Math.max(1, Math.floor(numCandles / 7));
    for (let i = 0; i < numCandles; i += intervalTicks) {
      const cx = 10 + i * stepX + stepX / 2;
      ctx.fillText(formatTime(state.candles5m[i].time), cx, h - 4);
    }

    ctx.restore();
  }

  function startRenderLoop() {
    function loop() {
      if (state.needsRender) {
        renderBinanceCandlestickChart();
        state.needsRender = false;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // --- 10. THEME & EVENT HANDLERS ---
  function applyTheme(themeName) {
    state.currentTheme = themeName;
    document.body.className = themeName;
    localStorage.setItem('kopi_tubruk_theme', themeName);
    if (dom.themeIcon) dom.themeIcon.textContent = themeName === 'theme-dark' ? '🌙' : '☀️';
    state.needsRender = true;
  }

  function toggleTheme() {
    applyTheme(state.currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark');
  }

  function setupEventListeners() {
    if (dom.themeToggle) dom.themeToggle.addEventListener('click', toggleTheme);

    // Coin Switching
    dom.coinTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        const symbol = this.dataset.coin;
        const selected = COINS.find(c => c.symbol === symbol);
        if (selected && selected !== state.selectedCoin) {
          dom.coinTabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');

          state.selectedCoin = selected;
          state.currentPrice = null;
          state.strikePrice = null;
          state.candles5m = [];
          state.hoveredCandle = null;

          if (dom.chartPairTitle) dom.chartPairTitle.textContent = `${selected.symbol}/USDT • 5m • Binance`;

          loadHistoricalBinanceKlines();
          connectBinanceStream();
          syncRoundState();
        }
      });
    });

    // Capital Input & Reset
    if (dom.inputCapital) {
      dom.inputCapital.addEventListener('input', function () {
        const val = parseFloat(this.value);
        if (!isNaN(val) && val >= 1) {
          state.portfolio.startingCapital = val;
          state.portfolio.cashBalance = val;
          state.portfolio.activePosition = null;
          state.portfolio.tradeHistory = [];
          state.portfolio.totalTrades = 0;
          state.portfolio.wins = 0;
          state.portfolio.losses = 0;
          state.portfolio.cumulativePnl = 0.00;
          updateSimulatorUI();
          renderTradeHistoryTable();
        }
      });
    }

    if (dom.btnResetPort) {
      dom.btnResetPort.addEventListener('click', function () {
        const defaultCap = 20.00;
        if (dom.inputCapital) dom.inputCapital.value = defaultCap.toFixed(2);
        state.portfolio.startingCapital = defaultCap;
        state.portfolio.cashBalance = defaultCap;
        state.portfolio.activePosition = null;
        state.portfolio.tradeHistory = [];
        state.portfolio.totalTrades = 0;
        state.portfolio.wins = 0;
        state.portfolio.losses = 0;
        state.portfolio.cumulativePnl = 0.00;
        updateSimulatorUI();
        renderTradeHistoryTable();
      });
    }

    if (dom.btnClearHistory) {
      dom.btnClearHistory.addEventListener('click', function () {
        state.portfolio.tradeHistory = [];
        renderTradeHistoryTable();
      });
    }

    window.addEventListener('resize', cacheCanvasSize);

    // Interactive Hover on Candlesticks
    if (dom.binanceCandleCanvas) {
      dom.binanceCandleCanvas.addEventListener('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const axisWidth = 72;
        const chartW = rect.width - axisWidth;
        const numCandles = state.candles5m.length;
        if (numCandles < 2) return;

        const stepX = (chartW - 20) / numCandles;
        const idx = Math.floor((mouseX - 10) / stepX);
        if (idx >= 0 && idx < numCandles) {
          state.hoveredCandle = state.candles5m[idx];
          updateThrottledMetrics();
        }
      });

      dom.binanceCandleCanvas.addEventListener('mouseleave', function () {
        state.hoveredCandle = null;
        updateThrottledMetrics();
      });
    }
  }

  // --- 11. INITIALIZATION ---
  async function init() {
    const savedTheme = localStorage.getItem('kopi_tubruk_theme') || 'theme-dark';
    applyTheme(savedTheme);

    setupEventListeners();
    cacheCanvasSize();
    updateSimulatorUI();
    renderTradeHistoryTable();
    syncRoundState();

    await loadHistoricalBinanceKlines();
    connectBinanceStream();

    setInterval(updateTimerCountdown, 100);
    setInterval(updateThrottledMetrics, 100);
    startRenderLoop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
