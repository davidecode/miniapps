// Game State Management
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
    setupTelegramWebApp();
    updateDisplay();
    startEnergyRecharge();
    loadLeaderboard();
    
    // Generate referral code based on Telegram user ID or random
    generateReferralCode();
}

// Telegram Web App Setup
function setupTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        const user = Telegram.WebApp.initDataUnsafe.user;
        if (user) {
            console.log('Telegram User:', user);
            // You can use user.id for unique identification
        }
    }
}

// Generate Referral Code
function generateReferralCode() {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || Math.random().toString(36).substr(2, 8);
    const referralCode = `TON-${userId}`;
    document.getElementById('referral-link').value = `https://t.me/your_bot?start=${referralCode}`;
}

// Tap Handler
function handleTap() {
    if (gameState.energy <= 0) {
        alert("⚠️ No energy! Wait for recharge or watch ad to refill.");
        return;
    }

    // Calculate reward with cap at 5 TON
    let reward = calculateTapReward();
    
    // Update game state
    gameState.balance += reward;
    gameState.energy -= 1;
    gameState.totalTaps += 1;
    
    // Check for level up
    checkLevelUp();
    
    // Update display and save
    updateDisplay();
    saveGameState();
    
    // Visual feedback
    showTapEffect(reward);
}

// Calculate tap reward (max 5 TON)
function calculateTapReward() {
    let baseReward = gameState.tapPower;
    let totalMultiplier = 1;
    
    // Apply Facebook boost
    if (gameState.boosts.facebook.active) {
        totalMultiplier *= gameState.boosts.facebook.multiplier;
    }
    
    // Apply level multiplier
    totalMultiplier *= (1 + (gameState.level * 0.1));
    
    let reward = baseReward * totalMultiplier;
    return Math.min(reward, 5); // Cap at 5 TON
}

// Facebook Share Boost
function activateFacebookBoost() {
    const shareText = `I'm earning TON coins in TON Tap Master! 🚀 Join now and get 5 TON bonus! #TONTapMaster #TapToEarn`;
    const gameUrl = 'https://t.me/your_bot'; // Ganti dengan bot URL nanti
    
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    
    // Activate boost
    gameState.boosts.facebook.active = true;
    gameState.boosts.facebook.expires = Date.now() + (60 * 60 * 1000); // 1 hour
    
    // Bonus for sharing
    gameState.balance += 2;
    
    alert("🎉 2x Earnings Boost Activated for 1 Hour! +2 TON bonus!");
    updateDisplay();
    saveGameState();
    startBoostTimer();
}

// Boost Timer
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
            alert("⏰ Your 2x boost has ended.");
            updateDisplay();
            return;
        }
        
        const minutes = Math.floor(timeLeft / 1000 / 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        timerElement.textContent = `Boost: ${minutes}:${seconds.toString().padStart(2, '0')} left`;
        boostButton.disabled = true;
    }, 1000);
}

// Copy Referral Link
function copyReferralLink() {
    const referralInput = document.getElementById('referral-link');
    referralInput.select();
    referralInput.setSelectionRange(0, 99999);
    
    try {
        navigator.clipboard.writeText(referralInput.value);
        alert("✅ Referral link copied! Share with friends to unlock withdrawal.");
    } catch (err) {
        // Fallback for older browsers
        document.execCommand('copy');
        alert("✅ Referral link copied! Share with friends to unlock withdrawal.");
    }
}

// Add Referral (Simulated - nanti integrate dengan backend)
function addReferral() {
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
    
    updateDisplay();
    saveGameState();
}

// Unlock Withdrawal
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

// Request Withdrawal
function requestWithdrawal() {
    if (!gameState.withdrawalUnlocked) {
        alert("❌ You need 5 referrals to unlock withdrawal");
        return;
    }
    
    if (gameState.balance < 10) {
        alert("❌ Minimum withdrawal: 10 TON");
        return;
    }
    
    // Simulate withdrawal process
    const amount = gameState.balance;
    alert(`✅ Withdrawal request submitted!\nAmount: ${amount.toFixed(2)} TON\nProcessing time: 3-5 days\n\nNote: This is a demo. In production, integrate with TON wallet.`);
    
    // Reset balance after withdrawal
    gameState.balance = 0;
    updateDisplay();
    saveGameState();
}

// Monetag Ad Integration
function showMonetagAd() {
    // Ganti dengan direct link Monetag Anda
    const monetagUrl = "https://monetag.com/your-publisher-link";
    window.open(monetagUrl, '_blank');
    
    // Simulate ad completion and reward
    setTimeout(() => {
        gameState.balance += 10;
        alert("✅ +10 TON added for watching ad!");
        updateDisplay();
        saveGameState();
    }, 3000);
}

// Energy System
function startEnergyRecharge() {
    setInterval(() => {
        if (gameState.energy < gameState.maxEnergy) {
            gameState.energy++;
            updateDisplay();
            saveGameState();
        }
    }, 300000); // Recharge 1 energy every 5 minutes
}

// Level System
function checkLevelUp() {
    const tapsRequired = gameState.level * 100;
    
    if (gameState.totalTaps >= tapsRequired) {
        gameState.level++;
        gameState.tapPower += 0.1;
        gameState.energy = gameState.maxEnergy; // Refill energy on level up
        
        alert(`⭐ Level Up! Now Level ${gameState.level}\nTap Power: ${gameState.tapPower.toFixed(1)} TON`);
        updateDisplay();
        saveGameState();
    }
}

// Visual Tap Effect
function showTapEffect(reward) {
    const tapBtn = document.getElementById('tap-btn');
    const originalText = tapBtn.innerHTML;
    
    // Flash effect
    tapBtn.style.transform = 'scale(0.95)';
    tapBtn.style.background = 'linear-gradient(45deg, #ff8a00, #e52e71)';
    
    setTimeout(() => {
        tapBtn.style.transform = '';
        tapBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)';
    }, 150);
}

// Load Leaderboard (Demo Data)
function loadLeaderboard() {
    const leaderboardData = [
        { name: "CryptoMaster", score: 1234 },
        { name: "TapKing", score: 987 },
        { name: "TonHunter", score: 765 },
        { name: "You", score: Math.floor(gameState.balance) }
    ];
    
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    leaderboardData.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span>${index < 3 ? ['🥇', '🥈', '🥉'][index] : '4.'} ${player.name}</span>
            <span>${player.score} TON</span>
        `;
        leaderboardList.appendChild(item);
    });
}

// Update Display
function updateDisplay() {
    // Update balance and level
    document.getElementById('balance').textContent = gameState.balance.toFixed(2);
    document.getElementById('level').textContent = gameState.level;
    
    // Update energy
    document.getElementById('energy').textContent = gameState.energy;
    document.getElementById('energy-fill').style.width = `${(gameState.energy / gameState.maxEnergy) * 100}%`;
    
    // Update tap value display
    document.getElementById('tap-value').textContent = `+${calculateTapReward().toFixed(1)} TON`;
    
    // Update referral progress
    document.getElementById('referral-count').textContent = gameState.referrals;
    document.getElementById('referral-progress').style.width = `${(gameState.referrals / 5) * 100}%`;
    
    // Update leaderboard
    loadLeaderboard();
}

// Save/Load Game State to Local Storage
function saveGameState() {
    localStorage.setItem('tonTapMaster', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('tonTapMaster');
    if (saved) {
        gameState = JSON.parse(saved);
    }
}

// Initialize game when page loads
window.onload = initGame;

// Demo function to simulate referrals (hapus di production)
function simulateReferral() {
    addReferral();
}