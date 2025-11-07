// firebase.js - Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

// Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAq7T-3RSiYrVDngGz2UCmNhj5Jj9neU_w",
    authDomain: "ton-tap-master.firebaseapp.com",
    projectId: "ton-tap-master",
    storageBucket: "ton-tap-master.firebasestorage.app",
    messagingSenderId: "796216661685",
    appId: "1:796216661685:web:7885728f25212e5133d0fc",
    measurementId: "G-THBQZYCPJJ"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firebase Functions
class FirebaseService {
    constructor() {
        this.userId = null;
        this.userData = null;
    }

    // Set user ID (Telegram user ID or generated ID)
    setUserId(id) {
        this.userId = id;
    }

    // Save user data to Firestore
    async saveUserData(userData) {
        if (!this.userId) return;

        try {
            const userRef = doc(db, 'users', this.userId);
            await setDoc(userRef, {
                ...userData,
                lastUpdated: new Date(),
                telegramData: window.Telegram?.WebApp?.initDataUnsafe?.user || null
            }, { merge: true });
            
            console.log('User data saved to Firebase');
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }

    // Load user data from Firestore
    async loadUserData() {
        if (!this.userId) return null;

        try {
            const userRef = doc(db, 'users', this.userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                this.userData = userDoc.data();
                console.log('User data loaded from Firebase');
                return this.userData;
            } else {
                console.log('No user data found in Firebase');
                return null;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }

    // Update specific fields
    async updateUserData(updates) {
        if (!this.userId) return;

        try {
            const userRef = doc(db, 'users', this.userId);
            await updateDoc(userRef, {
                ...updates,
                lastUpdated: new Date()
            });
            console.log('User data updated in Firebase');
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    }

    // Get real-time leaderboard
    setupLeaderboardListener(callback, limitCount = 10) {
        const leaderboardQuery = query(
            collection(db, 'users'),
            orderBy('balance', 'desc'),
            limit(limitCount)
        );

        return onSnapshot(leaderboardQuery, (snapshot) => {
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
    }

    // Track referral
    async trackReferral(referrerId, referredUserId) {
        try {
            const referralRef = doc(collection(db, 'referrals'));
            await setDoc(referralRef, {
                referrerId: referrerId,
                referredUserId: referredUserId,
                timestamp: new Date(),
                status: 'active'
            });
            console.log('Referral tracked in Firebase');
            return true;
        } catch (error) {
            console.error('Error tracking referral:', error);
            return false;
        }
    }

    // Get user referrals count
    async getUserReferralsCount(userId) {
        try {
            // This would require a more complex query in production
            // For now, we'll handle this in the user document
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                return userDoc.data().referrals || 0;
            }
            return 0;
        } catch (error) {
            console.error('Error getting referrals count:', error);
            return 0;
        }
    }
}

// Create global instance
const firebaseService = new FirebaseService();
export default firebaseService;
