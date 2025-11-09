// app.js - Regular Script Version
console.log("🎮 Loading TON Tap Master...");

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

// Initialize Game
async function initGame() {
    console.log("🎮 Initializing game...");
    
    // Setup event listeners first
    setupEventListeners();
    
    // Setup Telegram
    await setupTelegram();
    
    // Load game state
    await loadGameState();
    
    // Update display
    updateDisplay();
    
    // Start systems
    startEnergyRecharge();
    generateReferralCode();
    setupLeaderboard();
    
    console.log("✅ Game initialized successfully!");
}

// Setup Event Listeners
function setupEventListeners() {
    console.log("🔗 Setting up event listeners...");
    
    // Tap button
    const tapBtn = document.getElementById('tap-btn');
    if (tapBtn) {
        tapBtn.addEventListener('click', handleTap);
        console.log("✅ Tap button listener added");
    }
    
    // Boost button
    const boostBtn = document.getElementById('boost-btn');
    if (boostBtn) {
        boostBtn.addEventListener('click', activateFacebookBoost);
        console.log("✅ Boost button listener added");
    }
    
    // Copy referral button
    const copyRefBtn = document.getElementById('copy-ref-btn');
    if (copyRefBtn) {
        copyRefBtn.addEventListener('click', copyReferralLink);
        console.log("✅ Copy referral button listener added");
    }
    
    // Withdraw button
    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', requestWithdrawal);
        console.log("✅ Withdraw button listener added");
    }
    
    // Monetag ad button
    const monetagBtn = document.getElementById('monetag-ad-btn');
    if (monetagBtn) {
        monetagBtn.addEventListener('click', showMonetagAd);
        console.log("✅ Monetag button listener added");
    }
    
    console.log("✅ All event listeners setup complete");
}

// Telegram Setup
async function setupTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        console.log("📱 Telegram Web App detected");
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
            if (window.FirebaseService) {
                FirebaseService.setUserId(userId);
            }
            
            // Handle referral from start parameter
            handleStartParameter();
        }
    } else {
        console.log("🌐 Running in browser mode");
        // Fallback for browser testing
        const testUserId = 'test_' + Math.random().toString(36).substr(2, 9);
        gameState.userId = testUserId;
        gameState.username = 'Test User';
        if (window.FirebaseService) {
            FirebaseService.setUserId(testUserId);
        }
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
        if (window.FirebaseService) {
            const success = await FirebaseService.trackReferral(referrerId, gameState.userId);
            
            if (success) {
                // Give bonus to new user
                gameState.balance += 5;
                alert("🎉 Welcome bonus! +5 TON for joining with referral link!");
                
                // Update display and save
                updateDisplay();
                await saveGameState();
            }
        }
    } catch (error) {
        console.error('Error processing referral:', error);
    }
}

// Core Game Functions
function handleTap() {
    console.log("👆 Tap!");
    
    if (gameState.energy <= 0) {
        alert("⚠️ No energy! Wait for recharge.");
        return;
    }

    let reward = calculateTapReward();
    console.log(`💰 Reward: ${reward} TON`);
    
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
    console.log("🚀 Activating Facebook boost");
    
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
    console.log("📋 Copying referral link");
    
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
    console.log("👥 Adding referral");
    
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
    console.log("💰 Unlocking withdrawal");
    
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
    console.log("💳 Requesting withdrawal");
    
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
    console.log("📺 Showing Monetag ad");
    
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
    if (gameState.userId) {
        const referralCode = `TON-${gameState.userId}`;
        document.getElementById('referral-link').value = `https://t.me/TonTapMasterBot?start=${referralCode}`;
    } else {
        const randomCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        document.getElementById('referral-link').value = `https://t.me/TonTapMasterBot?start=ref-${randomCode}`;
    }
}

// Firebase Functions
async function saveGameState() {
    // Save to localStorage
    localStorage.setItem('tonTapMaster', JSON.stringify(gameState));
    
    // Save to Firebase if available
    if (gameState.userId && window.FirebaseService) {
        await FirebaseService.saveUserData(gameState);
    }
}

async function loadGameState() {
    // Try to load from Firebase first
    if (gameState.userId && window.FirebaseService) {
        const firebaseData = await FirebaseService.loadUserData();
        
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

function setupLeaderboard() {
    if (window.FirebaseService) {
        FirebaseService.setupLeaderboardListener((leaderboard) => {
            updateLeaderboardDisplay(leaderboard);
        }, 10);
    } else {
        console.log("❌ Firebase not available for leaderboard");
    }
}

function updateLeaderboardDisplay(leaderboard) {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    
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

function displayTelegramUser(userData) {
    const userElement = document.getElementById('telegram-user');
    const userPhoto = document.getElementById('user-photo');
    const userName = document.getElementById('user-name');
    
    if (!userElement || !userName) return;
    
    if (userData.username) {
        userName.textContent = `@${userData.username}`;
    } else if (userData.first_name) {
        userName.textContent = userData.first_name;
    }
    
    if (userData.photo_url && userPhoto) {
        userPhoto.src = userData.photo_url;
    } else if (userPhoto) {
        userPhoto.style.display = 'none';
    }
    
    userElement.style.display = 'flex';
}

function updateDisplay() {
    // Update balance and level
    const balanceElement = document.getElementById('balance');
    const levelElement = document.getElementById('level');
    const energyElement = document.getElementById('energy');
    const energyFillElement = document.getElementById('energy-fill');
    const tapValueElement = document.getElementById('tap-value');
    const referralCountElement = document.getElementById('referral-count');
    const referralProgressElement = document.getElementById('referral-progress');
    
    if (balanceElement) balanceElement.textContent = gameState.balance.toFixed(2);
    if (levelElement) levelElement.textContent = gameState.level;
    if (energyElement) energyElement.textContent = gameState.energy;
    if (energyFillElement) energyFillElement.style.width = `${(gameState.energy / gameState.maxEnergy) * 100}%`;
    if (tapValueElement) tapValueElement.textContent = `+${calculateTapReward().toFixed(1)} TON`;
    if (referralCountElement) referralCountElement.textContent = gameState.referrals;
    if (referralProgressElement) referralProgressElement.style.width = `${(gameState.referrals / 5) * 100}%`;
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM fully loaded, initializing game...");
    initGame();
});

// Make functions globally available for testing
window.handleTap = handleTap;
window.activateFacebookBoost = activateFacebookBoost;
window.copyReferralLink = copyReferralLink;
window.requestWithdrawal = requestWithdrawal;
window.showMonetagAd = showMonetagAd;
window.addReferral = addReferral;

console.log("✅ TON Tap Master script loaded!");
