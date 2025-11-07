// =============================================
// SIMPLE FIXED VERSION - TON TAP MASTER
// =============================================

console.log("🚀 TON Tap Master loaded!");

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

// ==================== INITIALIZATION ====================
function initGame() {
    console.log("🎮 Initializing game...");
    
    // Load saved game state
    loadGameState();
    
    // Setup Telegram if available
    setupTelegram();
    
    // Update display
    updateDisplay();
    
    // Start energy recharge system
    startEnergyRecharge();
    
    console.log("✅ Game initialized successfully!");
    showDebugInfo();
}

function setupTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        console.log("📱 Telegram Web App detected");
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    } else {
        console.log("🌐 Running in browser mode");
    }
}

// ==================== CORE GAME FUNCTIONS ====================
function handleTap() {
    console.log("👆 Tap detected!");
    
    if (gameState.energy <= 0) {
        alert("⚠️ No energy! Wait for recharge.");
        return;
    }

    // Calculate reward
    let reward = calculateTapReward();
    console.log(`💰 Reward: ${reward} TON`);
    
    // Update game state
    gameState.balance += reward;
    gameState.energy -= 1;
    gameState.totalTaps += 1;
    
    // Check level up
    checkLevelUp();
    
    // Update display
    updateDisplay();
    
    // Save game state
    saveGameState();
    
    // Visual feedback
    showTapEffect(reward);
}

function calculateTapReward() {
    let baseReward = gameState.tapPower;
    let totalMultiplier = 1;
    
    // Apply boost multiplier
    if (gameState.boosts.facebook.active) {
        totalMultiplier *= gameState.boosts.facebook.multiplier;
    }
    
    let reward = baseReward * totalMultiplier;
    return Math.min(reward, 5); // Cap at 5 TON
}

function activateFacebookBoost() {
    console.log("🚀 Activating Facebook boost");
    
    const shareText = `I'm earning TON coins in TON Tap Master! 🚀 Join now!`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://t.me/TonTapMasterBot')}&quote=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    
    // Activate boost
    gameState.boosts.facebook.active = true;
    gameState.boosts.facebook.expires = Date.now() + (60 * 60 * 1000); // 1 hour
    
    // Give bonus
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
            alert("⏰ Boost ended");
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
    console.log("📋 Copying referral link");
    
    const referralInput = document.getElementById('referral-link');
    referralInput.select();
    referralInput.setSelectionRange(0, 99999);
    
    try {
        navigator.clipboard.writeText(referralInput.value);
        alert("✅ Referral link copied!");
    } catch (err) {
        document.execCommand('copy');
        alert("✅ Referral link copied!");
    }
}

function addReferral() {
    console.log("👥 Adding referral");
    
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
        alert("🏆 10 referrals! VIP status! +25 TON bonus!");
    }
    
    updateDisplay();
    saveGameState();
}

function unlockWithdrawal() {
    console.log("💰 Unlocking withdrawal");
    
    gameState.withdrawalUnlocked = true;
    const statusElement = document.getElementById('withdrawal-status');
    const withdrawButton = document.getElementById('withdraw-btn');
    
    statusElement.textContent = "✅ UNLOCKED: You can now withdraw TON!";
    statusElement.className = "withdrawal-status unlocked";
    withdrawButton.disabled = false;
    withdrawButton.textContent = "💸 WITHDRAW TON";
    
    alert("🚀 WITHDRAWAL UNLOCKED!");
}

function requestWithdrawal() {
    console.log("💳 Requesting withdrawal");
    
    if (!gameState.withdrawalUnlocked) {
        alert("❌ Need 5 referrals to unlock withdrawal");
        return;
    }
    
    if (gameState.balance < 10) {
        alert("❌ Minimum withdrawal: 10 TON");
        return;
    }
    
    const amount = gameState.balance;
    alert(`✅ Withdrawal submitted!\nAmount: ${amount.toFixed(2)} TON\nProcessing: 3-5 days`);
    
    gameState.balance = 0;
    updateDisplay();
    saveGameState();
}

function showMonetagAd() {
    console.log("📺 Showing Monetag ad");
    
    // Simulate ad view
    setTimeout(() => {
        gameState.balance += 10;
        alert("✅ +10 TON added for watching ad!");
        updateDisplay();
        saveGameState();
    }, 1000);
}

// ==================== GAME SYSTEMS ====================
function startEnergyRecharge() {
    setInterval(() => {
        if (gameState.energy < gameState.maxEnergy) {
            gameState.energy++;
            updateDisplay();
            saveGameState();
        }
    }, 300000); // 5 minutes
}

function checkLevelUp() {
    const tapsRequired = gameState.level * 100;
    
    if (gameState.totalTaps >= tapsRequired) {
        gameState.level++;
        gameState.tapPower += 0.1;
        gameState.energy = gameState.maxEnergy;
        
        alert(`⭐ Level Up! Now Level ${gameState.level}`);
        updateDisplay();
        saveGameState();
    }
}

function showTapEffect(reward) {
    const tapBtn = document.getElementById('tap-btn');
    
    // Visual feedback
    tapBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        tapBtn.style.transform = 'scale(1)';
    }, 150);
}

// ==================== DISPLAY & STORAGE ====================
function updateDisplay() {
    console.log("🔄 Updating display");
    
    // Update numbers
    document.getElementById('balance').textContent = gameState.balance.toFixed(2);
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('energy').textContent = gameState.energy;
    
    // Update progress bars
    document.getElementById('energy-fill').style.width = `${(gameState.energy / gameState.maxEnergy) * 100}%`;
    document.getElementById('referral-progress').style.width = `${(gameState.referrals / 5) * 100}%`;
    
    // Update text
    document.getElementById('tap-value').textContent = `+${calculateTapReward().toFixed(1)} TON`;
    document.getElementById('referral-count').textContent = gameState.referrals;
}

function saveGameState() {
    localStorage.setItem('tonTapMaster', JSON.stringify(gameState));
    console.log("💾 Game saved");
}

function loadGameState() {
    const saved = localStorage.getItem('tonTapMaster');
    if (saved) {
        gameState = JSON.parse(saved);
        console.log("📂 Game loaded");
    }
}

// ==================== DEBUG FUNCTIONS ====================
function testButton() {
    console.log("🧪 Test button clicked!");
    alert("✅ Test button works! All JavaScript is loading correctly.");
}

function addCoins(amount) {
    gameState.balance += amount;
    updateDisplay();
    saveGameState();
    alert(`✅ +${amount} TON added!`);
}

function resetGame() {
    if (confirm("Are you sure you want to reset the game?")) {
        gameState = {
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
        updateDisplay();
        saveGameState();
        alert("🔄 Game reset!");
    }
}

function showDebugInfo() {
    const debugElement = document.getElementById('debug-info');
    debugElement.innerHTML = `
        <strong>Debug Info:</strong><br>
        Balance: ${gameState.balance} | Level: ${gameState.level} | Energy: ${gameState.energy}<br>
        Referrals: ${gameState.referrals} | Total Taps: ${gameState.totalTaps}<br>
        Withdrawal: ${gameState.withdrawalUnlocked ? 'UNLOCKED' : 'LOCKED'}
    `;
    debugElement.style.display = 'block';
}

// ==================== INITIALIZE GAME ====================
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM fully loaded");
    initGame();
});

// Fallback initialization
window.onload = function() {
    console.log("🖥️ Window loaded");
    if (typeof initGame === 'function') {
        initGame();
    } else {
        console.error("❌ initGame function not found!");
    }
};
