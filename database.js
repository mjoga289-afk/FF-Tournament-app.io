// database.js - Complete with Full Admin Access
class TournamentDB {
    constructor() {
        this.dbName = 'tunff09_complete_db';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);

            request.onerror = () => reject('Database error');
            
            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log('✅ DB Ready');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                // ===== USERS STORE =====
                if (!db.objectStoreNames.contains('users')) {
                    const store = db.createObjectStore('users', { keyPath: 'uid' });
                    store.createIndex('email', 'email', { unique: true });
                    store.createIndex('ffid', 'ffid', { unique: false });
                }

                // ===== TASKS STORE =====
                if (!db.objectStoreNames.contains('tasks')) {
                    db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
                }

                // ===== COMPLETED TASKS =====
                if (!db.objectStoreNames.contains('completed_tasks')) {
                    const store = db.createObjectStore('completed_tasks', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('userId', 'userId', { unique: false });
                    store.createIndex('taskId', 'taskId', { unique: false });
                    store.createIndex('user_task', ['userId', 'taskId'], { unique: true });
                }

                // ===== YOUTUBE TASKS =====
                if (!db.objectStoreNames.contains('youtube_tasks')) {
                    const store = db.createObjectStore('youtube_tasks', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('code', 'code', { unique: true });
                }

                // ===== COMPLETED YOUTUBE TASKS =====
                if (!db.objectStoreNames.contains('completed_youtube_tasks')) {
                    const store = db.createObjectStore('completed_youtube_tasks', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('userId', 'userId', { unique: false });
                    store.createIndex('taskId', 'taskId', { unique: false });
                    store.createIndex('user_task', ['userId', 'taskId'], { unique: true });
                }

                // ===== TOURNAMENTS STORE =====
                if (!db.objectStoreNames.contains('tournaments')) {
                    const store = db.createObjectStore('tournaments', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('status', 'status', { unique: false });
                }

                // ===== TOURNAMENT PARTICIPANTS =====
                if (!db.objectStoreNames.contains('tournament_participants')) {
                    const store = db.createObjectStore('tournament_participants', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('tournamentId', 'tournamentId', { unique: false });
                    store.createIndex('userId', 'userId', { unique: false });
                    store.createIndex('tournament_user', ['tournamentId', 'userId'], { unique: true });
                }

                // ===== TOURNAMENT SELECTIONS =====
                if (!db.objectStoreNames.contains('tournament_selections')) {
                    const store = db.createObjectStore('tournament_selections', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('tournamentId', 'tournamentId', { unique: false });
                }

                // ===== CONFIG STORE =====
                if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config', { keyPath: 'key' });
                }

                // ===== SEED INITIAL DATA =====
                this.seedInitialData(db);
            };
        });
    }

    seedInitialData(db) {
        const tx = db.transaction('config', 'readwrite');
        const store = tx.objectStore('config');
        
        store.put({ key: 'notice', value: '🎮 স্বাগতম tunff09-এ!' });
        store.put({ key: 'about', value: 'ফ্রি ফায়ার টুর্নামেন্ট প্ল্যাটফর্ম' });
        store.put({ key: 'whatsapp_number', value: '8801234567890' });
        store.put({ key: 'whatsapp_message', value: 'Hi, I need help' });
        store.put({ key: 'telegram_link', value: 'https://t.me/tunff09' });
        store.put({ key: 'support_email', value: 'support@tunff09.com' });
    }

    // ==================== USER FUNCTIONS ====================
    async getAllUsers() {
        const tx = this.db.transaction('users', 'readonly');
        return tx.objectStore('users').getAll();
    }

    async getUser(uid) {
        const tx = this.db.transaction('users', 'readonly');
        return tx.objectStore('users').get(uid);
    }

    async getUserByEmail(email) {
        const tx = this.db.transaction('users', 'readonly');
        const index = tx.objectStore('users').index('email');
        return index.get(email);
    }

    async getUserByEmailAndPassword(email, password) {
        const user = await this.getUserByEmail(email);
        return (user && user.password === password) ? user : null;
    }

    async createUser(userData) {
        const existing = await this.getUserByEmail(userData.email);
        if (existing) {
            return { success: false, error: 'Email already exists' };
        }
        
        const tx = this.db.transaction('users', 'readwrite');
        await tx.objectStore('users').put(userData);
        return { success: true, user: userData };
    }

    async updateUser(uid, updates) {
        const tx = this.db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        const user = await store.get(uid);
        
        if (!user) return { success: false };
        
        const updated = { ...user, ...updates };
        await store.put(updated);
        return { success: true, user: updated };
    }

    async updateUserCoins(uid, amount) {
        const tx = this.db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        const user = await store.get(uid);
        
        if (!user) return { success: false };
        
        user.coins = (user.coins || 0) + amount;
        await store.put(user);
        return { success: true, newCoins: user.coins };
    }

    async deleteUser(uid) {
        const tx = this.db.transaction('users', 'readwrite');
        await tx.objectStore('users').delete(uid);
        return { success: true };
    }

    async searchUsers(term) {
        const all = await this.getAllUsers();
        if (!term) return all;
        
        term = term.toLowerCase();
        return all.filter(u => 
            (u.email && u.email.toLowerCase().includes(term)) ||
            (u.ffid && u.ffid.toLowerCase().includes(term)) ||
            (u.phone && u.phone.includes(term))
        );
    }

    // ==================== TASK FUNCTIONS ====================
    async getAllTasks() {
        const tx = this.db.transaction('tasks', 'readonly');
        return tx.objectStore('tasks').getAll();
    }

    async createTask(data) {
        data.createdAt = new Date().toISOString();
        const tx = this.db.transaction('tasks', 'readwrite');
        const id = await tx.objectStore('tasks').put(data);
        return { success: true, id };
    }

    async deleteTask(id) {
        const tx = this.db.transaction('tasks', 'readwrite');
        await tx.objectStore('tasks').delete(Number(id));
        return { success: true };
    }

    async getUserCompletedTasks(uid) {
        const tx = this.db.transaction('completed_tasks', 'readonly');
        const index = tx.objectStore('completed_tasks').index('userId');
        return index.getAll(uid);
    }

    async getAllCompletedTasks() {
        const tx = this.db.transaction('completed_tasks', 'readonly');
        return tx.objectStore('completed_tasks').getAll();
    }

    async completeTask(uid, taskId, reward) {
        const tx = this.db.transaction(['completed_tasks', 'users'], 'readwrite');
        
        // Check if already completed
        const completedStore = tx.objectStore('completed_tasks');
        const index = completedStore.index('user_task');
        
        try {
            const existing = await index.get([uid, Number(taskId)]);
            if (existing) throw new Error('Task already completed');
        } catch (e) {
            const all = await this.getUserCompletedTasks(uid);
            if (all.some(c => c.taskId === Number(taskId))) {
                throw new Error('Task already completed');
            }
        }
        
        // Add to completed
        await completedStore.put({
            userId: uid,
            taskId: Number(taskId),
            completedAt: new Date().toISOString()
        });
        
        // Update user coins
        const userStore = tx.objectStore('users');
        const user = await userStore.get(uid);
        if (user) {
            user.coins = (user.coins || 0) + reward;
            user.tasksCompleted = (user.tasksCompleted || 0) + 1;
            await userStore.put(user);
        }
        
        return true;
    }

    // ==================== YOUTUBE TASK FUNCTIONS ====================
    async getAllYouTubeTasks() {
        const tx = this.db.transaction('youtube_tasks', 'readonly');
        return tx.objectStore('youtube_tasks').getAll();
    }

    async createYouTubeTask(data) {
        // Check if code exists
        const all = await this.getAllYouTubeTasks();
        if (all.some(t => t.code === data.code)) {
            return { success: false, error: 'Code already exists' };
        }
        
        const validUntil = new Date();
        validUntil.setHours(validUntil.getHours() + data.validHours);
        
        const task = {
            title: data.title,
            videoLink: data.videoLink,
            code: data.code,
            reward: data.reward,
            validUntil: validUntil.toISOString(),
            createdAt: new Date().toISOString()
        };
        
        const tx = this.db.transaction('youtube_tasks', 'readwrite');
        const id = await tx.objectStore('youtube_tasks').put(task);
        return { success: true, id };
    }

    async deleteYouTubeTask(id) {
        const tx = this.db.transaction('youtube_tasks', 'readwrite');
        await tx.objectStore('youtube_tasks').delete(Number(id));
        return { success: true };
    }

    async getUserCompletedYouTubeTasks(uid) {
        const tx = this.db.transaction('completed_youtube_tasks', 'readonly');
        const index = tx.objectStore('completed_youtube_tasks').index('userId');
        return index.getAll(uid);
    }

    async getAllCompletedYouTubeTasks() {
        const tx = this.db.transaction('completed_youtube_tasks', 'readonly');
        return tx.objectStore('completed_youtube_tasks').getAll();
    }

    async verifyYouTubeCode(uid, taskId, code, reward) {
        const tx = this.db.transaction(['youtube_tasks', 'completed_youtube_tasks', 'users'], 'readwrite');
        
        // Get task
        const taskStore = tx.objectStore('youtube_tasks');
        const task = await taskStore.get(Number(taskId));
        
        if (!task) return { success: false, message: 'Task not found' };
        if (task.code !== code) return { success: false, message: 'Wrong code' };
        if (new Date(task.validUntil) < new Date()) return { success: false, message: 'Expired' };
        
        // Check if completed
        const completedStore = tx.objectStore('completed_youtube_tasks');
        const index = completedStore.index('user_task');
        
        try {
            const existing = await index.get([uid, Number(taskId)]);
            if (existing) return { success: false, message: 'Already completed' };
        } catch (e) {
            const all = await this.getUserCompletedYouTubeTasks(uid);
            if (all.some(c => c.taskId === Number(taskId))) {
                return { success: false, message: 'Already completed' };
            }
        }
        
        // Add to completed
        await completedStore.put({
            userId: uid,
            taskId: Number(taskId),
            completedAt: new Date().toISOString()
        });
        
        // Update user
        const userStore = tx.objectStore('users');
        const user = await userStore.get(uid);
        if (user) {
            user.coins = (user.coins || 0) + reward;
            user.tasksCompleted = (user.tasksCompleted || 0) + 1;
            await userStore.put(user);
        }
        
        return { success: true };
    }

    // ==================== TOURNAMENT FUNCTIONS ====================
    async getAllTournaments() {
        const tx = this.db.transaction('tournaments', 'readonly');
        return tx.objectStore('tournaments').getAll();
    }

    async getTournament(id) {
        const tx = this.db.transaction('tournaments', 'readonly');
        return tx.objectStore('tournaments').get(Number(id));
    }

    async createTournament(data) {
        const tournament = {
            ...data,
            status: 'upcoming',
            currentParticipants: 0,
            selectedParticipants: 0,
            createdAt: new Date().toISOString()
        };
        
        const tx = this.db.transaction('tournaments', 'readwrite');
        const id = await tx.objectStore('tournaments').put(tournament);
        return { success: true, id };
    }

    async deleteTournament(id) {
        const tx = this.db.transaction(['tournaments', 'tournament_participants', 'tournament_selections'], 'readwrite');
        
        await tx.objectStore('tournaments').delete(Number(id));
        
        // Delete participants
        const participantStore = tx.objectStore('tournament_participants');
        const participants = await participantStore.index('tournamentId').getAll(Number(id));
        for (const p of participants) {
            await participantStore.delete(p.id);
        }
        
        // Delete selections
        const selectionStore = tx.objectStore('tournament_selections');
        const selections = await selectionStore.index('tournamentId').getAll(Number(id));
        for (const s of selections) {
            await selectionStore.delete(s.id);
        }
        
        return { success: true };
    }

    async joinTournament(tournamentId, userId, details) {
        const tx = this.db.transaction(['tournaments', 'tournament_participants', 'users'], 'readwrite');
        
        // Get tournament
        const tournamentStore = tx.objectStore('tournaments');
        const tournament = await tournamentStore.get(Number(tournamentId));
        
        if (!tournament) return { success: false, error: 'Tournament not found' };
        if (tournament.status !== 'upcoming') return { success: false, error: 'Not available' };
        if (tournament.currentParticipants >= tournament.maxPlayers) return { success: false, error: 'Full' };
        
        // Check if already joined
        const participantStore = tx.objectStore('tournament_participants');
        const index = participantStore.index('tournament_user');
        
        try {
            const existing = await index.get([Number(tournamentId), userId]);
            if (existing) return { success: false, error: 'Already joined' };
        } catch (e) {
            const all = await participantStore.index('tournamentId').getAll(Number(tournamentId));
            if (all.some(p => p.userId === userId)) {
                return { success: false, error: 'Already joined' };
            }
        }
        
        // Deduct coins
        const userStore = tx.objectStore('users');
        const user = await userStore.get(userId);
        
        if (!user) return { success: false, error: 'User not found' };
        if ((user.coins || 0) < tournament.entryFee) return { success: false, error: 'Insufficient coins' };
        
        user.coins -= tournament.entryFee;
        await userStore.put(user);
        
        // Add participant
        await participantStore.put({
            tournamentId: Number(tournamentId),
            userId,
            ffid: details.ffid || user.ffid,
            phone: details.phone || user.phone,
            email: details.email || user.email,
            status: 'joined',
            joinedAt: new Date().toISOString()
        });
        
        // Update tournament
        tournament.currentParticipants++;
        await tournamentStore.put(tournament);
        
        return { success: true };
    }

    async getTournamentParticipants(tournamentId) {
        const tx = this.db.transaction('tournament_participants', 'readonly');
        const index = tx.objectStore('tournament_participants').index('tournamentId');
        return index.getAll(Number(tournamentId));
    }

    async getTournamentSelections(tournamentId) {
        const tx = this.db.transaction('tournament_selections', 'readonly');
        const index = tx.objectStore('tournament_selections').index('tournamentId');
        return index.getAll(Number(tournamentId));
    }

    async selectRandomParticipants(tournamentId, count) {
        const tx = this.db.transaction(['tournaments', 'tournament_participants', 'tournament_selections'], 'readwrite');
        
        const tournament = await tx.objectStore('tournaments').get(Number(tournamentId));
        if (!tournament) throw new Error('Tournament not found');
        
        const participants = await tx.objectStore('tournament_participants').index('tournamentId').getAll(Number(tournamentId));
        const available = participants.filter(p => p.status === 'joined');
        
        if (available.length === 0) throw new Error('No participants');
        
        // Get previous selections
        const selections = await tx.objectStore('tournament_selections').index('tournamentId').getAll(Number(tournamentId));
        const previousUsers = new Set();
        selections.forEach(s => s.selectedUsers?.forEach(u => previousUsers.add(u)));
        
        const eligible = available.filter(p => !previousUsers.has(p.userId));
        if (eligible.length === 0) throw new Error('All selected before');
        
        const selectCount = Math.min(count, eligible.length);
        const shuffled = [...eligible].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, selectCount);
        
        // Update status
        for (const p of selected) {
            p.status = 'selected';
            p.selectionRound = selections.length + 1;
            await tx.objectStore('tournament_participants').put(p);
        }
        
        // Record selection
        await tx.objectStore('tournament_selections').put({
            tournamentId: Number(tournamentId),
            round: selections.length + 1,
            selectedCount: selected.length,
            selectedUsers: selected.map(p => p.userId),
            selectedAt: new Date().toISOString()
        });
        
        // Update tournament
        tournament.status = 'selection';
        tournament.selectedParticipants = (tournament.selectedParticipants || 0) + selected.length;
        await tx.objectStore('tournaments').put(tournament);
        
        return { round: selections.length + 1, selected };
    }

    async setRoomDetails(tournamentId, roomId, password) {
        const tx = this.db.transaction(['tournaments', 'tournament_participants'], 'readwrite');
        
        const tournament = await tx.objectStore('tournaments').get(Number(tournamentId));
        if (!tournament) return { success: false, error: 'Tournament not found' };
        
        to
