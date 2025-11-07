// app.js - Firebase Enhanced Version
import firebaseService from './firebase.js';

// Global Game State
let gameState = {
    balance: 0,
    level: 1,
    energy: 100,
    maxEnergy: 100,
    tapPower: 0.1,
    referrals: 0,
    boosts: {
        facebook: { active: false, expires: 0, multiplier: 2 }
    },
    withdrawalUnlocked: false,
    totalTaps: 0,
    userId: null,
    username: null
};

// Initialize Game with Firebase
async function initGame() {
    console.log("🎮 Initializing game with Firebase...");
    
    // Setup Telegram first to get user ID
    await setupTelegram();
    
    // Load game state (local storage + Firebase)
    await loadGameState();
    
    // Update display
    updateDisplay();
    
    // Start systems
    startEnergyRecharge();
    generateReferralCode();
    setupLeaderboard();
    
    console.log("✅ Game initialized with Firebase!");
}

// Enhanced Telegram Setup
async function setupTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        if (user) {
            displayTelegramUser(user);
            
            // Set user ID for Firebase
            const userId = user.id.toString();
            gameState.userId = userId;
            gameState.username = user.username || user.first_name || 'Telegram User';
            
            // Initialize Firebase with user ID
            firebaseService.setUserId(userId);
            
            // Handle referral from start parameter
            handleStartParameter();
        }
    } else {
        // Fallback for browser testing
        const testUserId = 'test_' + Math.random().toString(36).substr(2, 9);
        gameState.userId = testUserId;
        gameState.username = 'Test User';
        firebaseService.setUserId(testUserId);
    }
}

// Handle Telegram start parameter for referrals
function handleStartParameter() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
        const referralCode = window.Telegram.WebApp.initDataUnsafe.start_param;
        processReferral(referralCode);
    }
}

// Process referral code
async function processReferral(referralCode) {
    try {
        const referrerId = referralCode.replace('TON-', '');
        
        // Don't process self-referral
        if (referrerId === gameState.userId) return;
        
        // Track referral in Firebase
        const success = await firebaseService.trackReferral(referrerId, gameState.userId);
        
        if (success) {
            // Give bonus to new user
            gameState.balance += 5;
            alert("🎉 Welcome bonus! +5 TON for joining with referral link!");
            
            // Update display and save
            updateDisplay();
            saveGameState();
        }
    } catch (error) {
        console.error('Error processing referral:', error);
    }
}

// Enhanced Save Game State
async function saveGameState() {
    // Save to localStorage
    localStorage.setItem('tonTapMaster', JSON.stringify(gameState));
    
    // Save to Firebase
    if (gameState.userId) {
        await firebaseService.saveUserData(gameState);
    }
}

// Enhanced Load Game State
async function loadGameState() {
    // Try to load from Firebase first
    if (gameState.userId) {
        const firebaseData = await firebaseService.loadUserData();
        
        if (firebaseData) {
            // Merge Firebase data with current game state
            gameState = { ...gameState, ...firebaseData };
            console.log("📂 Game state loaded from Firebase");
            return;
        }
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem('tonTapMaster');
    if (saved) {
        const localData = JSON.parse(saved);
        gameState = { ...gameState, ...localData };
        console.log("📂 Game state loaded from localStorage");
    }
}

// Setup Real-time Leaderboard
function setupLeaderboard() {
    firebaseService.setupLeaderboardListener((leaderboard) => {
        updateLeaderboardDisplay(leaderboard);
    }, 10);
}

// Update Leaderboard Display
function updateLeaderboardDisplay(leaderboard) {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-item">No players yet</div>';
        return;
    }
    
    leaderboard.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        
        // Shorten long usernames
        let displayName = player.username;
        if (displayName.length > 12) {
            displayName = displayName.substring(0, 12) + '...';
        }
        
        item.innerHTML = `
            <span>${medal} ${displayName}</span>
            <span>${player.balance.toFixed(1)} TON</span>
        `;
        
        leaderboardList.appendChild(item);
    });
}

// Enhanced Add Referral with Firebase
async function addReferral() {
    gameState.referrals++;
    
    // Referral rewards
    if (gameState.referrals === 1) {
        gameState.balance += 5;
        alert("🎉 First referral! +5 TON bonus!");
    } else if (gameState.referrals === 3) {
        gameState.balance += 10;
        gameState.level++;
        alert("🎊 3 referrals! +10 TON and Level Up!");
    } else if (gameState.referrals === 5) {
        unlockWithdrawal();
    } else if (gameState.referrals === 10) {
        gameState.balance += 25;
        alert("🏆 10 referrals! VIP status unlocked! +25 TON bonus!");
    }
    
    // Update Firebase
    await firebaseService.updateUserData({
        referrals: gameState.referrals,
        balance: gameState.balance,
        level: gameState.level
    });
    
    updateDisplay();
    saveGameState();
}

// Core Game Functions (remain mostly the same but with async save)
async function handleTap() {
    if (gameState.energy <= 0) {
        alert("⚠️ No energy! Wait for recharge.");
        return;
    }

    let reward = calculateTapReward();
    
    gameState.balance += reward;
    gameState.energy -= 1;
    gameState.totalTaps += 1;
    
    checkLevelUp();
    updateDisplay();
    await saveGameState(); // Async save
    showTapEffect(reward);
}

async function activateFacebookBoost() {
    const shareText = `I'm earning TON coins in TON Tap Master! 🚀 Join now and get 5 TON bonus! #TONTapMaster #TapToEarn`;
    const gameUrl = document.getElementById('referral-link').value;
    
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    
    gameState.boosts.facebook.active = true;
    gameState.boosts.facebook.expires = Date.now() + (60 * 60 * 1000);
    gameState.balance += 2;
    
    alert("🎉 2x Earnings Boost Activated for 1 Hour! +2 TON bonus!");
    updateDisplay();
    await saveGameState(); // Async save
    startBoostTimer();
}

// Other functions remain similar but with async save where needed
function calculateTapReward() {
    let baseReward = gameState.tapPower;
    let totalMultiplier = 1;
    
    if (gameState.boosts.facebook.active) {
        totalMultiplier *= gameState.boosts.facebook.multiplier;
    }
    
    let reward = baseReward * totalMultiplier;
    return Math.min(reward, 5);
}

function startBoostTimer() {
    const timerElement = document.getElementById('boost-timer');
    const boostButton = document.getElementById('boost-btn');
    
    const timer = setInterval(() => {
        if (!gameState.boosts.facebook.active) {
            clearInterval(timer);
            return;
        }
        
        const timeLeft = gameState.boosts.facebook.expires - Date.now();
        if (timeLeft <= 0) {
            gameState.boosts.facebook.active = false;
            clearInterval(timer);
            timerElement.textContent = 'Boost: Not Active';
            boostButton.disabled = false;
            updateDisplay();
            return;
        }
        
        const minutes = Math.floor(timeLeft / 1000 / 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        timerElement.textContent = `Boost: ${minutes}:${seconds.toString().padStart(2, '0')} left`;
        boostButton.disabled = true;
    }, 1000);
}

function copyReferralLink() {
    const referralInput = document.getElementById('referral-link');
    referralInput.select();
    referralInput.setSelectionRange(0, 99999);
    
    try {
        navigator.clipboard.writeText(referralInput.value);
        alert("✅ Referral link copied! Share with friends to unlock withdrawal.");
    } catch (err) {
        document.execCommand('copy');
        alert("✅ Referral link copied! Share with friends to unlock withdrawal.");
    }
}

function unlockWithdrawal() {
    gameState.withdrawalUnlocked = true;
    const statusElement = document.getElementById('withdrawal-status');
    const withdrawButton = document.getElementById('withdraw-btn');
    
    statusElement.textContent = "✅ UNLOCKED: You can now withdraw TON!";
    statusElement.className = "withdrawal-status unlocked";
    withdrawButton.disabled = false;
    withdrawButton.textContent = "💸 WITHDRAW TON";
    
    alert("🚀 WITHDRAWAL UNLOCKED! You can now withdraw your TON coins!");
}

async function requestWithdrawal() {
    if (!gameState.withdrawalUnlocked) {
        alert("❌ You need 5 referrals to unlock withdrawal");
        return;
    }
    
    if (gameState.balance < 10) {
        alert("❌ Minimum withdrawal: 10 TON");
        return;
    }
    
    const amount = gameState.balance;
    alert(`✅ Withdrawal request submitted!\nAmount: ${amount.toFixed(2)} TON\nProcessing time: 3-5 days`);
    
    gameState.balance = 0;
    updateDisplay();
    await saveGameState();
}

function showMonetagAd() {
    setTimeout(() => {
        gameState.balance += 10;
        alert("✅ +10 TON added for watching ad!");
        updateDisplay();
        saveGameState();
    }, 1000);
}

function startEnergyRecharge() {
    setInterval(() => {
        if (gameState.energy < gameState.maxEnergy) {
            gameState.energy++;
            updateDisplay();
            saveGameState();
        }
    }, 300000);
}

function checkLevelUp() {
    const tapsRequired = gameState.level * 100;
    
    if (gameState.totalTaps >= tapsRequired) {
        gameState.level++;
        gameState.tapPower += 0.1;
        gameState.energy = gameState.maxEnergy;
        
        alert(`⭐ Level Up! Now Level ${gameState.level}\nTap Power: ${gameState.tapPower.toFixed(1)} TON`);
        updateDisplay();
        saveGameState();
    }
}

function showTapEffect(reward) {
    const tapBtn = document.getElementById('tap-btn');
    tapBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        tapBtn.style.transform = 'scale(1)';
    }, 150);
}

function generateReferralCode() {
    if (gameState.userId) {
        const referralCode = `TON-${gameState.userId}`;
        document.getElementById('referral-link').value = `https://t.me/TonTapMasterBot?start=${referralCode}`;
    } else {
        const randomCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        document.getElementById('referral-link').value = `https://t.me/TonTapMasterBot?start=ref-${randomCode}`;
    }
}

function displayTelegramUser(userData) {
    const userElement = document.getElementById('telegram-user');
    const userPhoto = document.getElementById('user-photo');
    const userName = document.getElementById('user-name');
    
    if (userData.username) {
        userName.textContent = `@${userData.username}`;
    } else if (userData.first_name) {
        userName.textContent = userData.first_name;
    }
    
    if (userData.photo_url) {
        userPhoto.src = userData.photo_url;
    } else {
        userPhoto.style.display = 'none';
    }
    
    userElement.style.display = 'flex';
}

function updateDisplay() {
    document.getElementById('balance').textContent = gameState.balance.toFixed(2);
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('energy').textContent = gameState.energy;
    document.getElementById('energy-fill').style.width = `${(gameState.energy / gameState.maxEnergy) * 100}%`;
    document.getElementById('tap-value').textContent = `+${calculateTapReward().toFixed(1)} TON`;
    document.getElementById('referral-count').textContent = gameState.referrals;
    document.getElementById('referral-progress').style.width = `${(gameState.referrals / 5) * 100}%`;
}

// Initialize game
window.initGame = initGame;
document.addEventListener('DOMContentLoaded', initGame);
