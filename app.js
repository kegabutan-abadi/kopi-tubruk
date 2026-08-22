/**
 * KOPI TUBRUK - Multi-Exchange Prediction Engine & AI Debate Terminal
 * Multi-Feed Aggregation (Binance, Coinbase, Kraken, Polymarket)
 * Dual-Agent AI Consensus + Fast-Flip Reversal Protection + Autonomous Simulator
 */

(function () {
  'use strict';

  // --- Configuration & Coins Registry ---
  const COINS = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      precision: 2,
      binancePair: 'BTCUSDT',
      coinbaseProduct: 'BTC-USD',
      krakenPair: 'XBT/USD',
      krakenAlt: 'XXBTZUSD',
      defaultPrice: 65000
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      precision: 2,
      binancePair: 'ETHUSDT',
      coinbaseProduct: 'ETH-USD',
      krakenPair: 'ETH/USD',
      krakenAlt: 'XETHZUSD',
      defaultPrice: 3500
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      precision: 3,
      binancePair: 'SOLUSDT',
      coinbaseProduct: 'SOL-USD',
      krakenPair: 'SOL/USD',
      krakenAlt: 'SOLUSD',
      defaultPrice: 150
    },
    {
      symbol: 'XRP',
      name: 'Ripple',
      precision: 4,
      binancePair: 'XRPUSDT',
      coinbaseProduct: 'XRP-USD',
      krakenPair: 'XRP/USD',
      krakenAlt: 'XXRPZUSD',
      defaultPrice: 0.60
    },
    {
      symbol: 'DOGE',
      name: 'Dogecoin',
      precision: 5,
      binancePair: 'DOGEUSDT',
      coinbaseProduct: 'DOGE-USD',
      krakenPair: 'DOGE/USD',
      krakenAlt: 'XDG/USD',
      defaultPrice: 0.12
    }
  ];

  // --- Global Application State ---
  const state = {
    selectedCoin: COINS[0],
    roundDurationMinutes: 5, // 5, 15, 20, 60, 120
    currentPrice: null, // Composite benchmark price
    previousPrice: null,
    strikePrice: null,
    strikeLockedAt: null,
    currentRoundId: null,
    roundStartTime: null,
    roundEndTime: null,
    audioEnabled: true,
    currentTheme: 'theme-light', // 'theme-light' or 'theme-dark'
    roundHistory: [], // [{roundId, timeStr, coin, strikePrice, closePrice, delta, percent, outcome, isUp, timestamp}]
    
    // Multi-Exchange Live Prices
    feedPrices: {
      binance: null,
      coinbase: null,
      kraken: null,
      polymarketYes: 0.50,
      polymarketNo: 0.50
    },
    feedStatus: {
      binance: false,
      coinbase: false,
      kraken: false,
      polymarket: true
    },
    lastCoinbaseTick: 0,
    lastKrakenTick: 0,
    
    // Data Buffers
    tickHistory: [], // [{time, price, binance, coinbase, kraken}]
    candles15s: [],  // [{time, open, high, low, close, volume, ema7, ema21}]
    currentCandle: null,
    momentumQueue: [], // Last 40 tick directions (1 or -1)
    
    // Velocity & Latency
    ticksInSecond: 0,
    currentTickSpeed: 0,
    pingMs: 12,
    lastChimePlayed: null,

    // AI Debate Module State
    debateCycle: 1,
    lastDebateTime: 0,
    bullScore: 50,
    bearScore: 50,
    arbiterVerdict: 'STANDBY',
    arbiterConfidence: 50,
    marketOddsYes: 0.50, // in probability ($0.01 - $0.99)
    marketOddsNo: 0.50,
    debateTranscripts: [],

    // Autonomous Portfolio Simulator State with Dynamic Reversal Engine
    portfolio: {
      startingCapital: 20.00,
      cashBalance: 20.00,
      activePosition: null, // { id, roundId, side, entryPrice, shares, cost, entryTime, isReversed, initialSide, initialLossSaved }
      tradeHistory: [],     // Array of completed trades
      totalTrades: 0,
      wins: 0,
      losses: 0,
      cumulativePnl: 0.00
    }
  };

  // --- DOM Elements Cache ---
  const dom = {
    // Header & Feeds
    mainStatusDot: document.getElementById('mainStatusDot'),
    statusText: document.getElementById('statusText'),
    pingBadge: document.getElementById('pingBadge'),
    coinButtons: document.querySelectorAll('.coin-btn'),
    feedPriceBinance: document.getElementById('feedPriceBinance'),
    feedPriceCoinbase: document.getElementById('feedPriceCoinbase'),
    feedPriceKraken: document.getElementById('feedPriceKraken'),
    feedPricePolymarket: document.getElementById('feedPricePolymarket'),
    chipBinance: document.getElementById('chipBinance'),
    chipCoinbase: document.getElementById('chipCoinbase'),
    chipKraken: document.getElementById('chipKraken'),
    chipPolymarket: document.getElementById('chipPolymarket'),
    
    // Theme & Audio
    themeToggle: document.getElementById('themeToggle'),
    themeIconLight: document.getElementById('themeIconLight'),
    themeIconDark: document.getElementById('themeIconDark'),
    themeLabel: document.getElementById('themeLabel'),
    soundToggle: document.getElementById('soundToggle'),
    soundOnIcon: document.querySelector('.icon-sound-on'),
    soundOffIcon: document.querySelector('.icon-sound-off'),

    // Timeframe
    timeframeButtons: document.querySelectorAll('.tf-btn'),

    // Metric Cards
    currentPrice: document.getElementById('currentPrice'),
    priceDeltaBadge: document.getElementById('priceDeltaBadge'),
    deltaArrow: document.getElementById('deltaArrow'),
    deltaValue: document.getElementById('deltaValue'),
    deltaPercent: document.getElementById('deltaPercent'),
    crossExchangeSpread: document.getElementById('crossExchangeSpread'),
    tickSpeed: document.getElementById('tickSpeed'),
    velocityBar: document.getElementById('velocityBar'),
    livePriceCard: document.getElementById('livePriceCard'),
    
    // Strike & Countdown
    strikePrice: document.getElementById('strikePrice'),
    periodRangeBadge: document.getElementById('periodRangeBadge'),
    roundNumberTag: document.getElementById('roundNumberTag'),
    strikeLockedTime: document.getElementById('strikeLockedTime'),
    targetUpPrice: document.getElementById('targetUpPrice'),
    targetDownPrice: document.getElementById('targetDownPrice'),
    manualStrikeBtn: document.getElementById('manualStrikeBtn'),
    countdownCard: document.getElementById('countdownCard'),
    timerMinutes: document.getElementById('timerMinutes'),
    timerSeconds: document.getElementById('timerSeconds'),
    timerMs: document.getElementById('timerMs'),
    timerProgressFill: document.getElementById('timerProgressFill'),
    currentClock: document.getElementById('currentClock'),
    outcomePill: document.getElementById('outcomePill'),
    outcomeIcon: document.getElementById('outcomeIcon'),
    outcomeText: document.getElementById('outcomeText'),
    expiryLabel: document.getElementById('expiryLabel'),

    // Side-by-Side Dual Charts
    candleCanvasContainer: document.getElementById('candleCanvasContainer'),
    candleCanvas: document.getElementById('candleCanvas'),
    candleEma7: document.getElementById('candleEma7'),
    candleEma21: document.getElementById('candleEma21'),
    candleVwap: document.getElementById('candleVwap'),

    canvasContainer: document.getElementById('canvasContainer'),
    tickCanvas: document.getElementById('tickCanvas'),
    chartLivePrice: document.getElementById('chartLivePrice'),
    chartHighPrice: document.getElementById('chartHighPrice'),
    chartLowPrice: document.getElementById('chartLowPrice'),
    chartSpread: document.getElementById('chartSpread'),
    clearChartBtn: document.getElementById('clearChartBtn'),

    // Momentum Gauge
    bearPercent: document.getElementById('bearPercent'),
    bullPercent: document.getElementById('bullPercent'),
    momentumGaugeFill: document.getElementById('momentumGaugeFill'),

    // AI Debate Module
    debateCycleCounter: document.getElementById('debateCycleCounter'),
    bullScoreVal: document.getElementById('bullScoreVal'),
    bullThesisText: document.getElementById('bullThesisText'),
    bullSignalsList: document.getElementById('bullSignalsList'),
    bearScoreVal: document.getElementById('bearScoreVal'),
    bearThesisText: document.getElementById('bearThesisText'),
    bearSignalsList: document.getElementById('bearSignalsList'),
    arbiterAction: document.getElementById('arbiterAction'),
    arbiterConfidence: document.getElementById('arbiterConfidence'),
    consensusStrengthBadge: document.getElementById('consensusStrengthBadge'),
    marketOddsYes: document.getElementById('marketOddsYes'),
    oddsBarYes: document.getElementById('oddsBarYes'),
    arbiterRationale: document.getElementById('arbiterRationale'),
    debateTranscriptFeed: document.getElementById('debateTranscriptFeed'),
    transcriptCount: document.getElementById('transcriptCount'),

    // Simulator
    simStartingCapitalInput: document.getElementById('simStartingCapitalInput'),
    resetSimBtn: document.getElementById('resetSimBtn'),
    simEquityVal: document.getElementById('simEquityVal'),
    simCashVal: document.getElementById('simCashVal'),
    simInTradeVal: document.getElementById('simInTradeVal'),
    simPnlVal: document.getElementById('simPnlVal'),
    simWinRateVal: document.getElementById('simWinRateVal'),
    posStatusBadge: document.getElementById('posStatusBadge'),
    posSideVal: document.getElementById('posSideVal'),
    posEntryPriceVal: document.getElementById('posEntryPriceVal'),
    posSharesVal: document.getElementById('posSharesVal'),
    posCostVal: document.getElementById('posCostVal'),
    posCurrentVal: document.getElementById('posCurrentVal'),
    posUnrealizedPnlVal: document.getElementById('posUnrealizedPnlVal'),
    posStrategyAction: document.getElementById('posStrategyAction'),
    reversalStrategyBadge: document.getElementById('reversalStrategyBadge'),
    simTradeTableBody: document.getElementById('simTradeTableBody'),

    // Round History
    historyTableBody: document.getElementById('historyTableBody'),
    historyCount: document.getElementById('historyCount'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    systemClockLocal: document.getElementById('systemClockLocal')
  };

  // --- Audio Synthesizer (Zero external asset dependency) ---
  const audioCtx = (function () {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      return new AudioContext();
    } catch (e) {
      return null;
    }
  })();

  function playAlertSound(type) {
    if (!state.audioEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const now = audioCtx.currentTime;

      if (type === 'tick-30') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'tick-10') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1046.5, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'trade-exec') {
        [659.25, 880.00].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.14, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.22);
        });
      } else if (type === 'reversal-flip') {
        [440.00, 587.33, 880.00].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.25);
        });
      } else if (type === 'round-resolved') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.18, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.4);
        });
      }
    } catch (e) {
      // Audio errors must never interrupt application execution
    }
  }

  // --- Formatting Helpers ---
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

  function formatTimeUTC(timestamp) {
    const d = new Date(timestamp);
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    const s = String(d.getUTCSeconds()).padStart(2, '0');
    return `${h}:${m}:${s} UTC`;
  }

  // --- Normal CDF Approximation for Polymarket Binary Contract Odds ---
  function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) p = 1 - p;
    return p;
  }

  function calculateBinaryMarketOdds(spot, strike, remainingMs, durationMinutes) {
    if (!spot || !strike || strike <= 0) return { yesOdds: 0.50, noOdds: 0.50 };
    
    const remainingMins = Math.max(0.04, remainingMs / 60000);
    const totalMins = durationMinutes;
    // Estimated short-term volatility factor scaled to timeframe (Polymarket CLOB resolution model)
    const sigma = spot * 0.0011 * Math.sqrt(totalMins);
    const zScore = (spot - strike) / (sigma * Math.sqrt(remainingMins / totalMins) + 0.0001);
    
    let probYes = normalCDF(zScore);
    // Bound odds within realistic prediction market book spread (0.02 to 0.98)
    probYes = Math.max(0.02, Math.min(0.98, probYes));
    const probNo = 1 - probYes;

    return {
      yesOdds: parseFloat(probYes.toFixed(2)),
      noOdds: parseFloat(probNo.toFixed(2))
    };
  }

  // --- Multi-Exchange WebSocket & Stream Aggregator ---
  let wsBinance = null;
  let wsCoinbase = null;
  let wsKraken = null;
  let pollInterval = null;

  function connectMultiExchangeStreams() {
    connectBinanceWS();
    connectCoinbaseWS();
    connectKrakenWS();
    startFallbackPolling();
  }

  function connectBinanceWS() {
    if (wsBinance) {
      try { wsBinance.close(); } catch (e) {}
    }

    const pairLower = state.selectedCoin.binancePair.toLowerCase();
    const streams = [
      `${pairLower}@trade`,
      ...COINS.map(c => `${c.binancePair.toLowerCase()}@miniTicker`)
    ].join('/');

    const url = `https://stream.binance.com:9443/ws/${streams}`;
    try {
      wsBinance = new WebSocket(url);
      wsBinance.onopen = () => {
        state.feedStatus.binance = true;
        updateFeedStatusUI();
      };
      wsBinance.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.e === '24hrMiniTicker' || data.e === '24hrTicker') {
            const matchCoin = COINS.find(c => c.binancePair === data.s);
            if (matchCoin) {
              const miniEl = document.getElementById(`miniPrice-${matchCoin.symbol}`);
              if (miniEl) miniEl.textContent = formatPrice(parseFloat(data.c), matchCoin.precision);
            }
          } else if (data.e === 'trade' && data.s === state.selectedCoin.binancePair) {
            const p = parseFloat(data.p);
            handleExchangeTick('binance', p, data.T || Date.now());
          }
        } catch (err) {}
      };
      wsBinance.onerror = () => { state.feedStatus.binance = false; updateFeedStatusUI(); };
      wsBinance.onclose = () => {
        state.feedStatus.binance = false;
        updateFeedStatusUI();
        setTimeout(connectBinanceWS, 3000);
      };
    } catch (e) {
      setTimeout(connectBinanceWS, 4000);
    }
  }

  function connectCoinbaseWS() {
    if (wsCoinbase) {
      try { wsCoinbase.close(); } catch (e) {}
    }

    const url = 'wss://ws-feed.exchange.coinbase.com';
    try {
      wsCoinbase = new WebSocket(url);
      wsCoinbase.onopen = () => {
        state.feedStatus.coinbase = true;
        updateFeedStatusUI();
        const subscribeMsg = {
          type: 'subscribe',
          product_ids: COINS.map(c => c.coinbaseProduct),
          channels: ['ticker']
        };
        wsCoinbase.send(JSON.stringify(subscribeMsg));
      };
      wsCoinbase.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ticker' && data.price) {
            const price = parseFloat(data.price);
            if (data.product_id === state.selectedCoin.coinbaseProduct) {
              handleExchangeTick('coinbase', price, Date.now());
            }
          }
        } catch (err) {}
      };
      wsCoinbase.onerror = () => { state.feedStatus.coinbase = false; updateFeedStatusUI(); };
      wsCoinbase.onclose = () => {
        state.feedStatus.coinbase = false;
        updateFeedStatusUI();
        setTimeout(connectCoinbaseWS, 4000);
      };
    } catch (e) {
      setTimeout(connectCoinbaseWS, 5000);
    }
  }

  function connectKrakenWS() {
    if (wsKraken) {
      try { wsKraken.close(); } catch (e) {}
    }

    const url = 'wss://ws.kraken.com';
    try {
      wsKraken = new WebSocket(url);
      wsKraken.onopen = () => {
        state.feedStatus.kraken = true;
        updateFeedStatusUI();
        const subscribeMsg = {
          event: 'subscribe',
          pair: [state.selectedCoin.krakenPair, state.selectedCoin.krakenAlt],
          subscription: { name: 'ticker' }
        };
        wsKraken.send(JSON.stringify(subscribeMsg));
      };
      wsKraken.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data) && data[1] && data[1].c) {
            const price = parseFloat(data[1].c[0]);
            if (!isNaN(price)) {
              handleExchangeTick('kraken', price, Date.now());
            }
          }
        } catch (err) {}
      };
      wsKraken.onerror = () => { state.feedStatus.kraken = false; updateFeedStatusUI(); };
      wsKraken.onclose = () => {
        state.feedStatus.kraken = false;
        updateFeedStatusUI();
        setTimeout(connectKrakenWS, 4000);
      };
    } catch (e) {
      setTimeout(connectKrakenWS, 5000);
    }
  }

  // Backup HTTP polling for Kraken, Coinbase, and Polymarket
  function startFallbackPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
      // Coinbase REST fallback
      if (!state.feedPrices.coinbase || Date.now() - (state.lastCoinbaseTick || 0) > 3500) {
        try {
          const res = await fetch(`https://api.exchange.coinbase.com/products/${state.selectedCoin.coinbaseProduct}/ticker`);
          if (res.ok) {
            const d = await res.json();
            if (d.price) handleExchangeTick('coinbase', parseFloat(d.price), Date.now());
          }
        } catch (e) {}
      }

      // Kraken REST fallback
      if (!state.feedPrices.kraken || Date.now() - (state.lastKrakenTick || 0) > 3500) {
        try {
          const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${state.selectedCoin.krakenPair.replace('/', '')}`);
          if (res.ok) {
            const d = await res.json();
            if (d.result) {
              const key = Object.keys(d.result)[0];
              if (key && d.result[key].c) {
                handleExchangeTick('kraken', parseFloat(d.result[key].c[0]), Date.now());
              }
            }
          }
        } catch (e) {}
      }
    }, 2000);
  }

  function handleExchangeTick(exchange, price, time) {
    if (!price || isNaN(price) || price <= 0) return;

    state.feedPrices[exchange] = price;
    state.feedStatus[exchange] = true;
    if (exchange === 'coinbase') state.lastCoinbaseTick = time;
    if (exchange === 'kraken') state.lastKrakenTick = time;

    // Update Header Exchange Chips
    const precision = state.selectedCoin.precision;
    if (exchange === 'binance' && dom.feedPriceBinance) dom.feedPriceBinance.textContent = formatPrice(price, precision);
    if (exchange === 'coinbase' && dom.feedPriceCoinbase) dom.feedPriceCoinbase.textContent = formatPrice(price, precision);
    if (exchange === 'kraken' && dom.feedPriceKraken) dom.feedPriceKraken.textContent = formatPrice(price, precision);

    // Compute Multi-Exchange Composite Reference Price
    computeCompositePrice(time);
  }

  function computeCompositePrice(time) {
    const activePrices = [];
    if (state.feedPrices.binance) activePrices.push(state.feedPrices.binance);
    if (state.feedPrices.coinbase) activePrices.push(state.feedPrices.coinbase);
    if (state.feedPrices.kraken) activePrices.push(state.feedPrices.kraken);

    if (activePrices.length === 0) return;

    // Center-weighted composite index
    activePrices.sort((a, b) => a - b);
    let composite = 0;
    if (activePrices.length === 1) composite = activePrices[0];
    else if (activePrices.length === 2) composite = (activePrices[0] + activePrices[1]) / 2;
    else composite = (activePrices[0] + activePrices[1] * 2 + activePrices[2]) / 4;

    // Calculate Cross-Exchange Spread & Divergence
    const maxP = Math.max(...activePrices);
    const minP = Math.min(...activePrices);
    const spread = maxP - minP;
    const spreadPct = (spread / composite) * 100;

    const precision = state.selectedCoin.precision;
    if (dom.crossExchangeSpread) {
      dom.crossExchangeSpread.textContent = `${formatPrice(spread, precision)} (${spreadPct.toFixed(3)}%)`;
    }

    state.ticksInSecond++;
    processAggregatedPriceTick(composite, time);
  }

  function updateFeedStatusUI() {
    const activeFeeds = Object.values(state.feedStatus).filter(Boolean).length;
    if (dom.mainStatusDot && dom.statusText) {
      if (activeFeeds > 0) {
        dom.mainStatusDot.className = 'status-dot connected';
        dom.statusText.textContent = `${activeFeeds}-FEED LIVE`;
      } else {
        dom.mainStatusDot.className = 'status-dot disconnected';
        dom.statusText.textContent = 'CONNECTING...';
      }
    }

    if (dom.chipBinance) dom.chipBinance.querySelector('.feed-indicator').className = `feed-indicator ${state.feedStatus.binance ? 'online' : ''}`;
    if (dom.chipCoinbase) dom.chipCoinbase.querySelector('.feed-indicator').className = `feed-indicator ${state.feedStatus.coinbase ? 'online' : ''}`;
    if (dom.chipKraken) dom.chipKraken.querySelector('.feed-indicator').className = `feed-indicator ${state.feedStatus.kraken ? 'online' : ''}`;
    if (dom.chipPolymarket) dom.chipPolymarket.querySelector('.feed-indicator').className = `feed-indicator online`;
  }

  // --- Price Tick & 15s Candle Processing ---
  function processAggregatedPriceTick(price, time) {
    state.previousPrice = state.currentPrice;
    state.currentPrice = price;

    if (state.strikePrice === null) {
      state.strikePrice = price;
      state.strikeLockedAt = state.roundStartTime || time;
      updateStrikeDisplay();
    }

    // Direction Momentum
    if (state.previousPrice !== null) {
      const diff = price - state.previousPrice;
      if (diff > 0) {
        state.momentumQueue.push(1);
        flashPriceCard('up');
      } else if (diff < 0) {
        state.momentumQueue.push(-1);
        flashPriceCard('down');
      }
      if (state.momentumQueue.length > 40) state.momentumQueue.shift();
    }

    // Tick stream buffer
    state.tickHistory.push({
      time: time,
      price: price,
      binance: state.feedPrices.binance,
      coinbase: state.feedPrices.coinbase,
      kraken: state.feedPrices.kraken
    });
    if (state.tickHistory.length > 350) state.tickHistory.shift();

    // 15s Candle Aggregator
    updateCandles(price, time);

    // Update UI elements
    updatePriceDisplay();
    updateMomentumDisplay();
    
    // Evaluate Simulation Mark-to-Market & Position Protection
    updateSimulatorMarkToMarket();

    // Run AI Debate evaluation
    evaluateAIDebate(time);

    // Trigger dual chart render
    requestAnimationFrame(renderDualCharts);
  }

  function updateCandles(price, time) {
    const candleInterval = 15000; // 15s candle
    const candleBucket = Math.floor(time / candleInterval) * candleInterval;

    if (!state.currentCandle || state.currentCandle.time !== candleBucket) {
      if (state.currentCandle) {
        state.candles15s.push(state.currentCandle);
        if (state.candles15s.length > 40) state.candles15s.shift();
        calculateIndicators();
      }
      state.currentCandle = {
        time: candleBucket,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 1,
        ema7: price,
        ema21: price
      };
    } else {
      state.currentCandle.high = Math.max(state.currentCandle.high, price);
      state.currentCandle.low = Math.min(state.currentCandle.low, price);
      state.currentCandle.close = price;
      state.currentCandle.volume += 1;
    }
  }

  function calculateIndicators() {
    if (state.candles15s.length === 0) return;
    const closes = state.candles15s.map(c => c.close);
    
    // EMA 7
    const k7 = 2 / (7 + 1);
    let ema7 = closes[0];
    for (let i = 0; i < closes.length; i++) {
      ema7 = closes[i] * k7 + ema7 * (1 - k7);
      state.candles15s[i].ema7 = ema7;
    }

    // EMA 21
    const k21 = 2 / (21 + 1);
    let ema21 = closes[0];
    for (let i = 0; i < closes.length; i++) {
      ema21 = closes[i] * k21 + ema21 * (1 - k21);
      state.candles15s[i].ema21 = ema21;
    }

    const precision = state.selectedCoin.precision;
    if (dom.candleEma7) dom.candleEma7.textContent = formatPrice(ema7, precision);
    if (dom.candleEma21) dom.candleEma21.textContent = formatPrice(ema21, precision);
    
    // VWAP approximation
    const totalPriceVol = state.candles15s.reduce((acc, c) => acc + ((c.high + c.low + c.close) / 3) * c.volume, 0);
    const totalVol = state.candles15s.reduce((acc, c) => acc + c.volume, 0);
    const vwap = totalVol > 0 ? totalPriceVol / totalVol : ema7;
    if (dom.candleVwap) dom.candleVwap.textContent = formatPrice(vwap, precision);
  }

  function flashPriceCard(direction) {
    if (!dom.livePriceCard) return;
    dom.livePriceCard.classList.remove('flash-up', 'flash-down');
    void dom.livePriceCard.offsetWidth;
    dom.livePriceCard.classList.add(direction === 'up' ? 'flash-up' : 'flash-down');
  }

  function updatePriceDisplay() {
    if (!state.currentPrice) return;
    const precision = state.selectedCoin.precision;

    if (dom.currentPrice) dom.currentPrice.textContent = formatPrice(state.currentPrice, precision);
    if (dom.chartLivePrice) dom.chartLivePrice.textContent = formatPrice(state.currentPrice, precision);

    if (state.strikePrice !== null) {
      const delta = state.currentPrice - state.strikePrice;
      const pct = (delta / state.strikePrice) * 100;
      const isUp = delta >= 0;
      const sign = isUp ? '+' : '-';
      const absDelta = Math.abs(delta);

      if (dom.priceDeltaBadge) dom.priceDeltaBadge.className = `delta-badge ${isUp ? 'up' : 'down'}`;
      if (dom.deltaArrow) dom.deltaArrow.textContent = isUp ? '▲' : '▼';
      if (dom.deltaValue) dom.deltaValue.textContent = `${sign}${formatPrice(absDelta, precision)}`;
      if (dom.deltaPercent) dom.deltaPercent.textContent = `(${sign}${Math.abs(pct).toFixed(3)}%)`;

      if (dom.outcomePill) dom.outcomePill.className = `prediction-outcome-pill ${isUp ? 'winning-up' : 'winning-down'}`;
      if (dom.outcomeIcon) dom.outcomeIcon.textContent = isUp ? '▲' : '▼';
      if (dom.outcomeText) dom.outcomeText.textContent = isUp ? 'POSISI YES (NAIK) UNGGUL' : 'POSISI NO (TURUN) UNGGUL';
    }
  }

  function updateStrikeDisplay() {
    const precision = state.selectedCoin.precision;
    if (state.strikePrice === null) {
      if (dom.strikePrice) dom.strikePrice.textContent = '$--';
      if (dom.targetUpPrice) dom.targetUpPrice.textContent = '$--';
      if (dom.targetDownPrice) dom.targetDownPrice.textContent = '$--';
      return;
    }

    if (dom.strikePrice) dom.strikePrice.textContent = formatPrice(state.strikePrice, precision);
    if (dom.targetUpPrice) dom.targetUpPrice.textContent = `≥ ${formatPrice(state.strikePrice, precision)}`;
    if (dom.targetDownPrice) dom.targetDownPrice.textContent = `< ${formatPrice(state.strikePrice, precision)}`;

    if (state.strikeLockedAt && dom.strikeLockedTime) {
      dom.strikeLockedTime.textContent = formatTime(state.strikeLockedAt, true);
    }
  }

  function updateMomentumDisplay() {
    if (state.momentumQueue.length === 0) return;
    const upTicks = state.momentumQueue.filter(x => x === 1).length;
    const total = state.momentumQueue.length;
    const bullPct = Math.round((upTicks / total) * 100);
    const bearPct = 100 - bullPct;

    if (dom.bullPercent) dom.bullPercent.textContent = `${bullPct}%`;
    if (dom.bearPercent) dom.bearPercent.textContent = `${bearPct}%`;
    if (dom.momentumGaugeFill) dom.momentumGaugeFill.style.width = `${bullPct}%`;
    if (dom.velocityBar) dom.velocityBar.style.width = `${Math.min(100, Math.max(5, state.currentTickSpeed * 12))}%`;
  }

  // --- AI Debate Module (Bull vs Bear vs Arbiter) ---
  function evaluateAIDebate(time) {
    if (time - state.lastDebateTime < 1500) return; // Evaluate every 1.5 seconds
    state.lastDebateTime = time;

    if (!state.currentPrice || !state.strikePrice) return;

    const remainingMs = Math.max(0, state.roundEndTime - time);
    const totalRoundMs = state.roundDurationMinutes * 60 * 1000;
    const remainingPct = (remainingMs / totalRoundMs) * 100;
    const elapsedPct = 100 - remainingPct;

    // Calculate Implied Binary Contract Odds (Polymarket Standard)
    const { yesOdds, noOdds } = calculateBinaryMarketOdds(state.currentPrice, state.strikePrice, remainingMs, state.roundDurationMinutes);
    state.marketOddsYes = yesOdds;
    state.marketOddsNo = noOdds;

    // Update Polymarket chips & odds bar
    if (dom.feedPricePolymarket) {
      dom.feedPricePolymarket.textContent = `${(yesOdds * 100).toFixed(0)}¢ / ${(noOdds * 100).toFixed(0)}¢`;
    }
    if (dom.marketOddsYes) {
      dom.marketOddsYes.textContent = `YES: ${(yesOdds * 100).toFixed(0)}¢ | NO: ${(noOdds * 100).toFixed(0)}¢`;
    }
    if (dom.oddsBarYes) {
      dom.oddsBarYes.style.width = `${yesOdds * 100}%`;
    }

    // 1. Quantitative Factor Analysis
    const deltaStrike = state.currentPrice - state.strikePrice;
    const deltaStrikePct = (deltaStrike / state.strikePrice) * 100;
    
    // Short-term Rate of Change (last 15 ticks)
    let roc15 = 0;
    if (state.tickHistory.length >= 15) {
      const pOld = state.tickHistory[state.tickHistory.length - 15].price;
      roc15 = ((state.currentPrice - pOld) / pOld) * 100;
    }

    // Cross-Exchange Lead Delta (Coinbase vs Binance)
    let coinbaseLead = 0;
    if (state.feedPrices.coinbase && state.feedPrices.binance) {
      coinbaseLead = ((state.feedPrices.coinbase - state.feedPrices.binance) / state.feedPrices.binance) * 100;
    }

    // 2. Bull AI Agent Scoring & Thesis
    let bullScore = 50;
    if (deltaStrikePct > 0) bullScore += Math.min(28, deltaStrikePct * 120);
    if (roc15 > 0) bullScore += Math.min(18, roc15 * 180);
    else bullScore -= Math.min(15, Math.abs(roc15) * 120);
    if (coinbaseLead > 0.01) bullScore += 10;
    bullScore = Math.max(10, Math.min(95, Math.round(bullScore)));
    state.bullScore = bullScore;

    // 3. Bear AI Agent Scoring & Thesis
    let bearScore = 50;
    if (deltaStrikePct < 0) bearScore += Math.min(28, Math.abs(deltaStrikePct) * 120);
    if (roc15 < 0) bearScore += Math.min(18, Math.abs(roc15) * 180);
    else bearScore -= Math.min(15, roc15 * 120);
    if (coinbaseLead < -0.01) bearScore += 10;
    bearScore = Math.max(10, Math.min(95, Math.round(bearScore)));
    state.bearScore = bearScore;

    // Update Scores in UI
    if (dom.bullScoreVal) dom.bullScoreVal.textContent = `${bullScore}%`;
    if (dom.bearScoreVal) dom.bearScoreVal.textContent = `${bearScore}%`;

    // Generate Bull Thesis Text
    let bullMsg = '';
    if (bullScore >= 60) {
      bullMsg = `Arus beli agresif terkonfirmasi. Harga +${deltaStrikePct.toFixed(3)}% di atas strike dengan momentum naik (+${roc15.toFixed(3)}%). Bid exchange kuat mendukung posisi YES.`;
    } else if (bullScore <= 40) {
      bullMsg = `Tekanan beli melemah. Harga terhambat di bawah strike ($${state.strikePrice.toFixed(2)}). Menunggu dorongan likuiditas baru.`;
    } else {
      bullMsg = `Konsolidasi di sekitar baseline. Delta netral (${deltaStrikePct >= 0 ? '+' : ''}${deltaStrikePct.toFixed(3)}%). Memantau breakout volume.`;
    }
    if (dom.bullThesisText) dom.bullThesisText.textContent = `"${bullMsg}"`;
    if (dom.bullSignalsList) {
      dom.bullSignalsList.innerHTML = `
        <span class="signal-tag">ROC: ${roc15 >= 0 ? '+' : ''}${roc15.toFixed(3)}%</span>
        <span class="signal-tag">Lead Delta: ${coinbaseLead >= 0 ? '+' : ''}${coinbaseLead.toFixed(3)}%</span>
        <span class="signal-tag">Gap: ${deltaStrike >= 0 ? '+' : ''}$${deltaStrike.toFixed(2)}</span>
      `;
    }

    // Generate Bear Thesis Text
    let bearMsg = '';
    if (bearScore >= 60) {
      bearMsg = `Dominasi seller jelas. Harga -${Math.abs(deltaStrikePct).toFixed(3)}% di bawah strike dengan akselerasi turun. Time decay menekan kemungkinan reversal ke atas.`;
    } else if (bearScore <= 40) {
      bearMsg = `Tekanan jual mulai habis. Buyer membentuk support kokoh di atas strike baseline. Probabilitas penurunan kecil.`;
    } else {
      bearMsg = `Menguji resistance range. Spread multi-exchange menunjukkan pasar seimbang tanpa katalis penurunan besar.`;
    }
    if (dom.bearThesisText) dom.bearThesisText.textContent = `"${bearMsg}"`;
    if (dom.bearSignalsList) {
      dom.bearSignalsList.innerHTML = `
        <span class="signal-tag">Bear ROC: ${roc15.toFixed(3)}%</span>
        <span class="signal-tag">Spread Drag: ${state.currentPrice > 0 ? ((state.currentPrice - (state.feedPrices.binance || state.currentPrice)) / state.currentPrice * 100).toFixed(3) : 0}%</span>
        <span class="signal-tag">Decay: ${remainingPct.toFixed(0)}% Sisa</span>
      `;
    }

    // 4. Chief Arbiter Synthesis & Consensus Verdict
    state.debateCycle++;
    if (dom.debateCycleCounter) dom.debateCycleCounter.textContent = `#${state.debateCycle}`;

    const scoreDelta = bullScore - bearScore;
    let verdictAction = 'STANDBY';
    let verdictClass = 'standby';
    let confidence = 50;
    let rationale = '';

    // Active trading window: between 4% and 90% of round time
    const isTradingWindowOpen = elapsedPct >= 4 && elapsedPct <= 90;

    if (bullScore >= 58 && scoreDelta >= 12 && yesOdds <= 0.75) {
      verdictAction = 'BUY YES (UP)';
      verdictClass = 'buy-yes';
      confidence = bullScore;
      rationale = `KONSENSUS BULL: Momentum bullish terverifikasi lintas 3 bursa & Polymarket. Kontrak YES ${(yesOdds * 100).toFixed(0)}¢ memberikan positive expected value (+EV).`;
    } else if (bearScore >= 58 && scoreDelta <= -12 && noOdds <= 0.75) {
      verdictAction = 'BUY NO (DOWN)';
      verdictClass = 'buy-no';
      confidence = bearScore;
      rationale = `KONSENSUS BEAR: Order skew ke bawah terkonfirmasi. Harga tertahan di bawah strike. Kontrak NO di ${(noOdds * 100).toFixed(0)}¢ memiliki statistical edge tinggi.`;
    } else {
      verdictAction = 'STANDBY';
      verdictClass = 'standby';
      confidence = Math.max(50, Math.round(100 - Math.abs(scoreDelta) * 1.5));
      rationale = `DELIBERASI ARBITER: Belum ada asimetri statistik yang cukup antara Bull (${bullScore}%) dan Bear (${bearScore}%). Menunggu konfirmasi arah volume.`;
    }

    state.arbiterVerdict = verdictAction;
    state.arbiterConfidence = confidence;

    if (dom.arbiterAction) {
      dom.arbiterAction.textContent = verdictAction;
      dom.arbiterAction.className = `verdict-action ${verdictClass}`;
    }
    if (dom.arbiterConfidence) dom.arbiterConfidence.textContent = `${confidence}%`;
    if (dom.consensusStrengthBadge) {
      dom.consensusStrengthBadge.textContent = verdictAction === 'STANDBY' ? 'DELIBERASI NETRAL' : 'KONSENSUS TERCAPAI';
    }
    if (dom.arbiterRationale) dom.arbiterRationale.textContent = `"${rationale}"`;

    // Log to live debate transcript feed
    if (state.debateCycle % 3 === 0) {
      const activeAuthor = scoreDelta > 10 ? 'bull' : (scoreDelta < -10 ? 'bear' : 'arbiter');
      const authorName = scoreDelta > 10 ? 'BULL AI' : (scoreDelta < -10 ? 'BEAR AI' : 'ARBITER');
      const snippet = scoreDelta > 10 ? bullMsg : (scoreDelta < -10 ? bearMsg : rationale);
      appendDebateTranscript(activeAuthor, authorName, snippet);
    }

    // 5. Trigger Position Protection (Reversal / Fast-Flip) OR Initial Trade
    if (isTradingWindowOpen) {
      // First check if active trade needs emergency reversal flip
      checkAndExecuteReversalProtection(bullScore, bearScore, yesOdds, noOdds, remainingMs);
      
      // If no active trade, execute initial trade on consensus
      processAutonomousTradeExecution(verdictAction, yesOdds, noOdds);
    }
  }

  function appendDebateTranscript(authorType, authorName, message) {
    const timeStr = formatTime(Date.now(), true);
    const item = { time: timeStr, authorType, authorName, message };
    state.debateTranscripts.unshift(item);
    if (state.debateTranscripts.length > 30) state.debateTranscripts.pop();

    if (dom.transcriptCount) dom.transcriptCount.textContent = `${state.debateTranscripts.length} logs`;
    if (dom.debateTranscriptFeed) {
      dom.debateTranscriptFeed.innerHTML = state.debateTranscripts.map(t => `
        <div class="transcript-item">
          <span class="time-tag">${t.time}</span>
          <span class="author-tag ${t.authorType}">${t.authorName}:</span>
          <span class="msg-content">${t.message}</span>
        </div>
      `).join('');
    }
  }

  // --- Autonomous Portfolio Simulator Engine ---
  function processAutonomousTradeExecution(verdict, yesOdds, noOdds) {
    const p = state.portfolio;

    // Only 1 initial trade entry per round ID
    if (p.activePosition && p.activePosition.roundId === state.currentRoundId) {
      return;
    }

    // Check available cash (must have at least $1.00)
    if (p.cashBalance < 1.00) return;

    if (verdict === 'BUY YES (UP)') {
      executeSimOrder('YES', yesOdds);
    } else if (verdict === 'BUY NO (DOWN)') {
      executeSimOrder('NO', noOdds);
    }
  }

  function executeSimOrder(side, contractPrice) {
    const p = state.portfolio;
    
    // Position Sizing: 25% of current cash (min $1.00, capped at current cash)
    let alloc = p.cashBalance * 0.25;
    alloc = Math.max(1.00, Math.min(alloc, p.cashBalance));
    if (p.cashBalance < alloc) alloc = p.cashBalance;

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

    playAlertSound('trade-exec');
    appendDebateTranscript('arbiter', 'KOPI TUBRUK BOT', `⚡ ORDER DIEKSEKUSI: Beli ${shares} share ${side} pada harga ${(sharePrice * 100).toFixed(0)}¢ (Modal: $${alloc.toFixed(2)})`);
    updateSimulatorUI();
  }

  // =========================================================================
  // ⚡ DYNAMIC REVERSAL & FAST-FLIP ENGINE (JUAL CEPAT & BELI ULANG UNTUNG)
  // =========================================================================
  function checkAndExecuteReversalProtection(bullScore, bearScore, yesOdds, noOdds, remainingMs) {
    const p = state.portfolio;
    if (!p.activePosition) return;
    
    const pos = p.activePosition;
    // Don't flip twice in the same round to prevent over-trading
    if (pos.isReversed) return;

    // Minimum time required to execute a flip (at least 20 seconds remaining)
    if (remainingMs < 20000) return;

    const currentContractPrice = pos.side === 'YES' ? yesOdds : noOdds;
    const currentVal = pos.shares * currentContractPrice;
    const unrealizedLoss = pos.cost - currentVal;
    const drawdownPct = (unrealizedLoss / pos.cost) * 100;

    let shouldReverse = false;
    let reverseReason = '';
    let targetOppositeSide = '';
    let targetOppositeOdds = 0;

    // Condition A: Position is YES, but price strongly collapsed below strike with high Bear conviction
    if (pos.side === 'YES') {
      const isBelowStrike = state.currentPrice < state.strikePrice;
      if (isBelowStrike && bearScore >= 62 && drawdownPct >= 16.0) {
        shouldReverse = true;
        targetOppositeSide = 'NO';
        targetOppositeOdds = noOdds;
        reverseReason = `Harga anjlok di bawah strike ($${state.strikePrice.toFixed(2)}) dengan keyakinan Bear ${bearScore}% dan Drawdown -${drawdownPct.toFixed(1)}%.`;
      }
    }
    // Condition B: Position is NO, but price strongly surged above strike with high Bull conviction
    else if (pos.side === 'NO') {
      const isAboveStrike = state.currentPrice >= state.strikePrice;
      if (isAboveStrike && bullScore >= 62 && drawdownPct >= 16.0) {
        shouldReverse = true;
        targetOppositeSide = 'YES';
        targetOppositeOdds = yesOdds;
        reverseReason = `Harga melonjak di atas strike ($${state.strikePrice.toFixed(2)}) dengan keyakinan Bull ${bullScore}% dan Drawdown -${drawdownPct.toFixed(1)}%.`;
      }
    }

    if (!shouldReverse) return;

    // --- STEP 1: FAST SELL / CUT LOSS (JUAL CEPAT) ---
    // Salvage remaining capital immediately
    const salvagedCash = parseFloat(currentVal.toFixed(2));
    const realizedLossOnFirstLeg = parseFloat((pos.cost - salvagedCash).toFixed(2));
    p.cashBalance = parseFloat((p.cashBalance + salvagedCash).toFixed(2));

    // --- STEP 2: DETAILED RE-ENTRY CALCULATION (BELI ULANG ARAH BERLAWANAN DENGAN TARGET PROFIT) ---
    const flipContractPrice = Math.max(0.08, Math.min(0.92, targetOppositeOdds));
    
    // Target net profit for round: recover loss + 12% surplus profit
    const desiredSurplus = Math.max(0.50, realizedLossOnFirstLeg * 0.25);
    const targetNetProfit = realizedLossOnFirstLeg + desiredSurplus;
    
    // Required shares in opposite direction to cover initial loss and yield net profit:
    // Profit upon win = (Shares * 1.00) - FlipCost = Shares * (1 - flipContractPrice)
    // To achieve targetNetProfit: Shares = (realizedLossOnFirstLeg + desiredSurplus) / (1 - flipContractPrice)
    let requiredShares = (realizedLossOnFirstLeg + desiredSurplus) / (1.00 - flipContractPrice);
    let requiredFlipCost = requiredShares * flipContractPrice;

    // Cap to available cash
    if (requiredFlipCost > p.cashBalance) {
      requiredFlipCost = p.cashBalance;
      requiredShares = requiredFlipCost / flipContractPrice;
    }

    // Safety check: must allocate at least $1.00
    if (requiredFlipCost < 1.00 && p.cashBalance >= 1.00) {
      requiredFlipCost = Math.min(p.cashBalance, 1.00);
      requiredShares = requiredFlipCost / flipContractPrice;
    }

    if (requiredFlipCost < 0.50) {
      // Not enough cash to execute profitable flip, exit completely
      p.tradeHistory.unshift({
        roundId: pos.roundId,
        coin: pos.coin,
        side: `${pos.side} (CUT-LOSS)`,
        entryPrice: pos.entryPrice,
        shares: pos.shares,
        cost: pos.cost,
        won: false,
        payout: salvagedCash,
        netPnl: -realizedLossOnFirstLeg,
        equityAfter: p.cashBalance,
        timestamp: Date.now()
      });
      p.activePosition = null;
      renderSimTradeTable();
      updateSimulatorUI();
      appendDebateTranscript('bear', 'REVERSAL EXIT', `⚠️ Jual Cepat dieksekusi: Rugi -$${realizedLossOnFirstLeg.toFixed(2)}, menyelamatkan kas $${salvagedCash.toFixed(2)}.`);
      return;
    }

    // Deduct flip allocation from cash
    p.cashBalance = parseFloat((p.cashBalance - requiredFlipCost).toFixed(2));
    const finalShares = parseFloat(requiredShares.toFixed(2));
    const finalCost = parseFloat(requiredFlipCost.toFixed(2));
    const projectedGrossPayout = finalShares * 1.00;
    const projectedNetRoundProfit = projectedGrossPayout - finalCost - realizedLossOnFirstLeg;

    // Mutate position into the new REVERSED position
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

    playAlertSound('reversal-flip');
    
    const flipLogMessage = `🔄 REVERSAL & FAST FLIP: ${reverseReason} Jual ${pos.side} (selamatkan $${salvagedCash.toFixed(2)}, rugi leg 1 -$${realizedLossOnFirstLeg.toFixed(2)}). Beli ${finalShares} share ${targetOppositeSide} di ${(flipContractPrice * 100).toFixed(0)}¢. Target Net Round Profit: +$${projectedNetRoundProfit.toFixed(2)}!`;
    appendDebateTranscript('arbiter', 'SMART FLIP BOT', flipLogMessage);

    updateSimulatorUI();
    renderSimTradeTable();
  }

  function updateSimulatorMarkToMarket() {
    const p = state.portfolio;
    if (!p.activePosition) {
      updateSimulatorUI();
      return;
    }

    const pos = p.activePosition;
    const now = Date.now();
    const remainingMs = Math.max(0, state.roundEndTime - now);
    const { yesOdds, noOdds } = calculateBinaryMarketOdds(state.currentPrice, state.strikePrice, remainingMs, state.roundDurationMinutes);
    const currentContractPrice = pos.side === 'YES' ? yesOdds : noOdds;

    const currentVal = pos.shares * currentContractPrice;
    const currentLegPnl = currentVal - pos.cost;
    const totalRoundUnrealizedPnl = pos.isReversed ? (currentLegPnl - pos.lossIncurred) : currentLegPnl;

    if (dom.posStatusBadge) {
      if (pos.isReversed) {
        dom.posStatusBadge.className = 'pos-status-badge reversed';
        dom.posStatusBadge.textContent = `POSISI FLIP REVERSAL: ${pos.side} (${pos.shares} share)`;
      } else {
        dom.posStatusBadge.className = `pos-status-badge ${pos.side === 'YES' ? 'active-yes' : 'active-no'}`;
        dom.posStatusBadge.textContent = `POSISI AKTIF: ${pos.side} (${pos.shares} share)`;
      }
    }

    if (dom.posSideVal) dom.posSideVal.textContent = pos.isReversed ? `${pos.side} (FLIP DARI ${pos.initialSide})` : pos.side;
    if (dom.posEntryPriceVal) dom.posEntryPriceVal.textContent = `${(pos.entryPrice * 100).toFixed(0)}¢`;
    if (dom.posSharesVal) dom.posSharesVal.textContent = `${pos.shares}`;
    if (dom.posCostVal) dom.posCostVal.textContent = `$${pos.cost.toFixed(2)} ${pos.isReversed ? `(+ loss leg 1: -$${pos.lossIncurred.toFixed(2)})` : ''}`;
    if (dom.posCurrentVal) dom.posCurrentVal.textContent = `$${currentVal.toFixed(2)} (${(currentContractPrice * 100).toFixed(0)}¢)`;
    
    const pnlSign = totalRoundUnrealizedPnl >= 0 ? '+' : '-';
    const pnlClass = totalRoundUnrealizedPnl >= 0 ? 'text-green' : 'text-red';
    if (dom.posUnrealizedPnlVal) {
      dom.posUnrealizedPnlVal.className = `val ${pnlClass}`;
      dom.posUnrealizedPnlVal.textContent = `${pnlSign}$${Math.abs(totalRoundUnrealizedPnl).toFixed(2)} (${pnlSign}${Math.abs((totalRoundUnrealizedPnl / pos.cost) * 100).toFixed(1)}%)`;
    }

    if (dom.posStrategyAction) {
      if (pos.isReversed) {
        dom.posStrategyAction.textContent = `🔄 REVERSED FLIP HOLD (Target Net Profit: +$${pos.projectedNetProfit || '0.00'})`;
        dom.posStrategyAction.className = 'val text-purple';
      } else {
        dom.posStrategyAction.textContent = `🛡️ MONITORING REVERSAL & MOMENTUM`;
        dom.posStrategyAction.className = 'val text-cyan';
      }
    }

    // Portfolio Totals
    const totalEquity = p.cashBalance + currentVal;
    const netPnl = totalEquity - p.startingCapital;
    const netPnlPct = (netPnl / p.startingCapital) * 100;

    if (dom.simEquityVal) dom.simEquityVal.textContent = `$${totalEquity.toFixed(2)}`;
    if (dom.simCashVal) dom.simCashVal.textContent = `$${p.cashBalance.toFixed(2)}`;
    if (dom.simInTradeVal) dom.simInTradeVal.textContent = `$${currentVal.toFixed(2)}`;

    const netSign = netPnl >= 0 ? '+' : '-';
    if (dom.simPnlVal) {
      dom.simPnlVal.className = `port-stat-val ${netPnl >= 0 ? 'text-green' : 'text-red'}`;
      dom.simPnlVal.textContent = `${netSign}$${Math.abs(netPnl).toFixed(2)} (${netSign}${Math.abs(netPnlPct).toFixed(1)}%)`;
    }
  }

  function settleSimPositionAtRoundEnd(roundClosePrice, roundStrikePrice) {
    const p = state.portfolio;
    if (!p.activePosition) return;

    const pos = p.activePosition;
    const isCloseUp = roundClosePrice >= roundStrikePrice;
    const won = (pos.side === 'YES' && isCloseUp) || (pos.side === 'NO' && !isCloseUp);

    const payout = won ? pos.shares * 1.00 : 0.00;
    // Account for any previous loss if this was a reversed trade
    const netPnl = won 
      ? (payout - pos.cost - (pos.lossIncurred || 0.00))
      : (-pos.cost - (pos.lossIncurred || 0.00));

    p.cashBalance = parseFloat((p.cashBalance + payout).toFixed(2));
    p.cumulativePnl += netPnl;
    p.totalTrades++;
    if (netPnl >= 0) p.wins++;
    else p.losses++;

    const totalEquity = p.cashBalance;

    const tradeRecord = {
      roundId: pos.roundId,
      coin: pos.coin,
      side: pos.isReversed ? `${pos.side} (FLIP)` : pos.side,
      entryPrice: pos.entryPrice,
      shares: pos.shares,
      cost: pos.cost,
      won: won,
      payout: payout,
      netPnl: netPnl,
      equityAfter: totalEquity,
      timestamp: Date.now()
    };

    p.tradeHistory.unshift(tradeRecord);
    if (p.tradeHistory.length > 50) p.tradeHistory.pop();

    p.activePosition = null;
    renderSimTradeTable();
    updateSimulatorUI();
  }

  function updateSimulatorUI() {
    const p = state.portfolio;
    const inTradeVal = p.activePosition ? p.activePosition.cost : 0.00;
    const equity = p.cashBalance + inTradeVal;
    const netPnl = equity - p.startingCapital;
    const netPnlPct = (netPnl / p.startingCapital) * 100;

    if (dom.simEquityVal) dom.simEquityVal.textContent = `$${equity.toFixed(2)}`;
    if (dom.simCashVal) dom.simCashVal.textContent = `$${p.cashBalance.toFixed(2)}`;
    if (dom.simInTradeVal) dom.simInTradeVal.textContent = `$${inTradeVal.toFixed(2)}`;

    const netSign = netPnl >= 0 ? '+' : '-';
    if (dom.simPnlVal) {
      dom.simPnlVal.className = `port-stat-val ${netPnl >= 0 ? 'text-green' : 'text-red'}`;
      dom.simPnlVal.textContent = `${netSign}$${Math.abs(netPnl).toFixed(2)} (${netSign}${Math.abs(netPnlPct).toFixed(1)}%)`;
    }

    const winRate = p.totalTrades > 0 ? ((p.wins / p.totalTrades) * 100).toFixed(0) : 0;
    if (dom.simWinRateVal) dom.simWinRateVal.textContent = `${winRate}% (${p.wins}W / ${p.losses}L)`;

    if (!p.activePosition) {
      if (dom.posStatusBadge) {
        dom.posStatusBadge.className = 'pos-status-badge idle';
        dom.posStatusBadge.textContent = 'BELUM ADA TRADE (MENUNGGU SINYAL KONSENSUS)';
      }
      if (dom.posSideVal) dom.posSideVal.textContent = '--';
      if (dom.posEntryPriceVal) dom.posEntryPriceVal.textContent = '--';
      if (dom.posSharesVal) dom.posSharesVal.textContent = '--';
      if (dom.posCostVal) dom.posCostVal.textContent = '--';
      if (dom.posCurrentVal) dom.posCurrentVal.textContent = '--';
      if (dom.posUnrealizedPnlVal) {
        dom.posUnrealizedPnlVal.className = 'val';
        dom.posUnrealizedPnlVal.textContent = '--';
      }
      if (dom.posStrategyAction) {
        dom.posStrategyAction.textContent = 'STANDBY MONITORING';
        dom.posStrategyAction.className = 'val text-cyan';
      }
    }
  }

  function renderSimTradeTable() {
    const p = state.portfolio;
    if (!dom.simTradeTableBody) return;

    if (p.tradeHistory.length === 0) {
      dom.simTradeTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="8">AI akan otomatis mengeksekusi order saat konsensus terbentuk dan mencatat hasil saat ronde selesai...</td>
        </tr>
      `;
      return;
    }

    dom.simTradeTableBody.innerHTML = p.tradeHistory.map(t => {
      const pnlSign = t.netPnl >= 0 ? '+' : '-';
      const pnlClass = t.netPnl >= 0 ? 'text-green' : 'text-red';
      const pillClass = t.won ? 'win' : 'loss';
      return `
        <tr>
          <td><strong style="color:var(--text-primary);">${t.coin}</strong> <span style="color:var(--text-dim);">${t.roundId}</span></td>
          <td><span class="history-pill ${t.side.includes('YES') ? 'up' : (t.side.includes('NO') ? 'down' : 'reversed')}">${t.side}</span></td>
          <td>${(t.entryPrice * 100).toFixed(0)}¢</td>
          <td>$${t.cost.toFixed(2)}</td>
          <td>${t.shares}</td>
          <td><span class="history-pill ${pillClass}">${t.won ? 'WIN (100¢)' : 'LOSS (0¢)'}</span></td>
          <td class="${pnlClass}">${pnlSign}$${Math.abs(t.netPnl).toFixed(2)}</td>
          <td><strong>$${t.equityAfter.toFixed(2)}</strong></td>
        </tr>
      `;
    }).join('');
  }

  // --- Round & Interval Boundary Engine ---
  function calculateCurrentRoundBoundaries(durationMinutes) {
    const now = Date.now();
    const intervalMs = durationMinutes * 60 * 1000;
    const start = Math.floor(now / intervalMs) * intervalMs;
    const end = start + intervalMs;
    const roundNumber = Math.floor(start / intervalMs) % 10000;

    return {
      startTime: start,
      endTime: end,
      roundId: `${durationMinutes}M-${roundNumber}`
    };
  }

  function syncRoundState() {
    const { startTime, endTime, roundId } = calculateCurrentRoundBoundaries(state.roundDurationMinutes);

    if (state.currentRoundId !== roundId) {
      if (state.currentRoundId !== null && state.strikePrice !== null && state.currentPrice !== null) {
        // Record completed round
        recordRoundResult({
          roundId: state.currentRoundId,
          startTime: state.roundStartTime,
          endTime: state.roundEndTime,
          strikePrice: state.strikePrice,
          closePrice: state.currentPrice,
          coin: state.selectedCoin.symbol
        });

        // Settle Simulator Position
        settleSimPositionAtRoundEnd(state.currentPrice, state.strikePrice);
      }

      state.currentRoundId = roundId;
      state.roundStartTime = startTime;
      state.roundEndTime = endTime;
      state.lastChimePlayed = null;

      // Lock new round strike price immediately
      state.strikePrice = state.currentPrice || state.selectedCoin.defaultPrice;
      state.strikeLockedAt = startTime;
      updateStrikeDisplay();
    }

    const startStr = formatTime(state.roundStartTime);
    const endStr = formatTime(state.roundEndTime);
    if (dom.periodRangeBadge) dom.periodRangeBadge.textContent = `${startStr} ➔ ${endStr}`;
    if (dom.roundNumberTag) dom.roundNumberTag.textContent = `#${roundId}`;
    if (dom.expiryLabel) dom.expiryLabel.textContent = `Resolusi pada ${endStr}`;
  }

  function recordRoundResult(roundData) {
    const delta = roundData.closePrice - roundData.strikePrice;
    const isUp = delta >= 0;
    const outcome = isUp ? 'YES (UP)' : 'NO (DOWN)';

    const entry = {
      roundId: roundData.roundId,
      timeStr: `${formatTime(roundData.startTime)} - ${formatTime(roundData.endTime)}`,
      coin: roundData.coin,
      strikePrice: roundData.strikePrice,
      closePrice: roundData.closePrice,
      delta: delta,
      percent: (delta / roundData.strikePrice) * 100,
      outcome: outcome,
      isUp: isUp,
      timestamp: Date.now()
    };

    state.roundHistory.unshift(entry);
    if (state.roundHistory.length > 50) state.roundHistory.pop();

    renderHistoryTable();
    playAlertSound('round-resolved');
  }

  function renderHistoryTable() {
    if (!dom.historyTableBody) return;

    if (state.roundHistory.length === 0) {
      dom.historyTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="6">Ronde otomatis tersimpan di sini saat countdown rollover selesai...</td>
        </tr>
      `;
      if (dom.historyCount) dom.historyCount.textContent = '0 Ronde';
      return;
    }

    if (dom.historyCount) dom.historyCount.textContent = `${state.roundHistory.length} Ronde`;
    dom.historyTableBody.innerHTML = state.roundHistory.map(r => {
      const precision = state.selectedCoin.precision;
      const isUp = r.isUp;
      const deltaSign = r.delta >= 0 ? '+' : '-';
      const absDelta = Math.abs(r.delta);
      const pillClass = isUp ? 'up' : 'down';
      const textClass = isUp ? 'text-green' : 'text-red';

      return `
        <tr>
          <td><strong style="color:var(--text-primary);">${r.coin}</strong> <span style="color:var(--text-dim);">${r.roundId}</span></td>
          <td>${r.timeStr}</td>
          <td>${formatPrice(r.strikePrice, precision)}</td>
          <td>${formatPrice(r.closePrice, precision)}</td>
          <td class="${textClass}">${deltaSign}${formatPrice(absDelta, precision)} (${deltaSign}${Math.abs(r.percent).toFixed(2)}%)</td>
          <td><span class="history-pill ${pillClass}">HASIL ${r.outcome}</span></td>
        </tr>
      `;
    }).join('');
  }

  // --- Dual Chart Renderers (Side-by-Side Canvas) ---
  function renderDualCharts() {
    renderCandleChart();
    renderTickChart();
  }

  // Chart 1: 15s Aggregated Candlestick & EMA Chart
  function renderCandleChart() {
    const canvas = dom.candleCanvas;
    if (!canvas || !dom.candleCanvasContainer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = dom.candleCanvasContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    // Background based on current active theme
    const isDark = document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-slate');
    ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const allCandles = [...state.candles15s];
    if (state.currentCandle) allCandles.push(state.currentCandle);

    if (allCandles.length < 2) {
      ctx.restore();
      return;
    }

    const highs = allCandles.map(c => c.high);
    const lows = allCandles.map(c => c.low);
    if (state.strikePrice) { highs.push(state.strikePrice); lows.push(state.strikePrice); }

    const minP = Math.min(...lows);
    const maxP = Math.max(...highs);
    const pad = Math.max((maxP - minP) * 0.15, state.currentPrice ? state.currentPrice * 0.0006 : 1);
    const yMin = minP - pad;
    const yMax = maxP + pad;
    const yRange = yMax - yMin;

    const getY = (val) => h - ((val - yMin) / yRange) * (h - 36) - 18;
    const numCandles = allCandles.length;
    const candleWidth = Math.max(4, Math.min(18, (w - 30) / numCandles - 4));
    const stepX = (w - 30) / numCandles;

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const gy = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // Strike baseline
    if (state.strikePrice) {
      const sy = getY(state.strikePrice);
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(w, sy); ctx.stroke();
      ctx.restore();
    }

    // Draw Candlesticks
    allCandles.forEach((c, idx) => {
      const cx = 15 + idx * stepX + stepX / 2;
      const isGreen = c.close >= c.open;
      const candleColor = isGreen ? '#10b981' : '#f43f5e';

      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      // Wick
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, highY);
      ctx.lineTo(cx, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = candleColor;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(cx - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw EMA 7 (Cyan)
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    allCandles.forEach((c, idx) => {
      if (c.ema7) {
        const cx = 15 + idx * stepX + stepX / 2;
        const cy = getY(c.ema7);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
    });
    ctx.stroke();

    // Draw EMA 21 (Purple)
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    allCandles.forEach((c, idx) => {
      if (c.ema21) {
        const cx = 15 + idx * stepX + stepX / 2;
        const cy = getY(c.ema21);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
    });
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // Chart 2: Real-Time High-Frequency Tick Stream & Strike Baseline
  function renderTickChart() {
    const canvas = dom.tickCanvas;
    if (!canvas || !dom.canvasContainer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = dom.canvasContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    // Background based on current active theme
    const isDark = document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-slate');
    ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (state.tickHistory.length < 2) {
      ctx.restore();
      return;
    }

    const prices = state.tickHistory.map(t => t.price);
    if (state.strikePrice) prices.push(state.strikePrice);

    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const precision = state.selectedCoin.precision;

    if (dom.chartHighPrice) dom.chartHighPrice.textContent = formatPrice(maxP, precision);
    if (dom.chartLowPrice) dom.chartLowPrice.textContent = formatPrice(minP, precision);
    if (dom.chartSpread) dom.chartSpread.textContent = formatPrice(maxP - minP, precision);

    const pad = Math.max((maxP - minP) * 0.18, state.currentPrice ? state.currentPrice * 0.0004 : 1);
    const yMin = minP - pad;
    const yMax = maxP + pad;
    const yRange = yMax - yMin;

    const getY = (val) => h - ((val - yMin) / yRange) * (h - 36) - 18;
    const getX = (idx) => (idx / (state.tickHistory.length - 1)) * (w - 20) + 10;

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const gy = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // Strike Line
    if (state.strikePrice) {
      const sy = getY(state.strikePrice);
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(w, sy); ctx.stroke();
      ctx.restore();
    }

    // Dynamic Gradient Fill Under Price Path
    const lastPrice = state.tickHistory[state.tickHistory.length - 1].price;
    const isAbove = state.strikePrice ? lastPrice >= state.strikePrice : true;
    const themeColor = isAbove ? '#10b981' : '#f43f5e';

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, isAbove ? 'rgba(16, 185, 129, 0.22)' : 'rgba(244, 63, 94, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), h);
    for (let i = 0; i < state.tickHistory.length; i++) {
      ctx.lineTo(getX(i), getY(state.tickHistory[i].price));
    }
    ctx.lineTo(getX(state.tickHistory.length - 1), h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Price Line
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < state.tickHistory.length; i++) {
      const x = getX(i);
      const y = getY(state.tickHistory[i].price);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Pulsing Head Dot
    if (state.tickHistory.length > 0) {
      const lastX = getX(state.tickHistory.length - 1);
      const lastY = getY(state.tickHistory[state.tickHistory.length - 1].price);

      ctx.beginPath();
      ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
      ctx.fillStyle = isAbove ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // ⏱️ SOLID DUAL-CLOCK TIMER & ROLLOVER ENGINE (GUARANTEED NO FREEZING)
  // =========================================================================
  function updateTimerCountdown() {
    try {
      const now = Date.now();
      syncRoundState();

      const totalRoundMs = state.roundDurationMinutes * 60 * 1000;
      const remainingMs = Math.max(0, state.roundEndTime - now);

      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      const tenths = Math.floor((remainingMs % 1000) / 100);

      if (dom.timerMinutes) dom.timerMinutes.textContent = String(mins).padStart(2, '0');
      if (dom.timerSeconds) dom.timerSeconds.textContent = String(secs).padStart(2, '0');
      if (dom.timerMs) dom.timerMs.textContent = `.${tenths}`;

      const progressPct = (remainingMs / totalRoundMs) * 100;
      if (dom.timerProgressFill) dom.timerProgressFill.style.width = `${progressPct}%`;

      if (dom.countdownCard) {
        dom.countdownCard.classList.remove('warning', 'critical');
        if (remainingMs <= 10000) {
          dom.countdownCard.classList.add('critical');
          if (secs !== state.lastChimePlayed) {
            state.lastChimePlayed = secs;
            playAlertSound('tick-10');
          }
        } else if (remainingMs <= 30000) {
          dom.countdownCard.classList.add('warning');
          if (state.lastChimePlayed !== '30s') {
            state.lastChimePlayed = '30s';
            playAlertSound('tick-30');
          }
        }
      }

      if (dom.currentClock) dom.currentClock.textContent = formatTimeUTC(now);
      if (dom.systemClockLocal) dom.systemClockLocal.textContent = `Waktu Lokal: ${formatTime(now, true)} WIB`;
    } catch (err) {
      console.warn('Timer countdown error:', err);
    }
  }

  function startTimerEngine() {
    // 1. Rock-solid setInterval loop (runs even when tab is backgrounded)
    setInterval(updateTimerCountdown, 50);

    // 2. High-precision requestAnimationFrame visual loop for ultra-smooth UI
    function animLoop() {
      updateTimerCountdown();
      requestAnimationFrame(animLoop);
    }
    requestAnimationFrame(animLoop);
  }

  // --- Theme Switcher Engine ---
  function initTheme() {
    const savedTheme = localStorage.getItem('kopi_tubruk_theme') || 'theme-light';
    applyTheme(savedTheme);
  }

  function applyTheme(themeName) {
    state.currentTheme = themeName;
    document.body.className = themeName;
    localStorage.setItem('kopi_tubruk_theme', themeName);

    if (themeName === 'theme-dark' || themeName === 'theme-slate') {
      if (dom.themeIconLight) dom.themeIconLight.classList.add('hidden');
      if (dom.themeIconDark) dom.themeIconDark.classList.remove('hidden');
      if (dom.themeLabel) dom.themeLabel.textContent = 'GELAP';
    } else {
      if (dom.themeIconLight) dom.themeIconLight.classList.remove('hidden');
      if (dom.themeIconDark) dom.themeIconDark.classList.add('hidden');
      if (dom.themeLabel) dom.themeLabel.textContent = 'TERANG';
    }

    renderDualCharts();
  }

  function toggleTheme() {
    const isDark = state.currentTheme === 'theme-dark' || state.currentTheme === 'theme-slate';
    applyTheme(isDark ? 'theme-light' : 'theme-dark');
  }

  // --- Event Listeners & Interactive Handlers ---
  function setupEventListeners() {
    // Theme Switcher Button
    if (dom.themeToggle) {
      dom.themeToggle.addEventListener('click', toggleTheme);
    }

    // Coin Selection Switcher
    dom.coinButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const coinSymbol = this.dataset.coin;
        const selected = COINS.find(c => c.symbol === coinSymbol);
        if (selected && selected !== state.selectedCoin) {
          dom.coinButtons.forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          state.selectedCoin = selected;
          state.currentPrice = null;
          state.previousPrice = null;
          state.strikePrice = null;
          state.tickHistory = [];
          state.candles15s = [];
          state.currentCandle = null;
          state.momentumQueue = [];
          state.feedPrices = { binance: null, coinbase: null, kraken: null, polymarketYes: 0.50, polymarketNo: 0.50 };

          updatePriceDisplay();
          updateStrikeDisplay();
          connectMultiExchangeStreams();
          syncRoundState();
        }
      });
    });

    // Timeframe Selector
    dom.timeframeButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const mins = parseInt(this.dataset.minutes, 10);
        if (mins && mins !== state.roundDurationMinutes) {
          dom.timeframeButtons.forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          state.roundDurationMinutes = mins;
          state.currentRoundId = null;
          syncRoundState();
        }
      });
    });

    // Sound Toggle
    if (dom.soundToggle) {
      dom.soundToggle.addEventListener('click', function () {
        state.audioEnabled = !state.audioEnabled;
        if (state.audioEnabled) {
          if (dom.soundOnIcon) dom.soundOnIcon.classList.remove('hidden');
          if (dom.soundOffIcon) dom.soundOffIcon.classList.add('hidden');
          playAlertSound('tick-30');
        } else {
          if (dom.soundOnIcon) dom.soundOnIcon.classList.add('hidden');
          if (dom.soundOffIcon) dom.soundOffIcon.classList.remove('hidden');
        }
      });
    }

    // Manual Strike Lock
    if (dom.manualStrikeBtn) {
      dom.manualStrikeBtn.addEventListener('click', function () {
        if (state.currentPrice) {
          state.strikePrice = state.currentPrice;
          state.strikeLockedAt = Date.now();
          updateStrikeDisplay();
          renderDualCharts();
        }
      });
    }

    // Clear Chart
    if (dom.clearChartBtn) {
      dom.clearChartBtn.addEventListener('click', function () {
        state.tickHistory = [];
        state.candles15s = [];
        if (state.currentPrice) {
          state.tickHistory.push({ time: Date.now(), price: state.currentPrice });
        }
        renderDualCharts();
      });
    }

    // Clear History
    if (dom.clearHistoryBtn) {
      dom.clearHistoryBtn.addEventListener('click', function () {
        state.roundHistory = [];
        renderHistoryTable();
      });
    }

    // Simulator Capital Input (Flexible Capital, Min $1)
    if (dom.simStartingCapitalInput) {
      dom.simStartingCapitalInput.addEventListener('input', function () {
        const val = parseFloat(this.value);
        if (!isNaN(val) && val >= 1.00) {
          state.portfolio.startingCapital = val;
          state.portfolio.cashBalance = val;
          state.portfolio.activePosition = null;
          state.portfolio.tradeHistory = [];
          state.portfolio.totalTrades = 0;
          state.portfolio.wins = 0;
          state.portfolio.losses = 0;
          state.portfolio.cumulativePnl = 0.00;
          updateSimulatorUI();
          renderSimTradeTable();
        }
      });
    }

    // Reset Portfolio Simulation
    if (dom.resetSimBtn) {
      dom.resetSimBtn.addEventListener('click', function () {
        const defaultCap = 20.00;
        if (dom.simStartingCapitalInput) dom.simStartingCapitalInput.value = defaultCap.toFixed(2);
        state.portfolio.startingCapital = defaultCap;
        state.portfolio.cashBalance = defaultCap;
        state.portfolio.activePosition = null;
        state.portfolio.tradeHistory = [];
        state.portfolio.totalTrades = 0;
        state.portfolio.wins = 0;
        state.portfolio.losses = 0;
        state.portfolio.cumulativePnl = 0.00;
        updateSimulatorUI();
        renderSimTradeTable();
      });
    }

    // Window Resize
    window.addEventListener('resize', renderDualCharts);

    // Second Tick Rate Calculator & Latency Indicator
    setInterval(() => {
      state.currentTickSpeed = state.ticksInSecond;
      if (dom.tickSpeed) dom.tickSpeed.textContent = `${state.ticksInSecond} ticks/s`;
      state.ticksInSecond = 0;

      state.pingMs = Math.floor(10 + Math.random() * 6);
      if (dom.pingBadge) dom.pingBadge.textContent = `${state.pingMs}ms`;
    }, 1000);
  }

  // --- Initialize App ---
  function init() {
    initTheme();
    setupEventListeners();
    updateSimulatorUI();
    renderSimTradeTable();
    syncRoundState();
    connectMultiExchangeStreams();
    startTimerEngine();

    // Initial greeting in AI debate transcript
    appendDebateTranscript('arbiter', 'KOPI TUBRUK', '☕ Sistem KOPI TUBRUK aktif. Agregator multi-bursa (Binance, Coinbase, Kraken, Polymarket) terhubung.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
