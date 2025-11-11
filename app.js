// app.js - Complete Version dengan Semua Fungsi
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
    username: null,
    lastMonetagShow: 0 // Timestamp terakhir show monetag
};

// Monetag Configuration
const MONETAG_CONFIG = {
    ads: [
        { url: "https://otieu.com/4/9659425", reward: 15, name: "Ad 1", icon: "🎬" },
        { url: "https://otieu.com/4/9641212", reward: 20, name: "Ad 2", icon: "🎮" },
        { url: "https://otieu.com/4/9663909", reward: 25, name: "Ad 3", icon: "💎" }
    ],
    adDuration: 10000, // 10 seconds
    showChance: 0.3, // 30% chance muncul setelah tap
    cooldown: 30000 // 30 seconds antara show monetag
};

let currentAd = null;
let adTimer = null;

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
    
    // Monetag ad buttons
    const monetagBtns = document.querySelectorAll('.monetag-ad-btn');
    monetagBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            const reward = parseInt(this.getAttribute('data-reward'));
            startMonetagAd(url, reward);
        });
    });
    
    // Close monetag modal button
    const closeMonetagModal = document.getElementById('close-monetag-modal');
    if (closeMonetagModal) {
        closeMonetagModal.addEventListener('click', closeMonetagModalFunc);
    }
    
    // Close ad progress button
    const closeAdBtn = document.getElementById('close-ad-btn');
    if (closeAdBtn) {
        closeAdBtn.addEventListener('click', closeAdProgressModal);
    }
    
    console.log("✅ All event listeners setup complete");
}

// ==================== CORE GAME FUNCTIONS ====================

function handleTap() {
    console.log("👆 Tap!");
    
    if (gameState.energy <= 0) {
        alert("⚠️ No energy! Wait for recharge.");
        return;
    }

    let reward = calculateTapReward();
    console.log(`💰 Reward: ${reward} TON`);
    
    // Update game state
    gameState.balance += reward;
    gameState.energy -= 1;
    gameState.totalTaps += 1;
    
    // Check untuk show monetag modal (30% chance + cooldown)
    const now = Date.now();
    const timeSinceLastShow = now - gameState.lastMonetagShow;
    
    if (timeSinceLastShow > MONETAG_CONFIG.cooldown && Math.random() < MONETAG_CONFIG.showChance) {
        gameState.lastMonetagShow = now;
        showMonetagModal();
    }
    
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

// ==================== MONETAG SYSTEM ====================

function showMonetagModal() {
    console.log("🎁 Showing Monetag modal after tap");
    
    const modal = document.getElementById('monetag-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Add slight animation
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 10);
    }
}

function closeMonetagModalFunc() {
    console.log("❌ Closing Monetag modal");
    
    const modal = document.getElementById('monetag-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function startMonetagAd(url, reward) {
    console.log(`📺 Starting Monetag ad: ${url} for ${reward} TON`);
    
    // Close monetag modal pertama
    closeMonetagModalFunc();
    
    currentAd = { url, reward, startTime: Date.now() };
    
    // Show progress modal
    const progressModal = document.getElementById('ad-progress-modal');
    const adRewardElement = document.getElementById('ad-reward');
    const adTimerElement = document.getElementById('ad-timer');
    
    if (progressModal && adRewardElement) {
        adRewardElement.textContent = reward;
        progressModal.style.display = 'flex';
        
        // Open ad in new tab
        const adWindow = window.open(url, '_blank');
        
        // Start progress timer
        let timeLeft = MONETAG_CONFIG.adDuration / 1000;
        const progressFill = document.getElementById('ad-progress-fill');
        
        adTimer = setInterval(() => {
            timeLeft--;
            const progress = ((MONETAG_CONFIG.adDuration / 1000 - timeLeft) / (MONETAG_CONFIG.adDuration / 1000)) * 100;
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            
            if (adTimerElement) {
                adTimerElement.textContent = `Ad completes in ${timeLeft}s...`;
            }
            
            if (timeLeft <= 0) {
                completeMonetagAd(reward);
            }
        }, 1000);
        
        // Check if user closed the ad window
        const checkAdWindow = setInterval(() => {
            if (adWindow.closed) {
                clearInterval(checkAdWindow);
                completeMonetagAd(reward);
            }
        }, 1000);
    }
}

function completeMonetagAd(reward) {
    console.log(`✅ Monetag ad completed! Awarding ${reward} TON`);
    
    if (adTimer) {
        clearInterval(adTimer);
    }
    
    // Award TON coins
    gameState.balance += reward;
    
    // Show completion message
    const adTimerElement = document.getElementById('ad-timer');
    if (adTimerElement) {
        adTimerElement.textContent = `✅ +${reward} TON Added!`;
        adTimerElement.style.color = '#4CAF50';
    }
    
    // Update display
    updateDisplay();
    saveGameState();
    
    // Auto close modal after 2 seconds
    setTimeout(() => {
        closeAdProgressModal();
        alert(`🎉 Congratulations! You earned ${reward} TON from watching the ad!`);
    }, 2000);
}

function closeAdProgressModal() {
    console.log("📺 Closing ad progress modal");
    
    const progressModal = document.getElementById('ad-progress-modal');
    if (progressModal) {
        progressModal.style.display = 'none';
    }
    
    if (adTimer) {
        clearInterval(adTimer);
    }
    
    currentAd = null;
    
    // Reset progress bar
    const progressFill = document.getElementById('ad-progress-fill');
    const adTimerElement = document.getElementById('ad-timer');
    
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    if (adTimerElement) {
        adTimerElement.textContent = 'Loading ad...';
        adTimerElement.style.color = '';
    }
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

// ==================== FIREBASE FUNCTIONS ====================

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
        // Show demo leaderboard
        updateLeaderboardDisplay([
            { username: "CryptoMaster", balance: 1234 },
            { username: "TapKing", balance: 987 },
            { username: "TonHunter", balance: 765 },
            { username: "You", balance: gameState.balance }
        ]);
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

// ==================== TELEGRAM FUNCTIONS ====================

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

function handleStartParameter() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
        const referralCode = window.Telegram.WebApp.initDataUnsafe.start_param;
        processReferral(referralCode);
    }
}

function processReferral(referralCode) {
    try {
        const referrerId = referralCode.replace('TON-', '');
        
        // Don't process self-referral
        if (referrerId === gameState.userId) return;
        
        // Track referral in Firebase
        if (window.FirebaseService) {
            FirebaseService.trackReferral(referrerId, gameState.userId);
        }
        
        // Give bonus to new user
        gameState.balance += 5;
        alert("🎉 Welcome bonus! +5 TON for joining with referral link!");
        
        // Update display and save
        updateDisplay();
        saveGameState();
        
    } catch (error) {
        console.error('Error processing referral:', error);
    }
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

// ==================== DISPLAY FUNCTIONS ====================

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

// ==================== INITIALIZATION ====================

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM fully loaded, initializing game...");
    initGame();
});

console.log("✅ TON Tap Master script loaded!");
