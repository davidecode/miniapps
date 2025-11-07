// Telegram Web App Integration
let tg = null;
let user = null;

// Initialize Game dengan Telegram
function initGame() {
    setupTelegramWebApp();
    loadGameState();
    updateDisplay();
    startEnergyRecharge();
    loadLeaderboard();
    generateReferralCode();
}

// Enhanced Telegram Setup
function setupTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        
        // Expand to full screen
        tg.expand();
        tg.enableClosingConfirmation();
        
        // Get user data
        user = tg.initDataUnsafe?.user;
        
        if (user) {
            displayTelegramUser(user);
            initializeUserData(user);
        }
        
        // Setup back button
        tg.BackButton.onClick(() => {
            tg.close();
        });
        
        // Theme handling
        tg.onEvent('themeChanged', updateTheme);
        updateTheme();
        
        console.log('Telegram Web App initialized:', user);
    } else {
        console.log('Running in browser mode');
        // Fallback for browser testing
        user = { id: Math.floor(Math.random() * 1000000), username: 'TestUser' };
        initializeUserData(user);
    }
}

// Display Telegram User Info
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

// Initialize User Data
function initializeUserData(userData) {
    // Generate unique user ID based on Telegram ID
    const userId = userData.id.toString();
    
    // Check if user exists in local storage, if not create new
    if (!localStorage.getItem(`tonTapMaster_${userId}`)) {
        gameState.userId = userId;
        gameState.username = userData.username || `user_${userId}`;
        gameState.createdAt = new Date().toISOString();
        saveGameState();
    } else {
        loadGameState();
    }
}

// Update Theme based on Telegram
function updateTheme() {
    if (!tg) return;
    
    const theme = tg.colorScheme;
    const bgColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    const textColor = theme === 'dark' ? '#ffffff' : '#000000';
    
    document.body.style.background = bgColor;
    document.body.style.color = textColor;
    
    // Update CSS variables for theme
    document.documentElement.style.setProperty('--bg-color', bgColor);
    document.documentElement.style.setProperty('--text-color', textColor);
}

// Enhanced Referral Code Generation
function generateReferralCode() {
    if (user) {
        const referralCode = `TON-${user.id}`;
        const botUsername = 'TonTapMasterBot'; // Ganti dengan username bot Anda
        const referralLink = `https://t.me/${botUsername}?start=${referralCode}`;
        document.getElementById('referral-link').value = referralLink;
    } else {
        // Fallback for browser
        const randomCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        document.getElementById('referral-link').value = `https://t.me/TonTapMasterBot?start=ref-${randomCode}`;
    }
}

// Handle Start Parameter (Referral)
function handleStartParameter() {
    if (tg && tg.initDataUnsafe.start_param) {
        const referralCode = tg.initDataUnsafe.start_param;
        processReferral(referralCode);
    }
}

// Process Referral Code
function processReferral(referralCode) {
    // Extract referrer ID from referral code
    const referrerId = referralCode.replace('TON-', '');
    
    if (referrerId && referrerId !== user.id.toString()) {
        // Simulate referral processing
        setTimeout(() => {
            tg.showPopup({
                title: '🎉 Referral Bonus!',
                message: 'You joined using a referral link! +5 TON bonus!',
                buttons: [{ type: 'ok' }]
            });
            
            gameState.balance += 5;
            updateDisplay();
            saveGameState();
        }, 1000);
    }
}

// Enhanced Share Function untuk Telegram
function shareToTelegram() {
    const shareText = `I'm earning TON coins in TON Tap Master! 🚀\n\nI've already earned ${gameState.balance.toFixed(2)} TON!\n\nJoin now and get 5 TON bonus using my link:`;
    const referralLink = document.getElementById('referral-link').value;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    
    // Give sharing bonus
    gameState.balance += 2;
    tg.showAlert('Thanks for sharing! +2 TON bonus!');
    
    updateDisplay();
    saveGameState();
}

// Enhanced Facebook Share dengan Telegram Fallback
function activateFacebookBoost() {
    if (tg && tg.platform !== 'unknown') {
        // Jika di Telegram, gunakan Telegram share
        shareToTelegram();
    } else {
        // Fallback ke Facebook share
        const shareText = `I'm earning TON coins in TON Tap Master! 🚀 Join now and get 5 TON bonus! #TONTapMaster #TapToEarn`;
        const gameUrl = document.getElementById('referral-link').value;
        
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(shareText)}`;
        
        window.open(shareUrl, '_blank');
    }
    
    // Activate boost
    gameState.boosts.facebook.active = true;
    gameState.boosts.facebook.expires = Date.now() + (60 * 60 * 1000);
    
    tg.showAlert('🎉 2x Earnings Boost Activated for 1 Hour!');
    updateDisplay();
    saveGameState();
    startBoostTimer();
}

// Enhanced Save/Load Game State
function saveGameState() {
    if (user) {
        const userKey = `tonTapMaster_${user.id}`;
        localStorage.setItem(userKey, JSON.stringify(gameState));
    } else {
        localStorage.setItem('tonTapMaster', JSON.stringify(gameState));
    }
}

function loadGameState() {
    let saved;
    if (user) {
        const userKey = `tonTapMaster_${user.id}`;
        saved = localStorage.getItem(userKey);
    } else {
        saved = localStorage.getItem('tonTapMaster');
    }
    
    if (saved) {
        const parsed = JSON.parse(saved);
        gameState = { ...gameState, ...parsed };
    }
}

// Telegram-specific Features
function showTelegramConfirm(message, callback) {
    if (tg) {
        tg.showConfirm(message, callback);
    } else {
        if (confirm(message)) {
            callback(true);
        }
    }
}

function showTelegramAlert(message) {
    if (tg) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

// Enhanced Withdrawal dengan Telegram Popup
function requestWithdrawal() {
    if (!gameState.withdrawalUnlocked) {
        showTelegramAlert("❌ You need 5 referrals to unlock withdrawal");
        return;
    }
    
    if (gameState.balance < 10) {
        showTelegramAlert("❌ Minimum withdrawal: 10 TON");
        return;
    }
    
    const withdrawalMessage = `💰 Withdrawal Request\n\nAmount: ${gameState.balance.toFixed(2)} TON\nProcessing: 3-5 days\n\nConfirm withdrawal?`;
    
    showTelegramConfirm(withdrawalMessage, (confirmed) => {
        if (confirmed) {
            // Simulate withdrawal processing
            const amount = gameState.balance;
            gameState.balance = 0;
            
            showTelegramAlert(`✅ Withdrawal submitted!\nAmount: ${amount.toFixed(2)} TON\n\nIn production, this would be sent to your TON wallet.`);
            
            updateDisplay();
            saveGameState();
        }
    });
}

// Handle Deep Linking
function handleDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start');
    
    if (startParam) {
        processReferral(startParam);
    }
}

// Initialize when page loads
window.onload = function() {
    initGame();
    handleStartParameter();
    handleDeepLink();
};

// Game State (tetap sama dengan sebelumnya)
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
    createdAt: null
};

// ... (fungsi-fungsi game lainnya tetap sama: handleTap, calculateTapReward, startBoostTimer, copyReferralLink, addReferral, unlockWithdrawal, showMonetagAd, startEnergyRecharge, checkLevelUp, showTapEffect, loadLeaderboard, updateDisplay)
// ... (energy system, level system, visual effects - sama seperti sebelumnya)
