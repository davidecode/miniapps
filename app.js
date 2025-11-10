// app.js - Show Monetag Links After Each Tap
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

// Core Tap Function dengan Monetag Popup
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

// Show Monetag Modal dengan 3 pilihan ads
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

// Close Monetag Modal
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

// Start Monetag Ad
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

// ... (fungsi lainnya tetap sama: calculateTapReward, activateFacebookBoost, startBoostTimer, copyReferralLink, addReferral, unlockWithdrawal, requestWithdrawal, startEnergyRecharge, checkLevelUp, showTapEffect, generateReferralCode, saveGameState, loadGameState, setupLeaderboard, updateLeaderboardDisplay, displayTelegramUser, setupTelegram, handleStartParameter, processReferral)

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

console.log("✅ TON Tap Master script loaded!");
