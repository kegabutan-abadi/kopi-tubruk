/**
 * KOPI TUBRUK - Dedicated Polymarket 5M UP/DOWN Prediction Terminal
 * Chart 1: Binance Spot Candlestick (1m / 5m) with TradingView LightweightCharts
 * Chart 2: Polymarket 5M UP/DOWN Probability (1m / 5m) with TradingView LightweightCharts
 * Global UI Zoom Scaling (A- / A+) + Chart Zoom + Resizable Layout + AI Fast-Flip Engine
 */

(function () {
  'use strict';

  // --- 1. COIN REGISTRY ---
  const COINS = [
    { symbol: 'BTC', name: 'Bitcoin', precision: 2, binancePair: 'BTCUSDT' },
    { symbol: 'ETH', name: 'Ethereum', precision: 2, binancePair: 'ETHUSDT' },
    { symbol: 'SOL', name: 'Solana', precision: 3, binancePair: 'SOLUSDT' },
    { symbol: 'XRP', name: 'Ripple', precision: 4, binancePair: 'XRPUSDT' },
    { symbol: 'DOGE', name: 'Dogecoin', precision: 5, binancePair: 'DOGEUSDT' }
  ];

  // --- 2. GLOBAL STATE ---
  const state = {
    selectedCoin: COINS[0],
    binanceTimeframe: '5m', // '1m' or '5m'
    polyTimeframe: '5m',    // '1m' or '5m'
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
    uiZoomLevel: 1.05, // comfortable large default zoom

    // Candlestick & Probability Buffers
    candlesBinance: [], // [{time (unix sec), open, high, low, close, volume}]
    polyOddsHistory: [], // [{time, yes, no}]

    // Live Odds
    marketOddsYes: 0.50,
    marketOddsNo: 0.50,
    bullScore: 50,
    bearScore: 50,

    // Portfolio Simulator
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
    coinTabs: document.querySelectorAll('.coin-tab-btn'),
    navSpotPrice: document.getElementById('navSpotPrice'),
    navSpotChange: document.getElementById('navSpotChange'),
    navStrikePrice: document.getElementById('navStrikePrice'),
    navTimerVal: document.getElementById('navTimerVal'),
    themeToggle: document.getElementById('themeToggle'),
    themeToggleIcon: document.getElementById('themeToggleIcon'),

    // Global Zoom Controls
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomReset: document.getElementById('btnZoomReset'),
    zoomLevelLabel: document.getElementById('zoomLevelLabel'),

    // Resizer
    workspaceWrapper: document.getElementById('workspaceWrapper'),
    paneCharts: document.getElementById('paneCharts'),
    resizerHandle: document.getElementById('resizerHandle'),
    paneOrder: document.getElementById('paneOrder'),

    // Chart 1 (Binance)
    binanceChartTitle: document.getElementById('binanceChartTitle'),
    binanceTfButtons: document.querySelectorAll('#binanceTfGroup .tf-btn'),
    valO: document.getElementById('valO'),
    valH: document.getElementById('valH'),
    valL: document.getElementById('valL'),
    valC: document.getElementById('valC'),
    valMa7: document.getElementById('valMa7'),
    valMa25: document.getElementById('valMa25'),
    btnBinanceZoomIn: document.getElementById('btnBinanceZoomIn'),
    btnBinanceZoomOut: document.getElementById('btnBinanceZoomOut'),
    btnFitBinanceChart: document.getElementById('btnFitBinanceChart'),
    binanceChartContainer: document.getElementById('binanceChartContainer'),

    // Chart 2 (Polymarket)
    polyChartTitle: document.getElementById('polyChartTitle'),
    polyTfButtons: document.querySelectorAll('#polyTfGroup .tf-btn'),
    polyLegendYes: document.getElementById('polyLegendYes'),
    polyLegendNo: document.getElementById('polyLegendNo'),
    btnPolyZoomIn: document.getElementById('btnPolyZoomIn'),
    btnPolyZoomOut: document.getElementById('btnPolyZoomOut'),
    btnFitPolyChart: document.getElementById('btnFitPolyChart'),
    polyChartContainer: document.getElementById('polyChartContainer'),

    // Ledger
    btnClearHistory: document.getElementById('btnClearHistory'),
    tradeHistoryBody: document.getElementById('tradeHistoryBody'),

    // Order & Execution Panel
    polyContractHeading: document.getElementById('polyContractHeading'),
    currentRoundPill: document.getElementById('currentRoundPill'),
    marketQuestionTitle: document.getElementById('marketQuestionTitle'),
    oddsYesCents: document.getElementById('oddsYesCents'),
    oddsYesTarget: document.getElementById('oddsYesTarget'),
    oddsNoCents: document.getElementById('oddsNoCents'),
    oddsNoTarget: document.getElementById('oddsNoTarget'),
    oddsBarFill: document.getElementById('oddsBarFill'),

    consensusStatusPill: document.getElementById('consensusStatusPill'),
    bullScoreText: document.getElementById('bullScoreText'),
    bearScoreText: document.getElementById('bearScoreText'),
    sentimentFill: document.getElementById('sentimentFill'),
    verdictTitle: document.getElementById('verdictTitle'),
    verdictDesc: document.getElementById('verdictDesc'),

    posStatusPill: document.getElementById('posStatusPill'),
    valPosSide: document.getElementById('valPosSide'),
    valPosEntry: document.getElementById('valPosEntry'),
    valPosShares: document.getElementById('valPosShares'),
    valPosCost: document.getElementById('valPosCost'),
    valPosCurrent: document.getElementById('valPosCurrent'),
    valPosPnl: document.getElementById('valPosPnl'),
    aiActionLogText: document.getElementById('aiActionLogText'),

    valTotalEquity: document.getElementById('valTotalEquity'),
    valCashBalance: document.getElementById('valCashBalance'),
    valNetPnl: document.getElementById('valNetPnl'),
    valWinRate: document.getElementById('valWinRate'),
    inputCapital: document.getElementById('inputCapital'),
    btnResetPort: document.getElementById('btnResetPort'),
    footerClock: document.getElementById('footerClock')
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
    const remainingMins = Math.max(0.04, remainingMs / 60000);
    const duration = state.roundDurationMinutes;
    const sigma = spot * 0.0011 * Math.sqrt(duration);
    const zScore = (spot - strike) / (sigma * Math.sqrt(remainingMins / duration) + 0.0001);
    let probYes = normalCDF(zScore);
    probYes = Math.max(0.02, Math.min(0.98, probYes));
    return {
      yesOdds: parseFloat(probYes.toFixed(2)),
      noOdds: parseFloat((1 - probYes).toFixed(2))
    };
  }

  // --- 5. TRADINGVIEW DUAL CHARTS INITIALIZATION ---
  let tvChartBinance = null;
  let candleSeries = null;
  let volumeSeries = null;
  let ma7Series = null;
  let ma25Series = null;
  let strikePriceLine = null;

  let tvChartPoly = null;
  let polyYesSeries = null;
  let polyNoSeries = null;

  function initTradingViewCharts() {
    if (!window.LightweightCharts) return;

    const isDark = document.body.classList.contains('theme-dark');
    const bg = isDark ? '#0d1117' : '#ffffff';
    const textColor = isDark ? '#8b949e' : '#656d76';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    const borderColor = isDark ? '#30363d' : '#d0d7de';

    // === CHART 1: BINANCE SPOT CANDLESTICK ===
    if (dom.binanceChartContainer) {
      if (tvChartBinance) { try { tvChartBinance.remove(); } catch (e) {} }
      
      tvChartBinance = LightweightCharts.createChart(dom.binanceChartContainer, {
        layout: { background: { color: bg }, textColor: textColor, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
        grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
          vertLine: { color: '#e3b341', style: LightweightCharts.LineStyle.Dashed },
          horzLine: { color: '#e3b341', style: LightweightCharts.LineStyle.Dashed }
        },
        rightPriceScale: { borderColor: borderColor, scaleMargins: { top: 0.08, bottom: 0.22 } },
        timeScale: { borderColor: borderColor, timeVisible: true, secondsVisible: false }
      });

      candleSeries = tvChartBinance.addCandlestickSeries({
        upColor: '#3fb950',
        downColor: '#f85149',
        borderVisible: false,
        wickUpColor: '#3fb950',
        wickDownColor: '#f85149'
      });

      volumeSeries = tvChartBinance.addHistogramSeries({ color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '' });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      ma7Series = tvChartBinance.addLineSeries({ color: '#e3b341', lineWidth: 1.5, priceLineVisible: false });
      ma25Series = tvChartBinance.addLineSeries({ color: '#bc8cff', lineWidth: 1.5, priceLineVisible: false });

      tvChartBinance.subscribeCrosshairMove(param => {
        const precision = state.selectedCoin.precision;
        if (!param || !param.time || !param.seriesData) {
          if (state.candlesBinance.length > 0) {
            const latest = state.candlesBinance[state.candlesBinance.length - 1];
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
    }

    // === CHART 2: POLYMARKET 5M UP/DOWN PROBABILITY (0¢ - 100¢) ===
    if (dom.polyChartContainer) {
      if (tvChartPoly) { try { tvChartPoly.remove(); } catch (e) {} }

      tvChartPoly = LightweightCharts.createChart(dom.polyChartContainer, {
        layout: { background: { color: bg }, textColor: textColor, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
        grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
          vertLine: { color: '#58a6ff', style: LightweightCharts.LineStyle.Dashed },
          horzLine: { color: '#58a6ff', style: LightweightCharts.LineStyle.Dashed }
        },
        rightPriceScale: {
          borderColor: borderColor,
          scaleMargins: { top: 0.1, bottom: 0.1 }
        },
        timeScale: { borderColor: borderColor, timeVisible: true, secondsVisible: false }
      });

      polyYesSeries = tvChartPoly.addAreaSeries({
        topColor: 'rgba(63, 185, 80, 0.35)',
        bottomColor: 'rgba(63, 185, 80, 0.02)',
        lineColor: '#3fb950',
        lineWidth: 2,
        title: 'UP (¢)',
        priceFormat: {
          type: 'custom',
          formatter: price => `${(price * 100).toFixed(0)}¢`
        }
      });

      polyNoSeries = tvChartPoly.addLineSeries({
        color: '#f85149',
        lineWidth: 2,
        title: 'DOWN (¢)',
        priceFormat: {
          type: 'custom',
          formatter: price => `${(price * 100).toFixed(0)}¢`
        }
      });

      polyYesSeries.createPriceLine({
        price: 0.50,
        color: '#58a6ff',
        lineWidth: 1.2,
        lineStyle: LightweightCharts.LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'PAR (50¢)'
      });

      tvChartPoly.subscribeCrosshairMove(param => {
        if (!param || !param.time || !param.seriesData) return;
        const yesVal = param.seriesData.get(polyYesSeries);
        const noVal = param.seriesData.get(polyNoSeries);
        if (yesVal && dom.polyLegendYes) dom.polyLegendYes.textContent = `${(yesVal.value * 100).toFixed(0)}¢`;
        if (noVal && dom.polyLegendNo) dom.polyLegendNo.textContent = `${(noVal.value * 100).toFixed(0)}¢`;
      });
    }

    resizeCharts();
  }

  function resizeCharts() {
    if (tvChartBinance && dom.binanceChartContainer) {
      const rect = dom.binanceChartContainer.getBoundingClientRect();
      tvChartBinance.applyOptions({ width: rect.width, height: rect.height });
    }
    if (tvChartPoly && dom.polyChartContainer) {
      const rect = dom.polyChartContainer.getBoundingClientRect();
      tvChartPoly.applyOptions({ width: rect.width, height: rect.height });
    }
  }

  function updateStrikePriceLineOnChart() {
    if (!candleSeries || !state.strikePrice) return;
    if (strikePriceLine) {
      try { candleSeries.removePriceLine(strikePriceLine); } catch (e) {}
    }
    strikePriceLine = candleSeries.createPriceLine({
      price: state.strikePrice,
      color: '#e3b341',
      lineWidth: 1.5,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'STRIKE 5M'
    });
  }

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

  // --- 6. REAL BINANCE DATA FETCHING & KLINE STREAM ---
  let wsBinance = null;

  async function fetchImmediateSpotPrice() {
    const pair = state.selectedCoin.binancePair;
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
      if (res.ok) {
        const d = await res.json();
        const price = parseFloat(d.lastPrice);
        state.currentPrice = price;
        state.price24hChange = parseFloat(d.priceChangePercent);
        if (state.strikePrice === null) {
          state.strikePrice = price;
          state.strikeLockedAt = Date.now();
        }
        updateThrottledMetrics();
      }
    } catch (e) {}
  }

  async function loadBinanceKlines() {
    const pair = state.selectedCoin.binancePair;
    const interval = state.binanceTimeframe; // '1m' or '5m'
    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=60`);
      if (res.ok) {
        const raw = await res.json();
        state.candlesBinance = raw.map(k => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5])
        }));

        if (state.candlesBinance.length > 0) {
          const latest = state.candlesBinance[state.candlesBinance.length - 1];
          state.currentPrice = latest.close;
          if (state.strikePrice === null) {
            state.strikePrice = latest.close;
            state.strikeLockedAt = Date.now();
          }

          if (candleSeries) candleSeries.setData(state.candlesBinance);
          if (volumeSeries) {
            volumeSeries.setData(state.candlesBinance.map(c => ({
              time: c.time,
              value: c.volume,
              color: c.close >= c.open ? 'rgba(63, 185, 80, 0.4)' : 'rgba(248, 81, 73, 0.4)'
            })));
          }

          const ma7Data = calculateSMAData(state.candlesBinance, 7);
          const ma25Data = calculateSMAData(state.candlesBinance, 25);
          if (ma7Series) ma7Series.setData(ma7Data);
          if (ma25Series) ma25Series.setData(ma25Data);

          if (ma7Data.length > 0) dom.valMa7.textContent = formatPrice(ma7Data[ma7Data.length - 1].value, state.selectedCoin.precision);
          if (ma25Data.length > 0) dom.valMa25.textContent = formatPrice(ma25Data[ma25Data.length - 1].value, state.selectedCoin.precision);

          updateStrikePriceLineOnChart();
          if (tvChartBinance) tvChartBinance.timeScale().fitContent();

          seedPolymarketOddsHistory();
        }
      }
    } catch (e) {
      console.warn('Kline load error:', e);
    }
  }

  function seedPolymarketOddsHistory() {
    if (!state.strikePrice || state.candlesBinance.length === 0) return;
    
    state.polyOddsHistory = state.candlesBinance.map(c => {
      const zScore = (c.close - state.strikePrice) / (state.strikePrice * 0.0012 + 0.0001);
      let probYes = normalCDF(zScore);
      probYes = Math.max(0.04, Math.min(0.96, probYes));
      return {
        time: c.time,
        value: parseFloat(probYes.toFixed(2)),
        noValue: parseFloat((1 - probYes).toFixed(2))
      };
    });

    if (polyYesSeries && polyNoSeries) {
      polyYesSeries.setData(state.polyOddsHistory.map(p => ({ time: p.time, value: p.value })));
      polyNoSeries.setData(state.polyOddsHistory.map(p => ({ time: p.time, value: p.noValue })));
      if (tvChartPoly) tvChartPoly.timeScale().fitContent();
    }
  }

  function connectBinanceStream() {
    if (wsBinance) { try { wsBinance.close(); } catch (e) {} }

    const pairLower = state.selectedCoin.binancePair.toLowerCase();
    const interval = state.binanceTimeframe;
    const url = `https://stream.binance.com:9443/ws/${pairLower}@kline_${interval}/${pairLower}@ticker`;

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

            if (candleSeries) candleSeries.update(candle);
            if (volumeSeries) {
              volumeSeries.update({
                time: candle.time,
                value: candle.volume,
                color: candle.close >= candle.open ? 'rgba(63, 185, 80, 0.4)' : 'rgba(248, 81, 73, 0.4)'
              });
            }

            const lastIdx = state.candlesBinance.length - 1;
            if (lastIdx >= 0 && state.candlesBinance[lastIdx].time === candle.time) {
              state.candlesBinance[lastIdx] = candle;
            } else {
              state.candlesBinance.push(candle);
              if (state.candlesBinance.length > 70) state.candlesBinance.shift();
            }

            const ma7Data = calculateSMAData(state.candlesBinance, 7);
            const ma25Data = calculateSMAData(state.candlesBinance, 25);
            if (ma7Series && ma7Data.length > 0) {
              ma7Series.update(ma7Data[ma7Data.length - 1]);
              dom.valMa7.textContent = formatPrice(ma7Data[ma7Data.length - 1].value, state.selectedCoin.precision);
            }
            if (ma25Series && ma25Data.length > 0) {
              ma25Series.update(ma25Data[ma25Data.length - 1]);
              dom.valMa25.textContent = formatPrice(ma25Data[ma25Data.length - 1].value, state.selectedCoin.precision);
            }

            const remainingMs = Math.max(0, state.roundEndTime - Date.now());
            const { yesOdds, noOdds } = calculateBinaryMarketOdds(candle.close, state.strikePrice, remainingMs);
            if (polyYesSeries && polyNoSeries) {
              polyYesSeries.update({ time: candle.time, value: yesOdds });
              polyNoSeries.update({ time: candle.time, value: noOdds });
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

  // --- 7. ROUND BOUNDARIES & TIMER ENGINE ---
  function calculateCurrentRoundBoundaries() {
    const now = Date.now();
    const duration = state.roundDurationMinutes;
    const intervalMs = duration * 60 * 1000;
    const start = Math.floor(now / intervalMs) * intervalMs;
    const end = start + intervalMs;
    const roundNumber = Math.floor(start / intervalMs) % 10000;

    return { startTime: start, endTime: end, roundId: `${duration}M-${roundNumber}` };
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

      state.strikePrice = state.currentPrice;
      state.strikeLockedAt = startTime;
      updateStrikePriceLineOnChart();

      if (dom.aiActionLogText) {
        dom.aiActionLogText.textContent = `[${formatTime(Date.now(), true)}] Ronde #${roundId} dimulai. Mengunci strike di ${formatPrice(state.strikePrice, state.selectedCoin.precision)}`;
      }
    }

    if (dom.currentRoundPill) dom.currentRoundPill.textContent = `RONDE #${roundId}`;
    if (dom.polyContractHeading) dom.polyContractHeading.textContent = `POLYMARKET ${state.roundDurationMinutes}M UP/DOWN: ${state.selectedCoin.symbol}`;
    if (dom.marketQuestionTitle) dom.marketQuestionTitle.textContent = `Pasar: Apakah harga ${state.selectedCoin.name} (${state.selectedCoin.symbol}) berada di atas Strike saat ronde berakhir?`;
    if (dom.navStrikePrice) dom.navStrikePrice.textContent = formatPrice(state.strikePrice, state.selectedCoin.precision);
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
    if (dom.navTimerVal) dom.navTimerVal.textContent = timeStr;

    if (dom.footerClock) dom.footerClock.textContent = `${formatTime(now, true)} WIB`;
  }

  // --- 8. REAL-TIME DOM METRICS & AI ENGINE LOOP (100ms) ---
  function updateThrottledMetrics() {
    if (!state.currentPrice) return;
    const precision = state.selectedCoin.precision;

    if (dom.navSpotPrice) {
      dom.navSpotPrice.textContent = formatPrice(state.currentPrice, precision);
      const isAboveStrike = state.strikePrice ? state.currentPrice >= state.strikePrice : true;
      dom.navSpotPrice.className = `metric-value ${isAboveStrike ? 'text-green' : 'text-red'}`;
    }

    if (dom.navSpotChange) {
      const change = state.price24hChange;
      const isUp = change >= 0;
      dom.navSpotChange.textContent = `${isUp ? '+' : ''}${change.toFixed(2)}%`;
      dom.navSpotChange.className = `change-tag ${isUp ? 'text-green' : 'text-red'}`;
    }

    evaluateAITradingEngine();
    updateSimulatorMarkToMarket();
  }

  // --- 9. ACTIVE AUTONOMOUS AI TRADING & FAST-FLIP REVERSAL ENGINE ---
  function evaluateAITradingEngine() {
    if (!state.currentPrice || !state.strikePrice) return;
    const now = Date.now();
    const remainingMs = Math.max(0, state.roundEndTime - now);
    const totalRoundMs = state.roundDurationMinutes * 60 * 1000;
    const elapsedSecs = Math.floor((totalRoundMs - remainingMs) / 1000);

    const { yesOdds, noOdds } = calculateBinaryMarketOdds(state.currentPrice, state.strikePrice, remainingMs);
    state.marketOddsYes = yesOdds;
    state.marketOddsNo = noOdds;

    if (dom.oddsYesCents) dom.oddsYesCents.textContent = `${(yesOdds * 100).toFixed(0)}¢`;
    if (dom.oddsNoCents) dom.oddsNoCents.textContent = `${(noOdds * 100).toFixed(0)}¢`;
    if (dom.oddsBarFill) dom.oddsBarFill.style.width = `${yesOdds * 100}%`;
    if (dom.polyLegendYes) dom.polyLegendYes.textContent = `${(yesOdds * 100).toFixed(0)}¢`;
    if (dom.polyLegendNo) dom.polyLegendNo.textContent = `${(noOdds * 100).toFixed(0)}¢`;

    const deltaStrike = state.currentPrice - state.strikePrice;
    const deltaStrikePct = (deltaStrike / state.strikePrice) * 100;
    
    let bullScore = 50;
    if (deltaStrikePct > 0) bullScore += Math.min(30, deltaStrikePct * 150);
    else bullScore -= Math.min(30, Math.abs(deltaStrikePct) * 150);

    const latestCandle = state.candlesBinance[state.candlesBinance.length - 1];
    if (latestCandle) {
      const ma7 = parseFloat(dom.valMa7.textContent.replace(/[^0-9.]/g, ''));
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

    if (bullScore >= 55) {
      verdict = 'BUY UP (YES)';
      rationale = `KONSENSUS BULL: Harga berada +${deltaStrikePct.toFixed(3)}% di atas strike ($${state.strikePrice.toFixed(2)}) didukung momentum MA(7). Posisi UP memiliki keunggulan statistik (+EV).`;
      if (dom.consensusStatusPill) { dom.consensusStatusPill.textContent = 'KONSENSUS BULL'; dom.consensusStatusPill.className = 'consensus-status-pill text-green'; }
    } else if (bearScore >= 55) {
      verdict = 'BUY DOWN (NO)';
      rationale = `KONSENSUS BEAR: Tekanan jual menahan harga -${Math.abs(deltaStrikePct).toFixed(3)}% di bawah strike baseline. Posisi DOWN memiliki probabilitas keunggulan tinggi.`;
      if (dom.consensusStatusPill) { dom.consensusStatusPill.textContent = 'KONSENSUS BEAR'; dom.consensusStatusPill.className = 'consensus-status-pill text-red'; }
    } else {
      verdict = 'STANDBY (MENGANALISIS)';
      rationale = `DELIBERASI ARBITER: Belum ada asimetri statistik yang cukup antara Bull (${bullScore}%) dan Bear (${bearScore}%). Menunggu konfirmasi breakout.`;
      if (dom.consensusStatusPill) { dom.consensusStatusPill.textContent = 'MENGANALISIS'; dom.consensusStatusPill.className = 'consensus-status-pill'; }
    }

    if (dom.verdictTitle) dom.verdictTitle.textContent = verdict;
    if (dom.verdictDesc) dom.verdictDesc.textContent = rationale;

    // Active Trading Execution
    if (elapsedSecs >= 10 && remainingMs >= 25000) {
      checkAndExecuteReversalProtection(bullScore, bearScore, yesOdds, noOdds, remainingMs);

      if (!state.portfolio.activePosition && state.portfolio.cashBalance >= 1.00) {
        const sideToBuy = bullScore >= bearScore ? 'YES' : 'NO';
        const priceToBuy = sideToBuy === 'YES' ? yesOdds : noOdds;
        executeSimOrder(sideToBuy, priceToBuy);
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

    const sideName = side === 'YES' ? 'UP' : 'DOWN';
    if (dom.aiActionLogText) {
      dom.aiActionLogText.textContent = `[${formatTime(Date.now(), true)}] ⚡ EKSEKUSI ORDER: Beli ${shares} Lembar ${sideName} @ ${(sharePrice * 100).toFixed(0)}¢ (Modal: $${alloc.toFixed(2)})`;
    }

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
      if (isBelowStrike && bearScore >= 60 && drawdownPct >= 16.0) {
        shouldReverse = true;
        targetOppositeSide = 'NO';
        targetOppositeOdds = noOdds;
      }
    } else if (pos.side === 'NO') {
      const isAboveStrike = state.currentPrice >= state.strikePrice;
      if (isAboveStrike && bullScore >= 60 && drawdownPct >= 16.0) {
        shouldReverse = true;
        targetOppositeSide = 'YES';
        targetOppositeOdds = yesOdds;
      }
    }

    if (!shouldReverse) return;

    const salvagedCash = parseFloat(currentVal.toFixed(2));
    const realizedLossOnFirstLeg = parseFloat((pos.cost - salvagedCash).toFixed(2));
    p.cashBalance = parseFloat((p.cashBalance + salvagedCash).toFixed(2));

    const flipContractPrice = Math.max(0.08, Math.min(0.92, targetOppositeOdds));
    const desiredSurplus = Math.max(0.50, realizedLossOnFirstLeg * 0.25);
    const targetNetProfit = realizedLossOnFirstLeg + desiredSurplus;
    
    let requiredShares = targetNetProfit / (1.00 - flipContractPrice);
    let requiredFlipCost = requiredShares * flipContractPrice;

    if (requiredFlipCost > p.cashBalance) {
      requiredFlipCost = p.cashBalance;
      requiredShares = requiredFlipCost / flipContractPrice;
    }

    const sideName = pos.side === 'YES' ? 'UP' : 'DOWN';
    const targetSideName = targetOppositeSide === 'YES' ? 'UP' : 'DOWN';

    if (requiredFlipCost < 0.50) {
      p.tradeHistory.unshift({
        time: formatTime(Date.now(), true),
        roundId: pos.roundId,
        coin: pos.coin,
        strike: state.strikePrice,
        close: state.currentPrice,
        side: `${sideName} (CUT-LOSS)`,
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

    if (dom.aiActionLogText) {
      dom.aiActionLogText.textContent = `[${formatTime(Date.now(), true)}] 🔄 REVERSAL FLIP: Jual ${sideName} (selamatkan $${salvagedCash.toFixed(2)}), Beli ${finalShares} Lembar ${targetSideName} @ ${(flipContractPrice * 100).toFixed(0)}¢ (Target Profit: +$${projectedNetRoundProfit.toFixed(2)})`;
    }

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
    const sideName = pos.side === 'YES' ? 'UP' : 'DOWN';

    if (dom.posStatusPill) {
      if (pos.isReversed) {
        dom.posStatusPill.className = 'position-status-pill reversed';
        dom.posStatusPill.textContent = `🔄 FLIP KE ${sideName} (${pos.shares} Lembar | Target Profit: +$${pos.projectedNetProfit || '0.00'})`;
      } else {
        dom.posStatusPill.className = `position-status-pill ${pos.side === 'YES' ? 'buy-yes' : 'buy-no'}`;
        dom.posStatusPill.textContent = `⚡ POSISI AKTIF: BUY ${sideName} (${pos.shares} Lembar @ ${(pos.entryPrice * 100).toFixed(0)}¢)`;
      }
    }

    if (dom.valPosSide) dom.valPosSide.textContent = pos.isReversed ? `${sideName} (FLIP)` : sideName;
    if (dom.valPosEntry) dom.valPosEntry.textContent = `${(pos.entryPrice * 100).toFixed(0)}¢`;
    if (dom.valPosShares) dom.valPosShares.textContent = `${pos.shares} sh`;
    if (dom.valPosCost) dom.valPosCost.textContent = `$${pos.cost.toFixed(2)}`;
    if (dom.valPosCurrent) dom.valPosCurrent.textContent = `$${currentVal.toFixed(2)} (${(currentContractPrice * 100).toFixed(0)}¢)`;

    const pnlSign = totalRoundPnl >= 0 ? '+' : '-';
    if (dom.valPosPnl) {
      dom.valPosPnl.className = `d-val ${totalRoundPnl >= 0 ? 'text-green' : 'text-red'}`;
      dom.valPosPnl.textContent = `${pnlSign}$${Math.abs(totalRoundPnl).toFixed(2)} (${pnlSign}${Math.abs((totalRoundPnl / pos.cost) * 100).toFixed(1)}%)`;
    }

    const totalEquity = p.cashBalance + currentVal;
    const netPnl = totalEquity - p.startingCapital;
    const netPnlPct = (netPnl / p.startingCapital) * 100;

    if (dom.valTotalEquity) dom.valTotalEquity.textContent = `$${totalEquity.toFixed(2)}`;
    if (dom.valCashBalance) dom.valCashBalance.textContent = `$${p.cashBalance.toFixed(2)}`;
    
    const netSign = netPnl >= 0 ? '+' : '-';
    if (dom.valNetPnl) {
      dom.valNetPnl.className = `c-num ${netPnl >= 0 ? 'text-green' : 'text-red'}`;
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

    const sideName = pos.side === 'YES' ? 'UP' : 'DOWN';
    p.tradeHistory.unshift({
      time: formatTime(Date.now(), true),
      roundId: pos.roundId,
      coin: pos.coin,
      strike: roundStrikePrice,
      close: roundClosePrice,
      side: pos.isReversed ? `${sideName} (FLIP)` : sideName,
      cost: pos.cost,
      won: won,
      netPnl: netPnl,
      equityAfter: p.cashBalance
    });

    if (dom.aiActionLogText) {
      dom.aiActionLogText.textContent = `[${formatTime(Date.now(), true)}] 🏁 RESOLUSI #${pos.roundId}: ${won ? 'WIN' : 'LOSS'} (Net PnL: ${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)})`;
    }

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
      dom.valNetPnl.className = `c-num ${netPnl >= 0 ? 'text-green' : 'text-red'}`;
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
        dom.valPosPnl.className = 'd-val';
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
      const sideTagClass = t.side.includes('UP') || t.side.includes('YES') ? 'yes' : ((t.side.includes('DOWN') || t.side.includes('NO')) ? 'no' : 'reversed');

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

  // --- 10. GLOBAL UI ZOOM SCALING CONTROLS ---
  function applyUiZoom(newZoom) {
    state.uiZoomLevel = Math.max(0.75, Math.min(1.60, parseFloat(newZoom.toFixed(2))));
    document.documentElement.style.setProperty('--ui-zoom', state.uiZoomLevel);
    localStorage.setItem('kopi_tubruk_zoom', state.uiZoomLevel);
    if (dom.zoomLevelLabel) dom.zoomLevelLabel.textContent = `${Math.round(state.uiZoomLevel * 100)}%`;
    resizeCharts();
  }

  function setupZoomControls() {
    const savedZoom = parseFloat(localStorage.getItem('kopi_tubruk_zoom')) || 1.05;
    applyUiZoom(savedZoom);

    if (dom.btnZoomIn) {
      dom.btnZoomIn.addEventListener('click', () => applyUiZoom(state.uiZoomLevel + 0.10));
    }
    if (dom.btnZoomOut) {
      dom.btnZoomOut.addEventListener('click', () => applyUiZoom(state.uiZoomLevel - 0.10));
    }
    if (dom.btnZoomReset) {
      dom.btnZoomReset.addEventListener('click', () => applyUiZoom(1.00));
    }

    // Chart-specific zoom buttons
    if (dom.btnBinanceZoomIn && tvChartBinance) {
      dom.btnBinanceZoomIn.addEventListener('click', () => {
        const range = tvChartBinance.timeScale().getVisibleLogicalRange();
        if (range) tvChartBinance.timeScale().setVisibleLogicalRange({ from: range.from + 4, to: range.to - 4 });
      });
    }
    if (dom.btnBinanceZoomOut && tvChartBinance) {
      dom.btnBinanceZoomOut.addEventListener('click', () => {
        const range = tvChartBinance.timeScale().getVisibleLogicalRange();
        if (range) tvChartBinance.timeScale().setVisibleLogicalRange({ from: range.from - 6, to: range.to + 6 });
      });
    }

    if (dom.btnPolyZoomIn && tvChartPoly) {
      dom.btnPolyZoomIn.addEventListener('click', () => {
        const range = tvChartPoly.timeScale().getVisibleLogicalRange();
        if (range) tvChartPoly.timeScale().setVisibleLogicalRange({ from: range.from + 4, to: range.to - 4 });
      });
    }
    if (dom.btnPolyZoomOut && tvChartPoly) {
      dom.btnPolyZoomOut.addEventListener('click', () => {
        const range = tvChartPoly.timeScale().getVisibleLogicalRange();
        if (range) tvChartPoly.timeScale().setVisibleLogicalRange({ from: range.from - 6, to: range.to + 6 });
      });
    }
  }

  // --- 11. DRAGGABLE RESIZABLE LAYOUT ENGINE ---
  function setupResizableDivider() {
    const handle = dom.resizerHandle;
    const wrapper = dom.workspaceWrapper;
    const paneOrder = dom.paneOrder;
    if (!handle || !wrapper || !paneOrder) return;

    let isDragging = false;

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      handle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      const newOrderWidth = wrapperRect.right - e.clientX;
      const clampedWidth = Math.max(300, Math.min(680, newOrderWidth));
      paneOrder.style.width = `${clampedWidth}px`;
      resizeCharts();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        handle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizeCharts();
      }
    });

    handle.addEventListener('touchstart', (e) => {
      isDragging = true;
      handle.classList.add('dragging');
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || !e.touches[0]) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      const newOrderWidth = wrapperRect.right - e.touches[0].clientX;
      const clampedWidth = Math.max(300, Math.min(680, newOrderWidth));
      paneOrder.style.width = `${clampedWidth}px`;
      resizeCharts();
    });

    window.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        handle.classList.remove('dragging');
        resizeCharts();
      }
    });
  }

  // --- 12. THEME & EVENT HANDLERS ---
  function applyTheme(themeName) {
    state.currentTheme = themeName;
    document.body.className = themeName;
    localStorage.setItem('kopi_tubruk_theme', themeName);
    if (dom.themeToggleIcon) dom.themeToggleIcon.textContent = themeName === 'theme-dark' ? '🌙' : '☀️';

    const isDark = themeName === 'theme-dark';
    const bg = isDark ? '#0d1117' : '#ffffff';
    const textColor = isDark ? '#8b949e' : '#656d76';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    const borderColor = isDark ? '#30363d' : '#d0d7de';

    const themeOpts = {
      layout: { background: { color: bg }, textColor: textColor },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      rightPriceScale: { borderColor: borderColor },
      timeScale: { borderColor: borderColor }
    };

    if (tvChartBinance) tvChartBinance.applyOptions(themeOpts);
    if (tvChartPoly) tvChartPoly.applyOptions(themeOpts);
  }

  function toggleTheme() {
    applyTheme(state.currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark');
  }

  function setupEventListeners() {
    if (dom.themeToggle) dom.themeToggle.addEventListener('click', toggleTheme);

    if (dom.btnFitBinanceChart) dom.btnFitBinanceChart.addEventListener('click', () => {
      if (tvChartBinance) tvChartBinance.timeScale().fitContent();
    });
    if (dom.btnFitPolyChart) dom.btnFitPolyChart.addEventListener('click', () => {
      if (tvChartPoly) tvChartPoly.timeScale().fitContent();
    });

    dom.binanceTfButtons.forEach(btn => {
      btn.addEventListener('click', async function () {
        const tf = this.dataset.tf;
        if (tf && tf !== state.binanceTimeframe) {
          dom.binanceTfButtons.forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          state.binanceTimeframe = tf;
          await loadBinanceKlines();
          connectBinanceStream();
        }
      });
    });

    dom.polyTfButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const tf = this.dataset.tf;
        if (tf && tf !== state.polyTimeframe) {
          dom.polyTfButtons.forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          state.polyTimeframe = tf;
          state.roundDurationMinutes = tf === '1m' ? 1 : 5;
          syncRoundState();
          seedPolymarketOddsHistory();
        }
      });
    });

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
          state.candlesBinance = [];
          state.polyOddsHistory = [];

          if (dom.binanceChartTitle) dom.binanceChartTitle.textContent = `GRAFIK 1: ${selected.symbol}/USDT SPOT BINANCE`;

          await fetchImmediateSpotPrice();
          await loadBinanceKlines();
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

    setupZoomControls();
    setupResizableDivider();
    window.addEventListener('resize', resizeCharts);
  }

  // --- 13. INITIALIZATION ---
  async function init() {
    initTradingViewCharts();
    
    const savedTheme = localStorage.getItem('kopi_tubruk_theme') || 'theme-dark';
    applyTheme(savedTheme);

    setupEventListeners();
    updateSimulatorUI();
    renderTradeHistoryTable();

    await fetchImmediateSpotPrice();
    syncRoundState();

    await loadBinanceKlines();
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
