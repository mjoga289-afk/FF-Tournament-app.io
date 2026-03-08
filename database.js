// database.js
// Complete IndexedDB Database for Free Fire Tournament Website

class TournamentDB {
    constructor() {
        this.dbName = 'tunff09_live_db';
        this.dbVersion = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            try {
                // First delete any old database with same name to ensure clean state
                const deleteRequest = indexedDB.deleteDatabase(this.dbName);
                
                deleteRequest.onsuccess = () => {
                    console.log('Old database deleted, creating new one...');
                    this.createNewDatabase(resolve, reject);
                };
                
                deleteRequest.onerror = () => {
                    console.log('Could not delete old database, creating new anyway...');
                    this.createNewDatabase(resolve, reject);
                };
                
                // Set timeout for safety
                setTimeout(() => {
                    this.createNewDatabase(resolve, reject);
                }, 500);
                
            } catch (error) {
                console.error('Init error:', error);
                reject(error);
            }
        });
    }
    
    createNewDatabase(resolve, reject) {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database initialization failed');
        };

        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('✅ Database initialized successfully');
            resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            console.log('Creating database stores...');

            // ========== USERS STORE ==========
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', { keyPath: 'uid' });
                userStore.createIndex('email', 'email', { unique: true });
                userStore.createIndex('ffid', 'ffid', { unique: false });
                userStore.createIndex('phone', 'phone', { unique: false });
                console.log('✅ Users store created');
            }

            // ========== TASKS STORE ==========
            if (!db.objectStoreNames.contains('tasks')) {
                const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
                taskStore.createIndex('type', 'type', { unique: false });
                taskStore.createIndex('createdAt', 'createdAt', { unique: false });
                console.log('✅ Tasks store created');
            }

            // ========== COMPLETED TASKS STORE ==========
            if (!db.objectStoreNames.contains('completed_tasks')) {
                const completedStore = db.createObjectStore('completed_tasks', { keyPath: 'id', autoIncrement: true });
                completedStore.createIndex('userId', 'userId', { unique: false });
                completedStore.createIndex('taskId', 'taskId', { unique: false });
                completedStore.createIndex('completedAt', 'completedAt', { unique: false });
                completedStore.createIndex('user_task', ['userId', 'taskId'], { unique: true });
                console.log('✅ Completed tasks store created');
            }

            // ========== YOUTUBE TASKS STORE ==========
            if (!db.objectStoreNames.contains('youtube_tasks')) {
                const youtubeStore = db.createObjectStore('youtube_tasks', { keyPath: 'id', autoIncrement: true });
                youtubeStore.createIndex('code', 'code', { unique: true });
                youtubeStore.createIndex('createdAt', 'createdAt', { unique: false });
                youtubeStore.createIndex('validUntil', 'validUntil', { unique: false });
                console.log('✅ YouTube tasks store created');
            }

            // ========== COMPLETED YOUTUBE TASKS STORE ==========
            if (!db.objectStoreNames.contains('completed_youtube_tasks')) {
                const completedYtStore = db.createObjectStore('completed_youtube_tasks', { keyPath: 'id', autoIncrement: true });
                completedYtStore.createIndex('userId', 'userId', { unique: false });
                completedYtStore.createIndex('taskId', 'taskId', { unique: false });
                completedYtStore.createIndex('completedAt', 'completedAt', { unique: false });
                completedYtStore.createIndex('user_task', ['userId', 'taskId'], { unique: true });
                console.log('✅ Completed YouTube tasks store created');
            }

            // ========== TOURNAMENTS STORE ==========
            if (!db.objectStoreNames.contains('tournaments')) {
                const tournamentStore = db.createObjectStore('tournaments', { keyPath: 'id', autoIncrement: true });
                tournamentStore.createIndex('status', 'status', { unique: false });
                tournamentStore.createIndex('startTime', 'startTime', { unique: false });
                tournamentStore.createIndex('createdAt', 'createdAt', { unique: false });
                console.log('✅ Tournaments store created');
            }

            // ========== TOURNAMENT PARTICIPANTS STORE ==========
            if (!db.objectStoreNames.contains('tournament_participants')) {
                const participantStore = db.createObjectStore('tournament_participants', { keyPath: 'id', autoIncrement: true });
                participantStore.createIndex('tournamentId', 'tournamentId', { unique: false });
                participantStore.createIndex('userId', 'userId', { unique: false });
                participantStore.createIndex('status', 'status', { unique: false });
                participantStore.createIndex('joinedAt', 'joinedAt', { unique: false });
                participantStore.createIndex('tournament_user', ['tournamentId', 'userId'], { unique: true });
                console.log('✅ Tournament participants store created');
            }

            // ========== TOURNAMENT SELECTIONS STORE ==========
            if (!db.objectStoreNames.contains('tournament_selections')) {
                const selectionStore = db.createObjectStore('tournament_selections', { keyPath: 'id', autoIncrement: true });
                selectionStore.createIndex('tournamentId', 'tournamentId', { unique: false });
                selectionStore.createIndex('round', 'round', { unique: false });
                selectionStore.createIndex('selectedAt', 'selectedAt', { unique: false });
                console.log('✅ Tournament selections store created');
            }

            // ========== CONFIG STORE ==========
            if (!db.objectStoreNames.contains('config')) {
                db.createObjectStore('config', { keyPath: 'key' });
                console.log('✅ Config store created');
            }

            // ========== SEED INITIAL DATA ==========
            this.seedInitialData(db);
        };
    }

    // Seed initial data
    seedInitialData(db) {
        try {
            console.log('Seeding initial data...');
            
            // Add default config
            const configTx = db.transaction('config', 'readwrite');
            const configStore = configTx.objectStore('config');
            
            configStore.put({ key: 'notice', value: '🎮 নতুন টুর্নামেন্ট শুরু হয়েছে! ৫০০০ টাকা প্রাইজ পুল।' });
            configStore.put({ key: 'about', value: '১. টুর্নামেন্টে কোন চিটিংবাজি করা যাবে না\n২. ফোন হ্যাক ইউজ করা যাবে না\n৩. আইডি হতে হবে ৪০ লেভেলের উপরে\n৪. প্রতিটি টুর্নামেন্টে র‍্যান্ডম ৫০% প্লেয়ার পাবে রুম আইডি\n৫. প্রতিদিন নতুন টাস্ক যোগ করা হয়' });
            configStore.put({ key: 'whatsapp_number', value: '8801234567890' });
            configStore.put({ key: 'whatsapp_message', value: 'Hi, I need help with tunff09' });
            configStore.put({ key: 'telegram_link', value: 'https://t.me/tunff09' });
            configStore.put({ key: 'support_email', value: 'support@tunff09.com' });
            
            // Add sample tasks
            const tasksTx = db.transaction('tasks', 'readwrite');
            const tasksStore = tasksTx.objectStore('tasks');
            
            tasksStore.put({
                title: 'ইউটিউব ভিডিও দেখুন',
                description: 'আমাদের ইউটিউব চ্যানেলের যেকোনো ভিডিও দেখুন এবং লাইক দিন',
                reward: 5,
                type: 'youtube',
                link: 'https://youtube.com',
                createdAt: new Date().toISOString()
            });
            
            tasksStore.put({
                title: 'ফেসবুক পোস্ট শেয়ার করুন',
                description: 'আমাদের ফেসবুক পেজের পোস্ট শেয়ার করুন',
                reward: 3,
                type: 'facebook',
                link: 'https://facebook.com',
                createdAt: new Date().toISOString()
            });
            
            tasksStore.put({
                title: 'ডেইলি চেক-ইন',
                description: 'প্রতিদিন ওয়েবসাইটে লগইন করুন এবং ২ কয়েন বোনাস নিন',
                reward: 2,
                type: 'daily',
                link: null,
                createdAt: new Date().toISOString()
            });
            
            // Add sample tournament
            const tournamentTx = db.transaction('tournaments', 'readwrite');
            const tournamentStore = tournamentTx.objectStore('tournaments');
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            tournamentStore.put({
                name: 'উইকলি চ্যাম্পিয়নশিপ',
                type: 'squad',
                map: 'bermuda',
                entryFee: 10,
                maxPlayers: 100,
                prizePool: '৫০০০',
                startTime: tomorrow.toISOString(),
                status: 'upcoming',
                currentParticipants: 0,
                selectedParticipants: 0,
                createdAt: new Date().toISOString()
            });
            
            console.log('✅ Initial data seeded successfully');
        } catch (error) {
            console.error('Error seeding initial data:', error);
        }
    }

    // ==================== USER FUNCTIONS ====================

    async getAllUsers() {
        try {
            const tx = this.db.transaction('users', 'readonly');
            const store = tx.objectStore('users');
            return await store.getAll();
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }

    async getUser(userId) {
        try {
            const tx = this.db.transaction('users', 'readonly');
            const store = tx.objectStore('users');
            return await store.get(userId);
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async getUserByEmail(email) {
        try {
            const tx = this.db.transaction('users', 'readonly');
            const store = tx.objectStore('users');
            const index = store.index('email');
            return await index.get(email);
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    async getUserByEmailAndPassword(email, password) {
        try {
            const tx = this.db.transaction('users', 'readonly');
            const store = tx.objectStore('users');
            const index = store.index('email');
            const user = await index.get(email);
            
            if (user && user.password === password) {
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error getting user by email and password:', error);
            return null;
        }
    }

    async createUser(userData) {
        try {
            const tx = this.db.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            
            // Check if email already exists
            const emailIndex = store.index('email');
            const existingUser = await emailIndex.get(userData.email);
            
            if (existingUser) {
                return { success: false, error: 'Email already exists' };
            }
            
            await store.put(userData);
            return { success: true, user: userData };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(userId, updates) {
        try {
            const tx = this.db.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            const user = await store.get(userId);
            
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            
            const updatedUser = { ...user, ...updates };
            await store.put(updatedUser);
            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUserCoins(userId, amount) {
        try {
            const tx = this.db.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            const user = await store.get(userId);
            
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            
            user.coins = (user.coins || 0) + amount;
            await store.put(user);
            return { success: true, newCoins: user.coins };
        } catch (error) {
            console.error('Error updating user coins:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteUser(userId) {
        try {
            const tx = this.db.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            await store.delete(userId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: error.message };
        }
    }

    async searchUsers(searchTerm) {
        try {
            const allUsers = await this.getAllUsers();
            
            if (!searchTerm) return allUsers;
            
            const term = searchTerm.toLowerCase();
            return allUsers.filter(user => 
                (user.email && user.email.toLowerCase().includes(term)) ||
                (user.ffid && user.ffid.toLowerCase().includes(term)) ||
                (user.phone && user.phone.includes(term))
            );
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    }

    // ==================== TASK FUNCTIONS ====================

    async getAllTasks() {
        try {
            const tx = this.db.transaction('tasks', 'readonly');
            const store = tx.objectStore('tasks');
            return await store.getAll();
        } catch (error) {
            console.error('Error getting all tasks:', error);
            return [];
        }
    }

    async createTask(taskData) {
        try {
            const tx = this.db.transaction('tasks', 'readwrite');
            const store = tx.objectStore('tasks');
            
            const newTask = {
                ...taskData,
                createdAt: new Date().toISOString()
            };
            
            const id = await store.put(newTask);
            return { success: true, id: id };
        } catch (error) {
            console.error('Error creating task:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteTask(taskId) {
        try {
            const tx = this.db.transaction('tasks', 'readwrite');
            const store = tx.objectStore('tasks');
            await store.delete(Number(taskId));
            return { success: true };
        } catch (error) {
            console.error('Error deleting task:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserCompletedTasks(userId) {
        try {
            const tx = this.db.transaction('completed_tasks', 'readonly');
            const store = tx.objectStore('completed_tasks');
            const index = store.index('userId');
            return await index.getAll(userId);
        } catch (error) {
            console.error('Error getting user completed tasks:', error);
            return [];
        }
    }

    async getAllCompletedTasks() {
        try {
            const tx = this.db.transaction('completed_tasks', 'readonly');
            const store = tx.objectStore('completed_tasks');
            return await store.getAll();
        } catch (error) {
            console.error('Error getting all completed tasks:', error);
            return [];
        }
    }

    async completeTask(userId, taskId, reward) {
        try {
            const tx = this.db.transaction(['completed_tasks', 'users'], 'readwrite');
            
            // Check if already completed
            const completedStore = tx.objectStore('completed_tasks');
            const userTaskIndex = completedStore.index('user_task');
            
            try {
                const existing = await userTaskIndex.get([userId, Number(taskId)]);
                if (existing) {
                    throw new Error('Task already completed');
                }
            } catch (e) {
                // If index doesn't exist, check manually
                const userCompleted = await this.getUserCompletedTasks(userId);
                const alreadyCompleted = userCompleted.some(ct => ct.taskId === Number(taskId));
                if (alreadyCompleted) {
                    throw new Error('Task already completed');
                }
            }
            
            // Add to completed tasks
            await completedStore.put({
                userId,
                taskId: Number(taskId),
                completedAt: new Date().toISOString()
            });
            
            // Update user coins
            const userStore = tx.objectStore('users');
            const user = await userStore.get(userId);
            
            if (user) {
                user.coins = (user.coins || 0) + reward;
                user.tasksCompleted = (user.tasksCompleted || 0) + 1;
                await userStore.put(user);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error completing task:', error);
            throw error;
        }
    }

    // ==================== YOUTUBE TASK FUNCTIONS ====================

    async getAllYouTubeCodeTasks() {
        try {
            const tx = this.db.transaction('youtube_tasks', 'readonly');
            const store = tx.objectStore('youtube_tasks');
            return await store.getAll();
        } catch (error) {
            console.error('Error getting all YouTube tasks:', error);
            return [];
        }
    }

    async createYouTubeCodeTask(taskData) {
        try {
            const tx = this.db.transaction('youtube_tasks', 'readwrite');
            const store = tx.objectStore('youtube_tasks');
            
            // Check if code is unique
            const codeIndex = store.index('code');
            const existing = await codeIndex.get(taskData.code);
            
            if (existing) {
                return { success: false, error: 'Code already exists' };
            }
            
            const validUntil = new Date();
            validUntil.setHours(validUntil.getHours() + taskData.validHours);
            
            const newTask = {
                title: taskData.title,
                description: 'ইউটিউব ভিডিও দেখুন এবং ভিতরের কোড ব্যবহার করুন',
                videoLink: taskData.videoLink,
                code: taskData.code,
                reward: taskData.reward,
                validUntil: validUntil.toISOString(),
                createdAt: new Date().toISOString()
            };
            
            const id = await store.put(newTask);
            return { success: true, id: id };
        } catch (error) {
            console.error('Error creating YouTube task:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteYouTubeCodeTask(taskId) {
        try {
            const tx = this.db.transaction('youtube_tasks', 'readwrite');
            const store = tx.objectStore('youtube_tasks');
            await store.delete(Number(taskId));
            return { success: true };
        } catch (error) {
            console.error('Error deleting YouTube task:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserCompletedYouTubeTasks(userId) {
        try {
            const tx = this.db.transaction('completed_youtube_tasks', 'readonly');
            const store = tx.objectStore('completed_youtube_tasks');
            const index = store.index('userId');
            return await index.getAll(userId);
        } catch (error) {
            console.error('Error getting user completed YouTube tasks:', error);
            return [];
        }
    }

    async getAllCompletedYouTubeTasks() {
        try {
            const tx = this.db.transaction('completed_youtube_tasks', 'readonly');
            const store = tx.objectStore('completed_youtube_tasks');
            return await store.getAll();
        } catch (error) {
            console.error('Error getting all completed YouTube tasks:', error);
            return [];
        }
    }

    async verifyYouTubeCode(userId, taskId, enteredCode, reward) {
        try {
            const tx = this.db.transaction(['youtube_tasks', 'completed_youtube_tasks', 'users'], 'readwrite');
            
            // Get task
            const taskStore = tx.objectStore('youtube_tasks');
            const task = await taskStore.get(Number(taskId));
            
            if (!task) {
                return { success: false, message: 'Task not found' };
            }
            
            // Check expiry
            if (new Date(task.validUntil) < new Date()) {
                return { success: false, message: 'Task expired' };
            }
            
            // Check code
            if (task.code !== enteredCode) {
                return { success: false, message: 'Wrong code' };
            }
            
            // Check if already completed
            const completedStore = tx.objectStore('completed_youtube_tasks');
            const userTaskIndex = completedStore.index('user_task');
            
            try {
                const existing = await userTaskIndex.get([userId, Number(taskId)]);
                if (existing) {
                    return { success: false, message: 'Already completed' };
                }
            } catch (e) {
                const userCompleted = await this.getUserCompletedYouTubeTasks(userId);
                const alreadyCompleted = userCompleted.some(ct => ct.taskId === Number(taskId));
                if (alreadyCompleted) {
                    return { success: false, message: 'Already completed' };
                }
            }
            
            // Add to completed
            await completedStore.put({
                userId,
                taskId: Number(taskId),
                completedAt: new Date().toISOString()
            });
            
            // Update user coins
            const userStore = tx.objectStore('users');
            const user = await userStore.get(userId);
            
            if (user) {
                user.coins = (user.coins || 0) + reward;
                user.tasksCompleted = (user.tasksCompleted || 0) + 1;
                await userStore.put(user);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error verifying YouTube code:', error);
            return { success: false, message: error.message };
        }
    }

    // ==================== TOURNAMENT FUNCTIONS ====================

    async getAllTournaments() {
        try {
            const tx = this.db.transaction('tournaments', 'readonly');
            const store = tx.objectStore('tournaments');
            return await store.getAll();
        } catch (error) {
            console.error('Error getting all tournaments:', error);
            return [];
        }
    }

    async getTournament(tournamentId) {
        try {
            const tx = this.db.transaction('tournaments', 'readonly');
            const store = tx.objectStore('tournaments');
            return await store.get(Number(tournamentId));
        } catch (error) {
            console.error('Error getting tournament:', error);
            return null;
        }
    }

    async createTournament(tournamentData) {
        try {
            const tx = this.db.transaction('tournaments', 'readwrite');
            const store = tx.objectStore('tournaments');
            
            const newTournament = {
                ...tournamentData,
                status: 'upcoming',
                currentParticipants: 0,
                selectedParticipants: 0,
                createdAt: new Date().toISOString()
            };
            
            const id = await store.put(newTournament);
            return { success: true, id: id };
        } catch (error) {
            console.error('Error creating tournament:', error);
            return { success: false, error: error.message };
        }
    }

    async updateTournament(tournamentId, updates) {
        try {
            const tx = this.db.transaction('tournaments', 'readwrite');
            const store = tx.objectStore('tournaments');
            const tournament = await store.get(Number(tournamentId));
            
            if (!tournament) {
                return { success: false, error: 'Tournament not found' };
            }
            
            const updatedTournament = { ...tournament, ...updates };
            await store.put(updatedTournament);
            return { success: true };
        } catch (error) {
            console.error('Error updating tournament:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteTournament(tournamentId) {
        try {
            const tx = this.db.transaction(['tournaments', 'tournament_participants', 'tournament_selections'], 'readwrite');
            
            // Delete tournament
            const tournamentStore = tx.objectStore('tournaments');
            await tournamentStore.delete(Number(tournamentId));
            
            // Delete all participants
            const participantStore = tx.objectStore('tournament_participants');
            const participantIndex = participantStore.index('tournamentId');
            const participants = await participantIndex.getAll(Number(tournamentId));
            
            for (const participant of participants) {
                await participantStore.delete(participant.id);
            }
            
            // Delete all selections
            const selectionStore = tx.objectStore('tournament_selections');
            const selectionIndex = selectionStore.index('tournamentId');
            const selections = await selectionIndex.getAll(Number(tournamentId));
            
            for (const selection of selections) {
                await selectionStore.delete(selection.id);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting tournament:', error);
            return { success: false, error: error.message };
        }
    }

    async joinTournament(tournamentId, userId, userDetails) {
        try {
            const tx = this.db.transaction(['tournaments', 'tournament_participants', 'users'], 'readwrite');
            
            // Check tournament
            const tournamentStore = tx.objectStore('tournaments');
            const tournament = await tournamentStore.get(Number(tournamentId));
            
            if (!tournament) {
                return { success: false, error: 'Tournament not found' };
            }
            
            if (tournament.status !== 'upcoming') {
                return { success: false, error: 'Tournament is not available for joining' };
            }
            
            if (tournament.currentParticipants >= tournament.maxPlayers) {
                return { success: false, error: 'Tournament is full' };
            }
            
            // Check if already joined
            const participantStore = tx.objectStore('tournament_participants');
            const tournamentUserIndex = participantStore.index('tournament_user');
            
            try {
                const existing = await tournamentUserIndex.get([Number(tournamentId), userId]);
                if (existing) {
                    return { success: false, error: 'Already joined this tournament' };
                }
            } catch (e) {
                const participants = await participantStore.index('tournamentId').getAll(Number(tournamentId));
                const existing = participants.find(p => p.userId === userId);
                if (existing) {
                    return { success: false, error: 'Already joined this tournament' };
                }
            }
            
            // Deduct coins
            const userStore = tx.objectStore('users');
            const user = await userStore.get(userId);
            
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            
            if ((user.coins || 0) < tournament.entryFee) {
                return { success: false, error: 'Insufficient coins' };
            }
            
            user.coins = (user.coins || 0) - tournament.entryFee;
            await userStore.put(user);
            
            // Add participant
            await participantStore.put({
                tournamentId: Number(tournamentId),
                userId,
                ffid: userDetails.ffid || user.ffid,
                phone: userDetails.phone || user.phone,
                email: userDetails.email || user.email,
                status: 'joined',
                joinedAt: new Date().toISOString()
            });
            
            // Update tournament count
            tournament.currentParticipants = (tournament.currentParticipants || 0) + 1;
            await tournamentStore.put(tournament);
            
            return { success: true };
        } catch (error) {
            console.error('Error joining tournament:', error);
            return { success: false, error: error.message };
        }
    }

    async getTournamentParticipants(tournamentId) {
        try {
            const tx = this.db.transaction('tournament_participants', 'readonly');
            const store = tx.objectStore('tournament_participants');
            const index = store.index('tournamentId');
            return await index.getAll(Number(tournamentId));
        } catch (error) {
            console.error('Error getting tournament participants:', error);
            return [];
        }
    }

    async getTournamentSelections(tournamentId) {
        try {
            const tx = this.db.transaction('tournament_selections', 'readonly');
            const store = tx.objectStore('tournament_selections');
            const index = store.index('tournamentId');
            return await index.getAll(Number(tournamentId));
        } catch (error) {
            console.error('Error getting tournament selections:', error);
            return [];
        }
    }

    async selectRandomParticipants(tournamentId, count) {
        try {
            const tx = this.db.transaction(['tournaments', 'tournament_participants', 'tournament_selections'], 'readwrite');
            
            const tournamentStore = tx.objectStore('tournaments');
            const tournament = await tournamentStore.get(Number(tournamentId));
            
            if (!tournament) {
                throw new Error('Tournament not found');
            }
            
            const participantStore = tx.objectStore('tournament_participants');
            const participants = await participantStore.index('tournamentId').getAll(Number(tournamentId));
            
            const availableParticipants = participants.filter(p => p.status === 'joined');
            
            if (availableParticipants.length === 0) {
                throw new Error('No participants available for selection');
            }
            
            const selectionStore = tx.objectStore('tournament_selections');
            const selectionIndex = selectionStore.index('tournamentId');
            const previousSelections = await selectionIndex.getAll(Number(tournamentId));
            
            const previouslySelectedUserIds = new Set();
            previousSelections.forEach(selection => {
                if (selection.selectedUsers && Array.isArray(selection.selectedUsers)) {
                    selection.selectedUsers.forEach(userId => {
                        previouslySelectedUserIds.add(userId);
                    });
                }
            });
            
            const eligibleParticipants = availableParticipants.filter(p => !previouslySelectedUserIds.has(p.userId));
            
            if (eligibleParticipants.length === 0) {
                throw new Error('No eligible participants (all have been selected before)');
            }
            
            const selected = [];
            const selectedCount = Math.min(count, eligibleParticipants.length);
            
            // Random shuffle
            const shuffled = [...eligibleParticipants];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            const selectedParticipants = shuffled.slice(0, selectedCount);
            
            for (const participant of selectedParticipants) {
                participant.status = 'selected';
                participant.selectionRound = (previousSelections.length + 1);
                await participantStore.put(participant);
                selected.push(participant.userId);
            }
            
            await selectionStore.put({
                tournamentId: Number(tournamentId),
                round: previousSelections.length + 1,
                selectedCount: selected.length,
                selectedUsers: selected,
                selectedAt: new Date().toISOString()
            });
            
            tournament.status = 'selection';
            tournament.selectedParticipants = (tournament.selectedParticipants || 0) + selected.length;
            await tournamentStore.put(tournament);
            
            return {
                round: previousSelections.length + 1,
                selected: selectedParticipants
            };
        } catch (error) {
            console.error('Error selecting random participants:', error);
            throw error;
        }
    }

    async setRoomDetails(tournamentId, roomId, password) {
        try {
            const tx = this.db.transaction(['tournaments', 'tournament_participants'], 'readwrite');
            
            const tournamentStore = tx.objectStore('tournaments');
            const tournament = await tournamentStore.get(Number(tournamentId));
            
            if (!tournament) {
                return { success: false, error: 'Tournament not found' };
            }
            
            tournament.roomDetails = { roomId, password };
            tournament.status = 'ongoing';
            await tournamentStore.put(tournament);
            
            const participantStore = tx.objectStore('tournament_participants');
            const participants = await participantStore.index('tournamentId').getAll(Number(tournamentId));
            
            for (const participant of participants) {
                if (participant.status === 'selected') {
                    participant.status = 'room_received';
                    await participantStore.put(participant);
                }
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error setting room details:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserTournaments(userId) {
        try {
            const tx = this.db.transaction(['tournament_participants', 'tournaments'], 'readonly');
            
            const participantStore = tx.objectStore('tournament_participants');
            const participantIndex = participantStore.index('userId');
            const userParticipants = await participantIndex.getAll(userId);
            
            const tournamentStore = tx.objectStore('tournaments');
            const result = [];
            
            for (const participant of userParticipants) {
                const tournament = await tournamentStore.get(participant.tournamentId);
                if (tournament) {
                    result.push({
                        ...participant,
                        tournamentDetails: tournament
                    });
                }
            }
            
            result.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
            
            return result;
        } catch (error) {
            console.error('Error getting user tournaments:', error);
            return [];
        }
    }

    // ==================== CONFIG FUNCTIONS ====================

    async getConfig(key) {
        try {
            const tx = this.db.transaction('config', 'readonly');
            const store = tx.objectStore('config');
            const result = await store.get(key);
            return result ? result.value : null;
        } catch (error) {
            console.error('Error getting config:', error);
            return null;
        }
    }

    async setConfig(key, value) {
        try {
            const tx = this.db.transaction('config', 'readwrite');
            const store = tx.objectStore('config');
            await store.put({ key, value });
            return { success: true };
        } catch (error) {
            console.error('Error setting config:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    async resetDatabase() {
        return new Promise((resolve) => {
            const request = indexedDB.deleteDatabase(this.dbName);
            
            request.onsuccess = () => {
                console.log('Database deleted successfully');
                resolve(true);
            };
            
            request.onerror = () => {
                console.log('Error deleting database');
                resolve(false);
            };
        });
    }
}

// Create global instance
const db = new TournamentDB();

// Auto-initialize
console.log('🚀 Database script loaded');