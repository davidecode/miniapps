// firebase.js - Firebase Configuration (Regular Script)
console.log("🔥 Loading Firebase...");

// Firebase configuration - GANTI DENGAN CONFIG ANDA!
const firebaseConfig = {
    apiKey: "AIzaSyEXAMPLE1234567890",
    authDomain: "ton-tap-master.firebaseapp.com",
    projectId: "ton-tap-master",
    storageBucket: "ton-tap-master.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Firebase Service
const FirebaseService = {
    userId: null,
    userData: null,

    setUserId(id) {
        this.userId = id;
        console.log("👤 Firebase user ID set:", id);
    },

    async saveUserData(userData) {
        if (!this.userId) {
            console.log("❌ No user ID set for Firebase");
            return false;
        }

        try {
            const userRef = db.collection('users').doc(this.userId);
            await userRef.set({
                ...userData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                telegramData: window.Telegram?.WebApp?.initDataUnsafe?.user || null
            }, { merge: true });
            
            console.log('✅ User data saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Error saving user data:', error);
            return false;
        }
    },

    async loadUserData() {
        if (!this.userId) {
            console.log("❌ No user ID set for Firebase");
            return null;
        }

        try {
            const userRef = db.collection('users').doc(this.userId);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                this.userData = userDoc.data();
                console.log('✅ User data loaded from Firebase');
                return this.userData;
            } else {
                console.log('ℹ️ No user data found in Firebase');
                return null;
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            return null;
        }
    },

    async updateUserData(updates) {
        if (!this.userId) return;

        try {
            const userRef = db.collection('users').doc(this.userId);
            await userRef.update({
                ...updates,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ User data updated in Firebase');
        } catch (error) {
            console.error('❌ Error updating user data:', error);
        }
    },

    setupLeaderboardListener(callback, limitCount = 10) {
        const leaderboardQuery = db.collection('users')
            .orderBy('balance', 'desc')
            .limit(limitCount);

        return leaderboardQuery.onSnapshot((snapshot) => {
            const leaderboard = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                leaderboard.push({
                    id: doc.id,
                    username: data.username || 'Anonymous',
                    balance: data.balance || 0,
                    level: data.level || 1,
                    referrals: data.referrals || 0
                });
            });
            callback(leaderboard);
        });
    },

    async trackReferral(referrerId, referredUserId) {
        try {
            await db.collection('referrals').add({
                referrerId: referrerId,
                referredUserId: referredUserId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });
            console.log('✅ Referral tracked in Firebase');
            return true;
        } catch (error) {
            console.error('❌ Error tracking referral:', error);
            return false;
        }
    }
};

console.log("✅ Firebase loaded successfully!");
