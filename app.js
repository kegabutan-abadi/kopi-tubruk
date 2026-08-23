/**
 * KOPI TUBRUK - Professional TradingView 5M Candlestick AI Prediction Terminal
 * Powered by LightweightCharts (TradingView Library) + Live Binance WebSocket
 * Autonomous Prediction Trading Engine with Fast-Flip Reversal Protection
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

    // Raw Candlestick Buffer
    candles5m: [], // [{time (unix sec), open, high, low, close, volume}]
    
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
    }
  };

  // --- 3. DOM ELEMENTS CACHE ---
  const dom = {
    coinTabs: document.querySelectorAll('.coin-btn'),
    topLivePrice: document.getElementById('topLivePrice'),
    topPriceChange: document.getElementById('topPriceChange'),
    topStrikePrice: document.getElementById('topStrikePrice'),
    topTimer: document.getElementById('topTimer'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),

    chartPairName: document.getElementById('chartPairName'),
    valO: document.getElementById('valO'),
    valH: document.getElementById('valH'),
    valL: document.getElementById('valL'),
    valC: document.getElementById('valC'),
    ma7Val: document.getElementById('ma7Val'),
    ma25Val: document.getElementById('ma25Val'),
    tvChartContainer: document.getElementById('tvChartContainer'),

    currentRoundTag: document.getElementById('currentRoundTag'),
    oddsYesCents: document.getElementById('oddsYesCents'),
    oddsYesTarget: document.getElementById('oddsYesTarget'),
    oddsNoCents: document.getElementById('oddsNoCents'),
    oddsNoTarget: document.getElementById('oddsNoTarget'),
    oddsBarFill: document.getElementById('oddsBarFill'),

    consensusPill: document.getElementById('consensusPill'),
    bullScoreText: document.getElementById('bullScoreText'),
    bearScoreText: document.getElementById('bearScoreText'),
    sentimentFill: document.getElementById('sentimentFill'),
    actionVerdict: document.getElementById('actionVerdict'),
    actionRationale: document.getElementById('actionRationale'),

    posStatusPill: document.getElementById('posStatusPill'),
    valPosSide: document.getElementById('valPosSide'),
    valPosEntry: document.getElementById('valPosEntry'),
    valPosShares: document.getElementById('valPosShares'),
    valPosCost: document.getElementById('valPosCost'),
    valPosCurrent: document.getElementById('valPosCurrent'),
    valPosPnl: document.getElementById('valPosPnl'),

    valTotalEquity: document.getElementById('valTotalEquity'),
    valCashBalance: document.getElementById('valCashBalance'),
    valNetPnl: document.getElementById('valNetPnl'),
    valWinRate: document.getElementById('valWinRate'),
    inputCapital: document.getElementById('inputCapital'),
    btnResetPort: document.getElementById('btnResetPort'),

    btnClearHistory: document.getElementById('btnClearHistory'),
    tradeHistoryBody: document.getElementById('tradeHistoryBody'),
    footerClock: document.getElementById('footerClock')
  };

  // --- 4. FORMATTING UTILITIES ---
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

  // --- 5. TRADINGVIEW LIGHTWEIGHT CHARTS ENGINE ---
  let tvChart = null;
  let candleSeries = null;
  let volumeSeries = null;
  let ma7Series = null;
  let ma25Series = null;
  let strikePriceLine = null;

  function initTradingViewChart() {
    if (!dom.tvChartContainer || !window.LightweightCharts) return;

    if (tvChart) {
      try { tvChart.remove(); } catch (e) {}
    }

    const isDark = document.body.classList.contains('theme-dark');
    const bg = isDark ? '#0b0e14' : '#ffffff';
    const textColor = isDark ? '#8c9ba5' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';

    tvChart = LightweightCharts.createChart(dom.tvChartContainer, {
      layout: {
        background: { color: bg },
        textColor: textColor,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor }
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
        vertLine: { width: 1, color: '#f0b90b', style: LightweightCharts.LineStyle.Dashed },
        horzLine: { width: 1, color: '#f0b90b', style: LightweightCharts.LineStyle.Dashed }
      },
      rightPriceScale: {
        borderColor: isDark ? '#1f293d' : '#e2e8f0',
        scaleMargins: { top: 0.1, bottom: 0.2 }
      },
      timeScale: {
        borderColor: isDark ? '#1f293d' : '#e2e8f0',
        timeVisible: true,
        secondsVisible: false
      }
    });

    // 1. Candlestick Series (Exact Binance Pro Green & Red)
    candleSeries = tvChart.addCandlestickSeries({
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d'
    });

    // 2. Volume Series at bottom
    volumeSeries = tvChart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 }
    });

    // 3. MA(7) Yellow Line
    ma7Series = tvChart.addLineSeries({
      color: '#f0b90b',
      lineWidth: 1.5,
      priceLineVisible: false
    });

    // 4. MA(25) Purple Line
    ma25Series = tvChart.addLineSeries({
      color: '#9353d3',
      lineWidth: 1.5,
      priceLineVisible: false
    });

    // Crosshair legend update
    tvChart.subscribeCrosshairMove(param => {
      const precision = state.selectedCoin.precision;
      if (!param || !param.time || !param.seriesData) {
        if (state.candles5m.length > 0) {
          const latest = state.candles5m[state.candles5m.length - 1];
          if (dom.valO) dom.valO.textContent = formatPrice(latest.open, precision);
          if (dom.valH) dom.valH.textContent = formatPrice(latest.high, precision);
          if (dom.valL) dom.valL.textContent = formatPrice(latest.low, precision);
          if (dom.valC) dom.valC.textContent = formatPrice(latest.close, precision);
        }
        return;
      }
      const data = param.seriesData.get(candleSeries);
      if (data) {
        if (dom.valO) dom.valO.textContent = formatPrice(data.open, precision);
        if (dom.valH) dom.valH.textContent = formatPrice(data.high, precision);
        if (dom.valL) dom.valL.textContent = formatPrice(data.low, precision);
        if (dom.valC) dom.valC.textContent = formatPrice(data.close, precision);
      }
    });

    // Resize observer
    window.addEventListener('resize', () => {
      if (tvChart && dom.tvChartContainer) {
        const rect = dom.tvChartContainer.getBoundingClientRect();
        tvChart.applyOptions({ width: rect.width, height: rect.height });
      }
    });
  }

  function updateStrikePriceLineOnChart() {
    if (!candleSeries || !state.strikePrice) return;
    if (strikePriceLine) {
      try { candleSeries.removePriceLine(strikePriceLine); } catch (e) {}
    }
    strikePriceLine = candleSeries.createPriceLine({
      price: state.strikePrice,
      color: '#f0b90b',
      lineWidth: 1.5,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'STRIKE 5M'
    });
  }

  // Calculate Moving Averages for LightweightCharts
  function calculateSMAData(data, period) {
    const res = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) continue;
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j].close;
      res.push({ time: data[i].time, value: sum / period });
    }
    return res;
  }

  // --- 6. BINANCE 5M KLINE API & WEBSOCKET ENGINE ---
  let wsBinance = null;

  async function loadHistoricalBinanceKlines() {
    const pair = state.selectedCoin.binancePair;
    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=5m&limit=60`);
      if (res.ok) {
        const raw = await res.json();
        state.candles5m = raw.map(k => ({
          time: Math.floor(k[0] / 1000), // Unix seconds for lightweight-charts
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5])
        }));

        if (state.candles5m.length > 0) {
          const latest = state.candles5m[state.candles5m.length - 1];
          state.currentPrice = latest.close;
          if (state.strikePrice === null) {
            state.strikePrice = latest.close;
            state.strikeLockedAt = Date.now();
          }

          // Populate chart series
          candleSeries.setData(state.candles5m);
          volumeSeries.setData(state.candles5m.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)'
          })));

          const ma7Data = calculateSMAData(state.candles5m, 7);
          const ma25Data = calculateSMAData(state.candles5m, 25);
          ma7Series.setData(ma7Data);
          ma25Series.setData(ma25Data);

          if (ma7Data.length > 0) dom.ma7Val.textContent = formatPrice(ma7Data[ma7Data.length - 1].value, state.selectedCoin.precision);
          if (ma25Data.length > 0) dom.ma25Val.textContent = formatPrice(ma25Data[ma25Data.length - 1].value, state.selectedCoin.precision);

          updateStrikePriceLineOnChart();
          tvChart.timeScale().fitContent();
        }
      }
    } catch (e) {
      console.warn('Kline fetch error:', e);
    }
  }

  function connectBinanceStream() {
    if (wsBinance) { try { wsBinance.close(); } catch (e) {} }

    const pairLower = state.selectedCoin.binancePair.toLowerCase();
    const url = `https://stream.binance.com:9443/ws/${pairLower}@kline_5m/${pairLower}@ticker`;

    try {
      wsBinance = new WebSocket(url);
      wsBinance.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.e === '24hrTicker') {
            state.price24hChange = parseFloat(data.P);
          }

          if (data.e === 'kline' && data.k) {
            const k = data.k;
            const candle = {
              time: Math.floor(k.t / 1000),
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v)
            };

            state.currentPrice = candle.close;
            if (state.strikePrice === null) {
              state.strikePrice = candle.close;
              state.strikeLockedAt = Date.now();
              updateStrikePriceLineOnChart();
            }

            // Real-time update into Lightweight Charts
            candleSeries.update(candle);
            volumeSeries.update({
              time: candle.time,
              value: candle.volume,
              color: candle.close >= candle.open ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)'
            });

            // Update in-memory array
            const lastIdx = state.candles5m.length - 1;
            if (lastIdx >= 0 && state.candles5m[lastIdx].time === candle.time) {
              state.candles5m[lastIdx] = candle;
            } else {
              state.candles5m.push(candle);
              if (state.candles5m.length > 70) state.candles5m.shift();
            }

            // Real-time MA updates
            const ma7Data = calculateSMAData(state.candles5m, 7);
            const ma25Data = calculateSMAData(state.candles5m, 25);
            if (ma7Data.length > 0) {
              ma7Series.update(ma7Data[ma7Data.length - 1]);
              dom.ma7Val.textContent = formatPrice(ma7Data[ma7Data.length - 1].value, state.selectedCoin.precision);
            }
            if (ma25Data.length > 0) {
              ma25Series.update(ma25Data[ma25Data.length - 1]);
              dom.ma25Val.textContent = formatPrice(ma25Data[ma25Data.length - 1].value, state.selectedCoin.precision);
            }
          }
        } catch (err) {}
      };

      wsBinance.onerror = () => setTimeout(connectBinanceStream, 3000);
      wsBinance.onclose = () => setTimeout(connectBinanceStream, 3000);
    } catch (e) {
      setTimeout(connectBinanceStream, 4000);
    }
  }

  // --- 7. ROUND BOUNDARIES & 5M TIMER ENGINE ---
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
      updateStrikePriceLineOnChart();
    }

    if (dom.currentRoundTag) dom.currentRoundTag.textContent = `RONDE #${roundId}`;
    if (dom.topStrikePrice) dom.topStrikePrice.textContent = formatPrice(state.strikePrice, state.selectedCoin.precision);
    if (dom.oddsYesTarget) dom.oddsYesTarget.textContent = `≥ ${formatPrice(state.strikePrice, state.selectedCoin.precision)}`;
    if (dom.oddsNoTarget) dom.oddsNoTarget.textContent = `< ${formatPrice(state.strikePrice, state.selectedCoin.precision)}`;
  }

  function updateTimerCountdown() {
    const now = Date.now();
    syncRoundState();

    const remainingMs = Math.max(0, state.roundEndTime - now);
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    const tenths = Math.floor((remainingMs % 1000) / 100);

    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
    if (dom.topTimer) dom.topTimer.textContent = timeStr;

    if (dom.footerClock) dom.footerClock.textContent = `${formatTime(now, true)} WIB`;
  }

  // --- 8. DOM METRICS & AI EVALUATION LOOP (100ms) ---
  function updateThrottledMetrics() {
    if (!state.currentPrice) return;
    const precision = state.selectedCoin.precision;

    // Header Price & 24h Change
    if (dom.topLivePrice) {
      dom.topLivePrice.textContent = formatPrice(state.currentPrice, precision);
      const isAboveStrike = state.strikePrice ? state.currentPrice >= state.strikePrice : true;
      dom.topLivePrice.className = `val ${isAboveStrike ? 'price-up' : 'price-down'}`;
    }

    if (dom.topPriceChange) {
      const change = state.price24hChange;
      const isUp = change >= 0;
      dom.topPriceChange.textContent = `${isUp ? '+' : ''}${change.toFixed(2)}%`;
      dom.topPriceChange.className = `badge-change ${isUp ? 'text-green' : 'text-red'}`;
    }

    // AI Evaluation & Mark to Market
    evaluateAITradingEngine();
    updateSimulatorMarkToMarket();
  }

  // --- 9. AUTONOMOUS AI PREDICTION & REVERSAL FAST-FLIP ENGINE ---
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

    if (dom.oddsYesCents) dom.oddsYesCents.textContent = `${(yesOdds * 100).toFixed(0)}¢`;
    if (dom.oddsNoCents) dom.oddsNoCents.textContent = `${(noOdds * 100).toFixed(0)}¢`;
    if (dom.oddsBarFill) dom.oddsBarFill.style.width = `${yesOdds * 100}%`;

    // Directional Factors on Binance 5M Candle
    const deltaStrike = state.currentPrice - state.strikePrice;
    const deltaStrikePct = (deltaStrike / state.strikePrice) * 100;
    
    let bullScore = 50;
    if (deltaStrikePct > 0) bullScore += Math.min(30, deltaStrikePct * 150);
    else bullScore -= Math.min(30, Math.abs(deltaStrikePct) * 150);

    const latestCandle = state.candles5m[state.candles5m.length - 1];
    if (latestCandle) {
      const ma7 = parseFloat(dom.ma7Val.textContent.replace(/[^0-9.]/g, ''));
      if (!isNaN(ma7) && state.currentPrice > ma7) bullScore += 10;
      else if (!isNaN(ma7) && state.currentPrice < ma7) bullScore -= 10;
    }

    bullScore = Math.max(10, Math.min(90, Math.round(bullScore)));
    const bearScore = 100 - bullScore;
    state.bullScore = bullScore;
    state.bearScore = bearScore;

    if (dom.bullScoreText) dom.bullScoreText.textContent = `${bullScore}%`;
    if (dom.bearScoreText) dom.bearScoreText.textContent = `${bearScore}%`;
    if (dom.sentimentFill) dom.sentimentFill.style.width = `${bullScore}%`;

    let verdict = 'STANDBY';
    let rationale = '';

    if (bullScore >= 65) {
      verdict = 'BUY YES (UP)';
      rationale = `KONSENSUS BULL: Harga berada +${deltaStrikePct.toFixed(3)}% di atas strike ($${state.strikePrice.toFixed(2)}) didukung momentum MA(7). Posisi YES memiliki keunggulan statistik (+EV).`;
      if (dom.consensusPill) { dom.consensusPill.textContent = 'KONSENSUS BULL'; dom.consensusPill.className = 'consensus-pill text-green'; }
    } else if (bearScore >= 65) {
      verdict = 'BUY NO (DOWN)';
      rationale = `KONSENSUS BEAR: Tekanan jual menahan harga -${Math.abs(deltaStrikePct).toFixed(3)}% di bawah strike baseline. Posisi NO memiliki probabilitas keunggulan tinggi.`;
      if (dom.consensusPill) { dom.consensusPill.textContent = 'KONSENSUS BEAR'; dom.consensusPill.className = 'consensus-pill text-red'; }
    } else {
      verdict = 'STANDBY (MENGANALISIS)';
      rationale = `DELIBERASI ARBITER: Belum ada asimetri statistik yang cukup antara Bull (${bullScore}%) dan Bear (${bearScore}%). Menunggu konfirmasi breakout.`;
      if (dom.consensusPill) { dom.consensusPill.textContent = 'DELIBERASI'; dom.consensusPill.className = 'consensus-pill'; }
    }

    if (dom.actionVerdict) dom.actionVerdict.textContent = verdict;
    if (dom.actionRationale) dom.actionRationale.textContent = rationale;

    // Trading Window: between 6% and 85% of round time
    const isTradingWindowOpen = elapsedPct >= 6 && elapsedPct <= 85;
    if (isTradingWindowOpen) {
      checkAndExecuteReversalProtection(bullScore, bearScore, yesOdds, noOdds, remainingMs);

      if (!state.portfolio.activePosition && state.portfolio.cashBalance >= 1.00) {
        if (bullScore >= 65 && yesOdds <= 0.70) executeSimOrder('YES', yesOdds);
        else if (bearScore >= 65 && noOdds <= 0.70) executeSimOrder('NO', noOdds);
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

  // ⚡ DYNAMIC FAST-FLIP REVERSAL STRATEGY
  function checkAndExecuteReversalProtection(bullScore, bearScore, yesOdds, noOdds, remainingMs) {
    const p = state.portfolio;
    if (!p.activePosition) return;
    const pos = p.activePosition;
    if (pos.isReversed) return;
    if (remainingMs < 20000) return;

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

    if (dom.posStatusPill) {
      if (pos.isReversed) {
        dom.posStatusPill.className = 'position-status-pill reversed';
        dom.posStatusPill.textContent = `🔄 FLIP KE ${pos.side} (${pos.shares} Lembar | Target Profit: +$${pos.projectedNetProfit || '0.00'})`;
      } else {
        dom.posStatusPill.className = `position-status-pill ${pos.side === 'YES' ? 'buy-yes' : 'buy-no'}`;
        dom.posStatusPill.textContent = `⚡ POSISI AKTIF: BUY ${pos.side} (${pos.shares} Lembar @ ${(pos.entryPrice * 100).toFixed(0)}¢)`;
      }
    }

    if (dom.valPosSide) dom.valPosSide.textContent = pos.isReversed ? `${pos.side} (FLIP)` : pos.side;
    if (dom.valPosEntry) dom.valPosEntry.textContent = `${(pos.entryPrice * 100).toFixed(0)}¢`;
    if (dom.valPosShares) dom.valPosShares.textContent = `${pos.shares} sh`;
    if (dom.valPosCost) dom.valPosCost.textContent = `$${pos.cost.toFixed(2)}`;
    if (dom.valPosCurrent) dom.valPosCurrent.textContent = `$${currentVal.toFixed(2)} (${(currentContractPrice * 100).toFixed(0)}¢)`;

    const pnlSign = totalRoundPnl >= 0 ? '+' : '-';
    if (dom.valPosPnl) {
      dom.valPosPnl.className = `p-val ${totalRoundPnl >= 0 ? 'text-green' : 'text-red'}`;
      dom.valPosPnl.textContent = `${pnlSign}$${Math.abs(totalRoundPnl).toFixed(2)} (${pnlSign}${Math.abs((totalRoundPnl / pos.cost) * 100).toFixed(1)}%)`;
    }

    const totalEquity = p.cashBalance + currentVal;
    const netPnl = totalEquity - p.startingCapital;
    const netPnlPct = (netPnl / p.startingCapital) * 100;

    if (dom.valTotalEquity) dom.valTotalEquity.textContent = `$${totalEquity.toFixed(2)}`;
    if (dom.valCashBalance) dom.valCashBalance.textContent = `$${p.cashBalance.toFixed(2)}`;
    
    const netSign = netPnl >= 0 ? '+' : '-';
    if (dom.valNetPnl) {
      dom.valNetPnl.className = `c-val ${netPnl >= 0 ? 'text-green' : 'text-red'}`;
      dom.valNetPnl.textContent = `${netSign}$${Math.abs(netPnl).toFixed(2)} (${netSign}${Math.abs(netPnlPct).toFixed(1)}%)`;
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

    if (dom.valTotalEquity) dom.valTotalEquity.textContent = `$${equity.toFixed(2)}`;
    if (dom.valCashBalance) dom.valCashBalance.textContent = `$${p.cashBalance.toFixed(2)}`;

    const netSign = netPnl >= 0 ? '+' : '-';
    if (dom.valNetPnl) {
      dom.valNetPnl.className = `c-val ${netPnl >= 0 ? 'text-green' : 'text-red'}`;
      dom.valNetPnl.textContent = `${netSign}$${Math.abs(netPnl).toFixed(2)} (${netSign}${Math.abs(netPnlPct).toFixed(1)}%)`;
    }

    const winRate = p.totalTrades > 0 ? ((p.wins / p.totalTrades) * 100).toFixed(0) : 0;
    if (dom.valWinRate) dom.valWinRate.textContent = `${winRate}% (${p.wins}W / ${p.losses}L)`;

    if (!p.activePosition) {
      if (dom.posStatusPill) {
        dom.posStatusPill.className = 'position-status-pill idle';
        dom.posStatusPill.textContent = 'BELUM ADA POSISI (MENUNGGU SINYAL KONSENSUS)';
      }
      if (dom.valPosSide) dom.valPosSide.textContent = '--';
      if (dom.valPosEntry) dom.valPosEntry.textContent = '--';
      if (dom.valPosShares) dom.valPosShares.textContent = '--';
      if (dom.valPosCost) dom.valPosCost.textContent = '--';
      if (dom.valPosCurrent) dom.valPosCurrent.textContent = '--';
      if (dom.valPosPnl) {
        dom.valPosPnl.className = 'p-val';
        dom.valPosPnl.textContent = '--';
      }
    }
  }

  function renderTradeHistoryTable() {
    const p = state.portfolio;
    if (!dom.tradeHistoryBody) return;
    if (p.tradeHistory.length === 0) {
      dom.tradeHistoryBody.innerHTML = `<tr class="empty-row"><td colspan="9">Belum ada trade yang selesai. AI akan otomatis mengeksekusi order dan mencatat audit di sini...</td></tr>`;
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

  // --- 10. THEME & EVENT HANDLERS ---
  function applyTheme(themeName) {
    state.currentTheme = themeName;
    document.body.className = themeName;
    localStorage.setItem('kopi_tubruk_theme', themeName);
    if (dom.themeIcon) dom.themeIcon.textContent = themeName === 'theme-dark' ? '🌙' : '☀️';

    if (tvChart) {
      const isDark = themeName === 'theme-dark';
      tvChart.applyOptions({
        layout: {
          background: { color: isDark ? '#0b0e14' : '#ffffff' },
          textColor: isDark ? '#8c9ba5' : '#4b5563'
        },
        grid: {
          vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' },
          horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' }
        },
        rightPriceScale: { borderColor: isDark ? '#1f293d' : '#e2e8f0' },
        timeScale: { borderColor: isDark ? '#1f293d' : '#e2e8f0' }
      });
    }
  }

  function toggleTheme() {
    applyTheme(state.currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark');
  }

  function setupEventListeners() {
    if (dom.themeToggle) dom.themeToggle.addEventListener('click', toggleTheme);

    // Coin Switching
    dom.coinTabs.forEach(tab => {
      tab.addEventListener('click', async function () {
        const symbol = this.dataset.coin;
        const selected = COINS.find(c => c.symbol === symbol);
        if (selected && selected !== state.selectedCoin) {
          dom.coinTabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');

          state.selectedCoin = selected;
          state.currentPrice = null;
          state.strikePrice = null;
          state.candles5m = [];

          if (dom.chartPairName) dom.chartPairName.textContent = `${selected.symbol}/USDT • 5m`;

          await loadHistoricalBinanceKlines();
          connectBinanceStream();
          syncRoundState();
        }
      });
    });

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
  }

  // --- 11. INITIALIZATION ---
  async function init() {
    initTradingViewChart();
    
    const savedTheme = localStorage.getItem('kopi_tubruk_theme') || 'theme-dark';
    applyTheme(savedTheme);

    setupEventListeners();
    updateSimulatorUI();
    renderTradeHistoryTable();
    syncRoundState();

    await loadHistoricalBinanceKlines();
    connectBinanceStream();

    setInterval(updateTimerCountdown, 100);
    setInterval(updateThrottledMetrics, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
