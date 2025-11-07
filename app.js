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
    totalTaps: 0
};

// Initialize Game
function initGame() {
    loadGameState();
    setupTelegram();
    updateDisplay();
    startEnergyRecharge();
    generateReferralCode();
}

function setupTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        const user = Telegram.WebApp.initDataUnsafe.user;
        if (user) {
            displayTelegramUser(user);
        }
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

// Core Game Functions
function handleTap() {
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
    saveGameState();
    showTapEffect(reward);
}

function calculateTapReward() {
    let baseReward = gameState.tapPower;
    let totalMultiplier = 1;
    
    if (gameState.boosts.facebook.active) {
        totalMultiplier *= gameState.boosts.facebook.multiplier;
    }
    
    let reward = baseReward * totalMultiplier;
    return Math.min(reward, 5);
}

function activateFacebookBoost() {
    const shareText = `I'm earning TON coins in TON Tap Master! 🚀 Join now and get 5 TON bonus! #TONTapMaster #TapToEarn`;
    const gameUrl = document.getElementById('referral-link').value;
    
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    
    gameState.boosts.facebook.active = true;
    gameState.boosts.facebook.expires = Date.now() + (60 * 60 * 1000);
    gameState.balance += 2;
    
    alert("🎉 2x Earnings Boost Activated for 1 Hour! +2 TON bonus!");
    updateDisplay();
    saveGameState();
    startBoostTimer();
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

function addReferral() {
    gameState.referrals++;
    
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
    
    updateDisplay();
    saveGameState();
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

function requestWithdrawal() {
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
    saveGameState();
}

function showMonetagAd() {
    // Simulate ad view
    setTimeout(() => {
        gameState.balance += 10;
        alert("✅ +10 TON added for watching ad!");
        updateDisplay();
        saveGameState();
    }, 1000);
}

// Game Systems
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
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || Math.random().toString(36).substr(2, 8);
    const referralCode = `TON-${userId}`;
    document.getElementById('referral-link').value = `https://t.me/TonTapMasterBot?start=${referralCode}`;
}

// Display & Storage
function updateDisplay() {
    document.getElementById('balance').textContent = gameState.balance.toFixed(2);
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('energy').textContent = gameState.energy;
    document.getElementById('energy-fill').style.width = `${(gameState.energy / gameState.maxEnergy) * 100}%`;
    document.getElementById('tap-value').textContent = `+${calculateTapReward().toFixed(1)} TON`;
    document.getElementById('referral-count').textContent = gameState.referrals;
    document.getElementById('referral-progress').style.width = `${(gameState.referrals / 5) * 100}%`;
}

function saveGameState() {
    localStorage.setItem('tonTapMaster', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('tonTapMaster');
    if (saved) {
        gameState = JSON.parse(saved);
    }
}

// Initialize game
window.onload = initGame;
