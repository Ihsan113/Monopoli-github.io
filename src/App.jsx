import React, { useState, useEffect, useRef } from 'react';
import { Play, User, Bot, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Building, Train, Zap, Home, History, X, Volume2, VolumeX, HelpCircle, AlertTriangle, ArrowUpCircle, Loader2, MapPin, Sparkles, Frown, TrendingDown, Wallet, Coins, RefreshCw, Skull, Lock, Unlock, Ticket, CheckCircle, Landmark, Trophy, Crosshair, Store, Gavel, Gem, Tractor, Timer, Info, Settings, BookOpen, Maximize } from 'lucide-react';

// --- Sound Synthesizer ---
let globalAudioCtx = null;

const initAudio = () => {
  if (typeof window === 'undefined') return null; 
  if (!globalAudioCtx) {
    try { globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } 
    catch (e) { return null; }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
};

const playTone = (type, freq, duration, vol = 0.1, delay = 0) => {
  const ctx = initAudio();
  if (!ctx) return;

  const play = () => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;

      const startTime = ctx.currentTime + delay;
      
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol, startTime);
      
      gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {}
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(play).catch(() => {});
  } else {
    play();
  }
};

const SFX = {
  step: () => playTone('sine', 400, 0.1, 0.05),
  dice: () => { 
    playTone('square', 600, 0.05); 
    playTone('square', 800, 0.05, 0.1, 0.05); 
  },
  coin: () => { 
    playTone('sine', 1200, 0.1); 
    playTone('sine', 1600, 0.3, 0.1, 0.1); 
  },
  fail: () => { 
    playTone('sawtooth', 300, 0.3); 
    playTone('sawtooth', 200, 0.4, 0.1, 0.2); 
  },
  build: () => { 
    playTone('square', 400, 0.1); 
    playTone('square', 600, 0.1, 0.1, 0.1); 
    playTone('square', 800, 0.2, 0.1, 0.2); 
  },
  magic: () => { 
    playTone('sine', 800, 0.1); 
    playTone('sine', 1200, 0.1, 0.1, 0.1); 
    playTone('sine', 1600, 0.2, 0.1, 0.2); 
  },
  win: () => { 
    playTone('square', 1000, 0.1); 
    playTone('square', 1500, 0.2, 0.1, 0.1); 
    playTone('square', 2000, 0.4, 0.1, 0.2); 
  },
  teleport: () => { 
    playTone('sine', 1500, 0.4, 0.1); 
    playTone('sine', 2000, 0.4, 0.1, 0.2); 
  },
  alarm: () => { 
    playTone('sawtooth', 800, 0.1); 
    playTone('sawtooth', 1200, 0.1, 0.1, 0.1); 
    playTone('sawtooth', 800, 0.1, 0.1, 0.2); 
    playTone('sawtooth', 1200, 0.1, 0.1, 0.3); 
  },
  click: () => playTone('sine', 300, 0.05, 0.05)
};



// --- Board Data (56 Tiles - 15x15 Grid) ---
const BOARD_TILES = [
  { id: 0, name: "START", type: "go" },
  { id: 1, name: "Cianjur", type: "property", group: "brown", price: 60, baseRent: 10, hPrice: 50, color: "bg-amber-800" },
  { id: 2, name: "Dana Umum", type: "chest" },
  { id: 3, name: "Sukabumi", type: "property", group: "brown", price: 60, baseRent: 15, hPrice: 50, color: "bg-amber-800" },
  { id: 4, name: "Pajak Jalan", type: "tax", price: 100 },
  { id: 5, name: "Stas. Gambir", type: "station", price: 200, baseRent: 50, color: "bg-gray-700" },
  { id: 6, name: "Serang", type: "property", group: "lightblue", price: 100, baseRent: 30, hPrice: 50, color: "bg-sky-400" },
  { id: 7, name: "Kesempatan", type: "chance" },
  { id: 8, name: "Cirebon", type: "property", group: "lightblue", price: 100, baseRent: 30, hPrice: 50, color: "bg-sky-400" },
  { id: 9, name: "Pertanian 1", type: "agriculture", price: 250, hPrice: 150, color: "bg-lime-500", group: "agri" }, 
  { id: 10, name: "Purwokerto", type: "property", group: "lightblue", price: 120, baseRent: 40, hPrice: 50, color: "bg-sky-400" },
  { id: 11, name: "Kuis AI", type: "quiz" },
  { id: 12, name: "Tegal", type: "property", group: "lightblue", price: 120, baseRent: 40, hPrice: 50, color: "bg-sky-400" },
  { id: 13, name: "Tambang 1", type: "mine", price: 300, hPrice: 200, color: "bg-yellow-700", group: "mine" }, 
  { id: 14, name: "PENJARA", type: "jail" },
  { id: 15, name: "Denpasar", type: "property", group: "pink", price: 140, baseRent: 50, hPrice: 100, color: "bg-pink-500" },
  { id: 16, name: "PLN", type: "utility", price: 150, baseRent: 40, color: "bg-yellow-400" },
  { id: 17, name: "Kuta", type: "property", group: "pink", price: 140, baseRent: 50, hPrice: 100, color: "bg-pink-500" },
  { id: 18, name: "Kesempatan", type: "chance" },
  { id: 19, name: "Lotre Emas", type: "lottery", color: "bg-teal-500" }, 
  { id: 20, name: "Ubud", type: "property", group: "pink", price: 160, baseRent: 60, hPrice: 100, color: "bg-pink-500" },
  { id: 21, name: "Stas. Bandung", type: "station", price: 200, baseRent: 50, color: "bg-gray-700" },
  { id: 22, name: "Makassar", type: "property", group: "orange", price: 180, baseRent: 70, hPrice: 100, color: "bg-orange-500" },
  { id: 23, name: "Dana Umum", type: "chest" },
  { id: 24, name: "Manado", type: "property", group: "orange", price: 180, baseRent: 70, hPrice: 100, color: "bg-orange-500" },
  { id: 25, name: "Balai Lelang", type: "auction", color: "bg-rose-600" }, 
  { id: 26, name: "Pajak Mewah", type: "tax", price: 200 },
  { id: 27, name: "Kendari", type: "property", group: "orange", price: 200, baseRent: 80, hPrice: 100, color: "bg-orange-500" },
  { id: 28, name: "PARKIR", type: "parking" },
  { id: 29, name: "Ambon", type: "property", group: "red", price: 220, baseRent: 90, hPrice: 150, color: "bg-red-500" },
  { id: 30, name: "Kuis AI", type: "quiz" },
  { id: 31, name: "Ternate", type: "property", group: "red", price: 220, baseRent: 90, hPrice: 150, color: "bg-red-500" },
  { id: 32, name: "Pertanian 2", type: "agriculture", price: 250, hPrice: 150, color: "bg-lime-500", group: "agri" }, 
  { id: 33, name: "Jayapura", type: "property", group: "red", price: 240, baseRent: 100, hPrice: 150, color: "bg-red-500" },
  { id: 34, name: "Stas. Tugu", type: "station", price: 200, baseRent: 50, color: "bg-gray-700" },
  { id: 35, name: "Balikpapan", type: "property", group: "yellow", price: 260, baseRent: 110, hPrice: 150, color: "bg-yellow-500" },
  { id: 36, name: "Kesempatan", type: "chance" },
  { id: 37, name: "Samarinda", type: "property", group: "yellow", price: 260, baseRent: 110, hPrice: 150, color: "bg-yellow-500" },
  { id: 38, name: "Tambang 2", type: "mine", price: 300, hPrice: 200, color: "bg-yellow-700", group: "mine" }, 
  { id: 39, name: "PDAM", type: "utility", price: 150, baseRent: 40, color: "bg-blue-400" },
  { id: 40, name: "Pontianak", type: "property", group: "yellow", price: 280, baseRent: 120, hPrice: 150, color: "bg-yellow-500" },
  { id: 41, name: "Dana Umum", type: "chest" },
  { id: 42, name: "DITANGKAP", type: "go_to_jail" },
  { id: 43, name: "Medan", type: "property", group: "green", price: 300, baseRent: 130, hPrice: 200, color: "bg-green-500" },
  { id: 44, name: "Padang", type: "property", group: "green", price: 300, baseRent: 130, hPrice: 200, color: "bg-green-500" },
  { id: 45, name: "Kuis AI", type: "quiz" },
  { id: 46, name: "Lotre Emas", type: "lottery", color: "bg-teal-500" }, 
  { id: 47, name: "Palembang", type: "property", group: "green", price: 320, baseRent: 150, hPrice: 200, color: "bg-green-500" },
  { id: 48, name: "Stas. Turi", type: "station", price: 200, baseRent: 50, color: "bg-gray-700" },
  { id: 49, name: "Kesempatan", type: "chance" },
  { id: 50, name: "Batam", type: "property", group: "darkpurple", price: 350, baseRent: 175, hPrice: 200, color: "bg-fuchsia-600" },
  { id: 51, name: "Telkom", type: "utility", price: 150, baseRent: 40, color: "bg-indigo-400" },
  { id: 52, name: "Balai Lelang", type: "auction", color: "bg-rose-600" }, 
  { id: 53, name: "Pekanbaru", type: "property", group: "darkpurple", price: 350, baseRent: 175, hPrice: 200, color: "bg-fuchsia-600" },
  { id: 54, name: "Bandung", type: "property", group: "darkblue", price: 400, baseRent: 200, hPrice: 200, color: "bg-blue-800" },
  { id: 55, name: "Jakarta", type: "property", group: "darkblue", price: 500, baseRent: 250, hPrice: 250, color: "bg-blue-800" }
];

const PLAYER_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-400'];
const PLAYER_BORDERS = ['border-red-500', 'border-blue-500', 'border-green-500', 'border-yellow-400'];
const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const ASSET_TYPES = ['gandum', 'telur', 'padi'];
const FALLBACK_ANTIQUES = [
  { name: 'Batu Akik Thanos', startBid: 150, val: 500 }, 
  { name: 'Keris Petir Emas', startBid: 200, val: 400 }, 
  { name: 'Lukisan Warga +62', startBid: 100, val: 300 }, 
  { name: 'Jam Tangan Pejabat', startBid: 120, val: 20 }, 
  { name: 'Sandal Jepit Legend', startBid: 80, val: 150 }
];

export default function App() {
  const [gameState, setGameState] = useState('menu'); 
  const [loadingData, setLoadingData] = useState({ progress: 0, text: '' });
  const [menuError, setMenuError] = useState('');
  
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Anti-Spam Security State
  const [uiLocked, setUiLocked] = useState(false);

  // AI Settings (Groq Only)
  const [groqApiKey, setGroqApiKey] = useState('');
  
  // Game Configuration Settings
  const [startMoney, setStartMoney] = useState(1500);
  const [eventMaxMoney, setEventMaxMoney] = useState(1000);
  const [eventMaxGold, setEventMaxGold] = useState(5);
  const [antiqueMaxPrice, setAntiqueMaxPrice] = useState(1500);
  const [assetMaxQty, setAssetMaxQty] = useState(10);
  const [maxComboCount, setMaxComboCount] = useState(5);

  const [playerConfigs, setPlayerConfigs] = useState([
    { id: 0, name: 'Pemain 1', isBot: false, active: true },
    { id: 1, name: 'AI Robot', isBot: true, active: true },
    { id: 2, name: 'Bapak Kost', isBot: true, active: false },
    { id: 3, name: 'Pemain 2', isBot: false, active: false }
  ]);

  const [players, setPlayers] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [properties, setProperties] = useState({}); 
  const [logs, setLogs] = useState([]);
  const [dice, setDice] = useState([1, 1]);
  const diceRef = useRef([1, 1]);
  const [goldPrice, setGoldPrice] = useState(100); 
  const [marketPrices, setMarketPrices] = useState({ gandum: 15, telur: 25, padi: 40 }); 
  const [tick, setTick] = useState(0); 
  
  const [activeModal, setActiveModal] = useState('WAIT_ROLL'); 
  const [modalData, setModalData] = useState(null); 
  const [errorMsg, setErrorMsg] = useState(''); 
  const [selectedEffectIdx, setSelectedEffectIdx] = useState(null);

  const [viewingPlayer, setViewingPlayer] = useState(null); 
  const [viewingProperty, setViewingProperty] = useState(null); 
  const [showGoldMarket, setShowGoldMarket] = useState(false);
  const [showPasarMenu, setShowPasarMenu] = useState(false); 
  const [showBankLoan, setShowBankLoan] = useState(false);
  const [showLogsMenu, setShowLogsMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [pendingTrade, setPendingTrade] = useState(null);
  const [repayAmount, setRepayAmount] = useState(100); 

  // --- ENGINE REFS ---
  const playersRef = useRef([]);
  const propertiesRef = useRef({});
  const logsEndRef = useRef(null);
  const botTimeoutRef = useRef(null);
  const aiConfigRef = useRef({ key: '' });
  const eventLockRef = useRef(false);
  const gameSettingsRef = useRef({ startMoney: 1500, eventMaxMoney: 1000, eventMaxGold: 5, antiqueMaxPrice: 1500, assetMaxQty: 10, maxComboCount: 5 });

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { propertiesRef.current = properties; }, [properties]);
  useEffect(() => { aiConfigRef.current = { key: groqApiKey }; }, [groqApiKey]);
  useEffect(() => { gameSettingsRef.current = { startMoney, eventMaxMoney, eventMaxGold, antiqueMaxPrice, assetMaxQty, maxComboCount }; }, [startMoney, eventMaxMoney, eventMaxGold, antiqueMaxPrice, assetMaxQty, maxComboCount]);
  
  // Sinkronisasi Data Real-Time
  useEffect(() => {
     if (viewingPlayer) {
         const freshPlayer = players.find(p => p.id === viewingPlayer.id);

         if (freshPlayer) setViewingPlayer(freshPlayer);
     }
  }, [players]);
  
    
     // --- ALARM PERINGATAN KRITIS ---
  const alarmPlayedRef = useRef(false);
  useEffect(() => {
     // Kalau UI lagi dikunci (lagi proses bayar), jangan cek/bunyikan alarm!
     if (uiLocked) return; 

     // Ambil data pemain yang sedang jalan langsung dari state
     const currPlayer = players[turnIndex];
     
     if (activeModal === 'WAIT_ROLL') alarmPlayedRef.current = false;
     
     if (!currPlayer || currPlayer.isBot) return;

     let isCritical = false;
     if (activeModal === 'RENT' && modalData?.rent && currPlayer.money - modalData.rent < 0) isCritical = true;
     else if (activeModal === 'TAX' && modalData?.price && currPlayer.money - modalData.price < 0) isCritical = true;
     else if (activeModal === 'QUIZ_RESULT' && modalData && !modalData.isCorrect && !((currPlayer.buffs || []).includes('LOSS_EXEMPTION')) && currPlayer.money - 100 < 0) isCritical = true;
     else if (activeModal === 'EVENT_RESULT' && modalData?.eventData) {
         const totalEventLoss = modalData.eventData.effects?.reduce((sum, ev) => ev.type === 'money' && ev.value < 0 ? sum + Math.abs(ev.value) : sum, 0) || 0;
         if (totalEventLoss > 0 && !((currPlayer.buffs || []).includes('LOSS_EXEMPTION')) && currPlayer.money - totalEventLoss < 0) isCritical = true;
     }

     // Bunyikan Alarm jika kritis dan belum pernah bunyi di sesi ini
     if (isCritical && !alarmPlayedRef.current) {
         playSound('alarm');
         alarmPlayedRef.current = true;
     } else if (!isCritical) {
         alarmPlayedRef.current = false; // Reset kalau player udah berhasil jual aset
     }
  }, [activeModal, modalData, players, turnIndex, uiLocked]); // <-- Jangan lupa tambahin uiLocked di array ini



  useEffect(() => {
    if (showLogsMenu) logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, showLogsMenu]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(''), 2500);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  useEffect(() => {
     setSelectedEffectIdx(null); 
  }, [activeModal]);

  useEffect(() => {
    const handleUserInteraction = () => {
      if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume();
      } else if (!globalAudioCtx) {
        initAudio();
      }
    };
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            console.log(`Gagal masuk fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  const consumeCard = (buffsArray, cardId) => {
    const arr = [...(buffsArray || [])];
    const idx = arr.indexOf(cardId);
    if (idx !== -1) arr.splice(idx, 1);
    return arr;
  };

  // --- GLOBAL TICKER (1 SEC) ---
  useEffect(() => {
     if (gameState === 'playing') {
         const timerInterval = setInterval(() => setTick(t => t + 1), 1000);
         return () => clearInterval(timerInterval);
     }
  }, [gameState]);

  useEffect(() => {
     if (gameState !== 'playing' || !playersRef.current.length) return;
     
     const currentProps = propertiesRef.current;
     const currentPlayers = playersRef.current;
     
     let propsChanged = false;
     let playersChanged = false;
     let newProps = { ...currentProps };
     let newPlayers = [...currentPlayers];
     let logsToAdd = [];
     let soundToPlay = null;

     Object.keys(newProps).forEach(propId => {
         const prop = newProps[propId];
         const tile = BOARD_TILES.find(t => t.id === Number(propId));

         if (prop.isMortgaged !== 'full' && prop.isMortgaged !== 'land' && prop.isMortgaged !== true && (tile.type === 'agriculture' || tile.type === 'mine')) {
             const maxTime = 300 - ((prop.level || 0) * 60);
             let timer = prop.harvestTimer !== undefined ? prop.harvestTimer : maxTime;
             timer -= 1;

             if (timer <= 0) {
                 timer = maxTime; 
                 
                 const pIdx = newPlayers.findIndex(p => p.id === prop.ownerId);
                 if (pIdx !== -1 && !newPlayers[pIdx].isBankrupt) {
                     let updatedPlayer = { ...newPlayers[pIdx] };
                     playersChanged = true;

                     if (tile.type === 'agriculture') {
                         const r = ASSET_TYPES[Math.floor(Math.random() * ASSET_TYPES.length)];
                         updatedPlayer.assets = { ...updatedPlayer.assets, [r]: (updatedPlayer.assets[r] || 0) + 1 };
                         logsToAdd.push(`⏱️ PANEN! ${updatedPlayer.name} mendapat 1 ${r} dari ${tile.name}.`);
                     } else if (tile.type === 'mine') {
                         updatedPlayer.gold = parseFloat(((updatedPlayer.gold || 0) + 0.5).toFixed(1));
                         logsToAdd.push(`⏱️ TAMBANG! ${updatedPlayer.name} mendapat 0.5g Emas dari ${tile.name}.`);
                     }
                     newPlayers[pIdx] = updatedPlayer;
                     soundToPlay = 'magic';
                 }
             }
             newProps[propId] = { ...prop, harvestTimer: timer };
             propsChanged = true;
         }
     });

     if (tick > 0 && tick % 10 === 0) {
         newPlayers = newPlayers.map(p => {
             if (!p.isBankrupt && p.antiques && p.antiques.length > 0) {
                 playersChanged = true;
                 return { ...p, antiques: p.antiques.map(ant => ({ ...ant, val: ant.val + 1 })) };
             }
             return p;
         });
     }

     if (propsChanged) setProperties(newProps);
     if (playersChanged) setPlayers(newPlayers);
     if (logsToAdd.length > 0) {
         setLogs(prev => [...logsToAdd.reverse(), ...prev]);
         if (soundEnabled && soundToPlay) playSound(soundToPlay);
     }
  }, [tick, gameState]); 

  const addLog = (msg) => setLogs(prev => [msg, ...prev]);
  const playSound = (sfxName) => { if (soundEnabled && SFX[sfxName]) SFX[sfxName](); };

  const updatePlayerState = (id, updater) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const updates = typeof updater === 'function' ? updater(p) : updater;
        return { ...p, ...updates };
      }
      return p;
    }));
  };

  const processForcedPayment = (player, amount, logMessage) => {
    const oldMoney = player.money || 0;
    let newMoney = oldMoney - amount;
    
    let botLogs = [];
    let currentAssets = { ...player.assets };
    let currentGold = player.gold || 0;
    let currentDebt = player.debt || 0;
    let currentAntiques = [...(player.antiques || [])];
    let propsChanged = false;
    let newProps = { ...propertiesRef.current };

    if (player.isBot && newMoney < 0) {
        ['gandum', 'telur', 'padi'].forEach(t => {
            while(newMoney < 0 && currentAssets[t] > 0) {
                newMoney += marketPrices[t];
                currentAssets[t] -= 1;
                botLogs.push(`Jual 1 ${t}`);
            }
        });
        while(newMoney < 0 && currentGold > 0) {
            let sellAmt = currentGold >= 1 ? 1 : currentGold;
            let val = Math.round(sellAmt * goldPrice);
            newMoney += val;
            currentGold = parseFloat((currentGold - sellAmt).toFixed(1));
            botLogs.push(`Jual ${sellAmt}g Emas`);
        }
        while(newMoney < 0 && currentAntiques.length > 0) {
            const ant = currentAntiques.pop();
            newMoney += ant.val;
            botLogs.push(`Jual Antik "${ant.name}"`);
        }
        if (newMoney < 0) {
            const ownedProps = BOARD_TILES.filter(t => newProps[t.id]?.ownerId === player.id && !newProps[t.id]?.isMortgaged);
            ownedProps.sort((a, b) => a.price - b.price);

            for (let prop of ownedProps) {
                if (newMoney >= 0) break;
                const pData = newProps[prop.id];
                
                let refundLand = prop.price / 2;
                let refundFull = refundLand + ((pData.level || 0) * (prop.hPrice || 0) / 2);
                
                let type = 'full';
                let refund = refundFull;

                if ((pData.level || 0) > 0 && (newMoney + refundLand) >= 0) {
                    type = 'land';
                    refund = refundLand;
                }

                newMoney += refund;
                newProps[prop.id] = { ...pData, isMortgaged: type };
                propsChanged = true;
                botLogs.push(`Gadai ${type==='land'?'Tanah':'Aset Penuh'} ${prop.name}`);
            }
        }
        while(newMoney < 0 && currentDebt < 1000) {
            newMoney += 500;
            currentDebt += 600;
            botLogs.push(`Pinjam Bank`);
        }
    }

    updatePlayerState(player.id, { money: newMoney, assets: currentAssets, gold: currentGold, debt: currentDebt, antiques: currentAntiques });
    if (propsChanged) setProperties(newProps);
    
    addLog(`${logMessage} (Saldo: Rp${oldMoney}K ➡️ Rp${newMoney}K)`);
    if(botLogs.length > 0) addLog(`🤖 BOT EMERGENCY [${player.name}]: Mencairkan aset dadakan! (${botLogs.join(', ')})`);
    
    return newMoney; 
  };

  const startGame = () => {
    const activeConfigs = playerConfigs.filter(p => p.active);
    if (activeConfigs.length < 2) {
      setMenuError("Minimal 2 pemain untuk mulai!");
      return;
    }
    if (!groqApiKey) {
      setMenuError("Harap masukkan API Key Groq!");
      return;
    }
    setMenuError('');

    const newPlayers = activeConfigs.map((config, i) => ({
      ...config, money: startMoney, gold: 0, totalGoldSpent: 0, debt: 0, position: 0, inJail: false, jailTurns: 0, isBankrupt: false, buffs: [], color: PLAYER_COLORS[i], borderColor: PLAYER_BORDERS[i],
      assets: { gandum: 0, telur: 0, padi: 0 }, antiques: []
    }));

    setGameState('loading');
    setLoadingData({ progress: 0, text: 'Menyiapkan Papan...' });
    initAudio(); 
    playSound('dice');

    let progress = 0;
    const loadInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 20;
      if (progress >= 100) progress = 100;
      if (progress >= 100) {
        clearInterval(loadInterval);
        setTimeout(() => {
          setPlayers(newPlayers);
          setTurnIndex(0);
          setProperties({});
          setGoldPrice(100);
          setMarketPrices({ gandum: 15, telur: 25, padi: 40 });
          setTick(0);
          setLogs([`🔥 Permainan Dimulai! AI Provider: GROQ`]);
          setGameState('playing');
          setActiveModal('WAIT_ROLL');
          playSound('coin');
        }, 800);
      } else {
        setLoadingData({ progress, text: 'Menghubungkan ke Sistem Master...' });
      }
    }, 200);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

  const callAIText = async (userPrompt, systemPrompt) => {
    const { key } = aiConfigRef.current;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 
    
    try {
        if (!key) throw new Error("API Key Missing");
        const finalContent = systemPrompt + "\n\n---\n\n" + userPrompt;
        
        const response = await fetch(GROQ_URL, {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json', 
             'Authorization': `Bearer ${key.trim()}` 
          },
          body: JSON.stringify({
             model: "llama-3.1-8b-instant", 
             messages: [
                { role: "user", content: finalContent }
             ],
             temperature: 0.9,
             max_tokens: 150
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) { 
      clearTimeout(timeoutId);
      addLog(`🔴 API Master Error (Text): ${error.message}`);
      return null; 
    }
  };

  const callAIJSON = async (userPrompt, systemPrompt) => {
    const { key } = aiConfigRef.current;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 
    
    try {
        if (!key) throw new Error("API Key Missing");
        
        const finalContent = systemPrompt + "\n\n---\n\n" + userPrompt + "\n\nIMPORTANT: HANYA KEMBALIKAN RAW JSON OBJECT. DILARANG MENGGUNAKAN MARKDOWN CODE BLOCKS ATAU TEKS LAIN.";
        
        const response = await fetch(GROQ_URL, {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json', 
             'Authorization': `Bearer ${key.trim()}` 
          },
          body: JSON.stringify({
             model: "llama-3.1-8b-instant", 
             messages: [
                { role: "user", content: finalContent }
             ],
             temperature: 0.8
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || "";
        
        let match = text.match(/\{[\s\S]*\}/);
        if (match) {
            const jsonResult = JSON.parse(match[0]);
            return jsonResult;
        }
        throw new Error("No JSON found in response");
    } catch (error) { 
      clearTimeout(timeoutId);
      addLog(`🔴 API Master Error (JSON): ${error.message} - Memakai sistem Fallback Lokal.`);
      return null; 
    }
  };

  const generateSystemEffects = () => {
    const { eventMaxMoney, eventMaxGold, antiqueMaxPrice, assetMaxQty, maxComboCount } = gameSettingsRef.current;
    const RND = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const RND_FLOAT = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));
    
    let effects = [];
    let promptDescParts = [];
    let needsAntiqueName = false;

    const isCombo = Math.random() > 0.6;
    let numEffects = 1;
    if (isCombo && maxComboCount > 1) {
        numEffects = RND(2, maxComboCount);
    }

    let availableTypes = ['money', 'move', 'teleport', 'jail', 'antique', 'asset', 'gold', 'vip', 'parkir'];
    if (Math.random() > 0.05) availableTypes = availableTypes.filter(t => t !== 'vip');
    if (Math.random() > 0.1) availableTypes = availableTypes.filter(t => t !== 'parkir');

    availableTypes.sort(() => Math.random() - 0.5);
    let selectedTypes = [];

    for (let t of availableTypes) {
        if (selectedTypes.length >= numEffects) break;
        if (t === 'move' && (selectedTypes.includes('teleport') || selectedTypes.includes('jail') || selectedTypes.includes('parkir'))) continue;
        if (t === 'teleport' && (selectedTypes.includes('move') || selectedTypes.includes('jail') || selectedTypes.includes('parkir'))) continue;
        if (t === 'parkir' && (selectedTypes.includes('move') || selectedTypes.includes('jail') || selectedTypes.includes('teleport'))) continue;
        if (t === 'jail' && (selectedTypes.includes('move') || selectedTypes.includes('teleport') || selectedTypes.includes('parkir'))) continue;
        selectedTypes.push(t);
    }

    selectedTypes.forEach(t => {
        if (t === 'money') {
            const isPos = Math.random() > 0.5;
            const val = isPos ? RND(10, eventMaxMoney) : RND(-eventMaxMoney, -10);
            effects.push({ type: 'money', value: val });
            promptDescParts.push(isPos ? `MENDAPATKAN HADIAH uang tunai Rp${val}K` : `MENGALAMI MUSIBAH/DIDENDA uang sebesar Rp${Math.abs(val)}K`);
        } else if (t === 'move') {
            const val = Math.random() > 0.5 ? RND(1, 5) : RND(-5, -1);
            effects.push({ type: 'move', value: val });
            promptDescParts.push(`TERPAKSA ${val > 0 ? 'maju' : 'mundur'} ${Math.abs(val)} langkah`);
        } else if (t === 'teleport') {
            let val = RND(0, 55);
            while(val === 14 || val === 42 || val === 28) val = RND(0, 55);
            effects.push({ type: 'teleport', targetId: val });
            promptDescParts.push(`PINDAH PAKSA / NYASAR KE PETAK "${BOARD_TILES[val].name}"`);
        } else if (t === 'parkir') {
            effects.push({ type: 'teleport', targetId: 28 });
            promptDescParts.push(`DITARIK PAKSA TUKANG PARKIR GAIB KE PETAK "PARKIR BEBAS"`);
        } else if (t === 'jail') {
            effects.push({ type: 'jail' });
            promptDescParts.push(`DITANGKAP SATPOL PP DAN DIJEBLOSKAN KE PENJARA`);
        } else if (t === 'antique') {
            const val = RND(50, antiqueMaxPrice);
            effects.push({ type: 'antique', item: { name: "", val: val } });
            needsAntiqueName = true;
            promptDescParts.push(`MENEMUKAN BARANG ANTIK BERHARGA (Bisa dijual seharga Rp${val}K)`);
        } else if (t === 'asset') {
            const ast = ASSET_TYPES[Math.floor(Math.random()*ASSET_TYPES.length)];
            const val = RND(1, assetMaxQty);
            effects.push({ type: 'asset', assetType: ast, value: val });
            promptDescParts.push(`MENDAPATKAN panen dadakan ${val} buah ${ast.toUpperCase()}`);
        } else if (t === 'gold') {
            const isPos = Math.random() > 0.5;
            const val = isPos ? RND_FLOAT(0.5, eventMaxGold) : RND_FLOAT(-eventMaxGold, -0.5);
            effects.push({ type: 'gold', value: val });
            promptDescParts.push(isPos ? `MENDAPAT KEUNTUNGAN ${val}g Emas` : `RUGI INVESTASI dan kehilangan ${Math.abs(val)}g Emas (Emas bisa jadi minus alias hutang)`);
        } else if (t === 'vip') {
            effects.push({ type: 'vip' });
            promptDescParts.push(`SANGAT HOKI MENDAPATKAN 1 KARTU VIP MISTERIUS`);
        }
    });

    const promptDesc = `Pemain mengalami kejadian ini: ${promptDescParts.join(" DAN ")}.`;
    return { effects, promptDesc, needsAntiqueName };
  };

  const generateAIEvent = async (playerName) => {
    const seed = Date.now();
    const { effects, promptDesc, needsAntiqueName } = generateSystemEffects();

    const sysPrompt = `ROLE: Game Master Monopoli Warga +62.
TUGAS: Buat SATU kalimat narasi yang sangat lucu, receh, dan absurd khas warga +62 untuk menjelaskan rentetan kejadian berikut ini.

KEJADIAN MUTLAK (DARI SISTEM):
${promptDesc}

PERATURAN KERAS (JIKA DILANGGAR GAME AKAN ERROR):
1. DILARANG KERAS MENGARANG/MENAMBAHKAN ANGKA UANG, JUMLAH LANGKAH, ATAU EMAS YANG TIDAK ADA DI DAFTAR KEJADIAN DI ATAS!
2. Jika kejadian menyebutkan "Masuk Penjara" tanpa denda, jangan karang cerita harus bayar denda triliunan. Cukup ceritakan proses masuk penjaranya saja.
3. HANYA DAN HANYA gunakan angka yang persis tertera pada KEJADIAN MUTLAK.
4. Gunakan format angka langsung disusul huruf K untuk uang (Contoh: Rp500K). JANGAN pakai titik pemisah seperti Rp500.000.
${needsAntiqueName ? "5. KARENA ADA BARANG ANTIK, WAJIB buat nama barang antik yang nyeleneh dan masukkan ke key 'antiqueName'." : ""}

OUTPUT WAJIB MURNI JSON SEPERTI INI (TANPA MARKDOWN):
{
  "message": "Tulis kalimat narasi lucu +62 disini pastikan angka sama persis dengan kejadian..."${needsAntiqueName ? ',\n  "antiqueName": "Nama Barang Antik Absurd"' : ''}
}`;

    let res = await callAIJSON(`Buat cerita event untuk ${playerName}! Seed: ${seed}`, sysPrompt);
    
    if (!res || !res.message) {
        res = { message: "System Fallback: Sinyal gaib putus, tapi efek dari langit tetap turun kepadamu!" };
        if (needsAntiqueName) res.antiqueName = FALLBACK_ANTIQUES[Math.floor(Math.random()*FALLBACK_ANTIQUES.length)].name;
    }

    let safeMsg = res.message
        .replace(/(?:Rp\s*)?(\d{1,3}(?:\.\d{3})+)/g, (match, p1) => `Rp${p1.replace(/\./g, '').slice(0, -3)}K`)
        .replace(/Rp\s*(\d{2,})000\b/gi, "Rp$1K")
        .replace(/(?<!Rp\s*)\b(\d{2,})000\b/gi, "$1K");
    res.message = safeMsg;

    if (needsAntiqueName) {
        const antiqueObj = effects.find(e => e.type === 'antique');
        if (antiqueObj) {
            antiqueObj.item.name = res.antiqueName || "Barang Gaib Misterius";
        }
    }

    addLog(`🎲 Sistem menyetujui efek, AI Master menceritakan kejadian untuk ${playerName}.`);
    
    return {
        message: res.message,
        effects: effects
    };
  };

  const generateQuiz = async () => {
    const seed = Date.now();
    const sysPrompt = `ROLE: Host Kuis Cak Lontong / Receh ala Warga +62.
TUGAS: Buat 1 pertanyaan kuis pilihan ganda yang BENAR-BENAR ACAK, KOCAK, dan ABSURD ala tebak-tebakan tongkrongan / bapak-bapak yang asik. 
PENTING: Nilai dalam array "options" WAJIB berisi TEKS JAWABAN PENUH yang nyeleneh. DILARANG hanya mengisi "A", "B", "C", atau "D".
STRICT OUTPUT JSON MURNI:
{
  "question": "Pertanyaan receh lucu?",
  "options": ["Teks Jawaban 1", "Teks Jawaban 2", "Teks Jawaban 3", "Teks Jawaban 4"],
  "answerIndex": 0 | 1 | 2 | 3
}`;
    const res = await callAIJSON(`Beri kuis. Seed: ${seed}.`, sysPrompt);
    
    if (res && Array.isArray(res.options) && res.options.length === 4 && res.options.every(o => typeof o === 'string' && o.trim().length > 2) && typeof res.answerIndex === 'number') {
        return res;
    }
    
    const fb = [
      { question: "Hewan apa yang paling hening dan gak pernah berisik?", options: ["Kucing Mengendap", "Semut Kesemutan", "Nyamuk Puasa", "Ikan Tidur"], answerIndex: 1 },
      { question: "Benda apa yang kalau dibalik malah rusak?", options: ["Meja Kayu", "Kasur Lipat", "Gelas Kopi Anak Senja", "Truk Tronton"], answerIndex: 2 },
      { question: "Kenapa Superman bajunya ada huruf S?", options: ["Karena dia Strong", "Karena kalau M kegedean", "Simbol Kedamaian", "Salah Cetak Pabrik"], answerIndex: 1 }
    ];
    return fb[Math.floor(Math.random() * fb.length)];
  };

  const generateAIAuction = async () => {
    const { antiqueMaxPrice } = gameSettingsRef.current;
    const item = FALLBACK_ANTIQUES[Math.floor(Math.random() * FALLBACK_ANTIQUES.length)];
    const seed = Date.now();
    const randomThemes = ['Relikui Kerajaan Kuno', 'Barang Nyeleneh +62', 'Teknologi Alien Bekas', 'Benda Mistis Pesugihan'];
    const selectedTheme = randomThemes[Math.floor(Math.random() * randomThemes.length)];

    const sysPrompt = `Tugasmu HANYA membuat 1 nama barang antik fiktif lucu/keren/receh ala Indonesia (Tema: ${selectedTheme}). Contoh: "Sandal Jepit Firaun", "Batu Akik Thanos", "Panci Bolong Nyi Roro Kidul". Hanya balas dengan 1 NAMA BARANG saja tanpa embel-embel teks lain.`;
    const flavorName = await callAIText(`Berikan 1 nama barang lelang. Seed: ${seed}`, sysPrompt);
    
    const val = Math.floor(Math.random() * antiqueMaxPrice) + 50;
    const startBid = Math.floor(val * (Math.random() * 0.5 + 0.1)); 

    return {
        name: flavorName ? flavorName : item.name,
        startBid: startBid, 
        val: val 
    };
  };

  const handleKudetaManual = (targetProp) => {
      const player = playersRef.current[turnIndex];
      const propData = propertiesRef.current[targetProp.id];
      const owner = playersRef.current.find(p => p.id === propData.ownerId);
      
      updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'FORCE_ACQUIRE') }));
      setProperties(prev => ({ ...prev, [targetProp.id]: { ...propData, ownerId: player.id } }));
      addLog(`👑 KUDETA BERHASIL! ${player.name} merampas properti ${targetProp.name} dari ${owner.name.substring(0,8)}!`);
      playSound('win');
      setViewingProperty(null);
  };

  const handleTebusGratisManual = (targetProp) => {
      const player = playersRef.current[turnIndex];
      updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'FREE_REDEEM') }));
      setProperties(prev => ({...prev, [targetProp.id]: { ...propertiesRef.current[targetProp.id], isMortgaged: false }}));
      addLog(`📈 TEBUS GRATIS! ${player.name} menebus properti ${targetProp.name} menggunakan Kartu VIP!`);
      playSound('magic');
      setViewingProperty(null);
  };

  // --- BOT AUTOMATION: Trade & Actions ---
  useEffect(() => {
    if (pendingTrade && pendingTrade.owner.isBot) {
        const timer = setTimeout(() => {
            const accept = Math.random() > 0.4;
            handleTradeResponse(accept);
        }, 2500);
        return () => clearTimeout(timer);
    }
  }, [pendingTrade]);

  useEffect(() => {
    if (gameState !== 'playing' || !playersRef.current.length) return;
    const currentPlayer = playersRef.current[turnIndex];
    if (!currentPlayer || activeModal === null) return;

    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);

    const autoAct = () => {
      if (viewingPlayer || viewingProperty || showGoldMarket || showPasarMenu || showBankLoan || pendingTrade || activeModal === 'SELECT_TELEPORT') {
         botTimeoutRef.current = setTimeout(autoAct, 1000);
         return;
      }

      let delay = 1500;
      let action = null;
      let payload = null;

      if (activeModal === 'AUCTION_BIDDING') {
          if (modalData.resolved) {
              action = 'ACKNOWLEDGE'; delay = 2500;
          } else {
              if (modalData.activeBidders.length === 0) {
                  action = 'AUCTION_END'; delay = 500;
              } else {
                  const currentBidderId = modalData.activeBidders[modalData.turnIdx];
                  if (currentBidderId === modalData.highestBidderId || (modalData.activeBidders.length === 1 && modalData.highestBidderId !== null)) {
                      action = 'AUCTION_END'; delay = 500;
                  } else {
                      const bidder = playersRef.current.find(p => p.id === currentBidderId);
                      if (bidder && bidder.isBot) {
                           const nextB = modalData.highestBidderId === null ? modalData.item.startBid : modalData.currentBid + 10;
                           if ((bidder.buffs || []).includes('VIP_AUCTION')) {
                               action = 'AUCTION_TURN_VIP_WIN'; payload = currentBidderId;
                           } else if (bidder.money >= nextB && modalData.botLimits[bidder.id] >= nextB) {
                               action = 'AUCTION_TURN_BID'; payload = currentBidderId;
                           } else {
                               action = 'AUCTION_TURN_FOLD'; payload = currentBidderId;
                           }
                           delay = Math.floor(Math.random() * 1000) + 1500; 
                      }
                  }
              }
          }
          if (action) botTimeoutRef.current = setTimeout(() => handleAction(action, payload), delay);
          return;
      }

      if (!currentPlayer.isBot) return;

      switch(activeModal) {
        case 'WAIT_ROLL':
          if (currentPlayer.isBankrupt) { 
              action = 'END_TURN'; delay = 500; 
          } else if (currentPlayer.inJail) {
             if ((currentPlayer.buffs || []).includes('FREE_JAIL')) {
                 action = 'USE_JAIL_CARD';
             } else if (currentPlayer.money >= 50) {
                 action = 'PAY_JAIL';
             } else {
                 action = 'ROLL_JAIL'; 
             }
          } else {
             if ((currentPlayer.gold || 0) >= 1 && Math.random() < 0.15) {
                 action = 'BOT_SELL_GOLD';
             }
             else if ((currentPlayer.buffs || []).includes('DEBT_CLEAR') && currentPlayer.debt > 0) {
                 action = 'USE_DEBT_CLEAR_CARD';
             } else if ((currentPlayer.buffs || []).includes('FREE_REDEEM') && BOARD_TILES.some(t => propertiesRef.current[t.id]?.ownerId === currentPlayer.id && propertiesRef.current[t.id]?.isMortgaged)) {
                 action = 'EXECUTE_FREE_REDEEM';
                 payload = BOARD_TILES.find(t => propertiesRef.current[t.id]?.ownerId === currentPlayer.id && propertiesRef.current[t.id]?.isMortgaged);
             } else if ((currentPlayer.buffs || []).includes('FORCE_ACQUIRE') && Math.random() < 0.4 && BOARD_TILES.some(t => propertiesRef.current[t.id]?.ownerId && propertiesRef.current[t.id]?.ownerId !== currentPlayer.id && !propertiesRef.current[t.id]?.isMortgaged)) {
                 action = 'EXECUTE_KUDETA';
                 payload = BOARD_TILES.find(t => propertiesRef.current[t.id]?.ownerId && propertiesRef.current[t.id]?.ownerId !== currentPlayer.id && !propertiesRef.current[t.id]?.isMortgaged);
             } else if ((currentPlayer.buffs || []).includes('CUSTOM_TELEPORT') && Math.random() < 0.3) {
                 action = 'PREPARE_CUSTOM_TELEPORT';
                 const jktProp = propertiesRef.current[55];
                 if (!jktProp || jktProp.ownerId === currentPlayer.id) {
                     payload = 55; 
                 } else {
                     payload = 0;  
                 }
             } else {
                 const mortgagedProps = BOARD_TILES.filter(t => propertiesRef.current[t.id]?.ownerId === currentPlayer.id && propertiesRef.current[t.id]?.isMortgaged);
                 let canRedeem = null;
                 for (let prop of mortgagedProps) {
                     const pData = propertiesRef.current[prop.id];
                     let cost = (prop.price / 2) + 20;
                     if (pData.isMortgaged !== 'land') cost += ((pData.level || 0) * (prop.hPrice || 0) / 2);
                     
                     if (currentPlayer.money > cost + 300) {
                         canRedeem = { prop, cost };
                         break;
                     }
                 }

                 if (canRedeem && Math.random() < 0.8) { 
                     action = 'BOT_EXECUTE_TEBUS';
                     payload = canRedeem;
                 } else {
                     action = 'ROLL';
                 }
             }
          }
          break;
        case 'BUY': action = 'BUY_YES'; break;
        case 'UPGRADE': 
          if ((currentPlayer.buffs || []).includes('FREE_MAX_UPGRADE') && Math.random() > 0.2) {
              action = 'USE_FREE_MAX_UPGRADE';
          } else {
              action = 'UPGRADE_YES'; 
          }
          break;
        case 'STATION_TELEPORT':
          if (currentPlayer.money > 100 && Math.random() > 0.4) {
             action = 'TELEPORT_STATION'; payload = modalData.availableStations[Math.floor(Math.random() * modalData.availableStations.length)].id;
          } else { action = 'TELEPORT_CANCEL'; }
          break;
        case 'RENT':
          action = 'PAY_RENT'; delay = 2000; break;
        case 'TAX':
        case 'EVENT_RESULT':
        case 'JAIL':
        case 'BANKRUPT':
        case 'PARKING_CARD':
        case 'QUIZ_RESULT':
        case 'AGRICULTURE_INFO':
        case 'MINE_INFO':
        case 'LOTTERY_RESULT':
        case 'AUCTION_LOADING':
          action = 'ACKNOWLEDGE'; delay = 2000; break;
        
        case 'LOTTERY_PLAY':
          action = 'LOTTERY_SPIN'; delay = 1000; break;
        case 'QUIZ_PLAY':
          action = 'QUIZ_ANSWER'; payload = Math.floor(Math.random() * 4); delay = 3000; break;
        case 'END_TURN':
          action = 'END_TURN'; delay = 1000; break;
      }

      if (action) botTimeoutRef.current = setTimeout(() => handleAction(action, payload), delay);
    };
    autoAct();

    return () => clearTimeout(botTimeoutRef.current);
  }, [activeModal, turnIndex, gameState, viewingPlayer, viewingProperty, showGoldMarket, showPasarMenu, showBankLoan, pendingTrade, modalData]); 

  const hasMonopoly = (ownerId, groupName) => {
     if (!groupName) return false;
     const groupTiles = BOARD_TILES.filter(t => t.group === groupName);
     const ownedInGroup = groupTiles.filter(t => propertiesRef.current[t.id]?.ownerId === ownerId && !propertiesRef.current[t.id]?.isMortgaged);
     return groupTiles.length > 0 && groupTiles.length === ownedInGroup.length;
  };

  const calculateRent = (tile, propData, ownerId) => {
    if (!propData || propData.isMortgaged === 'land' || propData.isMortgaged === 'full' || propData.isMortgaged === true) return 0; 
    
    if (tile.type === 'station') {
       const stationsOwned = BOARD_TILES.filter(t => t.type === 'station' && propertiesRef.current[t.id]?.ownerId === ownerId && !propertiesRef.current[t.id]?.isMortgaged).length;
       return 50 * stationsOwned;
    }
    if (tile.type === 'utility') {
       const utilsOwned = BOARD_TILES.filter(t => t.type === 'utility' && propertiesRef.current[t.id]?.ownerId === ownerId && !propertiesRef.current[t.id]?.isMortgaged).length;      
       return (diceRef.current[0] + diceRef.current[1]) * (utilsOwned >= 2 ? 20 : 10);
    }
    if (tile.type === 'agriculture' || tile.type === 'mine') return 0;
    
    let base = propData.level === 0 ? tile.baseRent : propData.level === 1 ? tile.baseRent*3 : propData.level === 2 ? tile.baseRent*8 : propData.level === 3 ? tile.baseRent*15 : propData.level === 4 ? tile.baseRent*25 : tile.baseRent*40;
    if (hasMonopoly(ownerId, tile.group)) base *= 2; 
    return base;
  };

  const calculateNetWorth = (player) => {
    if (!player) return 0;
    const ownedProps = BOARD_TILES.filter(t => propertiesRef.current[t.id]?.ownerId === player.id);
    const assetValue = ownedProps.reduce((sum, t) => {
       const prop = propertiesRef.current[t.id];
       if (prop.isMortgaged === 'land' || prop.isMortgaged === 'full' || prop.isMortgaged === true) return sum + (t.price / 2); 
       return sum + t.price + ((prop.level || 0) * (t.hPrice || 0));
    }, 0);
    
    const agriValue = (player.assets?.gandum || 0) * marketPrices.gandum + 
                      (player.assets?.telur || 0) * marketPrices.telur + 
                      (player.assets?.padi || 0) * marketPrices.padi;
    const antiqueValue = (player.antiques || []).reduce((sum, a) => sum + a.val, 0);

    const total = (player.money || 0) + assetValue + ((player.gold || 0) * goldPrice) + agriValue + antiqueValue - (player.debt || 0);
    return Math.floor(total); 
};

  const checkBankruptcy = (playerId) => {
    const p = playersRef.current.find(x => x.id === playerId);
    if (!p) return false;
    if ((p.money || 0) < 0) {
      playSound('fail');
      addLog(`💀 ${p.name} Dinyatakan BANGKRUT! Seluruh asetnya telah disita.`);
      updatePlayerState(playerId, { isBankrupt: true, money: 0, gold: 0, totalGoldSpent: 0, debt: 0, buffs: [], assets: {gandum:0,telur:0,padi:0}, antiques: [] });
      setProperties(prev => {
         const newProps = { ...prev };
         Object.keys(newProps).forEach(key => {
            if (newProps[key].ownerId === playerId) delete newProps[key];
         });
         return newProps;
      });
      return true;
    }
    return false;
  };

  const checkEndGame = () => {
    const activePlayers = playersRef.current.filter(p => !p.isBankrupt);
    if (activePlayers.length <= 1) {
       playSound('win');
       setGameState('gameover');
       return true;
    }
    return false;
  };

  // --- GAME ACTIONS CENTRAL HANDLER ---
  const handleAction = async (actionType, payload) => {
    const player = playersRef.current[turnIndex];
    if (!player) return;

    switch(actionType) {
      case 'BOT_SELL_GOLD':
        const sellAmtGold = player.gold >= 1 ? 1 : player.gold;
        const sellValGold = Math.round(sellAmtGold * goldPrice);
        const oldBGold = player.money;
        const newBGold = oldBGold + sellValGold;
        updatePlayerState(player.id, p => {
            const avg = p.gold > 0 ? (p.totalGoldSpent || 0) / p.gold : 0;
            return { 
                money: newBGold, 
                gold: parseFloat((p.gold - sellAmtGold).toFixed(1)),
                totalGoldSpent: Math.max(0, (p.totalGoldSpent || 0) - (avg * sellAmtGold))
            };
        });
        addLog(`🤖 BOT TRADING: ${player.name} menjual ${sellAmtGold}g Emas ke bursa senilai Rp${sellValGold}K! (Saldo: Rp${oldBGold}K ➡️ Rp${newBGold}K)`);
        playSound('coin');
        if(player.isBot) setTimeout(() => handleAction('ROLL'), 1500);
        break;

      case 'BOT_EXECUTE_TEBUS':
        if (payload) {
            const { prop, cost } = payload;
            const oldM = player.money;
            const newM = oldM - cost;
            updatePlayerState(player.id, { money: newM });
            setProperties(prev => ({...prev, [prop.id]: { ...prev[prop.id], isMortgaged: false }}));
            addLog(`🤖 BOT INVESTASI: ${player.name} proaktif menebus agunan properti ${prop.name} seharga Rp${cost}K. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
            playSound('magic');
            if(player.isBot) setTimeout(() => handleAction('ROLL'), 1500);
        }
        break;

           case 'PAY_RENT':
        setUiLocked(true); // Kunci UI biar gak dobel klik & nutup warning
        if (modalData && modalData.rent) {
          const rentAmt = modalData.rent;
          const ownerId = modalData.ownerId;
          const ownerName = modalData.ownerName;

          const newMoney = processForcedPayment(player, rentAmt, `💸 TRANSAKSI SEWA: ${player.name} membayar Rp${rentAmt}K kepada ${ownerName}.`);
          playSound('coin');

          const ownerObj = playersRef.current.find(p => p.id === ownerId);
          const oOld = ownerObj ? (ownerObj.money || 0) : 0;                   
          const actualPaid = Math.max(0, newMoney < 0 ? rentAmt + newMoney : rentAmt);          
          const oNew = oOld + actualPaid;

          addLog(`💰 PEMASUKAN SEWA: ${ownerName} menerima pembayaran masuk Rp${actualPaid}K. (Saldo: Rp${oOld}K ➡️ Rp${oNew}K)`);
          updatePlayerState(ownerId, { money: oNew });
          
          setTimeout(() => {
             if (newMoney < 0) {
                 if (checkBankruptcy(player.id)) {
                     if (checkEndGame()) return;
                     setActiveModal('BANKRUPT');
                     setUiLocked(false);
                     return;
                 }
             }
             setActiveModal('END_TURN');
             setUiLocked(false);
          }, 150);
        } else {
          setActiveModal('END_TURN');
          setUiLocked(false);
        }
        break;


      case 'PAY_JAIL':
        if (player.money >= 50) {
          const oldMoney = player.money;
          const newMoney = oldMoney - 50;
          updatePlayerState(player.id, { money: newMoney, inJail: false, jailTurns: 0 });
          addLog(`🔓 TEBUSAN PENJARA: ${player.name} menyogok sipir Rp50K dan bebas. (Saldo: Rp${oldMoney}K ➡️ Rp${newMoney}K)`);
          playSound('coin');
          handleAction('ROLL'); 
        } else {
          setErrorMsg("Uang tidak cukup!"); playSound('fail');
        }
        break;
      
      case 'USE_JAIL_CARD':
        updatePlayerState(player.id, p => ({ inJail: false, jailTurns: 0, buffs: consumeCard(p.buffs, 'FREE_JAIL') }));
        addLog(`🎟️ KONEKSI ORANG DALAM: ${player.name} memakai Kartu Bebas Penjara!`);
        playSound('magic');
        handleAction('ROLL');
        break;

      case 'ROLL_JAIL':
        setUiLocked(true); // Anti-Spam
        setActiveModal('ROLLING');
        playSound('dice');
        let dJail = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
        setDice(dJail);
        diceRef.current = dJail;
        await sleep(1000);
        
        if (dJail[0] === dJail[1]) { 
           updatePlayerState(player.id, { inJail: false, jailTurns: 0 });
           addLog(`🎲 HOKI! ${player.name} mendapat Dadu Kembar ${dJail[0]}-${dJail[1]}, lolos dari penjara secara ajaib!`);
           playSound('win');
           setActiveModal('MOVING');
           await animateMove(player.id, dJail[0] + dJail[1]);
        } else {
           const turns = (player.jailTurns || 0) + 1;
           if (turns >= 3) {
               updatePlayerState(player.id, { inJail: false, jailTurns: 0 });
               addLog(`🔓 BEBAS OTOMATIS! Masa tahanan ${player.name} habis (3x gagal dadu kembar).`);
               playSound('magic');
               setActiveModal('MOVING');
               await animateMove(player.id, dJail[0] + dJail[1]); 
           } else {
               updatePlayerState(player.id, { jailTurns: turns });
               addLog(`🎲 ZONK! ${player.name} gagal kabur karena dadu tidak kembar. (Percobaan ${turns}/3)`);
               playSound('fail');
               setActiveModal('END_TURN');
           }
        }
        setUiLocked(false);
        break;

      case 'ROLL':
        setUiLocked(true); // Anti-Spam
        setActiveModal('ROLLING');
        playSound('dice');
                let tempDice = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
        setDice(tempDice);
        diceRef.current = tempDice;
        await sleep(1000); 
        const totalRoll = tempDice[0] + tempDice[1];
        addLog(`🎲 MELEMPAR DADU: ${player.name} melangkah maju sejauh ${totalRoll} petak.`);
        setActiveModal('MOVING');
        await animateMove(player.id, totalRoll);
        setUiLocked(false);
        break;

      case 'BUY_YES':
        setUiLocked(true);
        if ((player.money || 0) >= modalData.price) {
          const oldM = player.money;
          const newM = oldM - modalData.price;
          updatePlayerState(player.id, { money: newM });
          setProperties(prev => ({ 
              ...prev, 
              [modalData.id]: { 
                  ownerId: player.id, 
                  level: 0, 
                  isMortgaged: false,
                  harvestTimer: (modalData.type === 'agriculture' || modalData.type === 'mine') ? 300 : undefined
              } 
          }));
          addLog(`🎉 PEMBELIAN ASET: ${player.name} membeli properti ${modalData.name} senilai Rp${modalData.price}K. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
          playSound('build');
          setActiveModal('END_TURN');
        } else {
          setErrorMsg('Uang Tidak Cukup!'); playSound('fail');
          if(player.isBot) setActiveModal('END_TURN'); 
        }
        setUiLocked(false);
        break;

            case 'BUY_NO':
      case 'UPGRADE_NO':
        playSound('click');
        setActiveModal('END_TURN');
        break;


      case 'UPGRADE_YES':
        setUiLocked(true);
        if ((player.money || 0) >= modalData.dynamicCost) {
          const oldM = player.money;
          const newM = oldM - modalData.dynamicCost;
          updatePlayerState(player.id, { money: newM });
          setProperties(prev => ({ ...prev, [modalData.id]: { ...prev[modalData.id], level: (prev[modalData.id].level || 0) + 1 } }));
          addLog(`🏗️ UPGRADE ASET: ${player.name} bayar biaya tukang Rp${modalData.dynamicCost}K buat naikin level ${modalData.name}. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
          playSound('build');
          setActiveModal('END_TURN');
        } else {
          setErrorMsg('Dana Kurang Bos!'); playSound('fail');
          if(player.isBot) setActiveModal('END_TURN');
        }
        setUiLocked(false);
        break;
      
      case 'USE_FREE_MAX_UPGRADE':
        updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'FREE_MAX_UPGRADE') }));
        setProperties(prev => ({ ...prev, [modalData.id]: { ...prev[modalData.id], level: modalData.maxLevel } }));
        addLog(`🌟 SULTAN BEBAS: ${player.name} pakai Kartu VIP! ${modalData.name} langsung Mentok Level Max secara GRATIS!`);
        playSound('magic');
        setActiveModal('END_TURN');
        break;

      case 'TELEPORT_STATION':
        if ((player.money || 0) >= 50) {
            const oldM = player.money;
            const newM = oldM - 50;
            updatePlayerState(player.id, { money: newM, position: payload });
            addLog(`🚂 WUSSS FAST-TRAVEL! ${player.name} membayar tiket Rp50K lalu naik kereta menuju ${BOARD_TILES[payload].name}! (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
            playSound('teleport');
            setTimeout(() => { evaluateTile(BOARD_TILES[payload], playersRef.current[turnIndex]); }, 1000);
        } else {
            setErrorMsg('Uang Tiket Kereta Kurang!'); playSound('fail');
        }
        break;

            case 'TELEPORT_CANCEL':
        playSound('click');
        setActiveModal('END_TURN');
        break;


      case 'USE_DEBT_CLEAR_CARD':
        updatePlayerState(player.id, p => ({ debt: 0, buffs: consumeCard(p.buffs, 'DEBT_CLEAR') }));
        addLog(`🎫 PEMUTIHAN! ${player.name} menggunakan Kartu VIP untuk melunasi semua hutang Pinjol secara instan!`);
        playSound('magic');
        setViewingPlayer(null);
        if(player.isBot) setTimeout(() => handleAction('ROLL'), 1500);
        break;
      
      case 'PREPARE_CUSTOM_TELEPORT':
        setViewingPlayer(null);
        setActiveModal('SELECT_TELEPORT');
        if (player.isBot) {
           setTimeout(() => handleAction('EXECUTE_CUSTOM_TELEPORT', 55), 1000);
        }
        break;

      case 'EXECUTE_CUSTOM_TELEPORT':
        updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'CUSTOM_TELEPORT'), position: payload }));
        addLog(`✨ TELEPORT BEBAS! ${player.name} berpindah tempat secara instan ke petak ${BOARD_TILES[payload].name} menggunakan Kartu VIP!`);
        playSound('teleport');
        setViewingPlayer(null);
        setActiveModal('MOVING');
        setTimeout(() => { evaluateTile(BOARD_TILES[payload], playersRef.current[turnIndex]); }, 500);
        break;

      case 'EXECUTE_KUDETA':
        updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'FORCE_ACQUIRE') }));
        setProperties(prev => ({ ...prev, [payload.id]: { ...propertiesRef.current[payload.id], ownerId: player.id } }));
        addLog(`👑 KUDETA KARTU VIP! ${player.name} merampas hak milik properti ${payload.name} secara paksa dan gratis!`);
        playSound('win');
        if(player.isBot) setTimeout(() => handleAction('ROLL'), 1500);
        break;

      case 'EXECUTE_FREE_REDEEM':
        updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'FREE_REDEEM') }));
        setProperties(prev => ({...prev, [payload.id]: { ...propertiesRef.current[payload.id], isMortgaged: false }}));
        addLog(`📈 TEBUS GRATIS! ${player.name} telah menebus kembali properti ${payload.name} dari bank dengan Kartu VIP!`);
        playSound('magic');
        if(player.isBot) setTimeout(() => handleAction('ROLL'), 1500);
        break;

      case 'LOTTERY_SPIN':
        setUiLocked(true); // Anti-Spam
        playSound('dice');
        await sleep(1000);
        const winAmount = Math.random() > 0.5 ? Math.floor(Math.random() * 300) + 50 : 0;
        if (winAmount > 0) {
            const oldM = player.money;
            const newM = oldM + winAmount;
            updatePlayerState(player.id, { money: newM });
            addLog(`🎰 JACKPOT MENANG! ${player.name} memenangkan putaran Lotre dan meraup untung Rp${winAmount}K! (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
            playSound('win');
            setModalData(prev => ({ ...prev, result: winAmount }));
        } else {
            addLog(`🎰 LOTRE ZONK! Nasib buruk, ${player.name} cuma dapet angin kali ini.`);
            playSound('fail');
            setModalData(prev => ({ ...prev, result: 0 }));
        }
        setActiveModal('LOTTERY_RESULT');
        setUiLocked(false);
        break;

      case 'AUCTION_TURN_VIP_WIN': {
        const winnerId = payload;
        const winner = playersRef.current.find(p=>p.id===winnerId);
        updatePlayerState(winnerId, p => ({ buffs: consumeCard(p.buffs, 'VIP_AUCTION'), antiques: [...(p.antiques || []), { name: modalData.item.name, val: modalData.item.val }] }));
        addLog(`🎟️ KARTU SAKTI LELANG! ${winner.name} menggunakan VIP AUTO WIN dan memenangkan "${modalData.item.name}" secara INSTAN & GRATIS!`);
        playSound('win');
        setModalData(prev => ({ ...prev, resolved: true, winner, currentBid: 0 }));
        break;
      }

      case 'AUCTION_TURN_BID': {
        const bidderId = payload;
        const bidderName = playersRef.current.find(p=>p.id===bidderId)?.name || 'Anonim';
        const nextB = modalData.highestBidderId === null ? modalData.item.startBid : modalData.currentBid + 10;
        playSound('coin');
        addLog(`🔨 TANTANGAN LELANG: ${bidderName} menaikkan tawaran ke Rp${nextB}K!`);
        setModalData(prev => ({ ...prev, currentBid: nextB, highestBidderId: bidderId, turnIdx: (prev.turnIdx + 1) % prev.activeBidders.length }));
        break;
      }

      case 'AUCTION_TURN_FOLD': {
        const foldId = payload;
        const foldName = playersRef.current.find(p=>p.id===foldId)?.name || 'Anonim';
        addLog(`⏭️ LELANG: ${foldName} mundur, kantong lagi kering.`);
        setModalData(prev => {
            const newActive = prev.activeBidders.filter(id => id !== foldId);
            if (newActive.length === 0) return { ...prev, activeBidders: newActive };
            const nextIdx = prev.turnIdx % newActive.length;
            return { ...prev, activeBidders: newActive, turnIdx: nextIdx };
        });
        break;
      }

      case 'AUCTION_END': {
        if (modalData.highestBidderId === null || modalData.activeBidders.length === 0) {
            addLog(`🔨 LELANG SELESAI: Penawaran Barang Antik "${modalData.item.name}" dibatalkan karena sepi peminat.`);
            playSound('fail');
            setModalData(prev => ({ ...prev, resolved: true, winner: null }));
        } else {
            const winnerId = modalData.highestBidderId;
            const winner = playersRef.current.find(p => p.id === winnerId);
            if(winner) {
                const oldM = winner.money;
                const newM = oldM - modalData.currentBid;
                updatePlayerState(winnerId, p => ({ money: newM, antiques: [...(p.antiques || []), { name: modalData.item.name, val: modalData.item.val }] }));
                addLog(`🔨 KETUK PALU SAH! ${winner.name} menangin Lelang "${modalData.item.name}" seharga Rp${modalData.currentBid}K. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
                playSound('win');
                setModalData(prev => ({ ...prev, resolved: true, winner }));
            }
        }
        break;
      }

            case 'ACKNOWLEDGE':
        setUiLocked(true); // Kunci UI biar aman
        if (activeModal === 'TAX' && modalData && modalData.price) {
            const newMoney = processForcedPayment(player, modalData.price, `📉 WAKTU PAJAK! ${player.name} keciduk petugas bayar Pajak Rp${modalData.price}K.`);
            playSound('fail');
            setTimeout(() => {
               if (newMoney < 0 && checkBankruptcy(player.id)) { if(checkEndGame()) return; setActiveModal('BANKRUPT'); setUiLocked(false); return; }
               setActiveModal('END_TURN');
               setUiLocked(false);
            }, 100);
            return;
        }

        if (activeModal === 'EVENT_RESULT' && modalData?.eventData?.effects) {
            let nextActionQueue = null; 
            let totalMoneyGain = 0;
            let totalMoneyLoss = 0;
            let logDetails = [];
            
            let tmpAssets = { ...player.assets };
            let tmpGold = player.gold || 0;
            let tmpAntiques = [...(player.antiques || [])];
            let tmpBuffs = [...(player.buffs || [])];

            modalData.eventData.effects.forEach(ev => {
                if (ev.type === 'money') {
                    if (ev.value < 0 && tmpBuffs.includes('LOSS_EXEMPTION')) {
                        logDetails.push(`🛡️ Kebal dari denda Rp${Math.abs(ev.value)}K`);
                        tmpBuffs = consumeCard(tmpBuffs, 'LOSS_EXEMPTION');
                        playSound('magic');
                    } else {
                        if (ev.value > 0) totalMoneyGain += ev.value;
                        if (ev.value < 0) totalMoneyLoss += Math.abs(ev.value);
                    }
                } else if (ev.type === 'asset') {
                    const aType = ev.assetType || ASSET_TYPES[Math.floor(Math.random()*ASSET_TYPES.length)];
                    tmpAssets[aType] = (tmpAssets[aType] || 0) + (ev.value || 1);
                    logDetails.push(`🌾 +${ev.value || 1} ${aType}`);
                    playSound('coin');
                } else if (ev.type === 'gold') {
                    const oldGold = tmpGold;
                    tmpGold = parseFloat((tmpGold + ev.value).toFixed(1));
                    const diff = parseFloat((tmpGold - oldGold).toFixed(1));
                    if(diff !== 0) {
                        logDetails.push(`🪙 ${diff > 0 ? '+' : ''}${diff}g Emas`);
                        playSound('coin');
                    }
                } else if (ev.type === 'antique' && ev.item) {
                    tmpAntiques.push(ev.item);
                    logDetails.push(`🏺 Mengamankan "${ev.item.name}" (Rp${ev.item.val}K)`);
                    playSound('coin');
                } else if (ev.type === 'jail') {
                    nextActionQueue = { type: 'jail' };
                } else if (ev.type === 'teleport' && nextActionQueue?.type !== 'jail') {
                    nextActionQueue = { type: 'teleport', targetId: ev.targetId };
                } else if (ev.type === 'move' && !nextActionQueue) {
                    nextActionQueue = { type: 'move', value: ev.value };
                } else if (ev.type === 'vip') {
                    const validBuffs = ['FREE_RENT', 'FREE_JAIL', 'DISCOUNT_TAX', 'CUSTOM_TELEPORT', 'FORCE_ACQUIRE', 'DEBT_CLEAR', 'LOSS_EXEMPTION', 'FREE_REDEEM', 'VIP_AUCTION', 'FREE_MAX_UPGRADE'];
                    const gainedCard = validBuffs[Math.floor(Math.random() * validBuffs.length)];
                    tmpBuffs.push(gainedCard);
                    logDetails.push(`🌟 MENDAPAT KARTU VIP LANGKA!`);
                    playSound('magic');
                }
            });

            updatePlayerState(player.id, { assets: tmpAssets, gold: tmpGold, antiques: tmpAntiques, buffs: tmpBuffs });

            const oldMoneyForEvent = player.money || 0;
            let currentMoneyAfterGain = oldMoneyForEvent + totalMoneyGain;
            if (totalMoneyGain > 0) {
               logDetails.push(`💰 Mendapat Rp${totalMoneyGain}K`);
               playSound('coin');
            }

            if (totalMoneyLoss > 0) {
                let moneyToTest = currentMoneyAfterGain - totalMoneyLoss;
                let currentDebtForEv = player.debt || 0;
                let botEmergencyLogs = [];

                if (player.isBot && moneyToTest < 0) {
                    ['gandum', 'telur', 'padi'].forEach(t => {
                        while(moneyToTest < 0 && tmpAssets[t] > 0) {
                            moneyToTest += marketPrices[t];
                            tmpAssets[t] -= 1;
                            botEmergencyLogs.push(`Jual 1 ${t}`);
                        }
                    });
                    while(moneyToTest < 0 && tmpGold > 0) {
                        let sellAmt = tmpGold >= 1 ? 1 : tmpGold;
                        let val = Math.round(sellAmt * goldPrice);
                        moneyToTest += val;
                        tmpGold = parseFloat((tmpGold - sellAmt).toFixed(1));
                        botEmergencyLogs.push(`Jual ${sellAmt}g Emas`);
                    }
                    while(moneyToTest < 0 && tmpAntiques.length > 0) {
                        const ant = tmpAntiques.pop();
                        moneyToTest += ant.val;
                        botEmergencyLogs.push(`Jual Antik "${ant.name}"`);
                    }
                    if (moneyToTest < 0) {
                        const ownedProps = BOARD_TILES.filter(t => propertiesRef.current[t.id]?.ownerId === player.id && !propertiesRef.current[t.id]?.isMortgaged);
                        ownedProps.sort((a,b) => a.price - b.price);
                        for(let prop of ownedProps) {
                            if (moneyToTest >= 0) break;
                            const pData = propertiesRef.current[prop.id];
                            
                            let refundLand = prop.price / 2;
                            let refundFull = refundLand + ((pData.level || 0) * (prop.hPrice || 0) / 2);
                            
                            let type = 'full';
                            let refund = refundFull;
                            if ((pData.level || 0) > 0 && (moneyToTest + refundLand) >= 0) {
                                type = 'land';
                                refund = refundLand;
                            }
                            
                            moneyToTest += refund;
                            setProperties(prev => ({...prev, [prop.id]: { ...prev[prop.id], isMortgaged: type }}));
                            botEmergencyLogs.push(`Gadai ${type==='land'?'Tanah':'Full'} ${prop.name}`);
                        }
                    }
                    while(moneyToTest < 0 && currentDebtForEv < 1000) {
                        moneyToTest += 500;
                        currentDebtForEv += 600;
                        botEmergencyLogs.push(`Pinjam Bank`);
                    }
                }
                
                updatePlayerState(player.id, { money: moneyToTest, assets: tmpAssets, gold: tmpGold, debt: currentDebtForEv });
                logDetails.push(`📉 Denda Rp${totalMoneyLoss}K`);
                if(botEmergencyLogs.length > 0) addLog(`🤖 BOT EMERGENCY [${player.name}]: Jual aset dadakan buat bertahan hidup! (${botEmergencyLogs.join(', ')})`);
                
                playSound('fail');
            } else {
                updatePlayerState(player.id, { money: currentMoneyAfterGain });
            }

            if (logDetails.length > 0) {
                addLog(`⚡ EFEK [${player.name}]: ${logDetails.join(' | ')}.`);
            }

            setTimeout(() => {
                const freshP = playersRef.current.find(x => x.id === player.id);
                if (freshP && freshP.money < 0) {
                   if (checkBankruptcy(freshP.id)) {
                      if(checkEndGame()) return;
                      setActiveModal('BANKRUPT'); 
                      setUiLocked(false);
                      return;
                   }
                }

                if (nextActionQueue) {
                    if (nextActionQueue.type === 'jail') {
                        addLog(`🚨 EVENT AI: Ya elah, ${player.name} langsung diseret Satpol PP ke bui!`);
                        updatePlayerState(player.id, { position: 14, inJail: true, jailTurns: 0 }); 
                        playSound('fail'); 
                        setActiveModal('END_TURN');
                    } else if (nextActionQueue.type === 'teleport') {
                        addLog(`🪄 EVENT AI: Dimensi bergetar, ${player.name} di-teleportasi secara gaib!`);
                        playSound('teleport');
                        updatePlayerState(player.id, { position: nextActionQueue.targetId });
                        setTimeout(() => { evaluateTile(BOARD_TILES[nextActionQueue.targetId], playersRef.current[turnIndex]); }, 500);
                    } else if (nextActionQueue.type === 'move') {
                        addLog(`🪄 EVENT AI: Langkah gaib memaksa ${player.name} bergerak ${nextActionQueue.value} petak!`);
                        setActiveModal('MOVING');
                        animateMove(player.id, nextActionQueue.value); 
                    }
                    setUiLocked(false);
                    return; 
                }
                
                setActiveModal('END_TURN');
                setUiLocked(false);
            }, 150);
            return;
        }

        if (activeModal === 'QUIZ_RESULT') {
            if (modalData.isCorrect) {
                const oldM = player.money;
                const newM = oldM + 200;
                updatePlayerState(player.id, { money: newM });
                addLog(`💰 KUIS BENAR: Si paling pinter! Hadiah Rp200K masuk kantong. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
            } else {
                if ((player.buffs || []).includes('LOSS_EXEMPTION')) {
                    addLog(`🛡️ ASURANSI! ${player.name} salah jawab kuis tapi ditolong dewa, gak jadi kena denda!`);
                    updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'LOSS_EXEMPTION') }));
                    playSound('magic');
                } else {
                    const newMoney = processForcedPayment(player, 100, `📉 DENDA KUIS: Potongan otomatis Rp100K diterapkan karena salah jawab.`);
                }
            }
            setTimeout(() => {
               const pCheck = playersRef.current[turnIndex];
               if ((pCheck?.money || 0) < 0 && checkBankruptcy(pCheck.id)) { 
                  if(checkEndGame()) return;
                  setActiveModal('BANKRUPT'); 
                  setUiLocked(false);
                  return; 
               }
               setActiveModal('END_TURN');
               setUiLocked(false);
            }, 100);
            return;
        }

        if (activeModal === 'BANKRUPT') {
          if(checkEndGame()) return;
          setActiveModal('END_TURN');
          setUiLocked(false);
          return;
        }

        setActiveModal('END_TURN');
        setUiLocked(false);
        break;


      case 'QUIZ_ANSWER':
        const isCorrect = payload === modalData.answerIndex;
        setModalData(prev => ({ ...prev, isCorrect, selectedAnswer: payload }));
        if (isCorrect) { addLog(`🧠 INTELEK! ${player.name} bener jawab kuis recehnya!`); playSound('win'); } 
        else { addLog(`🤡 KOCAK! ${player.name} salah jawab tebak-tebakan.`); playSound('fail'); }
        setActiveModal('QUIZ_RESULT'); 
        break;

      case 'END_TURN':
        setGoldPrice(prev => Math.max(20, Math.min(300, prev + Math.floor(Math.random() * 51) - 25))); 
        setMarketPrices(prev => ({
           gandum: Math.max(5, Math.min(60, prev.gandum + Math.floor(Math.random() * 21) - 10)),
           telur: Math.max(10, Math.min(80, prev.telur + Math.floor(Math.random() * 31) - 15)),
           padi: Math.max(15, Math.min(100, prev.padi + Math.floor(Math.random() * 41) - 20))
        }));

        if(checkEndGame()) return;

        let nextIdx = (turnIndex + 1) % playersRef.current.length;
        let loops = 0;
        while(playersRef.current[nextIdx].isBankrupt && loops < playersRef.current.length) {
            nextIdx = (nextIdx + 1) % playersRef.current.length;
            loops++;
        }
        setTurnIndex(nextIdx);
        setModalData(null);
        setActiveModal('WAIT_ROLL');
        playSound('step');
        break;
    }
  };

    const animateMove = async (playerId, steps) => {
    const dir = steps > 0 ? 1 : -1;
    const absSteps = Math.abs(steps);
    let passedGo = false;
    let hadDebt = false;

    if (dir === -1) {
       playSound('fail');
       await sleep(300); // Kasih jeda sedikit sebelum langkah pertama
    }

    for (let i = 0; i < absSteps; i++) {
      let passedGoThisStep = false;
      
      updatePlayerState(playerId, p => {
          let nextPos = p.position + dir;
          if (nextPos >= 56) { 
              nextPos -= 56; 
              passedGoThisStep = true; 
              hadDebt = (p.debt || 0) > 0;
          }
          if (nextPos < 0) { nextPos += 56; }

          if (passedGoThisStep) {
             if (hadDebt) {
                 return { position: nextPos, debt: Math.max(0, (p.debt || 0) - 200) }; 
             } else {
                 return { position: nextPos, money: (p.money || 0) + 200 };
             }
          }
          return { position: nextPos };
      });

      playSound('step');
      if (passedGoThisStep) passedGo = true;
      await sleep(200); 
    }

    if (passedGo) {
       const p = playersRef.current.find(x => x.id === playerId);
       if (hadDebt) {
           addLog(`🚨 DEBT COLLECTOR! Gaji Start Rp200K milik ${p?.name} disita bank otomatis buat nyicil pinjol!`); playSound('fail');
       } else {
           addLog(`💵 CAIR CAIR! ${p?.name} ngelewatin Start. Gaji Rp200K masuk saldo.`); playSound('coin');
       }
    }

    setTimeout(() => {
       const finalPlayer = playersRef.current.find(p => p.id === playerId);
       if(finalPlayer) evaluateTile(BOARD_TILES[finalPlayer.position], finalPlayer);
    }, 100);
  };


  const evaluateTile = async (tile, player) => {
    setModalData(tile);
    const props = propertiesRef.current; 

    if ((tile.type === 'property' || tile.type === 'station' || tile.type === 'utility') && props[tile.id] && props[tile.id].ownerId !== player.id && !props[tile.id].isMortgaged) {
        
        if ((player.buffs || []).includes('LOSS_EXEMPTION')) {
            addLog(`🛡️ ASURANSI VIP! ${player.name} selamat dari denda bayar sewa selangit di ${tile.name}!`);
            playSound('magic');
            updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'LOSS_EXEMPTION') }));
            setActiveModal('END_TURN');
            return;
        }

        if ((player.buffs || []).includes('FREE_RENT')) {
            addLog(`🎫 KARTU AJAIB! ${player.name} pamer ke pemilik tanah, pake Kartu Bebas Sewa di ${tile.name}!`);
            playSound('magic');
            updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'FREE_RENT') }));
            setActiveModal('END_TURN');
            return;
        }

        const owner = playersRef.current.find(p => p.id === props[tile.id].ownerId);
        const rent = calculateRent(tile, props[tile.id], owner.id); 
        setModalData({ ...tile, rent, ownerName: owner.name, ownerId: owner.id, isMonopoly: hasMonopoly(owner.id, tile.group) });        
        playSound('fail');     
        setActiveModal('RENT');
        return;

    }

    if (tile.type === 'station' && props[tile.id]?.ownerId === player.id && !props[tile.id].isMortgaged) {
       const ownedStations = BOARD_TILES.filter(t => t.type === 'station' && props[t.id]?.ownerId === player.id && !props[t.id]?.isMortgaged);
       if (ownedStations.length > 1) {
           setModalData({ ...tile, availableStations: ownedStations.filter(t => t.id !== tile.id) });
           setActiveModal('STATION_TELEPORT');
           return;
       }
    }

    if (tile.type === 'agriculture' || tile.type === 'mine') {
       const propData = props[tile.id];
       if (!propData) {
          setActiveModal('BUY');
       } else if (propData.ownerId === player.id) {
          if ((propData.level || 0) < 3 && !propData.isMortgaged) {
             const currentLevel = propData.level || 0;
             const maxLevel = 3;
             const dynamicCost = tile.hPrice * (currentLevel + 1);
             const nextEffect = `- ${(currentLevel + 1) * 60} Detik / Panen`;
             setModalData({ ...tile, dynamicCost, currentLevel, maxLevel, nextEffect });
             setActiveModal('UPGRADE');
          } else {
             setActiveModal('END_TURN');
          }
       } else if (propData.ownerId !== player.id && !propData.isMortgaged) {
          const owner = playersRef.current.find(p => p.id === propData.ownerId);
          const tilesOwned = BOARD_TILES.filter(t => t.type === tile.type && props[t.id]?.ownerId === owner.id && !props[t.id]?.isMortgaged).length;
          
          if (tile.type === 'agriculture') {
              let gainedAssets = [];
              let newAssets = { ...owner.assets };
              for(let k=0; k<tilesOwned; k++) {
                 const r = ASSET_TYPES[Math.floor(Math.random() * ASSET_TYPES.length)];
                 newAssets[r] = (newAssets[r] || 0) + 1;
                 gainedAssets.push(r);
              }
              updatePlayerState(owner.id, { assets: newAssets });
              addLog(`🌾 GOTONG ROYONG! ${player.name} singgah di Ladang ${owner.name}, panen dadakan ${gainedAssets.join(', ')} buat pemilik!`);
              playSound('magic');
              setModalData({ ...tile, ownerName: owner.name, rewardText: gainedAssets.join(', ') });
              setActiveModal('AGRICULTURE_INFO');
          } else { 
              const goldGain = tilesOwned === 2 ? 1 : 0.5; 
              updatePlayerState(owner.id, p => ({ gold: parseFloat(((p.gold || 0) + goldGain).toFixed(1)) }));
              addLog(`⛏️ PEKERJA TAMBAHAN! ${player.name} mampir ke Tambang ${owner.name}, bantu gali ${goldGain}g Emas gratis buat bos!`);
              playSound('magic');
              setModalData({ ...tile, ownerName: owner.name, rewardText: `${goldGain}g Emas` });
              setActiveModal('MINE_INFO');
          }
       } else {
          setActiveModal('END_TURN');
       }
    } 
    else if (tile.type === 'property' || tile.type === 'station' || tile.type === 'utility') {
      const propData = props[tile.id];
      if (!propData) {
        setActiveModal('BUY');
      } else if (propData.ownerId === player.id && tile.type === 'property') {
        if ((propData.level || 0) < 5 && !propData.isMortgaged) {
             const currentLevel = propData.level || 0;
             const maxLevel = 5;
             const dynamicCost = tile.hPrice * (currentLevel + 1);
             const nextRent = currentLevel + 1 === 1 ? tile.baseRent*3 : currentLevel + 1 === 2 ? tile.baseRent*8 : currentLevel + 1 === 3 ? tile.baseRent*15 : currentLevel + 1 === 4 ? tile.baseRent*25 : tile.baseRent*40;
             setModalData({ ...tile, dynamicCost, nextRent, currentLevel, maxLevel });
             setActiveModal('UPGRADE');
        } else {
             setActiveModal('END_TURN');
        }
      } else {
        setActiveModal('END_TURN');
      }
    } else if (tile.type === 'tax') {
      if ((player.buffs || []).includes('LOSS_EXEMPTION')) {
         addLog(`🛡️ ASURANSI VIP! ${player.name} aman dari petugas pajak pake Kartu Spesial!`);
         playSound('magic');
         updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'LOSS_EXEMPTION') }));
         setActiveModal('END_TURN');
      } else if ((player.buffs || []).includes('DISCOUNT_TAX')) {
         addLog(`🎫 DISKON FULL! ${player.name} ngeles ke petugas pajak pake Kartu VIP, gak jadi didenda!`);
         playSound('magic');
         updatePlayerState(player.id, p => ({ buffs: consumeCard(p.buffs, 'DISCOUNT_TAX') }));
         setActiveModal('END_TURN');
      } else {
         setActiveModal('TAX');
      }
    } else if (tile.type === 'chance' || tile.type === 'chest') {
      if (eventLockRef.current) return;
      eventLockRef.current = true;
      setActiveModal('EVENT_LOADING');
      playSound('magic');
      const event = await generateAIEvent(player.name);
      
      setModalData({ ...tile, eventData: event });
      setActiveModal('EVENT_RESULT');
      eventLockRef.current = false;
    } else if (tile.type === 'quiz') {
      setActiveModal('QUIZ_LOADING');
      playSound('magic');
      const q = await generateQuiz();
      setModalData({ ...tile, ...q });
      setActiveModal('QUIZ_PLAY');
    } else if (tile.type === 'lottery') { 
      setActiveModal('LOTTERY_PLAY');
      playSound('magic');
    } else if (tile.type === 'auction') { 
      setActiveModal('AUCTION_LOADING');
      playSound('magic');
      const item = await generateAIAuction(); 
      const activeBidders = playersRef.current.filter(p => !p.isBankrupt).map(p => p.id);
      let botLimits = {};
      playersRef.current.forEach(p => {
         if (p.isBot && !p.isBankrupt) {
             botLimits[p.id] = Math.min(p.money, item.startBid + Math.floor(Math.random() * item.startBid * 1.5));
         }
      });
      setModalData({ 
         ...tile, item, currentBid: item.startBid, highestBidderId: null, botLimits, activeBidders, turnIdx: 0, resolved: false, winner: null 
      });
      setActiveModal('AUCTION_BIDDING');
    } else if (tile.type === 'go_to_jail') {
      updatePlayerState(player.id, { position: 14, inJail: true, jailTurns: 0 }); 
      addLog(`🚨 TERCIDUK! Satpol PP nangkap ${player.name} dan diseret langsung ke bui.`);
      playSound('fail');
      setActiveModal('JAIL');
    } else if (tile.type === 'parking') {
      playSound('magic');
      const cards = [
         { id: 'FREE_RENT', name: 'Bebas Sewa', desc: 'Tidak perlu bayar sewa di lahan musuh!' },
         { id: 'FREE_JAIL', name: 'Bebas Penjara', desc: 'Bisa keluar penjara gratis 1x!' },
         { id: 'CASH', name: 'Uang Kaget', desc: 'Langsung dapat suntikan dana Rp 150K!' },
         { id: 'DISCOUNT_TAX', name: 'Kebal Pajak', desc: 'Satu kali kebal dari denda di petak Pajak!' },
         { id: 'CUSTOM_TELEPORT', name: 'Teleport Bebas', desc: 'Pindah ke petak mana saja (Aktifkan di Profil)!' }, 
         { id: 'FORCE_ACQUIRE', name: 'Kudeta Lahan', desc: 'Gunakan saat Akuisisi untuk merampas lahan secara GRATIS!' },
         { id: 'DEBT_CLEAR', name: 'Pemutihan Pinjol', desc: 'Lunas hutang Bank 100% (Aktifkan di Profil)!' },
         { id: 'LOSS_EXEMPTION', name: 'Asuransi Kerugian', desc: 'Otomatis menahan hilangnya uang dari Denda/Sewa/Event 1x!' },
         { id: 'FREE_REDEEM', name: 'Tebus Gadai Gratis', desc: 'Tebus 1 lahan/bangunan dari bank secara gratis (Pilih di Lahan)!' },
         { id: 'VIP_AUCTION', name: 'Auto Win Lelang', desc: 'Menangkan 1 barang antik di Balai Lelang secara INSTAN & GRATIS!' },
         { id: 'FREE_MAX_UPGRADE', name: 'Sultan Mendadak', desc: 'Upgrade petak properti/ladang langsung ke Level Max secara GRATIS!' }
      ];
      const card = cards[Math.floor(Math.random() * cards.length)];
      if (card.id === 'CASH') {
         const oldM = player.money;
         const newM = oldM + 150;
         updatePlayerState(player.id, p => ({ money: newM }));
         addLog(`🎟️ PARKIR HOKI! ${player.name} nemu dompet isinya Rp150K! (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
      } else {
         updatePlayerState(player.id, p => ({ buffs: [...(p.buffs || []), card.id] }));
         addLog(`🎟️ PARKIR HOKI! ${player.name} dapet privilese VIP: ${card.name}!`);
      }
      setModalData({ ...tile, card });
      setActiveModal('PARKING_CARD');
    } else {
      setActiveModal('END_TURN'); 
    }
  };

  const handleGadai = (type) => {
    const player = playersRef.current[turnIndex];
    if (!player || !viewingProperty) return;
    const propData = propertiesRef.current[viewingProperty.id];
    
    let refund = 0;
    if (type === 'land') {
       refund = viewingProperty.price / 2;
    } else {
       refund = (viewingProperty.price / 2) + ((propData?.level || 0) * (viewingProperty.hPrice || 0) / 2);
    }
    
    const oldM = player.money;
    const newM = oldM + refund;
    updatePlayerState(player.id, p => ({ money: newM }));
    setProperties(prev => ({...prev, [viewingProperty.id]: { ...propData, isMortgaged: type }}));
    addLog(`🏦 DANA CAIR: ${player.name} menggadaikan ${type==='land'?'Tanah':'Semua Aset'} di ${viewingProperty.name} dapet Rp${refund}K. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
    playSound('coin');
    setViewingProperty(null);
  };

  const handleTebus = () => {
    const player = playersRef.current[turnIndex];
    if (!player || !viewingProperty) return;
    const propData = propertiesRef.current[viewingProperty.id];
    
    let cost = 0;
    if (propData.isMortgaged === 'land') {
       cost = (viewingProperty.price / 2) + 20;
    } else {
       cost = (viewingProperty.price / 2) + ((propData?.level || 0) * (viewingProperty.hPrice || 0) / 2) + 20;
    }

    if ((player.money || 0) >= cost) {
        const oldM = player.money;
        const newM = oldM - cost;
        updatePlayerState(player.id, p => ({ money: newM }));
        setProperties(prev => ({...prev, [viewingProperty.id]: { ...propData, isMortgaged: false }}));
        addLog(`📈 SERTIFIKAT KEMBALI: ${player.name} sukses nebus agunan ${viewingProperty.name} seharga Rp${cost}K. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
        playSound('magic');
        setViewingProperty(null);
    } else {
        setErrorMsg("Uang tunai tidak cukup untuk melunasi tebusan!"); playSound('fail');
    }
  };

  const handleBorrowBank = () => {
     const player = playersRef.current[turnIndex];
     if (!player) return;
     if ((player.debt || 0) >= 1000) {
        setErrorMsg("Batas Hutang Maksimal (Rp1000K) sudah tercapai!"); playSound('fail');
     } else {
        const oldM = player.money || 0;
        const newM = oldM + 500;
        updatePlayerState(player.id, p => ({ money: newM, debt: (p.debt || 0) + 600 })); 
        addLog(`🏛️ BANK PINJOL: ${player.name} nekat minjol Rp500K (Tercatat hutang Rp600K). (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
        playSound('coin');
     }
  };
  
  const handlePayBank = () => {
     const player = playersRef.current[turnIndex];
     if (!player || (player.debt || 0) <= 0) return;
     
     const maxPayable = Math.min((player.money || 0), (player.debt || 0), repayAmount);

     if (maxPayable > 0) { 
        const oldM = player.money;
        const newM = oldM - maxPayable;
        const newD = (player.debt || 0) - maxPayable;
        updatePlayerState(player.id, p => ({ money: newM, debt: newD }));
        addLog(`🏛️ NYICIL PINJOL: ${player.name} bayar tunggakan sebesar Rp${maxPayable}K. (Saldo: Rp${oldM}K ➡️ Rp${newM}K, Sisa Hutang: Rp${newD}K)`);
        playSound('coin');
        setRepayAmount(100);
     } else {
        setErrorMsg(`Nominal cicilan tidak sesuai atau uang tidak cukup!`); playSound('fail');
     }
  };

  const handleSellAntique = (index, antique) => {
     const oldM = currentPlayer.money;
     const newM = oldM + antique.val;
     updatePlayerState(currentPlayer.id, p => {
         const newAntiques = [...(p.antiques || [])];
         newAntiques.splice(index, 1);
         return { money: newM, antiques: newAntiques };
     });
     addLog(`🏛️ MUSEUM BANK: Laku keras! ${currentPlayer.name} ngelepas barang lelang "${antique.name}" seharga Rp${antique.val}K. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
     playSound('coin');
  };

  const handleSellAllAntiques = () => {
     const player = playersRef.current[turnIndex];
     if (!player || (player.antiques || []).length === 0) return;
     const oldM = player.money;
     const totalVal = player.antiques.reduce((sum, a) => sum + a.val, 0);
     const newM = oldM + totalVal;
     updatePlayerState(player.id, p => ({ money: newM, antiques: [] }));
     addLog(`🏛️ MUSEUM BANK: SULTAN! ${player.name} ngeborong jual SEMUA barang lelang seharga Rp${totalVal}K! (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
     playSound('coin');
  };

    const handleTradeRequest = () => {
    const player = playersRef.current[turnIndex];
    if (!player || !viewingProperty) return;
    const targetProp = viewingProperty;
    const propData = propertiesRef.current[targetProp.id];
    const owner = playersRef.current.find(p => p.id === propData.ownerId);
    let cost = 0;
    const assetValue = targetProp.price + ((propData.level || 0) * (targetProp.hPrice || 0));
    if (targetProp.type === 'property') {
      const currentRent = calculateRent(targetProp, propData, owner.id);
      cost = assetValue + (currentRent * 1.5);
    } 
    else if (targetProp.type === 'utility' || targetProp.type === 'station') {
      cost = targetProp.price * 3;
    } 
    else if (targetProp.type === 'agriculture' || targetProp.type === 'mine') {
      cost = assetValue * 2.5;
    }
    if (propData.isMortgaged) {
      let redeemCost = (targetProp.price / 2) + 20;
      if (propData.isMortgaged !== 'land') {
        redeemCost += ((propData.level || 0) * (targetProp.hPrice || 0) / 2);
      }      
      cost = Math.max(cost - redeemCost, 10);
    }
    const finalCost = Math.floor(cost);   
    if ((player.money || 0) >= finalCost) {
      setPendingTrade({ 
        buyer: player, 
        owner: owner, 
        prop: targetProp, 
        cost: finalCost, 
        isKudeta: false,
        isMortgaged: propData.isMortgaged 
      });
      setViewingProperty(null);
      playSound('magic');
    } else {
      setErrorMsg(`Butuh Rp${finalCost}K untuk akuisisi lahan ini!`);
      playSound('fail');
    }
  };


  const handleTradeResponse = (isAccepted, isKudetaMode = false) => {
     if (!pendingTrade) return;
     const { buyer, owner, prop, cost } = pendingTrade;
     const currentBuyer = playersRef.current.find(p => p.id === buyer.id);
     const currentOwner = playersRef.current.find(p => p.id === owner.id);
     const currentPropData = propertiesRef.current[prop.id];
     
     let finalCost = isKudetaMode ? 0 : cost;

     if (isAccepted && (currentBuyer?.money || 0) >= finalCost) {
         const oldBuyerM = currentBuyer.money;
         const newBuyerM = oldBuyerM - finalCost;
         const oldOwnerM = currentOwner.money;
         const newOwnerM = oldOwnerM + finalCost;
         
         updatePlayerState(currentBuyer.id, p => ({ 
            money: newBuyerM,
            buffs: isKudetaMode ? consumeCard(p.buffs, 'FORCE_ACQUIRE') : p.buffs
         }));
         updatePlayerState(currentOwner.id, p => ({ money: newOwnerM }));
         
         setProperties(prev => ({ 
             ...prev, 
             [prop.id]: { 
                 ownerId: currentBuyer.id, 
                 level: currentPropData.level, 
                 isMortgaged: currentPropData.isMortgaged, 
                 harvestTimer: currentPropData.harvestTimer 
             } 
         }));
         
         if (isKudetaMode) {
             addLog(`👑 KUDETA KARTU VIP! ${currentBuyer.name} merampas properti ${prop.name} secara paksa dan GRATIS!`);
         } else {
             addLog(`🤝 DEAL MAFIA! ${currentOwner.name} ngelepas properti ${prop.name} ke ${currentBuyer.name} seharga Rp${cost}K!`);
         }
         
         if (currentPropData.isMortgaged) addLog(`⚠️ PERHATIAN: ${currentBuyer.name} mewarisi status GADAI lahan itu, jangan lupa ditebus ya.`);
         playSound('win');
     } else if (isAccepted && (currentBuyer?.money || 0) < cost) {
         addLog(`❌ INVESTASI GAGAL! Tawaran diterima tapi uang ${currentBuyer.name} mendadak kurang di dompet.`); playSound('fail');
     } else {
         addLog(`❌ DITOLAK MENTAH-MENTAH! ${currentOwner.name} gengsi ngelepas lahan kesayangannya.`); playSound('fail');
     }
     setPendingTrade(null);
  };

  const handleBuyGold = () => {
     const player = playersRef.current[turnIndex];
     if (!player) return;
     if ((player.money || 0) >= goldPrice) {
        const oldM = player.money;
        const newM = oldM - goldPrice;
        updatePlayerState(player.id, p => ({ 
            money: newM, 
            gold: parseFloat(((p.gold || 0) + 1).toFixed(1)),
            totalGoldSpent: (p.totalGoldSpent || 0) + goldPrice 
        }));
        addLog(`💰 BELI EMAS: ${player.name} borong 1g Emas senilai Rp${goldPrice}K. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
        playSound('coin');
     } else { setErrorMsg('Uang Tunai Kamu Sedang Kosong!'); playSound('fail'); }
  };
  
  const handleSellGold = (sellAll = false) => {
     const player = playersRef.current[turnIndex];
     if (!player || (player.gold || 0) <= 0) return;
     
     const sellAmt = sellAll ? player.gold : ((player.gold || 0) >= 1 ? 1 : player.gold);
     const sellValue = Math.round(sellAmt * goldPrice);

     const oldM = player.money;
     const newM = oldM + sellValue;

     updatePlayerState(player.id, p => {
         const avg = p.gold > 0 ? (p.totalGoldSpent || 0) / p.gold : 0;
         return { 
             money: newM, 
             gold: parseFloat((p.gold - sellAmt).toFixed(1)),
             totalGoldSpent: Math.max(0, (p.totalGoldSpent || 0) - (avg * sellAmt))
         };
     });
     addLog(`💰 JUAL EMAS: ${player.name} nyairin ${sellAmt}g Emas seharga Rp${sellValue}K! (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
     playSound('coin');
  };

  const handleSellAsset = (type, sellAll = false) => {
     const player = playersRef.current[turnIndex];
     if (!player) return;
     const amount = player.assets[type] || 0;
     if (amount > 0) {
        const qtyToSell = sellAll ? amount : 1;
        const value = marketPrices[type] * qtyToSell;
        const oldM = player.money;
        const newM = oldM + value;
        updatePlayerState(player.id, p => ({ 
           money: newM,
           assets: { ...p.assets, [type]: amount - qtyToSell }
        }));
        playSound('coin');
        addLog(`🛒 PASAR TANI: Cuan juragan! ${player.name} jual ${qtyToSell} ${type} ke bandar dapet Rp${value}K. (Saldo: Rp${oldM}K ➡️ Rp${newM}K)`);
     } else {
        setErrorMsg(`Gudangmu Kosong! Kamu tidak memiliki persediaan ${type}!`); playSound('fail');
     }
  };

  // --- ROTATION UTILS ---
  const getGridStyle = (id) => {
    let col, row;
    if (id >= 0 && id <= 14) { col = 15 - id; row = 15; }
    else if (id >= 15 && id <= 28) { col = 1; row = 15 - (id - 14); }
    else if (id >= 29 && id <= 42) { col = 1 + (id - 28); row = 1; }
    else if (id >= 43 && id <= 55) { col = 15; row = 1 + (id - 42); } 
    return { gridColumnStart: col, gridRowStart: row };
  };

  const getTileLayout = (id) => {
    if (id > 0 && id < 14) return { dir: 'flex-col', colorBar: 'w-full h-[25%]', contentRot: 'rotate-0', borderClass: 'border-t border-slate-800/30 bottom-0 w-full h-[3px] md:h-[4px]', houseDir: 'flex-row' };
    if (id > 14 && id < 28) return { dir: 'flex-row-reverse', colorBar: 'w-[25%] h-full', contentRot: 'rotate-90', borderClass: 'border-l border-slate-800/30 left-0 h-full w-[3px] md:w-[4px]', houseDir: 'flex-col' }; 
    if (id > 28 && id < 42) return { dir: 'flex-col-reverse', colorBar: 'w-full h-[25%]', contentRot: 'rotate-180', borderClass: 'border-b border-slate-800/30 top-0 w-full h-[3px] md:h-[4px]', houseDir: 'flex-row' };
    if (id > 42 && id < 56) return { dir: 'flex-row', colorBar: 'w-[25%] h-full', contentRot: '-rotate-90', borderClass: 'border-r border-slate-800/30 right-0 h-full w-[3px] md:w-[4px]', houseDir: 'flex-col' }; 
    return { dir: 'flex-col', colorBar: '', contentRot: 'rotate-0', borderClass: 'hidden', houseDir: '' }; 
  };

  const getTileRotationStyle = (id) => {
    if (id === 0) return { transform: 'rotate(-45deg)' };
    if (id === 14) return { transform: 'rotate(45deg)' };
    if (id === 28) return { transform: 'rotate(135deg)' };
    if (id === 42) return { transform: 'rotate(-135deg)' };
    return { transform: 'rotate(0deg)' }; 
  };

  const getCornerBgColor = (id) => {
      if (id === 0) return '#ef4444'; 
      if (id === 14) return '#ea580c'; 
      if (id === 28) return '#2563eb'; 
      if (id === 42) return '#991b1b'; 
      return undefined;
  }

  const formatTimer = (seconds) => {
      if (seconds === undefined) return "0:00";
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDER LOAD/START ---
  if (gameState === 'loading') {
      return (
        <div className="min-h-[100dvh] bg-slate-900 flex flex-col justify-center items-center font-sans text-white">
           <Loader2 size={64} className="animate-spin text-blue-500 mb-6" />
           <h2 className="text-4xl font-black mb-2 animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
             {loadingData.progress}%
           </h2>
           <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">{loadingData.text}</p>
        </div>
      );
  }

  // --- GAME OVER RENDER ---
  if (gameState === 'gameover') {
     const sortedPlayers = [...playersRef.current].sort((a, b) => calculateNetWorth(b) - calculateNetWorth(a));
     
     return (
       <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-white">
          <Trophy size={80} className="text-yellow-400 mb-4 animate-bounce" />
          <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">GAME OVER</h1>
          <p className="text-slate-400 mb-8">Permainan Monopoli Selesai!</p>
          
          <div className="w-full max-w-md bg-slate-800 p-6 rounded-3xl shadow-2xl border border-slate-700 space-y-4">
             <h2 className="text-xl font-bold text-center mb-4 uppercase tracking-widest text-slate-300">Papan Skor Akhir</h2>
             {sortedPlayers.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${i===0 ? 'bg-yellow-900/20 border-yellow-500' : p.isBankrupt ? 'bg-red-900/10 border-red-900/50 opacity-60' : 'bg-slate-700 border-slate-600'}`}>
                   <div className="flex items-center gap-3">
                      <div className="font-black text-2xl w-6 text-center">{i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : `${i+1}.`}</div>
                      <div>
                         <p className={`font-bold ${i===0 ? 'text-yellow-400' : 'text-white'}`}>{p.name}</p>
                         <p className="text-xs text-slate-400">{p.isBankrupt ? 'BANGKRUT' : 'Selamat!'}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase">Kekayaan Net</p>
                      <p className={`font-mono font-black text-lg ${p.isBankrupt ? 'text-red-500' : 'text-green-400'}`}>Rp{calculateNetWorth(p)}K</p>
                   </div>
                </div>
             ))}
          </div>

          <button onClick={() => window.location.reload()} className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-full shadow-lg active:scale-95 transition-transform">
             KEMBALI KE MENU
          </button>
       </div>
     );
  }

  // --- MENU RENDER ---
  if (gameState === 'menu') {
    return (
      <div className="min-h-[100dvh] bg-slate-900 flex flex-col font-sans overflow-hidden">
        <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button onClick={toggleFullScreen} className="bg-slate-700 p-2 rounded-full text-white hover:bg-slate-600 shadow-lg transition-transform active:scale-95">
               <Maximize size={24} />
            </button>
            <button onClick={() => setShowTutorial(true)} className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-500 shadow-lg transition-transform active:scale-95">
               <HelpCircle size={24} />
            </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-4 relative z-10 pt-8 pb-4 overflow-y-auto no-scrollbar">
          <Building size={40} className="text-green-500 mb-2" />
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 text-center drop-shadow-lg">
            MONOPOLI <span className="text-yellow-400">ULTIMATE</span>
          </h1>
          <p className="text-green-300 font-medium text-[10px] md:text-xs text-center mb-6 max-w-xs">Sistem Full-Auto + Logika Maksimal!</p>

          <div className="w-full max-w-sm bg-slate-800 p-4 rounded-[24px] shadow-2xl border border-slate-700">
            {menuError && <div className="text-red-400 font-bold text-center bg-red-900/30 p-2 rounded-xl mb-4 text-xs">{menuError}</div>}
            
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 mb-4">
               <p className="text-slate-400 font-bold text-[10px] uppercase mb-2">Asisten AI Master (Groq Only):</p>
               <input type="password" placeholder="Masukkan API Key Groq" value={groqApiKey} onChange={e => setGroqApiKey(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 mb-4">
               <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} className="w-full flex justify-between items-center text-slate-300 hover:text-white transition-colors">
                  <span className="font-bold text-[10px] uppercase flex items-center gap-1"><Settings size={12}/> Pengaturan Permainan</span>
                  <span className="text-xs">{showSettingsMenu ? '▼' : '▶'}</span>
               </button>
               
               {showSettingsMenu && (
                 <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                   <div>
                     <div className="flex justify-between items-center mb-1">
                       <label className="text-[10px] text-slate-400">Modal Uang Awal</label>
                       <span className="text-xs font-mono font-black text-green-400">Rp{startMoney}K</span>
                     </div>
                     <input type="range" min="500" max="5000" step="500" value={startMoney} onChange={(e) => setStartMoney(Number(e.target.value))} className="w-full accent-green-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                   </div>

                   <div>
                     <div className="flex justify-between items-center mb-1">
                       <label className="text-[10px] text-slate-400">Maks. Hadiah/Denda Event</label>
                       <span className="text-xs font-mono font-black text-blue-400">Rp{eventMaxMoney}K</span>
                     </div>
                     <input type="range" min="100" max="1000" step="100" value={eventMaxMoney} onChange={(e) => setEventMaxMoney(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                   </div>

                   <div>
                     <div className="flex justify-between items-center mb-1">
                       <label className="text-[10px] text-slate-400">Maks. Untung/Rugi Emas</label>
                       <span className="text-xs font-mono font-black text-yellow-500">{eventMaxGold}g</span>
                     </div>
                     <input type="range" min="1" max="5" step="1" value={eventMaxGold} onChange={(e) => setEventMaxGold(Number(e.target.value))} className="w-full accent-yellow-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                   </div>

                   <div>
                     <div className="flex justify-between items-center mb-1">
                       <label className="text-[10px] text-slate-400">Maks. Harga Barang Antik</label>
                       <span className="text-xs font-mono font-black text-rose-400">Rp{antiqueMaxPrice}K</span>
                     </div>
                     <input type="range" min="100" max="1500" step="100" value={antiqueMaxPrice} onChange={(e) => setAntiqueMaxPrice(Number(e.target.value))} className="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="text-[10px] text-slate-400">Maks. Aset Tani</label>
                         <span className="text-[10px] font-mono font-black text-lime-400">{assetMaxQty}</span>
                       </div>
                       <input type="range" min="1" max="10" step="1" value={assetMaxQty} onChange={(e) => setAssetMaxQty(Number(e.target.value))} className="w-full accent-lime-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                     </div>
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="text-[10px] text-slate-400">Maks. Efek Kombo</label>
                         <span className="text-[10px] font-mono font-black text-purple-400">{maxComboCount}x</span>
                       </div>
                       <input type="range" min="2" max="5" step="1" value={maxComboCount} onChange={(e) => setMaxComboCount(Number(e.target.value))} className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                     </div>
                   </div>
                 </div>
               )}
            </div>

            <div className="space-y-3">
              {playerConfigs.map((p, idx) => (
                <div key={idx} className={`p-2 rounded-xl flex flex-col gap-2 transition-all ${p.active ? 'bg-slate-900 border border-slate-600' : 'opacity-40 grayscale'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${p.active ? PLAYER_COLORS[idx] : 'bg-gray-600'}`}>
                      {p.isBot ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <input type="text" value={p.name} onChange={(e) => setPlayerConfigs(prev => prev.map((cfg, i) => i === idx ? {...cfg, name: e.target.value} : cfg))} disabled={!p.active} className="font-bold text-sm md:text-base text-white bg-transparent outline-none flex-1 w-full" />
                    <button onClick={() => setPlayerConfigs(prev => prev.map((cfg, i) => i === idx ? {...cfg, active: !cfg.active} : cfg))} className={`w-8 h-8 rounded-lg font-black flex items-center justify-center ${p.active ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                      {p.active ? <X size={16} /> : '+'}
                    </button>
                  </div>
                  {p.active && (
                    <div className="flex bg-slate-800 p-1 rounded-lg">
                      <button onClick={() => setPlayerConfigs(prev => prev.map((cfg, i) => i === idx ? {...cfg, isBot: false} : cfg))} className={`flex-1 py-1 text-[10px] md:text-xs font-bold rounded transition-all ${!p.isBot ? 'bg-slate-600 text-white' : 'text-slate-400'}`}> Manusia </button>
                      <button onClick={() => setPlayerConfigs(prev => prev.map((cfg, i) => i === idx ? {...cfg, isBot: true} : cfg))} className={`flex-1 py-1 text-[10px] md:text-xs font-bold rounded transition-all ${p.isBot ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}> AI Bot </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-none p-4 pb-[max(env(safe-area-inset-bottom),24px)] flex justify-center items-center bg-slate-900 z-20 shadow-[0_-10px_20px_rgba(15,23,42,0.8)]">
          <button onClick={startGame} className="w-full max-w-sm mx-auto py-4 bg-green-600 active:bg-green-700 text-white rounded-2xl font-black text-lg shadow-[0_5px_20px_rgba(22,163,74,0.3)] flex justify-center items-center gap-2 active:scale-95 transition-transform">
            <Play fill="currentColor" size={20} /> MULAI PERMAINAN
          </button>
        </div>

                        {/* MODAL TUTORIAL / INFO PANDUAN GAME */}
        {showTutorial && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowTutorial(false)}>
            <div className="bg-slate-800 w-full max-w-md rounded-3xl p-5 shadow-2xl border border-blue-500/50 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                 <div className="flex items-center gap-2">
                   <BookOpen className="text-blue-400" size={24}/>
                   <h2 className="text-lg font-black text-white uppercase tracking-wider">Panduan Warga +62</h2>
                 </div>
                 <button onClick={() => setShowTutorial(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
               </div>
               
               <div className="overflow-y-auto no-scrollbar space-y-4 text-sm text-slate-300 pb-4">
                  
                  {/* SECTION 1: DASAR BERMAIN */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded-bl-lg text-white">BASIC</div>
                     <p className="font-bold text-white mb-2 flex items-center gap-1"><Building size={14} className="text-blue-400"/> Tujuan & Lahan Dasar</p>
                     <ul className="text-[11px] leading-relaxed space-y-1 list-disc list-inside text-slate-300">
                        <li>Jadilah yang paling kaya! Buat lawan bangkrut dengan uang sewa.</li>
                        <li><b>Gaji Start:</b> Lewat petak START dapat <span className="text-green-400 font-bold">Rp200K</span> (Akan otomatis dipotong jika punya hutang Pinjol).</li>
                        <li><b>Monopoli Lahan:</b> Beli lahan sewarna. Jika kamu kuasai 1 grup warna, <span className="text-red-400 font-bold">Sewa naik 2X LIPAT!</span></li>
                        <li><b>Upgrade:</b> Lahan bisa diupgrade sampai Level 5 (Hotel). Makin tinggi, harga tukang makin mahal, tapi sewa makin mencekik.</li>
                     </ul>
                  </div>

                  {/* SECTION 2: EKONOMI PASIF */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-lime-600 text-[8px] font-black px-2 py-0.5 rounded-bl-lg text-white">ECONOMY</div>
                     <p className="font-bold text-white mb-2 flex items-center gap-1"><Tractor size={14} className="text-lime-400"/> Tani, Tambang & Fast-Travel</p>
                     <ul className="text-[11px] leading-relaxed space-y-1 list-disc list-inside text-slate-300">
                        <li><b>Lahan Tani & Tambang:</b> Menghasilkan aset (Gandum/Telur/Padi/Emas) secara otomatis tiap waktu tertentu. <b>Upgrade (Maks Lv 3)</b> untuk mempercepat waktu panen!</li>
                        <li><b>Pasar Tani:</b> Jual hasil panenmu di menu <b>PASAR</b> (Atas layar). Harga fluktuatif tiap giliran.</li>
                        <li><b>Stasiun Kereta:</b> Punya &gt;1 stasiun? Kamu bisa bayar Rp50K untuk <b>Teleportasi (Fast-Travel)</b> antar stasiunmu!</li>
                     </ul>
                  </div>

                  {/* SECTION 3: BANK & LELANG */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-yellow-600 text-[8px] font-black px-2 py-0.5 rounded-bl-lg text-slate-900">FINANCE</div>
                     <p className="font-bold text-white mb-2 flex items-center gap-1"><Landmark size={14} className="text-yellow-400"/> Bank Pinjol, Gadai & Lelang</p>
                     <ul className="text-[11px] leading-relaxed space-y-1 list-disc list-inside text-slate-300">
                        <li><b>Gadai:</b> Kepepet? Tap lahanmu, pilih Gadai Tanah/Full. Awas, lahan gadai tidak menghasilkan uang sewa!</li>
                        <li><b>Bank Pinjol:</b> Minjam Rp500K langsung cair, tapi hutang tercatat Rp600K. Max hutang Rp1.000K.</li>
                        <li><b>Bursa Emas:</b> Beli emas buat investasi jangka panjang. Harga naik turun!</li>
                        <li><b>Balai Lelang:</b> Mendarat di sini memicu lelang barang antik aneh buatan AI. Harga barang antik yang sukses dibeli akan <b>naik Rp1K tiap 10 detik!</b> Jual ke Bank pas lagi butuh duit.</li>
                     </ul>
                  </div>

                  {/* SECTION 4: MAFIA & AI */}
<div className="bg-slate-900 p-3 rounded-xl border border-slate-700 relative overflow-hidden">
   <div className="absolute top-0 right-0 bg-red-600 text-[8px] font-black px-2 py-0.5 rounded-bl-lg text-white">ADVANCED</div>
   <p className="font-bold text-white mb-2 flex items-center gap-1"><Crosshair size={14} className="text-red-400"/> Sistem Mafia & Master AI</p>
   <ul className="text-[11px] leading-relaxed space-y-1 list-disc list-inside text-slate-300">
      <li>
         <b>Akuisisi Paksa:</b> Incar tanah musuh? Tap tanah mereka dan ajukan Akuisisi! 
         Syaratnya: Harga dihitung berdasarkan <b>Nilai Strategis</b> lahan (Aset + Potensi Sewa/Panen). 
         Makin gacor lahannya, makin mahal tebusannya!
      </li>
      <li><b>Event Master AI:</b> Mendarat di Dana Umum/Kesempatan? AI akan membuat cerita takdirmu (Denda/Hadiah/Teleport/Masuk Penjara). Nasibmu murni di tangan AI!</li>
      <li><b>Kuis AI:</b> Jawab pertanyaan receh. Benar +200K, Salah -100K.</li>
   </ul>
</div>


                  {/* SECTION 5: TIER S - KARTU VIP */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-purple-500/50 relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                     <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-[8px] font-black px-2 py-0.5 rounded-bl-lg text-white animate-pulse">TIER S - SAKTI</div>
                     <p className="font-bold text-white mb-2 flex items-center gap-1"><Ticket size={14} className="text-purple-400"/> Kartu VIP Khusus (Parkir Bebas)</p>
                     <p className="text-[10px] mb-3 text-slate-400">Didapatkan murni dari hoki saat mendarat di petak PARKIR. Kartu tersimpan di <b>Profil Pemain (Tap namamu di bawah)</b>.</p>
                     
                     <div className="space-y-2">
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                           <p className="text-[10px] font-bold text-emerald-400 mb-1">⚡ AKTIF OTOMATIS (Sistem yang pakai):</p>
                           <ul className="text-[9.5px] leading-tight space-y-1 list-disc list-inside text-slate-300">
                              <li><b>Bebas Sewa:</b> Otomatis dipakai saat injak lahan musuh (Sewa jadi Rp0).</li>
                              <li><b>Asuransi Rugi:</b> Otomatis menahan uang hilang dari Denda AI, Pajak, atau Salah Kuis.</li>
                              <li><b>Kebal Pajak:</b> Otomatis menahan denda saat injak petak Pajak Jalan/Mewah.</li>
                           </ul>
                        </div>
                        
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                           <p className="text-[10px] font-bold text-cyan-400 mb-1">👆 AKTIF MANUAL (Tombol / Klik):</p>
                           <ul className="text-[9.5px] leading-tight space-y-1 list-disc list-inside text-slate-300">
                              <li><b>Teleport Bebas:</b> Tap kartu di Profil sebelum kocok dadu. Pindah ke petak mana saja!</li>
                              <li><b>Pemutihan Pinjol:</b> Tap kartu di Profil. Hutang bank lunas Rp0 seketika!</li>
                              <li><b>Bebas Penjara:</b> Muncul tombol khusus saat kamu masuk penjara.</li>
                              <li><b>Kudeta Lahan:</b> Tap lahan musuh &rarr; Muncul tombol "Kudeta Lahan". Ambil lahan mereka GRATIS!</li>
                              <li><b>Sultan Mendadak:</b> Tap propertimu yg mau diupgrade &rarr; Muncul tombol "Upgrade Max". Langsung Mentok Level 5 GRATIS!</li>
                              <li><b>Tebus Gadai:</b> Tap lahanmu yg digadai &rarr; Muncul tombol "Tebus Gratis".</li>
                              <li><b>Auto Win Lelang:</b> Saat giliranmu nawar lelang, tekan tombol VIP buat menang instan GRATIS!</li>
                           </ul>
                        </div>
                     </div>
                  </div>

               </div>
               <button onClick={() => setShowTutorial(false)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold mt-2 active:scale-95 transition-transform shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2">
                  <CheckCircle size={18}/> SAYA SIAP JADI SULTAN!
               </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const DiceIcon1 = DICE_ICONS[dice[0] - 1] || Dice1;
  const DiceIcon2 = DICE_ICONS[dice[1] - 1] || Dice1;
  const currentPlayer = players[turnIndex] || players[0];
  const avgGoldPrice = currentPlayer?.gold > 0 ? Math.round((currentPlayer?.totalGoldSpent || 0) / Math.max(0.1, currentPlayer.gold)) : 0;
  const totalGoldProfit = Math.round(((currentPlayer?.gold || 0) * goldPrice) - (currentPlayer?.totalGoldSpent || 0));

  // ==========================================
  // RENDER: CENTER HUB
  // ==========================================
  const renderCenterHub = () => {
    if (!activeModal || !currentPlayer) return null;
    const botIsThinking = currentPlayer.isBot;
    const smBtn = "w-full py-2 px-4 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform text-white disabled:opacity-50 disabled:grayscale";

    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-2 text-center transition-all ${activeModal==='WAIT_ROLL' || activeModal==='END_TURN' ? 'bg-slate-900/95' : 'bg-slate-900'} rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden`}>
        
        {/* Indikator Status Master AI */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-md text-[8px] md:text-[10px] text-slate-300 border border-slate-700 font-bold z-50 shadow">
           <Bot size={12} className="text-emerald-400"/>
           Master: <span className="text-emerald-400">GROQ</span>
        </div>

        {errorMsg && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white font-black text-xs px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.8)] z-50 animate-bounce whitespace-nowrap">
             {errorMsg}
          </div>
        )}

        {(activeModal !== 'ROLLING' && activeModal !== 'MOVING') && (
          <div className="absolute top-2 right-2 flex items-center bg-slate-800 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm border border-slate-700">
            <span className={`font-mono ${(currentPlayer?.money || 0) < 0 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>Rp{currentPlayer?.money || 0}K</span>
          </div>
        )}

        <div className="w-full h-full flex flex-col items-center justify-center mt-6 md:mt-8 px-2 overflow-y-auto no-scrollbar relative z-10">
          
          {activeModal === 'SELECT_TELEPORT' && (
             <div className="flex flex-col items-center gap-2">
                <MapPin size={32} className="text-purple-400 animate-bounce" />
                <h2 className="text-sm md:text-lg font-black text-purple-300 mb-2">MODE TELEPORT!</h2>
                <p className="text-[10px] md:text-xs text-slate-300 px-2 text-center">Tap petak mana pun di papan untuk pindah instan (Kecuali Sudut).</p>
             </div>
          )}

          {activeModal === 'WAIT_ROLL' && (
            <>
              {currentPlayer.inJail ? (
                <>
                  <Lock size={32} className="text-red-500 mb-2"/>
                  <h2 className="text-sm md:text-lg font-black text-white mb-4">Di Penjara!</h2>
                  {!botIsThinking ? (
                    <div className="flex flex-col gap-2 w-full">
                      {(currentPlayer.buffs || []).includes('FREE_JAIL') && (
                         <button onClick={() => !uiLocked && handleAction('USE_JAIL_CARD')} disabled={uiLocked} className={`${smBtn} bg-purple-600 hover:bg-purple-500 text-xs`}>PAKAI KARTU BEBAS</button>
                      )}
                      <button onClick={() => !uiLocked && handleAction('PAY_JAIL')} disabled={uiLocked} className={`${smBtn} bg-red-600 hover:bg-red-500 text-xs`}>SOGOK Rp50K</button>
                      <button onClick={() => !uiLocked && handleAction('ROLL_JAIL')} disabled={uiLocked} className={`${smBtn} bg-blue-600 hover:bg-blue-500 text-xs`}>COBA DADU KEMBAR ({(currentPlayer.jailTurns || 0) + 1}/3)</button>
                    </div>
                  ) : (<p className="text-slate-400 text-xs font-bold animate-pulse">Bot lagi nelpon pengacara ☎️...</p>)}
                </>
              ) : (
                <>
                  <div className="mb-4 text-slate-500 animate-bounce flex gap-2">
                    <DiceIcon1 size={32} /><DiceIcon2 size={32} />
                  </div>
                  <h2 className="text-sm md:text-lg font-black text-white mb-4">Giliran <span className={currentPlayer.color.replace('bg-', 'text-')}>{currentPlayer.name}</span></h2>
                  {!botIsThinking ? (
                    <button onClick={() => !uiLocked && handleAction('ROLL')} disabled={uiLocked} className={`${smBtn} bg-blue-600 hover:bg-blue-500`}>KOCOK DADU</button>
                  ) : (<p className="text-slate-400 text-xs font-bold animate-pulse">Bot lagi nyari wangsit ☕...</p>)}
                </>
              )}
            </>
          )}

          {activeModal === 'ROLLING' && (
            <div className="flex gap-4 animate-spin text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" style={{ animationDuration: '0.4s' }}>
              <DiceIcon1 size={40} /><DiceIcon2 size={40} />
            </div>
          )}

          {activeModal === 'MOVING' && (
             <div className="flex flex-col items-center gap-2">
               <div className="flex gap-2 text-blue-400 mb-2"><DiceIcon1 size={24} /><DiceIcon2 size={24} /></div>
               <p className="text-slate-300 text-xs font-bold animate-pulse">Jalan bosku...</p>
             </div>
          )}

          {activeModal === 'BUY' && modalData && (
            <>
              {modalData.type === 'agriculture' ? <Tractor size={28} className="text-lime-500 mb-1"/> : 
               modalData.type === 'mine' ? <Gem size={28} className="text-yellow-600 mb-1"/> :
               <Home size={28} className="text-green-500 mb-1"/>}
              <h2 className="text-sm md:text-base font-black text-white leading-tight">{modalData.name}</h2>
              <p className="text-yellow-400 font-mono font-bold text-xs md:text-sm my-3">Harga: Rp {modalData.price}K</p>
              {!botIsThinking ? (
                <div className="flex w-full gap-2">
                  <button onClick={() => !uiLocked && handleAction('BUY_YES')} disabled={uiLocked} className={`${smBtn} bg-green-600 hover:bg-green-500`}>BELI</button>
                  <button onClick={() => !uiLocked && handleAction('BUY_NO')} disabled={uiLocked} className={`${smBtn} bg-slate-700 text-slate-300 hover:bg-slate-600`}>SKIP</button>
                </div>
              ) : (<p className="text-slate-400 text-xs font-bold animate-pulse">Bot cek mutasi rekening 💳...</p>)}
            </>
          )}

          {activeModal === 'UPGRADE' && modalData && (
            <>
              <ArrowUpCircle size={28} className="text-yellow-500 mb-1"/>
              <h2 className="text-sm md:text-base font-black text-white leading-tight">{modalData.name} <span className="text-xs text-yellow-400">(Lv.{modalData.currentLevel} ➡️ {modalData.currentLevel+1})</span></h2>
              
              <div className="bg-slate-800 border border-slate-700 p-2 rounded-lg my-3 w-full">
                 <p className="text-slate-400 text-[10px] mb-1">Harga Tukang (Makin Level Makin Mahal):</p>
                 <p className="text-yellow-400 font-mono font-black text-sm mb-2">Rp {modalData.dynamicCost}K</p>
                 
                 {modalData.type === 'property' ? (
                     <>
                        <p className="text-slate-400 text-[9px]">Sewa Level Berikutnya akan jadi:</p>
                        <p className="text-red-400 font-mono font-bold text-xs">Rp {modalData.nextRent}K</p>
                     </>
                 ) : (
                     <>
                        <p className="text-slate-400 text-[9px]">Waktu panen/tambang akan lebih cepat:</p>
                        <p className="text-lime-400 font-mono font-bold text-xs">{modalData.nextEffect}</p>
                     </>
                 )}
              </div>

              {!botIsThinking ? (
                <div className="flex flex-col w-full gap-2">
                  {(currentPlayer.buffs || []).includes('FREE_MAX_UPGRADE') ? (
                      <button onClick={() => !uiLocked && handleAction('USE_FREE_MAX_UPGRADE')} disabled={uiLocked} className={`${smBtn} bg-purple-600 hover:bg-purple-500 flex justify-center items-center gap-1 shadow-[0_0_15px_rgba(168,85,247,0.5)]`}>
                         <Sparkles size={16}/> UPGRADE MAX GRATIS (VIP)
                      </button>
                  ) : null}
                  <div className="flex w-full gap-2">
                     <button onClick={() => !uiLocked && handleAction('UPGRADE_YES')} disabled={uiLocked} className={`${smBtn} bg-yellow-600 text-slate-900 hover:bg-yellow-500`}>UPGRADE</button>
                     <button onClick={() => !uiLocked && handleAction('UPGRADE_NO')} disabled={uiLocked} className={`${smBtn} bg-slate-700 text-slate-300 hover:bg-slate-600`}>SKIP</button>
                  </div>
                </div>
              ) : (<p className="text-slate-400 text-xs font-bold animate-pulse">Bot manggil mandor 🧱...</p>)}
            </>
          )}

          {activeModal === 'AGRICULTURE_INFO' && modalData && (
             <>
               <Tractor size={32} className="text-lime-400 mb-2"/>
               <h2 className="text-sm md:text-base font-black text-white">LADANG {modalData.ownerName}</h2>
               <p className="text-[10px] md:text-xs text-slate-300 my-2 text-center px-4">
                 Ikut panen bareng, pemilik dapet: <br/><span className="text-lime-400 font-bold uppercase">{modalData.rewardText}</span>
               </p>
               {!botIsThinking ? (
                 <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-slate-700 hover:bg-slate-600`}>SIAAP</button>
               ) : (<p className="text-slate-400 text-xs animate-pulse">Bot bantuin panen 🌾...</p>)}
             </>
          )}

          {activeModal === 'MINE_INFO' && modalData && (
             <>
               <Gem size={32} className="text-yellow-600 mb-2"/>
               <h2 className="text-sm md:text-base font-black text-white">TAMBANG {modalData.ownerName}</h2>
               <p className="text-[10px] md:text-xs text-slate-300 my-2 text-center px-4">
                 Ikut nggali bareng, pemilik dapet: <br/><span className="text-yellow-500 font-bold uppercase">{modalData.rewardText}</span>
               </p>
               {!botIsThinking ? (
                 <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-slate-700 hover:bg-slate-600`}>SIAAP</button>
               ) : (<p className="text-slate-400 text-xs animate-pulse">Bot bantuin gali ⛏️...</p>)}
             </>
          )}

          {activeModal === 'LOTTERY_PLAY' && (
             <>
               <div className="flex gap-2 mb-2">
                  <span className="text-3xl animate-bounce">🎰</span>
                  <span className="text-3xl animate-bounce" style={{animationDelay: '0.1s'}}>🎰</span>
                  <span className="text-3xl animate-bounce" style={{animationDelay: '0.2s'}}>🎰</span>
               </div>
               <h2 className="text-sm md:text-base font-black text-teal-400 mb-2">LOTRE WARGA</h2>
               <p className="text-[10px] text-slate-300 mb-4">Putar gratis, moga-moga jackpot bosku!</p>
               {!botIsThinking ? (
                 <button onClick={() => !uiLocked && handleAction('LOTTERY_SPIN')} disabled={uiLocked} className={`${smBtn} bg-teal-600 hover:bg-teal-500`}>PUTAR (GRATIS)</button>
               ) : (<p className="text-slate-400 text-xs animate-pulse">Bot ngarep jackpot 🎰...</p>)}
             </>
          )}

          {activeModal === 'LOTTERY_RESULT' && modalData && (
             <>
                {modalData.result > 0 ? (
                   <>
                     <span className="text-4xl mb-2">🎉</span>
                     <h2 className="text-sm md:text-lg font-black text-green-400 mb-2">GACOR!</h2>
                     <p className="text-white text-xs mb-4">Dapat cuan Uang +Rp{modalData.result}K</p>
                   </>
                ) : (
                   <>
                     <Frown size={40} className="text-red-500 mb-2" />
                     <h2 className="text-sm md:text-lg font-black text-red-500 mb-2">ZONK!</h2>
                     <p className="text-white text-xs mb-4">Gak dapet apa-apa bro...</p>
                   </>
                )}
                {!botIsThinking ? (
                   <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-slate-700`}>LANJUTKAN</button>
                ) : (<p className="text-slate-400 text-xs animate-pulse">Bot bersyukur 🙏...</p>)}
             </>
          )}

          {activeModal === 'AUCTION_LOADING' && (
             <div className="flex flex-col items-center gap-2">
                <Gavel size={32} className="text-rose-400 animate-pulse" />
                <p className="text-xs font-bold text-white">Bot dandan rapi ke Lelang 👔...</p>
             </div>
          )}

          {activeModal === 'AUCTION_BIDDING' && modalData && (
             <>
               <Gavel size={36} className="text-rose-500 mb-1" />
               <h2 className="text-sm md:text-base font-black text-white mb-1">LELANG ANTIK</h2>
               <p className="text-[10px] text-slate-300 mb-2">Barang: <span className="font-bold text-rose-300">{modalData.item.name}</span></p>
               
               {!modalData.resolved ? (
                 <>
                   <div className="bg-rose-900/30 border border-rose-500/50 p-2 rounded-lg mb-3 w-full">
                      <p className="text-[10px] text-slate-400">Harga Buka / Bid Tertinggi</p>
                      <p className="text-lg font-black font-mono text-green-400">Rp {modalData.highestBidderId === null ? modalData.item.startBid : modalData.currentBid}K</p>
                      <p className="text-[9px] text-slate-300 mt-1">Oleh: {modalData.highestBidderId !== null ? (players.find(p=>p.id===modalData.highestBidderId)?.name || 'Anonim') : 'Belum Ada'}</p>
                   </div>
                   
                   {(() => {
                       const currentAuctionPlayerId = modalData.activeBidders[modalData.turnIdx];
                       const currentAuctionPlayer = players.find(p => p.id === currentAuctionPlayerId);
                       const nextB = modalData.highestBidderId === null ? modalData.item.startBid : modalData.currentBid + 10;

                       if (!currentAuctionPlayer) return null;

                       if (currentAuctionPlayer.isBot) {
                           return (
                               <div className="flex flex-col items-center gap-2 w-full">
                                  <p className="text-[10px] font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Giliran <span className="text-white">{currentAuctionPlayer.name}</span></p>
                                  <div className="flex items-center gap-2 text-rose-400 text-[10px] animate-pulse my-2">
                                     <Loader2 size={14} className="animate-spin" /> Bot ngitung duit receh 🪙...
                                  </div>
                               </div>
                           );
                       } else {
                           return (
                               <div className="flex flex-col w-full gap-2">
                                  <p className="text-[10px] text-slate-300 mb-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 mx-auto w-max">Giliran <span className="font-bold text-white">{currentAuctionPlayer.name}</span>:</p>
                                  
                                  {(currentAuctionPlayer.buffs || []).includes('VIP_AUCTION') && (
                                     <button onClick={() => !uiLocked && handleAction('AUCTION_TURN_VIP_WIN', currentAuctionPlayer.id)} disabled={uiLocked} className={`${smBtn} bg-purple-600 hover:bg-purple-500 flex justify-center items-center gap-1 mb-1 transition-transform active:scale-95`}>
                                        <Sparkles size={14}/> GAS VIP AUTO WIN (GRATIS)
                                     </button>
                                  )}

                                  <button onClick={() => !uiLocked && handleAction('AUCTION_TURN_BID', currentAuctionPlayer.id)} disabled={uiLocked || currentAuctionPlayer.money < nextB} className={`${smBtn} bg-rose-600 hover:bg-rose-500 flex justify-between items-center px-4 disabled:opacity-50 disabled:grayscale transition-transform active:scale-95`}>
                                     <span className="text-xs font-bold">HAJAR BID</span>
                                     <span className="text-xs font-mono font-black">Rp{nextB}K</span>
                                  </button>
                                  <button onClick={() => !uiLocked && handleAction('AUCTION_TURN_FOLD', currentAuctionPlayer.id)} disabled={uiLocked} className={`${smBtn} bg-slate-700 hover:bg-slate-600 text-slate-300 mt-1 text-xs`}>MUNDUR (PASS)</button>
                               </div>
                           );
                       }
                   })()}
                 </>
               ) : (
                 <>
                    {modalData.winner ? (
                       <>
                         <span className="text-4xl mb-2">🔨</span>
                         <h2 className="text-sm md:text-lg font-black text-green-400 mb-1">SAH!</h2>
                         <p className="text-[10px] text-slate-300 mb-2">{modalData.item.name} sikat sama {modalData.winner.name} senilai Rp{modalData.currentBid}K.</p>
                         <div className="bg-slate-800 p-2 rounded border border-slate-700 mb-3 w-full">
                             <p className="text-[9px] text-slate-400 mb-1">Nilai Asli Barang (Rahasia):</p>
                             <p className={`font-mono font-black ${modalData.item.val >= modalData.currentBid ? 'text-green-400' : 'text-red-400'}`}>Rp{modalData.item.val}K</p>
                         </div>
                       </>
                    ) : (
                       <>
                         <X size={40} className="text-slate-500 mb-2" />
                         <h2 className="text-sm md:text-lg font-black text-slate-400 mb-1">BATAL!</h2>
                         <p className="text-[10px] text-slate-300 mb-4">Gak ada yang doyan sama barang ini.</p>
                       </>
                    )}
                    {!currentPlayer.isBot ? (
                       <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-slate-700 hover:bg-slate-600`}>LANJUTKAN</button>
                    ) : (<p className="text-slate-400 text-xs animate-pulse">Bot beres-beres 🧹...</p>)}
                 </>
               )}
             </>
          )}

          {activeModal === 'STATION_TELEPORT' && modalData && (
            <>
              <Train size={28} className="text-slate-400 mb-1"/>
              <h2 className="text-sm md:text-base font-black text-white leading-tight">FAST TRAVEL</h2>
              <p className="text-slate-400 text-[10px] md:text-xs mb-3">Otw ke stasiunmu yg lain?</p>
              {!botIsThinking ? (
                <div className="flex flex-col w-full gap-2 overflow-y-auto max-h-32 no-scrollbar">
                  {modalData.availableStations.map(st => (
                     <button key={st.id} onClick={() => !uiLocked && handleAction('TELEPORT_STATION', st.id)} disabled={uiLocked} className={`${smBtn} bg-blue-600 hover:bg-blue-500 text-[10px] md:text-xs`}>
                       KE {st.name.toUpperCase()} (Rp50K)
                     </button>
                  ))}
                  <button onClick={() => !uiLocked && handleAction('TELEPORT_CANCEL')} disabled={uiLocked} className={`${smBtn} bg-slate-700 text-slate-300 hover:bg-slate-600 text-[10px] md:text-xs mt-1`}>GAK JADI</button>
                </div>
              ) : (<p className="text-slate-400 text-xs font-bold animate-pulse">Bot cek jadwal KRL 🚆...</p>)}
            </>
          )}

          {activeModal === 'RENT' && modalData && (
            <>
              <Frown size={28} className="text-red-500 mb-1"/>
              <h2 className="text-sm md:text-base font-black text-white">BAYAR SEWA</h2>
              <p className="text-[10px] text-slate-400">Punya si {modalData.ownerName}</p>
              <p className="text-red-500 font-mono font-bold text-sm md:text-lg my-2">-Rp {modalData.rent}K</p>
              {modalData.isMonopoly ? <p className="text-[8px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full mb-3 animate-pulse border border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.5)]">⚠️ 2x LIPAT (MONOPOLI KOMPLEKS) ⚠️</p> : null}
              
              { !botIsThinking && (currentPlayer.money - modalData.rent < 0) && (
                 <div className="bg-red-900/40 border border-red-500 rounded p-2 mb-3 text-left w-full shadow-inner animate-pulse">
                    <p className="text-[10px] text-red-300 font-bold flex items-center gap-1"><AlertTriangle size={12}/> PERINGATAN KRITIS!</p>
                    <p className="text-[9px] text-red-200 mt-1 leading-tight">Uangmu bakal minus (Rp{currentPlayer.money - modalData.rent}K). Jual Aset Tani, Emas, atau Gadai Lahanmu di menu atas sekarang sebelum pencet Bayar biar gak Bangkrut!</p>
                 </div>
              )}

              {!botIsThinking ? (
                <div className="flex flex-col w-full gap-2">
                   <button onClick={() => !uiLocked && handleAction('PAY_RENT')} disabled={uiLocked} className={`${smBtn} bg-red-600 hover:bg-red-500`}>BAYAR</button>
                </div>
              ) : (<p className="text-slate-400 text-xs animate-pulse">Bot nangis ngorek celengan 😭...</p>)}
            </>
          )}

          {activeModal === 'TAX' && modalData && (
            <>
              <AlertTriangle size={28} className="text-orange-500 mb-1"/>
              <h2 className="text-sm md:text-base font-black text-white leading-tight">{modalData.name}</h2>
              <p className="text-orange-500 font-mono font-bold text-sm md:text-lg my-3">-Rp {modalData.price}K</p>
              
              { !botIsThinking && (currentPlayer.money - modalData.price < 0) && (
                 <div className="bg-red-900/40 border border-red-500 rounded p-2 mb-3 text-left w-full shadow-inner animate-pulse">
                    <p className="text-[10px] text-red-300 font-bold flex items-center gap-1"><AlertTriangle size={12}/> PERINGATAN KRITIS!</p>
                    <p className="text-[9px] text-red-200 mt-1 leading-tight">Uangmu bakal minus (Rp{currentPlayer.money - modalData.price}K). Cari pinjeman di Bank, Jual Aset Tani, Emas, atau Gadai Lahanmu sekarang!</p>
                 </div>
              )}

              {!botIsThinking ? (
                <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-orange-600 hover:bg-orange-500`}>BAYAR</button>
              ) : (<p className="text-slate-400 text-xs animate-pulse">Bot nangis ngorek celengan 😭...</p>)}
            </>
          )}

          {activeModal === 'JAIL' && (
            <>
              <AlertTriangle size={32} className="text-red-600 mb-2"/>
              <h2 className="text-sm md:text-base font-black text-white">MASUK PENJARA!</h2>
              <div className="my-2"/>
              {!botIsThinking ? (
                <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-slate-700 hover:bg-slate-600`}>PASRAH</button>
              ) : (<p className="text-slate-400 text-xs animate-pulse">Bot nelpon pengacara ☎️...</p>)}
            </>
          )}

          {activeModal === 'BANKRUPT' && (
            <>
              <Skull size={32} className="text-red-600 mb-2 animate-bounce"/>
              <h2 className="text-sm md:text-base font-black text-red-500">BANGKRUT!</h2>
              <p className="text-[9px] text-slate-400 my-2">Uangmu habis. Lahan disita rentenir.</p>
              {!botIsThinking ? (
                <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-red-800 border border-red-500 text-white hover:bg-red-700`}>KELUAR GAME</button>
              ) : (<p className="text-slate-400 text-xs animate-pulse">Bot gembel out 💀...</p>)}
            </>
          )}

          {activeModal === 'EVENT_LOADING' && (
             <div className="flex flex-col items-center gap-2">
                <Sparkles size={32} className="text-blue-400 animate-pulse" />
                <p className="text-xs font-bold text-white">Bot ngundi nasib 🔮...</p>
             </div>
          )}

          {activeModal === 'EVENT_RESULT' && modalData?.eventData && (() => {
              const hasInsurance = (currentPlayer.buffs || []).includes('LOSS_EXEMPTION');
              const totalEventLoss = modalData.eventData.effects?.reduce((sum, ev) => ev.type === 'money' && ev.value < 0 ? sum + Math.abs(ev.value) : sum, 0) || 0;
              const willBankrupt = !hasInsurance && totalEventLoss > 0 && (currentPlayer.money - totalEventLoss < 0);

              return (
                <>
                  {modalData.eventData.effects && modalData.eventData.effects.some(e => e.type==='teleport' || e.type==='move' || e.type==='jail') ? <MapPin size={24} className="text-blue-400 mb-1"/> : <Sparkles size={24} className="text-blue-400 mb-1"/>}
                  <h2 className="text-xs md:text-sm font-black text-white leading-tight mb-2">TAKDIR WARGA</h2>
                  <p className="text-slate-200 text-[10px] md:text-xs font-medium mb-3 leading-snug">"{modalData.eventData.message}"</p>
                  
                  <div className="flex gap-2 justify-center mb-1">
                     {modalData.eventData.effects && modalData.eventData.effects.map((e, i) => (
                        <button 
                           key={i} 
                           onClick={() => setSelectedEffectIdx(i === selectedEffectIdx ? null : i)}
                           className={`text-[14px] md:text-base bg-slate-800 border ${i === selectedEffectIdx ? 'border-blue-400 ring-2 ring-blue-500/50 scale-110' : 'border-slate-700'} rounded-lg px-2 py-1 hover:bg-slate-700 transition-all shadow-md`}
                           title="Klik untuk detail"
                        >
                           {e.type === 'vip' ? '🌟' : e.type === 'money' && e.value > 0 ? '💰' : e.type === 'money' ? '📉' : e.type === 'move' ? '👣' : e.type === 'teleport' ? '🪄' : e.type === 'jail' ? '🚨' : e.type === 'antique' ? '🏺' : e.type === 'asset' ? '🌾' : e.type === 'gold' ? '🪙' : '✨'}
                        </button>
                     ))}
                  </div>
                  
                  <p className="text-[9px] text-slate-400 mb-3 animate-pulse italic">*Tap ikon di atas buat liat detail kombo.</p>

                  {selectedEffectIdx !== null && modalData.eventData.effects[selectedEffectIdx] && (
                     <div className="bg-blue-900/40 border border-blue-500/50 p-2 rounded-xl mb-4 text-left w-full shadow-inner animate-in fade-in duration-200">
                        <p className="text-[10px] text-blue-300 font-bold mb-1 flex items-center gap-1"><Info size={10}/> Detail Keputusan:</p>
                        <p className="text-[11px] md:text-xs text-white font-medium">
                           {(() => {
                               const e = modalData.eventData.effects[selectedEffectIdx];
                               if (e.type === 'vip') return 'Dapet 1 Kartu VIP Gaib Misterius!';
                               if (e.type === 'money') return e.value > 0 ? `Dapet transferan Rp${e.value}K` : `Dipalak sebesar Rp${Math.abs(e.value)}K`;
                               if (e.type === 'move') return e.value > 0 ? `Jalan maju ${e.value} langkah` : `Mundur sejauh ${Math.abs(e.value)} langkah`;
                               if (e.type === 'teleport') return `Dipaksa pindah/teleport ke petak ${BOARD_TILES[e.targetId]?.name || 'Tidak Diketahui'}`;
                               if (e.type === 'jail') return 'Langsung diseret ke Penjara tanpa ampun!';
                               if (e.type === 'antique') return `Nemu barang antik "${e.item?.name}" (Bisa dijual: Rp${e.item?.val}K)`;
                               if (e.type === 'asset') return `Dapet tambahan stok ${e.value || 1} buah ${e.assetType}`;
                               if (e.type === 'gold') return e.value > 0 ? `Dapet untung batangan ${e.value}g Emas` : `Rugi ilang ${Math.abs(e.value)}g Emas`;
                               return 'Efek misterius...';
                           })()}
                        </p>
                     </div>
                  )}

                  {!botIsThinking && willBankrupt && (
                     <div className="bg-red-900/40 border border-red-500 rounded p-2 mb-3 text-left w-full shadow-inner animate-pulse">
                        <p className="text-[10px] text-red-300 font-bold flex items-center gap-1"><AlertTriangle size={12}/> PERINGATAN KRITIS!</p>
                        <p className="text-[9px] text-red-200 mt-1 leading-tight">Denda event ini bikin uangmu minus (Rp{currentPlayer.money - totalEventLoss}K). Gadai lahan atau jual emas sekarang di menu atas sebelum mencet OK!</p>
                     </div>
                  )}

                  {!botIsThinking ? (
                    <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-blue-600 hover:bg-blue-500`}>SIAAP BOS</button>
                  ) : (<p className="text-slate-400 text-xs animate-pulse">Bot memproses 🔮...</p>)}
                </>
              );
          })()}

          {activeModal === 'PARKING_CARD' && modalData?.card && (
             <>
               <Ticket size={32} className="text-yellow-400 mb-2" />
               <h2 className="text-xs md:text-sm font-black text-white leading-tight mb-1">KARTU VIP!</h2>
               <p className="text-yellow-400 font-bold text-xs md:text-sm mb-2">{modalData.card.name}</p>
               <p className="text-slate-300 text-[10px] mb-4 leading-tight">"{modalData.card.desc}"</p>
               {!botIsThinking ? (
                 <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-yellow-600 text-slate-900`}>AMBIL</button>
               ) : (<p className="text-slate-400 text-xs animate-pulse">Bot nyimpen kartu 💳...</p>)}
             </>
          )}

          {activeModal === 'QUIZ_LOADING' && (
             <div className="flex flex-col items-center gap-2">
                <HelpCircle size={32} className="text-purple-500 animate-pulse" />
                <p className="text-xs font-bold text-white">Siapin Kuis Receh...</p>
             </div>
          )}

          {activeModal === 'QUIZ_PLAY' && modalData && modalData.options && (
            <div className="w-full flex flex-col items-center">
              <h2 className="text-[10px] md:text-xs font-black text-purple-400 mb-2">KUIS WARGA +62</h2>
              <p className="text-white text-[10px] md:text-xs font-medium mb-3 leading-tight">{modalData.question}</p>
              <div className="w-full flex flex-col gap-1.5">
                 {modalData.options.map((opt, i) => (
                    <button key={i} onClick={() => !botIsThinking && !uiLocked && handleAction('QUIZ_ANSWER', i)} disabled={botIsThinking || uiLocked} className="w-full text-left px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-900 border border-slate-700 text-slate-200 text-[9px] md:text-[11px] font-medium leading-tight transition-colors">
                      {opt}
                    </button>
                 ))}
              </div>
              {botIsThinking && <p className="text-purple-400 mt-2 text-[10px] animate-pulse">Bot mikir keras 🤔...</p>}
            </div>
          )}

          {activeModal === 'QUIZ_RESULT' && modalData && (
             <div className="w-full flex flex-col items-center">
                {modalData.isCorrect ? (
                   <>
                     <CheckCircle size={40} className="text-green-500 mb-2" />
                     <h2 className="text-sm md:text-lg font-black text-green-400 mb-2">PINTER JUGA!</h2>
                     <p className="text-white text-xs mb-4">Dapet receh: +Rp200K</p>
                   </>
                ) : (
                   <>
                     <X size={40} className="text-red-500 mb-2" />
                     <h2 className="text-sm md:text-lg font-black text-red-500 mb-2">SALAH WOY!</h2>
                     <p className="text-white text-xs mb-3">Denda Kuis: -Rp100K</p>

                     {!botIsThinking && !((currentPlayer.buffs || []).includes('LOSS_EXEMPTION')) && (currentPlayer.money - 100 < 0) && (
                        <div className="bg-red-900/40 border border-red-500 rounded p-2 mb-3 text-left w-full shadow-inner animate-pulse">
                           <p className="text-[10px] text-red-300 font-bold flex items-center gap-1"><AlertTriangle size={12}/> PERINGATAN KRITIS!</p>
                           <p className="text-[9px] text-red-200 mt-1 leading-tight">Denda ini bikin uangmu minus (Rp{currentPlayer.money - 100}K). Segera jual aset atau gadai lahan di menu atas biar selamat!</p>
                        </div>
                     )}
                   </>
                )}
                {!botIsThinking ? (
                   <button onClick={() => !uiLocked && handleAction('ACKNOWLEDGE')} disabled={uiLocked} className={`${smBtn} bg-slate-700`}>LANJUTKAN</button>
                ) : (<p className="text-slate-400 text-xs animate-pulse">Bot bersyukur 🙏...</p>)}
             </div>
          )}

          {activeModal === 'END_TURN' && (
            <>
              <h2 className="text-sm md:text-base font-black text-white mb-4">Giliran Kelar</h2>
              {!botIsThinking ? (
                <button onClick={() => !uiLocked && handleAction('END_TURN')} disabled={uiLocked} className={`${smBtn} bg-slate-700 hover:bg-slate-600`}>OPER DADU</button>
              ) : (<p className="text-slate-400 text-xs animate-pulse">Bot udud dulu 🚬...</p>)}
            </>
          )}
        </div>
      </div>
    );
  };

  // --- RENDER GAME ---
  return (
    <div className="bg-[#020617] flex flex-col font-sans select-none h-[100dvh] overflow-hidden w-full">
      
      {/* TOP BAR */}
      <div className="flex-none bg-slate-900/95 backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-40 border-b border-slate-800 flex justify-between items-center px-2 md:px-3 py-2 pt-[max(env(safe-area-inset-top),8px)]">
         <div className="flex gap-1 md:gap-2">
           <button onClick={() => setShowBankLoan(true)} className="px-2 md:px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-full active:bg-blue-600/40 border border-blue-600/50 flex items-center gap-1 transition-colors">
              <Landmark size={14} /><span className="text-[9px] md:text-[10px] font-bold hidden sm:inline">BANK</span>
           </button>
           <button onClick={() => setShowGoldMarket(true)} className="px-2 md:px-3 py-1.5 bg-yellow-600/20 text-yellow-500 rounded-full active:bg-yellow-600/40 border border-yellow-600/50 flex items-center gap-1 transition-colors">
              <Coins size={14} /><span className="text-[9px] md:text-[10px] font-bold hidden sm:inline">EMAS</span>
           </button>
           <button onClick={() => setShowPasarMenu(true)} className="px-2 md:px-3 py-1.5 bg-lime-600/20 text-lime-500 rounded-full active:bg-lime-600/40 border border-lime-600/50 flex items-center gap-1 transition-colors">
              <Store size={14} /><span className="text-[9px] md:text-[10px] font-bold hidden sm:inline">PASAR</span>
           </button>
         </div>
         <div className="flex gap-1 md:gap-2">
           <button onClick={toggleFullScreen} className="p-1.5 bg-slate-800 rounded-full text-slate-300 active:bg-slate-700 transition-colors hidden sm:block">
              <Maximize size={16} />
           </button>
           <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 bg-slate-800 rounded-full text-slate-300 active:bg-slate-700 transition-colors">
             {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
           </button>
           <button onClick={() => setShowLogsMenu(true)} className="p-1.5 bg-slate-800 rounded-full text-slate-300 active:bg-slate-700 transition-colors"><History size={16} /></button>
         </div>
      </div>

      {/* CENTER: Papan + Menu Bawah */}
<div className="flex-1 w-full flex flex-col items-center justify-start md:justify-center overflow-y-auto no-scrollbar py-2 md:py-4 gap-3 md:gap-4 relative">
         
         {/* BERITA BERJALAN ALA BURSA EFEK (DIPINDAH KE ATAS PAPAN) */}
         <div className="w-full max-w-[800px] shrink-0 bg-slate-900 border border-slate-800 rounded-xl flex items-center px-2 py-1.5 overflow-hidden shadow-inner">
            <div className="bg-red-600 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded mr-2 shrink-0 z-10 shadow-md">INFO +62</div>
            <div className="flex-1 overflow-hidden whitespace-nowrap mask-edges">
               <div className="animate-ticker inline-block text-[9px] md:text-[10px] font-mono font-bold text-slate-300">
                  <span className="text-yellow-400 mx-4">🪙 EMAS: Rp{goldPrice}K</span>
                  <span className="text-lime-400 mx-4">🌾 GANDUM: Rp{marketPrices.gandum}K</span>
                  <span className="text-orange-300 mx-4">🥚 TELUR: Rp{marketPrices.telur}K</span>
                  <span className="text-yellow-500 mx-4">🌾 PADI: Rp{marketPrices.padi}K</span>
                  <span className="text-yellow-400 mx-4">🪙 EMAS: Rp{goldPrice}K</span>
                  <span className="text-lime-400 mx-4">🌾 GANDUM: Rp{marketPrices.gandum}K</span>
               </div>
            </div>
         </div>

         {/* THE BOARD (RASIO 4:5 PORTRAIT) */}
<div className="w-full max-w-[800px] aspect-square flex flex-col mx-auto relative shrink-0">
           <div className="w-full h-full bg-[#cde6d0] border-[2px] md:border-[3px] border-slate-800 rounded-lg relative shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-[1px] md:p-[2px]">
             
             {/* GRID 15x15 (Sudut Potret Biar Petak Atas-Bawah Lebar & Gak Ciut) */}
{/* GRID 15x15 (Petak Luas Sama Rata) */}
<div className="w-full h-full grid gap-0" style={{ gridTemplateColumns: '1.5fr repeat(13, 1fr) 1.5fr', gridTemplateRows: '1.5fr repeat(13, 1fr) 1.5fr' }}>
             
             {/* Center Hub (Dibuat Absolute Biar Nggak Mendorong Ukuran Petak Papan) */}
<div className="z-30 relative" style={{ gridColumn: '2 / 15', gridRow: '2 / 15' }}>
   <div className="absolute inset-1 md:inset-2">
      {renderCenterHub()}
   </div>
</div>

             {/* Tiles */}
             {BOARD_TILES.map((tile) => {
               const baseStyle = getGridStyle(tile.id);
               const layout = getTileLayout(tile.id);
               const cornerStyle = getTileRotationStyle(tile.id);
               const cornerBg = getCornerBgColor(tile.id); 
               const propData = properties[tile.id];
               const owner = propData ? players.find(p => p.id === propData.ownerId) : null;
               const isCurrentTurnOnTile = players[turnIndex] && players[turnIndex].position === tile.id && !players[turnIndex].isBankrupt;
               const isCorner = cornerBg !== undefined;

               return (
                 <div 
                   key={tile.id} 
                   style={{...baseStyle, backgroundColor: cornerBg}} 
                   onClick={() => {
                       if (activeModal === 'SELECT_TELEPORT') {
                           if (tile.id !== 14 && tile.id !== 28 && tile.id !== 42 && tile.id !== 0) { handleAction('EXECUTE_CUSTOM_TELEPORT', tile.id); } 
                           else { setErrorMsg("Pilih petak selain Sudut!"); playSound('fail'); }
                       } else {
                           setViewingProperty(tile);
                       }
                   }} 
                   className={`${!isCorner ? 'bg-slate-50' : ''} relative overflow-hidden shadow-inner cursor-pointer hover:opacity-80 transition-colors ${isCurrentTurnOnTile ? 'ring-2 ring-blue-500 z-10' : 'ring-[0.5px] ring-slate-800/20'} ${activeModal === 'SELECT_TELEPORT' && tile.id !== 14 && tile.id !== 28 && tile.id !== 42 && tile.id !== 0 ? 'animate-pulse ring-2 ring-purple-500' : ''}`}
                 >
                   
                   {/* STRUKTUR KARTU NON-CORNER */}
                   {!isCorner ? (
                      <div className={`absolute inset-0 flex ${layout.dir}`}>
                         {/* Color Bar */}
                         {tile.group ? (
                             <div className={`${layout.colorBar} ${tile.color} shrink-0`} />
                         ) : (
                             <div className={`${layout.colorBar} shrink-0`} />
                         )}

                         {/* Teks & Ikon */}
                         <div className="flex-1 flex items-center justify-center relative overflow-hidden p-[1px]">
                             <div className={`flex flex-col items-center justify-center w-max ${layout.contentRot}`}>
                                {tile.type === 'station' ? <Train size={8} className="text-slate-700 opacity-80 md:w-6 md:h-6" /> : null}
                                {tile.type === 'utility' ? <Zap size={8} className="text-slate-700 opacity-80 md:w-6 md:h-6" /> : null}
                                {tile.type === 'chest' ? <Sparkles size={8} className="text-blue-600 opacity-90 md:w-6 md:h-6" /> : null}
                                {tile.type === 'chance' ? <MapPin size={8} className="text-pink-600 opacity-90 md:w-6 md:h-6" /> : null}
                                {tile.type === 'quiz' ? <HelpCircle size={8} className="text-purple-700 opacity-90 md:w-6 md:h-6" /> : null}
                                {tile.type === 'agriculture' ? <Tractor size={8} className="text-lime-700 opacity-80 md:w-6 md:h-6" /> : null}
                                {tile.type === 'mine' ? <Gem size={8} className="text-yellow-700 opacity-80 md:w-6 md:h-6" /> : null}
                                {tile.type === 'lottery' ? <Coins size={8} className="text-teal-700 opacity-80 md:w-6 md:h-6" /> : null}
                                {tile.type === 'auction' ? <Gavel size={8} className="text-rose-700 opacity-80 md:w-6 md:h-6" /> : null}

                                {/* Teks untuk Properti & Pajak */}
                                {tile.type === 'property' ? <span className={`text-[3px] sm:text-[4px] md:text-[6px] font-black text-center ${propData?.isMortgaged?'text-slate-400':'text-slate-900'} leading-[1.1] mt-[1px] block w-[90%] break-words`}>{tile.name.substring(0,4).toUpperCase()}</span> : null}
                                {tile.type === 'tax' ? <span className="text-[3.5px] sm:text-[4px] md:text-[6px] font-black text-orange-700 leading-none mt-[1px]">TAX</span> : null}
                                
{/* Teks Miring untuk Petak Non-Properti/Non-Sudut (DISEMBUNYIKAN) */}
{tile.type !== 'property' && tile.type !== 'tax' ? (
   <span className="hidden text-[4.5px] sm:text-[5px] md:text-[7.5px] font-black text-slate-900 leading-tight transform -rotate-45 text-center w-[150%] absolute opacity-85 tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] pointer-events-none z-0">
      {tile.name.toUpperCase()}
   </span>
) : null}
                             </div>
                         </div>

                         {/* Status Kepemilikan & Rumah */}
                         {owner && !owner.isBankrupt && (!propData.isMortgaged || propData.isMortgaged === 'land') ? (
                             <div className={`${layout.borderClass} ${owner.color} z-10 flex items-center justify-center gap-[1px] shrink-0 ${layout.houseDir}`}>
                                {tile.type === 'property' && (propData.level || 0) > 0 && (propData.level || 0) < 5 ? Array(propData.level).fill(0).map((_, i) => (
                                   <span key={i} className={`text-[3px] md:text-[5px] leading-none ${layout.contentRot}`}>🏠</span>
                                )) : null}
                                {tile.type === 'property' && propData.level === 5 ? <span className={`text-[3px] md:text-[5px] leading-none ${layout.contentRot}`}>🏨</span> : null}
                                {(tile.type === 'agriculture' || tile.type === 'mine') && (propData.level || 0) > 0 ? Array(propData.level).fill(0).map((_, i) => (
                                   <span key={i} className={`text-[3px] md:text-[5px] leading-none ${layout.contentRot}`}>⭐</span>
                                )) : null}
                             </div>
                         ) : (
                             <div className={`${layout.borderClass.replace(/border.*/, '')} shrink-0`} />
                         )}
                         
                         {/* Mortgaged Bar Transparan */}
                         {owner && !owner.isBankrupt && propData.isMortgaged ? (
                             <div className={`${layout.borderClass.replace(/border.*/, '')} opacity-40 ${owner.color} shrink-0`} />
                         ) : null}
                      </div>
                   ) : (
// SUDUT PAPAN POTRET PRESISI
<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
   <div style={cornerStyle} className="w-[140%] h-[140%] flex flex-col items-center justify-center p-[2px]">
                             {tile.type === 'go' ? <span className="text-[6px] md:text-[10px] font-black text-white leading-none tracking-widest drop-shadow-md">START</span> : null}
                             {tile.type === 'jail' ? <span className="text-[5px] md:text-[8px] font-black text-white leading-none text-center drop-shadow-md">PENJARA</span> : null}
                             {tile.type === 'parking' ? <span className="text-[5px] md:text-[8px] font-black text-white leading-none drop-shadow-md">PARKIR</span> : null}
                             {tile.type === 'go_to_jail' ? <span className="text-[4px] md:text-[7px] font-black text-white leading-none text-center drop-shadow-md">TANGKAP</span> : null}
                         </div>
                      </div>
                   )}

                   {/* Lock Icon */}
                   {propData?.isMortgaged ? (
                      <div className="absolute inset-0 bg-black/60 z-[15] flex items-center justify-center">
                          <Lock size={10} className="text-white/80 md:w-[12px] md:h-[12px]"/>
                      </div>
                   ) : null}

                   {/* Player Tokens */}
                   <div className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-center gap-[1px] z-20 p-0.5">
                     {players.filter(p => p.position === tile.id && !p.isBankrupt).map(p => (
                       <div key={p.id} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5 rounded-full ${p.color} border-[1px] md:border-2 border-white shadow-[0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-300 relative`}>
                          <span className="text-[5px] sm:text-[6px] md:text-[8px] font-black text-white drop-shadow-md">{p.isBot?'B':(p.id+1)}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               );
             })}
             </div>
           </div>
         </div>

         {/* BOTTOM MENU CARDS - Nempel & Dempet dengan Papan */}
         <div className="w-full max-w-[800px] shrink-0 bg-slate-900/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.5)] border border-slate-800 rounded-2xl p-2 overflow-x-auto no-scrollbar flex gap-2">
             {players.map((p, idx) => {
                if (p.isBankrupt) return null; 
                const isDanger = (p.money || 0) <= 200 && (p.money || 0) >= 0;
                return (
                  <div 
                    key={p.id} onClick={() => setViewingPlayer(p)}
                    className={`flex items-center gap-2 p-2 px-3 rounded-xl border transition-all shrink-0 cursor-pointer min-w-[120px] shadow-sm
                      ${idx === turnIndex ? p.borderColor + ' bg-slate-800 scale-100 shadow-inner' : 'border-slate-700 bg-slate-800/40 opacity-70 hover:opacity-100'}
                      ${isDanger && idx !== turnIndex ? 'bg-red-900/30 border-red-800' : ''}`}
                  >
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${p.color} shadow-sm`} />
                    <div className="flex flex-col flex-1">
                       <span className="font-bold text-[10px] text-slate-200 leading-tight flex items-center gap-1 justify-between w-full">
                          {p.name.substring(0,8)} {(p.buffs || []).length > 0 ? <Ticket size={8} className="text-yellow-400"/> : ''}
                       </span>
                       <span className={`font-mono font-black text-xs leading-tight ${isDanger ? 'text-red-400' : 'text-green-400'}`}>Rp{p.money || 0}K</span>
                    </div>
                  </div>
                );
             })}
         </div>

      </div>

      {/* OVERLAY MODALS */}

      {/* 0. Pinjaman Bank & Jual Antik */}
      {showBankLoan && currentPlayer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => {setShowBankLoan(false); playSound('click'); setRepayAmount(100);}}>
          <div className="bg-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-blue-600/50 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2">
                 <Landmark className="text-blue-400" size={24}/>
                 <h2 className="text-xl font-black text-white">Bank Sentral</h2>
               </div>
               <button onClick={() => {setShowBankLoan(false); playSound('click'); setRepayAmount(100);}} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-center mb-6">
               <p className="text-slate-400 text-xs font-bold mb-1">TOTAL HUTANGMU</p>
               <span className="font-mono font-black text-3xl text-red-500">Rp{currentPlayer?.debt || 0}K</span>
               <p className="text-[9px] text-slate-500 mt-2">*Hutang memotong otomatis gaji Start Rp200K.</p>
            </div>

            <div className="flex flex-col gap-3">
               <button onClick={handleBorrowBank} disabled={(currentPlayer?.debt || 0) >= 1000} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex flex-col items-center">
                 <span>PINJAM UANG (Dapat Rp500K)</span>
                 <span className="text-[10px] font-normal opacity-80">*Akan nambah hutang Rp600K (Bunga pinjol 20%)</span>
               </button>
               
               <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl">
                 <p className="text-[10px] text-slate-400 font-bold mb-2 text-center uppercase tracking-wider">Atur Nominal Cicilan</p>
                 <div className="flex items-center justify-between bg-slate-800 p-2 rounded-lg mb-3">
                    <button onClick={() => setRepayAmount(Math.max(10, repayAmount - 50))} className="px-4 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white font-black">-</button>
                    <span className="font-mono font-black text-white text-lg">Rp{Math.min((currentPlayer?.money || 0), (currentPlayer?.debt || 0), repayAmount)}K</span>
                    <button onClick={() => setRepayAmount(Math.min((currentPlayer?.money || 0), (currentPlayer?.debt || 0), repayAmount + 50))} className="px-4 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white font-black">+</button>
                 </div>
                 <button onClick={handlePayBank} disabled={(currentPlayer?.debt || 0) === 0 || currentPlayer.money <= 0} className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold active:scale-95 disabled:opacity-50 disabled:grayscale transition-all text-sm">
                   BAYAR CICILAN
                 </button>
               </div>
            </div>

            {((currentPlayer?.antiques || []).length > 0) ? (
              <div className="bg-slate-900 p-4 rounded-xl border border-rose-900/50 mt-4 max-h-40 overflow-y-auto no-scrollbar">
                 <p className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider text-center">Jual Barang Antik Lelang</p>
                 <div className="flex flex-col gap-2">
                    {currentPlayer.antiques.map((ant, i) => (
                       <div key={i} className="flex justify-between items-center bg-slate-800 p-2 rounded-lg border border-slate-700">
                          <span className="text-xs text-white flex items-center gap-1"><Gem size={12} className="text-rose-400"/> {ant.name}</span>
                          <button onClick={() => handleSellAntique(i, ant)} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-[10px] font-bold active:scale-95 transition-transform">
                             JUAL Rp{ant.val}K
                          </button>
                       </div>
                    ))}
                 </div>
                 <button onClick={handleSellAllAntiques} className="w-full py-2 mt-3 bg-red-600/80 hover:bg-red-500 text-white rounded-lg font-bold active:scale-95 transition-transform text-xs border border-red-500/50">
                    JUAL SEMUA BARANG ANTIK
                 </button>
                 <p className="text-[9px] text-slate-500 mt-2 text-center">*Harga barang antik naik Rp1K tiap 10 detik.</p>
              </div>
            ) : null}

            {errorMsg ? <p className="text-red-500 text-xs text-center mt-4 font-bold animate-pulse">{errorMsg}</p> : null}
          </div>
        </div>
      )}

      {/* 1. Bursa Emas (Gold Market) */}
      {showGoldMarket && currentPlayer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => { setShowGoldMarket(false); playSound('click'); }}>

          <div className="bg-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-yellow-600/50 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2">
                 <Coins className="text-yellow-400" size={24}/>
                 <h2 className="text-xl font-black text-white">Bursa Emas</h2>
               </div>
               <button onClick={() => { setShowGoldMarket(false); playSound('click'); }} className="text-slate-400 hover:text-white"><X size={20}/></button>

            </div>
            
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-center mb-4">
               <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Harga Emas Saat Ini (1g)</p>
               <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-black text-3xl text-yellow-400">Rp{goldPrice}K</span>
                  <RefreshCw size={16} className="text-slate-500" />
               </div>
               <p className="text-[9px] text-slate-500 mt-2">*Harga naik-turun tiap akhir giliran bos.</p>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 mb-6 text-xs">
               <p className="text-slate-400 font-bold mb-2 border-b border-slate-700 pb-1">Portofolio Emas Kamu</p>
               <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Total Beli (Modal)</span>
                  <span className="text-white">Rp{Math.round(currentPlayer?.totalGoldSpent || 0)}K</span>
               </div>
               <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Rata-rata Harga Beli</span>
                  <span className="text-white">Rp{avgGoldPrice}K /g</span>
               </div>
               <div className="flex justify-between mt-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Estimasi Cuan/Rugi</span>
                  <span className={`font-bold ${totalGoldProfit > 0 ? 'text-green-400' : totalGoldProfit < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                     {totalGoldProfit > 0 ? '+' : ''}Rp{Math.round(totalGoldProfit)}K
                  </span>
               </div>
            </div>

            <div className="flex gap-4 justify-between items-center mb-6 px-2">
               <div>
                  <p className="text-xs text-slate-400">Emas Dimiliki</p>
                  <p className={`font-bold text-lg ${currentPlayer?.gold < 0 ? 'text-red-500' : 'text-white'}`}>{parseFloat((currentPlayer?.gold || 0).toFixed(1))} <span className="text-sm">Gram</span></p>
               </div>
               <div className="text-right">
                  <p className="text-xs text-slate-400">Uang Tunai Kamu</p>
                  <p className="font-bold text-lg text-green-400">Rp{currentPlayer?.money || 0}K</p>
               </div>
            </div>

            <div className="flex gap-2 mt-auto">
               <div className="flex flex-col gap-2 flex-1">
                  <button onClick={() => handleSellGold(false)} disabled={(currentPlayer?.gold || 0) <= 0} className="w-full py-2 bg-red-600/20 text-red-500 border border-red-600/50 rounded-lg text-xs font-bold active:bg-red-600/40 disabled:opacity-50 disabled:grayscale transition-colors">
                     JUAL {(currentPlayer?.gold || 0) >= 1 ? '1g' : `${parseFloat((currentPlayer?.gold || 0).toFixed(1))}g`}
                  </button>
                  <button onClick={() => handleSellGold(true)} disabled={(currentPlayer?.gold || 0) <= 0} className="w-full py-2 bg-red-800/40 text-red-400 border border-red-600/50 rounded-lg text-xs font-bold active:bg-red-600/60 disabled:opacity-50 disabled:grayscale transition-colors">
                     JUAL SEMUA
                  </button>
               </div>
               <button onClick={handleBuyGold} disabled={(currentPlayer?.money || 0) < goldPrice} className="flex-1 py-3 h-full bg-yellow-500 text-slate-900 rounded-xl font-bold active:bg-yellow-600 disabled:opacity-50 disabled:grayscale transition-colors flex items-center justify-center">
                  BELI (1g)
               </button>
            </div>
            {errorMsg ? <p className="text-red-500 text-xs text-center mt-3 font-bold animate-pulse">{errorMsg}</p> : null}
          </div>
        </div>
      )}

      {/* 2. Pasar Hasil Pertanian */}
      {showPasarMenu && currentPlayer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => { setShowPasarMenu(false); playSound('click'); }}>
          <div className="bg-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-lime-600/50 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2">
                 <Store className="text-lime-400" size={24}/>
                 <h2 className="text-xl font-black text-white">Pasar Tani</h2>
               </div>
               <button onClick={() => { setShowPasarMenu(false); playSound('click');}}className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 mb-4 text-xs">
               <p className="text-slate-400 font-bold mb-2">Harga Beli Tengkulak Sekarang:</p>
               <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                     <p className="text-[10px] text-slate-400 uppercase">Gandum</p>
                     <p className="font-mono font-bold text-lime-400">Rp{marketPrices.gandum}K</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                     <p className="text-[10px] text-slate-400 uppercase">Telur</p>
                     <p className="font-mono font-bold text-orange-300">Rp{marketPrices.telur}K</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                     <p className="text-[10px] text-slate-400 uppercase">Padi</p>
                     <p className="font-mono font-bold text-yellow-500">Rp{marketPrices.padi}K</p>
                  </div>
               </div>
               <p className="text-[9px] text-slate-500 mt-2 text-center">*Harga pasar di update tiap giliran.</p>
            </div>

            <div className="flex flex-col gap-3">
               <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <div>
                     <p className="text-xs text-slate-400">Stok Gandum</p>
                     <p className="font-bold text-white text-lg">{currentPlayer.assets?.gandum || 0}</p>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => handleSellAsset('gandum', false)} disabled={(currentPlayer.assets?.gandum || 0) === 0} className="px-3 py-2 bg-lime-600/20 text-lime-400 border border-lime-600/50 rounded-lg font-bold disabled:opacity-50 text-[10px] active:scale-95 transition-transform">JUAL 1x</button>
                     <button onClick={() => handleSellAsset('gandum', true)} disabled={(currentPlayer.assets?.gandum || 0) === 0} className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg font-bold disabled:opacity-50 text-[10px] active:scale-95 transition-transform">JUAL SEMUA</button>
                  </div>
               </div>
               <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <div>
                     <p className="text-xs text-slate-400">Stok Telur</p>
                     <p className="font-bold text-white text-lg">{currentPlayer.assets?.telur || 0}</p>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => handleSellAsset('telur', false)} disabled={(currentPlayer.assets?.telur || 0) === 0} className="px-3 py-2 bg-orange-600/20 text-orange-400 border border-orange-600/50 rounded-lg font-bold disabled:opacity-50 text-[10px] active:scale-95 transition-transform">JUAL 1x</button>
                     <button onClick={() => handleSellAsset('telur', true)} disabled={(currentPlayer.assets?.telur || 0) === 0} className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg font-bold disabled:opacity-50 text-[10px] active:scale-95 transition-transform">JUAL SEMUA</button>
                  </div>
               </div>
               <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <div>
                     <p className="text-xs text-slate-400">Stok Padi</p>
                     <p className="font-bold text-white text-lg">{currentPlayer.assets?.padi || 0}</p>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => handleSellAsset('padi', false)} disabled={(currentPlayer.assets?.padi || 0) === 0} className="px-3 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 rounded-lg font-bold disabled:opacity-50 text-[10px] active:scale-95 transition-transform">JUAL 1x</button>
                     <button onClick={() => handleSellAsset('padi', true)} disabled={(currentPlayer.assets?.padi || 0) === 0} className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg font-bold disabled:opacity-50 text-[10px] active:scale-95 transition-transform">JUAL SEMUA</button>
                  </div>
               </div>
            </div>

            {errorMsg ? <p className="text-red-500 text-xs text-center mt-3 font-bold animate-pulse">{errorMsg}</p> : null}
          </div>
        </div>
      )}

      {/* 3. Player Detail Overlay */}
      {viewingPlayer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setViewingPlayer(null)}>
          <div className="bg-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2">
                 <div className={`w-4 h-4 rounded-full ${viewingPlayer.color}`} />
                 <h2 className="text-xl font-black text-white">{viewingPlayer.name}</h2>
               </div>
               <button onClick={() => setViewingPlayer(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto no-scrollbar space-y-3">
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                     <p className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1"><Wallet size={12}/> Uang Tunai</p>
                     <p className="font-mono font-bold text-lg text-green-400">Rp{viewingPlayer.money || 0}K</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                     <p className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1"><TrendingDown size={12}/> Net Worth</p>
                     <p className="font-mono font-bold text-lg text-blue-400">Rp{calculateNetWorth(viewingPlayer)}K</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-yellow-600/30">
                     <p className="text-[10px] text-yellow-500 font-bold flex items-center gap-1"><Coins size={12}/> Emas</p>
                     <p className={`font-mono font-bold ${viewingPlayer.gold < 0 ? 'text-red-500' : 'text-white'}`}>{parseFloat((viewingPlayer.gold || 0).toFixed(1))}g</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-red-600/30">
                     <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Landmark size={12}/> Hutang Bank</p>
                     <p className="font-mono font-bold text-white">Rp{viewingPlayer.debt || 0}K</p>
                  </div>
                  
                  {(() => {
                      const playerAgriMines = BOARD_TILES.filter(t => (t.type === 'agriculture' || t.type === 'mine') && properties[t.id]?.ownerId === viewingPlayer.id && properties[t.id]?.isMortgaged !== 'full' && properties[t.id]?.isMortgaged !== 'land' && properties[t.id]?.isMortgaged !== true);
                      if (playerAgriMines.length > 0) {
                          return (
                             <div className="col-span-2 bg-slate-900 p-3 rounded-xl border border-blue-600/30">
                                <p className="text-[10px] text-blue-400 font-bold mb-2 flex items-center gap-1"><Timer size={12} className="animate-pulse"/> Waktu Panen / Tambang</p>
                                {playerAgriMines.map(t => (
                                   <div key={t.id} className="flex justify-between items-center bg-slate-800 p-2 rounded mb-1 border border-slate-700">
                                      <span className="text-[10px] text-slate-300">{t.name}</span>
                                      <span className="font-mono text-xs font-black text-white">{formatTimer(properties[t.id]?.harvestTimer)}</span>
                                   </div>
                                ))}
                             </div>
                          );
                      }
                      return null;
                  })()}

                  <div className="col-span-2 bg-slate-900 p-3 rounded-xl border border-lime-600/30">
                     <p className="text-[10px] text-lime-400 font-bold mb-1 flex items-center gap-1"><Store size={12}/> Aset Tani & Koleksi Antik</p>
                     <div className="flex gap-2 flex-wrap mb-1">
                        {viewingPlayer.assets?.gandum > 0 ? <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🌾 {viewingPlayer.assets.gandum} Gandum</span> : null}
                        {viewingPlayer.assets?.telur > 0 ? <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🥚 {viewingPlayer.assets.telur} Telur</span> : null}
                        {viewingPlayer.assets?.padi > 0 ? <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">🌾 {viewingPlayer.assets.padi} Padi</span> : null}
                     </div>
                     {((viewingPlayer.antiques || []).length > 0) ? (
                        <div className="flex gap-2 flex-wrap mt-2">
                           {viewingPlayer.antiques.map((ant, i) => (
                              <span key={i} className="text-[10px] bg-rose-900/30 text-rose-300 px-2 py-0.5 rounded border border-rose-800/50">💎 {ant.name} (Rp{ant.val}K)</span>
                           ))}
                        </div>
                     ) : null}
                     {(!viewingPlayer.assets?.gandum && !viewingPlayer.assets?.telur && !viewingPlayer.assets?.padi && (viewingPlayer.antiques||[]).length===0) ? <p className="text-[10px] text-slate-500 italic">Belum punya aset fisik.</p> : null}
                  </div>

                  {((viewingPlayer.buffs || []).length > 0) ? (
                    <div className="col-span-2 bg-slate-900 p-3 rounded-xl border border-purple-600/30 flex flex-col gap-2">
                       <p className="text-[10px] text-purple-400 font-bold flex items-center gap-1"><Ticket size={12}/> Kartu VIP (Klik kalau mau Aktif)</p>
                       <div className="flex gap-2 flex-wrap">
                          {Object.entries((viewingPlayer.buffs || []).reduce((acc, b) => { acc[b] = (acc[b] || 0) + 1; return acc; }, {})).map(([b, count], i) => {
                             const isUsable = viewingPlayer.id === currentPlayer.id && activeModal === 'WAIT_ROLL' && !currentPlayer.isBot;
                             const countText = count > 1 ? ` x${count}` : '';
                             
                             if (b === 'DEBT_CLEAR') {
                                return <button key={i} onClick={() => {
                                    if(isUsable) { handleAction('USE_DEBT_CLEAR_CARD'); setViewingPlayer(null); }
                                    else setErrorMsg("Gunakan saat giliranmu (sebelum lempar dadu)!");
                                }} className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${isUsable ? 'bg-purple-600 text-white hover:bg-purple-500 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-purple-900/50 text-purple-300'}`}>Hapus Pinjol (TAP){countText}</button>
                             }
                             if (b === 'CUSTOM_TELEPORT') {
                                return <button key={i} onClick={() => { 
                                    if(isUsable) { handleAction('PREPARE_CUSTOM_TELEPORT'); setViewingPlayer(null); }
                                    else setErrorMsg("Gunakan saat giliranmu (sebelum lempar dadu)!");
                                }} className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${isUsable ? 'bg-purple-600 text-white hover:bg-purple-500 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-purple-900/50 text-purple-300'}`}>Teleport Bebas (TAP){countText}</button>
                             }
                             return <span key={i} className="text-[10px] font-bold bg-purple-900/50 text-purple-300 px-2 py-1 rounded-md">
                              {b === 'FREE_RENT' ? 'Bebas Sewa' : b === 'FREE_JAIL' ? 'Bebas Penjara' : b === 'DISCOUNT_TAX' ? 'Kebal Pajak' : b === 'FORCE_ACQUIRE' ? 'Kudeta Lahan' : b === 'LOSS_EXEMPTION' ? 'Asuransi Rugi' : b === 'FREE_REDEEM' ? 'Tebus Gadai' : b === 'VIP_AUCTION' ? 'Auto Win Lelang' : b === 'FREE_MAX_UPGRADE' ? 'Sultan Mendadak (Max Upgrade)' : b}{countText}
                             </span>
                          })}
                       </div>
                       {errorMsg ? <p className="text-red-500 text-[10px] text-center mt-1 animate-pulse">{errorMsg}</p> : null}
                    </div>
                  ) : null}
               </div>

               <h3 className="text-xs font-bold text-slate-500 mt-4 uppercase tracking-wider flex justify-between">
                   Aset Properti
                   <span className="text-[8px] italic normal-case font-normal text-slate-400">*Tap aset untuk lihat info</span>
               </h3>
               <div className="flex-1 max-h-48 space-y-2 pb-2">
                  {BOARD_TILES.filter(t => properties[t.id]?.ownerId === viewingPlayer.id).length === 0 ? (
                    <div className="text-center text-slate-500 text-xs italic py-4">Belum memiliki lahan satupun.</div>
                  ) : null}
                  {BOARD_TILES.filter(t => properties[t.id]?.ownerId === viewingPlayer.id).map(t => (
                    <div key={t.id} onClick={() => { setViewingPlayer(null); setViewingProperty(t); }} className={`flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border cursor-pointer hover:bg-slate-800 transition-colors ${properties[t.id]?.isMortgaged ? 'border-red-900/50 opacity-50' : 'border-slate-700/50'}`}>
                       <div className="flex items-center gap-2">
                         {t.color ? <div className={`w-2 h-6 rounded-sm ${t.color}`} /> : null}
                         <span className="font-bold text-sm text-slate-200">{t.name}</span>
                         {properties[t.id]?.isMortgaged === 'full' ? <span className="text-[8px] bg-red-800 text-white px-1 rounded">GADAI FULL</span> : null}
                         {properties[t.id]?.isMortgaged === 'land' ? <span className="text-[8px] bg-orange-800 text-white px-1 rounded">GADAI TANAH</span> : null}
                       </div>
                       {(!properties[t.id]?.isMortgaged || properties[t.id]?.isMortgaged === 'land') ? (
                         <div className="flex gap-1 text-[8px]">
                           {t.type === 'property' && (properties[t.id]?.level || 0) > 0 && (properties[t.id]?.level || 0) < 5 ? Array(properties[t.id].level).fill(0).map((_,i) => <span key={i}>🏠</span>) : null}
                           {t.type === 'property' && properties[t.id]?.level === 5 ? <span>🏨</span> : null}
                           {(t.type === 'agriculture' || t.type === 'mine') && (properties[t.id]?.level || 0) > 0 ? Array(properties[t.id].level).fill(0).map((_,i) => <span key={i}>⭐</span>) : null}
                         </div>
                       ) : null}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Property Detail Overlay (GADAI / TEBUS / TRADE) */}
      {viewingProperty && currentPlayer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => {setViewingProperty(null); setErrorMsg('');}}>
          <div className="bg-slate-800 w-full max-w-[320px] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {viewingProperty.group ? <div className={`h-12 w-full ${viewingProperty.color} flex items-center justify-center`}>
               {viewingProperty.type === 'agriculture' ? <Tractor size={20} className="text-white/80" /> : 
                viewingProperty.type === 'mine' ? <Gem size={20} className="text-white/80" /> :
                <Home size={20} className="text-white/80" />}
            </div> : null}
            {getCornerBgColor(viewingProperty.id) ? <div className="h-12 w-full flex items-center justify-center" style={{backgroundColor: getCornerBgColor(viewingProperty.id)}}>
               <AlertTriangle size={20} className="text-white/80" />
            </div> : null}
            
            <div className="p-5 flex flex-col relative max-h-[85vh] overflow-y-auto no-scrollbar">
               <button onClick={() => {setViewingProperty(null); setErrorMsg('');}} className="absolute top-2 right-2 text-slate-400 hover:text-white"><X size={18}/></button>
               
               <h2 className="text-xl font-black text-white mb-1 pr-6">{viewingProperty.name}</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                 {viewingProperty.type === 'property' ? <><Building size={12}/> Lahan Properti</> : 
                  viewingProperty.type === 'station' ? <><Train size={12}/> Stasiun Kereta</> : 
                  viewingProperty.type === 'utility' ? <><Zap size={12}/> Fasilitas Publik</> : 
                  viewingProperty.type === 'agriculture' ? <><Tractor size={12}/> Area Pertanian</> : 
                  viewingProperty.type === 'mine' ? <><Gem size={12}/> Tambang Emas</> : 
                  viewingProperty.type === 'auction' ? <><Gavel size={12}/> Balai Lelang</> : 
                  viewingProperty.type=== 'lottery' ? <><Coins size={12}/> Lotre Mas</> : 
                  viewingProperty.type === 'chance' || viewingProperty.type === 'chest' ? <><Sparkles size={12}/> Event AI Master</> :
                  viewingProperty.type === 'quiz' ? <><HelpCircle size={12}/> Kuis Pengetahuan</> : 'Petak Khusus'}
               </p>

               <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 mb-4 text-[10px] text-slate-300 leading-relaxed shadow-inner">
                  <p className="font-black text-white mb-1 flex items-center gap-1"><Info size={12} className="text-blue-400"/> Sistem & Manfaat Petak:</p>
                  {viewingProperty.type === 'property' && "Lahan ini bisa dibeli dan dibangun Rumah/Hotel (Maks level 5). Sewa akan meningkat tajam setiap levelnya. Kuasai semua lahan sewarna (Monopoli) untuk menggandakan harga sewa! Bisa digadai jika kamu butuh uang cepat."}
                  {viewingProperty.type === 'station' && "Tarif sewa di stasiun bergantung pada jumlah stasiun yang kamu miliki (Rp50K x Jumlah). Fitur Spesial: Pemilik bisa 'Fast-Travel' alias Teleportasi instan antar stasiun yang dimiliki dengan membayar Rp50K."}
                  {viewingProperty.type === 'utility' && "Tarif sewa utilitas bersifat dinamis. Biaya yang harus dibayar musuh adalah hasil lemparan dadu mereka dikali 10. Jika kamu menguasai PLN dan PDAM sekaligus, biaya menjadi lemparan dadu dikali 20!"}
                  {viewingProperty.type === 'agriculture' && "Lahan Pertanian! Menghasilkan passive income 1 Aset (Gandum/Telur/Padi) secara otomatis. Bisa diupgrade hingga Level 3 untuk mempercepat waktu produksi panen (-60 Detik per level)! Jika pemain lain menginjak, kamu panen ekstra."}
                  {viewingProperty.type === 'mine' && "Lahan Tambang! Menghasilkan passive income 0.5g Emas secara otomatis. Bisa diupgrade hingga Level 3 untuk mempercepat waktu menambang emas (-60 Detik per level)! Jika pemain lain menginjak, kamu dapat bonus emas."}
                  {viewingProperty.type === 'auction' && "Balai Lelang Antik! Pemain yang tiba di sini akan memicu Lelang Barang Antik. Semua pemain akan bergantian menawar (Turn-Based). Barang antik yang dibeli nilainya akan terus naik Rp 1K setiap 10 Detik. Jual ke Bank saat harga mahal!"}
                  {viewingProperty.type === 'lottery' && "Lotre Keberuntungan! Taruhkan nasibmu di putaran slot ini. Kamu berpeluang memenangkan hadiah uang tunai nomplok (Jackpot) secara gratis, atau zonk sama sekali."}
                  {viewingProperty.type === 'parking' && "Parkir Bebas! Tempat paling aman. Mendarat di sini kamu akan langsung mendapat 1 Kartu VIP secara acak (Kudeta Lahan, Teleport Bebas, Bebas Penjara, Sultan Mendadak, dll)."}
                  {viewingProperty.type === 'jail' && "Penjara! Area terkunci. Pemain yang tertangkap harus mencoba mendapatkan dadu kembar (maks 3x percobaan), membayar denda Rp50K (sogok), atau menggunakan Kartu Bebas Penjara untuk keluar."}
                  {viewingProperty.type === 'tax' && "Pajak Jalan/Mewah! Pemain yang mendarat di sini wajib membayar denda kas Bank. Uangmu akan langsung dipotong (Bisa ditahan jika punya Kartu Asuransi VIP)."}
                  {(viewingProperty.type === 'chance' || viewingProperty.type === 'chest') && "Event AI Master! Takdirmu ditentukan di sini. Secara sistematis kejadian akan diacak, mulai dari denda/uang kaget, dilempar ke petak bebas, hingga dapet Kartu VIP langka!"}
                  {viewingProperty.type === 'quiz' && "Kuis Master AI! Jawab pertanyaan nyeleneh langsung dari AI. Benar dapat Rp200K, Salah didenda Rp100K."}
                  {viewingProperty.type === 'go_to_jail' && "TANGKAP! Petak jebakan. Jika kamu berhenti di sini, Satpol PP akan langsung menyeretmu ke Penjara tanpa melewati garis Start."}
                  {viewingProperty.type === 'go' && "START! Garis awal permainan. Setiap kali pemain melewati atau berhenti di petak ini, Bank akan membayarkan Gaji sebesar Rp200K. Tapi hati-hati, jika kamu punya hutang pinjol, gajimu otomatis dipotong Bank!"}
               </div>

               {viewingProperty.price ? (
                 <div className="space-y-3">
                   <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                     <span className="text-xs text-slate-400">Harga Beli Dasar Lahan</span>
                     <span className="font-mono font-bold text-green-400">Rp {viewingProperty.price}K</span>
                   </div>

                   {propertiesRef.current[viewingProperty.id] ? (
                      <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                        <span className="text-xs text-slate-400">Total Nilai Aset Saat Ini</span>
                        <span className="font-mono font-black text-blue-400 text-sm">Rp {viewingProperty.price + ((propertiesRef.current[viewingProperty.id].level || 0) * (viewingProperty.hPrice || 0))}K</span>
                      </div>
                   ) : null}
                   
                   {(viewingProperty.type === 'property' || viewingProperty.type === 'station' || viewingProperty.type === 'utility') ? (
                      <div className="flex flex-col border-b border-slate-700 pb-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xs text-slate-400">Total Sewa Saat Ini</span>
                          <span className="font-mono font-bold text-red-400">Rp {calculateRent(viewingProperty, propertiesRef.current[viewingProperty.id], propertiesRef.current[viewingProperty.id]?.ownerId)}K</span>
                        </div>
                        {propertiesRef.current[viewingProperty.id] && hasMonopoly(propertiesRef.current[viewingProperty.id].ownerId, viewingProperty.group) ? (
                           <span className="text-[8px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full mt-2 w-max animate-pulse border border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.5)]">⚠️ BONUS 2X LIPAT (MONOPOLI AKTIF)</span>
                        ) : null}
                      </div>
                   ) : null}

                   {viewingProperty.hPrice ? (
  <div className="flex justify-between items-end border-b border-slate-700 pb-2">
    <span className="text-xs text-slate-400">Harga Dasar Upgrade Lvl Selanjutnya</span>
    <span className="font-mono font-bold">
      {(() => {
        const pData = propertiesRef.current[viewingProperty.id];
        const currentLevel = pData?.level || 0;        
        const maxLevel = (viewingProperty.type === 'agriculture' || viewingProperty.type === 'mine') ? 3 : 5;
        if (currentLevel >= maxLevel) {
          return (
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_0_5px_rgba(251,191,36,0.6)] animate-pulse">
              LEVEL MAX ✨
            </span>
          );
        }
        return <span className="text-yellow-400">Rp {viewingProperty.hPrice * (currentLevel + 1)}K</span>;
      })()}
    </span>
  </div>
) : null}

                   
                   <div className={`mt-4 p-3 bg-slate-900 rounded-xl border ${propertiesRef.current[viewingProperty.id]?.isMortgaged ? 'border-red-900/50' : 'border-slate-700'}`}>
                     <p className="text-[10px] text-slate-500 font-bold mb-1">STATUS KEPEMILIKAN</p>
                     {propertiesRef.current[viewingProperty.id] ? (
                       <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-center">
                           <span className="font-bold text-sm text-white flex items-center gap-1">
                             <div className={`w-2 h-2 rounded-full ${playersRef.current.find(p => p.id === propertiesRef.current[viewingProperty.id].ownerId)?.color}`}/>
                             {playersRef.current.find(p => p.id === propertiesRef.current[viewingProperty.id].ownerId)?.name}
                           </span>
                           {(!propertiesRef.current[viewingProperty.id].isMortgaged || propertiesRef.current[viewingProperty.id].isMortgaged === 'land') ? (
                             <div className="flex gap-0.5 text-[10px]">
                                {viewingProperty.type === 'property' && (propertiesRef.current[viewingProperty.id].level || 0) > 0 && (propertiesRef.current[viewingProperty.id].level || 0) < 5 ? Array(propertiesRef.current[viewingProperty.id].level).fill(0).map((_,i) => <span key={i}>🏠</span>) : null}
                                {viewingProperty.type === 'property' && propertiesRef.current[viewingProperty.id].level === 5 ? <span>🏨</span> : null}
                                {(viewingProperty.type === 'agriculture' || viewingProperty.type === 'mine') && (propertiesRef.current[viewingProperty.id].level || 0) > 0 ? Array(propertiesRef.current[viewingProperty.id].level).fill(0).map((_,i) => <span key={i}>⭐</span>) : null}
                             </div>
                           ) : null}
                         </div>
                         {propertiesRef.current[viewingProperty.id].isMortgaged ? (
                           <div className="text-xs font-bold flex items-center gap-1 bg-red-900/20 w-max px-2 py-0.5 rounded text-red-500">
                               <Lock size={10}/> {propertiesRef.current[viewingProperty.id].isMortgaged === 'land' ? 'TANAH DIGADAI' : 'FULL DIGADAI'}
                           </div>
                         ) : null}
                       </div>
                     ) : (
                       <span className="font-bold text-sm text-slate-400 italic">Belum Dimiliki</span>
                     )}
                   </div>

                   {/* ACTION BUTTONS: TRADE ATAU GADAI/TEBUS */}
                   {propertiesRef.current[viewingProperty.id] && !currentPlayer.isBot && !currentPlayer.isBankrupt ? (
                     <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col gap-2">
                       
{/* Jika milik musuh -> Ajukan Tawaran Trade */}
{propertiesRef.current[viewingProperty.id].ownerId !== currentPlayer.id ? (
  <>
     {(() => {
         const pData = propertiesRef.current[viewingProperty.id];
         const assetValue = viewingProperty.price + ((pData.level || 0) * (viewingProperty.hPrice || 0));
         let tradeCost = 0;


         if (viewingProperty.type === 'property') {
            const currentRent = calculateRent(viewingProperty, pData, pData.ownerId);
            tradeCost = assetValue + (currentRent * 1.5);
         } 
         else if (viewingProperty.type === 'utility' || viewingProperty.type === 'station') {
            tradeCost = viewingProperty.price * 3;
         } 
         else if (viewingProperty.type === 'agriculture' || viewingProperty.type === 'mine') {
            tradeCost = assetValue * 2.5;
         }


         let isMortgagedNow = pData.isMortgaged;
         if (isMortgagedNow) {
             let redeemCost = (viewingProperty.price / 2) + 20;
             if (isMortgagedNow !== 'land') {
                 redeemCost += ((pData.level || 0) * (viewingProperty.hPrice || 0) / 2);
             }
             // Potong harga tapi minimal seharga aset dasar
             tradeCost = Math.max(tradeCost - redeemCost, 10);
         }

         const finalTradeCost = Math.floor(tradeCost);

         return (
             <button onClick={handleTradeRequest} className="w-full py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg text-xs font-bold hover:bg-blue-600/40 transition-colors">
                AJUKAN AKUISISI (Bayar Rp{finalTradeCost}K){isMortgagedNow ? ' - Diskon Gadai' : ''}
             </button>
         );
     })()}

     {/* Tombol Kudeta Kartu VIP */}
     {(currentPlayer.buffs || []).includes('FORCE_ACQUIRE') ? (
        <button onClick={() => handleKudetaManual(viewingProperty)} className="w-full py-2 bg-purple-600/20 text-purple-400 border border-purple-600/50 rounded-lg text-xs font-bold hover:bg-purple-600/40 flex justify-center items-center gap-1 transition-colors mt-2">
           <Crosshair size={14}/> KUDETA LAHAN (GRATIS PAKAI KARTU VIP)
        </button>
     ) : null}
  </>
) : null}


                        {/* Jika milik sendiri -> Gadai / Tebus */}
                        {propertiesRef.current[viewingProperty.id].ownerId === currentPlayer.id ? (
                          <>
                            {propertiesRef.current[viewingProperty.id].isMortgaged ? (
                              <>
                                 <button onClick={handleTebus} className="w-full py-2 bg-green-600/20 text-green-500 border border-green-600/50 rounded-lg text-xs font-bold hover:bg-green-600/40 flex justify-center items-center gap-1 transition-colors">
                                    <Unlock size={14}/> {propertiesRef.current[viewingProperty.id].isMortgaged === 'land' 
                                        ? `TEBUS TANAH (Bayar Rp${(viewingProperty.price/2)+20}K)`
                                        : `TEBUS SEMUA (Bayar Rp${(viewingProperty.price/2) + ((propertiesRef.current[viewingProperty.id].level||0) * (viewingProperty.hPrice||0) / 2) + 20}K)`}
                                 </button>
                                 {(currentPlayer.buffs || []).includes('FREE_REDEEM') ? (
                                    <button onClick={() => handleTebusGratisManual(viewingProperty)} className="w-full py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 rounded-lg text-xs font-bold hover:bg-emerald-600/40 flex justify-center items-center gap-1 transition-colors">
                                       <Unlock size={14}/> TEBUS GRATIS (KARTU VIP)
                                    </button>
                                 ) : null}
                              </>
                            ) : (
                              <>
                                 {(propertiesRef.current[viewingProperty.id].level || 0) > 0 ? (
                                    <div className="flex flex-col gap-2">
                                       <button onClick={() => handleGadai('land')} className="w-full py-2 bg-orange-600/20 text-orange-500 border border-orange-600/50 rounded-lg text-[10px] font-bold hover:bg-orange-600/40 flex justify-center items-center gap-1 transition-colors">
                                          <Lock size={12}/> GADAI TANAH SAJA (Dapat Rp{viewingProperty.price/2}K)
                                       </button>
                                       <button onClick={() => handleGadai('full')} className="w-full py-2 bg-red-600/20 text-red-500 border border-red-600/50 rounded-lg text-[10px] font-bold hover:bg-red-600/40 flex justify-center items-center gap-1 transition-colors">
                                          <Lock size={12}/> GADAI SEMUA (Dapat Rp{(viewingProperty.price/2) + ((propertiesRef.current[viewingProperty.id].level||0) * (viewingProperty.hPrice||0) / 2)}K)
                                       </button>
                                    </div>
                                 ) : (
                                    <button onClick={() => handleGadai('full')} className="w-full py-2 bg-orange-600/20 text-orange-500 border border-orange-600/50 rounded-lg text-xs font-bold hover:bg-orange-600/40 flex justify-center items-center gap-1 transition-colors">
                                       <Lock size={14}/> GADAI ASET (Dapat Rp{viewingProperty.price/2}K)
                                    </button>
                                 )}
                              </>
                            )}
                          </>
                        ) : null}
                        {errorMsg ? <span className="text-red-500 text-[9px] text-center mt-1 animate-pulse">{errorMsg}</span> : null}
                     </div>
                   ) : null}
                 </div>
               ) : (
                 <p className="text-sm text-slate-300 italic text-center py-4">Petak Khusus Event (Lelang/Lotre).</p>
               )}
            </div>
          </div>
        </div>
      )}

      {/* 5. OVERLAY TRADE REQUEST */}
      {pendingTrade && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-blue-500/50 flex flex-col text-center">
             <Building size={48} className="text-blue-400 mx-auto mb-4" />
             <h2 className="text-xl font-black text-white mb-2">TAWARAN AKUISISI!</h2>
             <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                <span className="font-bold text-blue-400">{pendingTrade.buyer.name}</span> nawar properti <span className="font-bold text-yellow-400">{pendingTrade.prop.name}</span> {pendingTrade.isMortgaged ? <span className="text-red-400 font-bold"><br/>(Status: DIGADAI)</span> : 'beserta isinya'} seharga <span className="font-bold text-green-400">Rp {pendingTrade.cost}K</span>.
             </p>
             <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">
                Keputusan di tangan: <span className="font-bold text-white">{pendingTrade.owner.name}</span>
             </p>
             
             {pendingTrade.owner.isBot ? (
                <div className="flex justify-center items-center gap-2 text-blue-400 animate-pulse font-bold text-sm bg-blue-900/20 p-3 rounded-xl border border-blue-800">
                   <Loader2 className="animate-spin" size={16}/> Bot lagi pikir-pikir 💳...
                </div>
             ) : (
                <div className="flex flex-col w-full gap-3">
                   {pendingTrade.buyer.buffs.includes('FORCE_ACQUIRE') && pendingTrade.buyer.id === currentPlayer.id ? (
                      <button onClick={() => handleTradeResponse(true, true)} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 text-xs flex items-center justify-center gap-2">
                         <Crosshair size={16}/> PAKAI KARTU KUDETA (GRATIS)
                      </button>
                   ) : null}
                   <div className="flex gap-3">
                     <button onClick={() => handleTradeResponse(true)} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">TERIMA</button>
                     <button onClick={() => handleTradeResponse(false)} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">TOLAK</button>
                   </div>
                </div>
             )}
          </div>
        </div>
      )}

      {/* History Drawer */}
      {showLogsMenu && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end backdrop-blur-sm" onClick={() => setShowLogsMenu(false)}>
          <div className="bg-slate-900 rounded-t-3xl h-[75vh] flex flex-col border-t border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2"><History size={18}/> Log Perjalanan Warga</h3>
              <button onClick={() => setShowLogsMenu(false)} className="p-1.5 bg-slate-800 rounded-full text-white"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {logs.map((log, i) => (
  <div key={`${log}-${i}`} className={`text-xs font-mono p-2.5 rounded-lg border 
                   ${log.includes('🔴 API') || log.includes('System Fallback') ? 'bg-red-900/30 text-red-300 border-red-800/50' : 
                     log.includes('📡 API') || log.includes('🎲 AI Master') || log.includes('🎲 Sistem') ? 'bg-indigo-900/20 text-indigo-300 border-indigo-800/50' : 
                     log.includes('⚡ EFEK') ? 'bg-amber-900/20 text-amber-300 border-amber-800/50' : 
                     log.includes('🤖 BOT EMERGENCY') || log.includes('🤖 BOT INVESTASI') || log.includes('🤖 BOT TRADING') ? 'bg-cyan-900/20 text-cyan-300 border-cyan-800/50' : 
                     'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 15s linear infinite;
        }
        .mask-edges {
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}} />
    </div>
  );
}