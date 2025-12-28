// Main Alpine.js App
function app() {
    return {
        currentPage: 'login',
        loginForm: {
            username: '',
            password: '',
        },
        loginLoading: false,
        loginError: '',
        username: '',
        firstname: '',
        surname: '',
        avatarUrl: '',
        showLogoutDropdown: false,
        // Sprint Tasks state
        kanbanData: null,
        kanbanLoading: false,
        kanbanError: '',
        selectedTab: 'todo',
        kanbanCounts: {
            todo: 0,
            inProcess: 0,
            wfc: 0,
            b2r: 0,
            done: 0
        },
        // Task Detail state
        taskDetail: null,
        taskDetailLoading: false,
        taskDetailError: '',
        taskDetailTab: 'detail',
        // Task Comments state
        taskComments: [],
        taskCommentsLoading: false,
        taskCommentsError: '',
        // Task History state
        taskHistory: [],
        taskHistoryLoading: false,
        taskHistoryError: '',
        // Task tracking state
        isTaskTracking: false,
        taskTrackingLoading: false,
        // Active booking state
        activeBooking: null,
        activeBookingLoading: false,
        bookingStartTime: null, // Start time in milliseconds from backend
        bookingTimerInterval: null, // Interval ID for the timer
        currentBookingTime: 0, // Current elapsed time in milliseconds (updated by timer)
        // Tickets state
        tickets: [],
        ticketsLoading: false,
        ticketsError: '',
        // Last Comments state
        lastComments: [],
        lastCommentsLoading: false,
        lastCommentsError: '',
        previousPage: null, // Track previous page for back navigation
        menuItems: [
            {
                id: 'sprint-tasks',
                title: 'Sprint Tasks',
                subtitle: 'Sprint görevleri ve takibi',
                icon: '📋',
            },
            {
                id: 'tickets',
                title: 'Open Tickets',
                subtitle: 'Biletler ve talepler',
                icon: '🎫',
            },
            {
                id: 'last-comments',
                title: 'Last Comments',
                subtitle: 'Son yorumlar',
                icon: '💬',
            },
        ],
        
        init() {
            // Check if user is already logged in
            this.checkAuth();
            // Fetch active booking if authenticated (only once on page load)
            if (authService.isAuthenticated()) {
                this.fetchActiveBooking();
            }
        },
        
        checkAuth() {
            if (authService.isAuthenticated()) {
                this.currentPage = 'menu';
                // Get user info if available
                const userInfo = authService.getUserInfo();
                if (userInfo) {
                    this.username = userInfo.username || '';
                    this.firstname = userInfo.firstname || '';
                    this.surname = userInfo.surname || '';
                    this.avatarUrl = this.getAvatarUrl(userInfo.file);
                }
            } else {
                this.currentPage = 'login';
            }
        },
        
        async handleLogin() {
            this.loginLoading = true;
            this.loginError = '';
            
            const result = await authService.login(
                this.loginForm.username,
                this.loginForm.password
            );
            
            this.loginLoading = false;
            
            if (result.success) {
                // Store user data
                if (result.userData) {
                    authService.setUserInfo(result.userData);
                    this.username = result.userData.username || this.loginForm.username;
                    this.firstname = result.userData.firstname || '';
                    this.surname = result.userData.surname || '';
                    this.avatarUrl = this.getAvatarUrl(result.userData.file);
                } else {
                    this.username = this.loginForm.username;
                    this.firstname = '';
                    this.surname = '';
                    this.avatarUrl = '';
                }
                
                // Navigate to menu
                this.currentPage = 'menu';
                
                // Fetch active booking after login
                await this.fetchActiveBooking();
                
                // Clear form
                this.loginForm.username = '';
                this.loginForm.password = '';
            } else {
                this.loginError = result.error;
            }
        },
        
        navigateToMenuItem(itemId) {
            this.currentPage = itemId;
            // Load kanban data when navigating to sprint tasks
            if (itemId === 'sprint-tasks') {
                this.fetchKanbanData();
            }
            // Load tickets when navigating to tickets
            if (itemId === 'tickets') {
                this.fetchTickets();
            }
            // Load last comments when navigating to last-comments
            if (itemId === 'last-comments') {
                this.fetchLastComments();
            }
        },
        
        async navigateToMenu() {
            this.currentPage = 'menu';
            // Refresh active booking when returning to menu
            await this.fetchActiveBooking();
        },
        
        toggleLogoutDropdown() {
            this.showLogoutDropdown = !this.showLogoutDropdown;
        },
        
        closeLogoutDropdown() {
            this.showLogoutDropdown = false;
        },
        
        async handleLogout() {
            this.showLogoutDropdown = false;
            
            // Stop timer before logout
            this.stopBookingTimer();
            this.bookingStartTime = null;
            this.currentBookingTime = 0;
            
            // Call logout endpoint
            try {
                await api.get('/logout');
            } catch (error) {
                console.error('Logout endpoint error:', error);
                // Continue with logout even if endpoint fails
            }
            
            // Clear local storage and state
            authService.logout();
            this.currentPage = 'login';
            this.username = '';
            this.firstname = '';
            this.surname = '';
            this.avatarUrl = '';
            this.loginForm.username = '';
            this.loginForm.password = '';
            this.loginError = '';
        },
        
        getInitials() {
            if (this.firstname) {
                return this.firstname.charAt(0).toUpperCase();
            }
            if (this.username) {
                return this.username.charAt(0).toUpperCase();
            }
            return 'U';
        },
        
        getDisplayName() {
            // Get from state first
            if (this.firstname || this.surname) {
                return `${this.firstname || ''} ${this.surname || ''}`.trim();
            }
            // Fallback to userInfo from localStorage
            const userInfo = authService.getUserInfo();
            if (userInfo) {
                const firstName = userInfo.firstname || '';
                const surName = userInfo.surname || '';
                if (firstName || surName) {
                    return `${firstName} ${surName}`.trim();
                }
            }
            return this.username || 'Kullanıcı';
        },
        
        getAvatarUrl(file) {
            if (file && file.id) {
                // Avatar endpoint doesn't include /api/
                return `https://core-backend.reybex.com/fileUploader/show/${file.id}`;
            }
            return '';
        },
        
        getPageTitle() {
            const titles = {
                'menu': 'Menü',
                'sprint-tasks': 'Sprint Tasks',
                'tickets': 'Open Tickets',
                'last-comments': 'Last Comments',
                'task-detail': 'Task Detail',
            };
            return titles[this.currentPage] || 'Reybex';
        },
        
        async fetchKanbanData() {
            this.kanbanLoading = true;
            this.kanbanError = '';
            
            try {
                const userId = authService.getUserId();
                if (!userId) {
                    this.kanbanError = 'Kullanıcı bilgisi bulunamadı';
                    this.kanbanLoading = false;
                    return;
                }
                
                const payload = {
                    users: [{ id: userId }],
                    responsibleUsers: null,
                    department: null,
                    projectId: null,
                    customerId: null,
                    sprintId: 1759743240961002, // Hardcoded for now
                    tags: [],
                    showTickets: false,
                    groupByUsers: false,
                    groupByResponsibleUsers: false
                };
                
                const response = await api.post('/kanban', payload);
                
                if (response.data && response.data.data) {
                    this.kanbanData = response.data.data;
                    this.calculateCounts();
                }
            } catch (error) {
                console.error('Failed to fetch kanban data:', error);
                this.kanbanError = 'Kanban verileri yüklenemedi';
            } finally {
                this.kanbanLoading = false;
            }
        },
        
        calculateCounts() {
            if (!this.kanbanData || !Array.isArray(this.kanbanData)) {
                return;
            }
            
            // Reset counts
            this.kanbanCounts = {
                todo: 0,
                inProcess: 0,
                wfc: 0,
                b2r: 0,
                done: 0
            };
            
            // Calculate counts for each column
            this.kanbanData.forEach(column => {
                const columnName = column.name?.toLowerCase() || '';
                const columnTypeName = column.kanbanColumnType?.translatedName?.toLowerCase() || '';
                let totalCount = 0;
                
                // Sum up totalTaskCount from all groups
                if (column.groups && Array.isArray(column.groups)) {
                    column.groups.forEach(group => {
                        totalCount += group.totalTaskCount || 0;
                    });
                }
                
                // Map column names to our tab keys (check both name and kanbanColumnType)
                const searchName = columnName || columnTypeName;
                
                if (searchName.includes('todo')) {
                    this.kanbanCounts.todo = totalCount;
                } else if (searchName.includes('in process') || searchName.includes('inprocess')) {
                    this.kanbanCounts.inProcess = totalCount;
                } else if (searchName.includes('wfc') || searchName.includes('wcf')) {
                    this.kanbanCounts.wfc = totalCount;
                } else if (searchName.includes('b2r')) {
                    this.kanbanCounts.b2r = totalCount;
                } else if (searchName.includes('done') || searchName.includes('erledigt')) {
                    this.kanbanCounts.done = totalCount;
                }
            });
        },
        
        selectTab(tab) {
            this.selectedTab = tab;
        },
        
        getTasksForTab() {
            if (!this.kanbanData || !Array.isArray(this.kanbanData)) {
                return [];
            }
            
            // Find the column matching the selected tab
            let targetColumn = null;
            this.kanbanData.forEach(column => {
                const columnName = column.name?.toLowerCase() || '';
                const columnTypeName = column.kanbanColumnType?.translatedName?.toLowerCase() || '';
                const searchName = columnName || columnTypeName;
                
                if (this.selectedTab === 'todo' && searchName.includes('todo')) {
                    targetColumn = column;
                } else if (this.selectedTab === 'inProcess' && (searchName.includes('in process') || searchName.includes('inprocess'))) {
                    targetColumn = column;
                } else if (this.selectedTab === 'wfc' && (searchName.includes('wfc') || searchName.includes('wcf'))) {
                    targetColumn = column;
                } else if (this.selectedTab === 'b2r' && searchName.includes('b2r')) {
                    targetColumn = column;
                } else if (this.selectedTab === 'done' && (searchName.includes('done') || searchName.includes('erledigt'))) {
                    targetColumn = column;
                }
            });
            
            if (!targetColumn || !targetColumn.groups || !Array.isArray(targetColumn.groups)) {
                return [];
            }
            
            // Collect all tasks from all groups
            const tasks = [];
            targetColumn.groups.forEach(group => {
                if (group.tasks && Array.isArray(group.tasks)) {
                    tasks.push(...group.tasks);
                }
            });
            
            return tasks;
        },
        
        async openTaskDetail(taskId) {
            // Store previous page before opening task detail
            if (this.currentPage !== 'task-detail') {
                this.previousPage = this.currentPage;
            }
            
            this.taskDetailLoading = true;
            this.taskDetailError = '';
            this.taskDetailTab = 'detail';
            
            try {
                const response = await api.get(`/task/${taskId}`);
                if (response.data && response.data.data) {
                    this.taskDetail = response.data.data;
                    this.currentPage = 'task-detail';
                    
                    // Check if this task is currently being tracked
                    try {
                        const bookingResponse = await api.get('/taskHistory/bookingTime');
                        if (bookingResponse.data && bookingResponse.data.id) {
                            // Compare booking task id with current task id
                            this.isTaskTracking = bookingResponse.data.id === taskId;
                        } else {
                            this.isTaskTracking = false;
                        }
                    } catch (bookingError) {
                        console.error('Failed to fetch booking time:', bookingError);
                        this.isTaskTracking = false;
                    }
                    
                    // Load comments when opening task detail
                    if (this.taskDetailTab === 'comments') {
                        this.fetchTaskComments(taskId);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch task detail:', error);
                this.taskDetailError = 'Task detayı yüklenemedi';
            } finally {
                this.taskDetailLoading = false;
            }
        },
        
        async fetchTaskComments(taskId) {
            this.taskCommentsLoading = true;
            this.taskCommentsError = '';
            
            try {
                const response = await api.get(`/taskComment/${taskId}`);
                if (response.data && response.data.data) {
                    this.taskComments = response.data.data;
                }
            } catch (error) {
                console.error('Failed to fetch task comments:', error);
                this.taskCommentsError = 'Yorumlar yüklenemedi';
            } finally {
                this.taskCommentsLoading = false;
            }
        },
        
        async selectTaskDetailTab(tab) {
            this.taskDetailTab = tab;
            // Load comments when switching to comments tab
            if (tab === 'comments' && this.taskDetail?.task?.id) {
                await this.fetchTaskComments(this.taskDetail.task.id);
            }
            // Load history when switching to timeHistory tab
            if (tab === 'timeHistory' && this.taskDetail?.task?.id) {
                await this.fetchTaskHistory(this.taskDetail.task.id);
            }
        },
        
        async fetchTaskHistory(taskId) {
            this.taskHistoryLoading = true;
            this.taskHistoryError = '';
            
            try {
                const response = await api.get(`/taskHistory?taskId=${taskId}`);
                if (response.data && response.data.data) {
                    this.taskHistory = response.data.data;
                }
            } catch (error) {
                console.error('Failed to fetch task history:', error);
                this.taskHistoryError = 'Task geçmişi yüklenemedi';
            } finally {
                this.taskHistoryLoading = false;
            }
        },
        
        getTimeDisplay(historyItem) {
            // If taskCost_cost exists, show it (approved time)
            if (historyItem.taskCost_cost !== null && historyItem.taskCost_cost !== undefined) {
                return {
                    value: historyItem.taskCost_cost,
                    isApproved: true
                };
            }
            // Otherwise show taskCost_timeTracked (unapproved, red)
            if (historyItem.taskCost_timeTracked !== null && historyItem.taskCost_timeTracked !== undefined) {
                return {
                    value: historyItem.taskCost_timeTracked,
                    isApproved: false
                };
            }
            return {
                value: 0,
                isApproved: true
            };
        },
        
        formatDateOnly(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        },
        
        parseDescription(descriptionJson) {
            if (!descriptionJson) return '';
            
            try {
                const parsed = typeof descriptionJson === 'string' ? JSON.parse(descriptionJson) : descriptionJson;
                
                // Check if it's Editor.js format
                if (parsed.blocks && Array.isArray(parsed.blocks)) {
                    return this.renderEditorJsBlocks(parsed.blocks);
                }
                
                // Fallback to simple text
                return parsed.text || descriptionJson;
            } catch (e) {
                // If not JSON, return as is
                return descriptionJson;
            }
        },
        
        renderEditorJsBlocks(blocks) {
            if (!blocks || !Array.isArray(blocks)) return '';
            
            let html = '';
            
            blocks.forEach(block => {
                if (!block.type || !block.data) return;
                
                switch (block.type) {
                    case 'paragraph':
                        const text = block.data.text || '';
                        // Parse HTML tags in text (like <b>, <i>, etc.)
                        html += `<p class="mb-2 break-words overflow-wrap-anywhere">${this.parseInlineHtml(text)}</p>`;
                        break;
                    
                    case 'header':
                        const level = block.data.level || 1;
                        const headerText = block.data.text || '';
                        const headerTag = `h${Math.min(level, 6)}`;
                        const headerClass = level === 1 ? 'text-2xl font-bold mb-3 mt-4 break-words overflow-wrap-anywhere' : 
                                          level === 2 ? 'text-xl font-bold mb-2 mt-3 break-words overflow-wrap-anywhere' : 
                                          'text-lg font-semibold mb-2 mt-2 break-words overflow-wrap-anywhere';
                        html += `<${headerTag} class="${headerClass}">${this.parseInlineHtml(headerText)}</${headerTag}>`;
                        break;
                    
                    case 'list':
                        const listStyle = block.data.style === 'ordered' ? 'ol' : 'ul';
                        const listItems = block.data.items || [];
                        const listClass = listStyle === 'ol' ? 'mb-2 ml-4 list-decimal break-words' : 'mb-2 ml-4 list-disc break-words';
                        html += `<${listStyle} class="${listClass}">`;
                        listItems.forEach(item => {
                            const itemContent = typeof item === 'string' ? item : (item.content || '');
                            html += `<li class="mb-1 break-words overflow-wrap-anywhere">${this.parseInlineHtml(itemContent)}</li>`;
                        });
                        html += `</${listStyle}>`;
                        break;
                    
                    case 'table':
                        const tableContent = block.data.content || [];
                        const withHeadings = block.data.withHeadings || false;
                        html += '<div class="overflow-x-auto my-3"><table class="min-w-full border-collapse border border-gray-300 text-sm break-words">';
                        if (withHeadings && tableContent.length > 0) {
                            html += '<thead><tr>';
                            tableContent[0].forEach(cell => {
                                html += `<th class="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left break-words overflow-wrap-anywhere">${this.escapeHtml(cell)}</th>`;
                            });
                            html += '</tr></thead>';
                            html += '<tbody>';
                            for (let i = 1; i < tableContent.length; i++) {
                                html += '<tr>';
                                tableContent[i].forEach(cell => {
                                    html += `<td class="border border-gray-300 px-3 py-2 break-words overflow-wrap-anywhere">${this.escapeHtml(cell)}</td>`;
                                });
                                html += '</tr>';
                            }
                            html += '</tbody>';
                        } else {
                            html += '<tbody>';
                            tableContent.forEach(row => {
                                html += '<tr>';
                                row.forEach(cell => {
                                    html += `<td class="border border-gray-300 px-3 py-2 break-words overflow-wrap-anywhere">${this.escapeHtml(cell)}</td>`;
                                });
                                html += '</tr>';
                            });
                            html += '</tbody>';
                        }
                        html += '</table></div>';
                        break;
                    
                    case 'image':
                        const imageUrl = block.data.file?.url || '';
                        const imageCaption = block.data.caption || '';
                        if (imageUrl) {
                            html += `<div class="my-3">`;
                            html += `<img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(imageCaption)}" class="max-w-full h-auto rounded-lg" />`;
                            if (imageCaption) {
                                html += `<p class="text-sm text-gray-600 italic mt-1">${this.parseInlineHtml(imageCaption)}</p>`;
                            }
                            html += `</div>`;
                        }
                        break;
                    
                    case 'delimiter':
                        html += '<hr class="my-4 border-gray-300" />';
                        break;
                    
                    case 'code':
                        const codeText = block.data.code || '';
                        html += `<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto my-2"><code class="text-sm">${this.escapeHtml(codeText)}</code></pre>`;
                        break;
                    
                    case 'quote':
                        const quoteText = block.data.text || '';
                        const quoteCaption = block.data.caption || '';
                        html += `<blockquote class="border-l-4 border-blue-500 pl-4 my-3 italic text-gray-700 break-words">`;
                        html += `<p class="break-words overflow-wrap-anywhere">${this.parseInlineHtml(quoteText)}</p>`;
                        if (quoteCaption) {
                            html += `<cite class="text-sm text-gray-600 break-words overflow-wrap-anywhere">— ${this.parseInlineHtml(quoteCaption)}</cite>`;
                        }
                        html += `</blockquote>`;
                        break;
                    
                    default:
                        // For unknown block types, try to render text if available
                        if (block.data.text) {
                            html += `<p class="mb-2 break-words overflow-wrap-anywhere">${this.parseInlineHtml(block.data.text)}</p>`;
                        }
                }
            });
            
            return html;
        },
        
        parseInlineHtml(text) {
            if (!text) return '';
            
            // First decode HTML entities (like &nbsp;, &gt;, &lt;, &amp;, etc.)
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            let decoded = textarea.value;
            
            // Now we need to escape only unsafe HTML tags, but keep safe ones
            // We'll use a more sophisticated approach:
            // 1. Temporarily replace safe tags with placeholders
            // 2. Escape all HTML
            // 3. Restore safe tags
            const safeTagPattern = /<(b|strong|i|em|u|br|code|span)(\s[^>]*)?>|<\/(b|strong|i|em|u|br|code|span)>/gi;
            const placeholders = [];
            let placeholderIndex = 0;
            
            // Replace safe tags with placeholders
            let withPlaceholders = decoded.replace(safeTagPattern, (match) => {
                placeholders.push(match);
                return `__SAFE_TAG_${placeholderIndex++}__`;
            });
            
            // Escape all remaining HTML
            let escaped = withPlaceholders
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            // Restore safe tags
            placeholders.forEach((tag, index) => {
                escaped = escaped.replace(`__SAFE_TAG_${index}__`, tag);
            });
            
            // Decode HTML entities (like &nbsp;, &gt;, etc.) but keep safe tags
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = escaped;
            return tempDiv.innerHTML;
        },
        
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        getVcsStatusColor(status) {
            if (!status) return 'bg-gray-100 text-gray-700';
            const statusLower = status.toLowerCase();
            if (statusLower === 'production') {
                return 'bg-green-100 text-green-700';
            } else if (statusLower === 'staging' || statusLower === 'test') {
                return 'bg-yellow-100 text-yellow-700';
            } else if (statusLower === 'development') {
                return 'bg-blue-100 text-blue-700';
            }
            return 'bg-gray-100 text-gray-700';
        },
        
        async startTaskTracking(taskId) {
            this.taskTrackingLoading = true;
            try {
                await api.get(`/taskHistory/bookTask/${taskId}`);
                // Update tracking state - check if current task detail matches
                if (this.taskDetail?.task?.id === taskId) {
                    this.isTaskTracking = true;
                }
                // Refresh active booking if on menu page
                if (this.currentPage === 'menu') {
                    await this.fetchActiveBooking();
                }
            } catch (error) {
                console.error('Failed to start task tracking:', error);
                alert('Task takibi başlatılamadı');
            } finally {
                this.taskTrackingLoading = false;
            }
        },
        
        async stopTaskTracking() {
            this.taskTrackingLoading = true;
            try {
                await api.get('/taskHistory/endTask');
                // Always set to false when stopping
                this.isTaskTracking = false;
                this.stopBookingTimer();
                this.bookingStartTime = null;
                this.currentBookingTime = 0;
                // Refresh active booking if on menu page
                if (this.currentPage === 'menu') {
                    await this.fetchActiveBooking();
                }
            } catch (error) {
                console.error('Failed to stop task tracking:', error);
                alert('Task takibi durdurulamadı');
            } finally {
                this.taskTrackingLoading = false;
            }
        },
        
        handlePlayStopClick() {
            if (this.isTaskTracking) {
                this.stopTaskTracking();
            } else {
                if (this.taskDetail?.task?.id) {
                    this.startTaskTracking(this.taskDetail.task.id);
                }
            }
        },
        
        async fetchActiveBooking() {
            this.activeBookingLoading = true;
            try {
                const response = await api.get('/taskHistory/bookingTime');
                if (response.data) {
                    this.activeBooking = response.data;
                    // Update tracking state based on active booking
                    const wasTracking = this.isTaskTracking;
                    this.isTaskTracking = response.data.showCurrentBooking && response.data.id !== null;
                    
                    // If there's bookingTime (even without active task), start/update the timer
                    if (response.data.bookingTime && response.data.bookingTime > 0) {
                        // Calculate start time: current time - bookingTime
                        const newStartTime = Date.now() - response.data.bookingTime;
                        
                        // If timer is already running, just update start time
                        // Otherwise, restart the timer
                        if (this.bookingTimerInterval && this.bookingStartTime !== null) {
                            // Timer is already running, just update the start time
                            this.bookingStartTime = newStartTime;
                            // Update current time immediately
                            this.currentBookingTime = response.data.bookingTime;
                        } else {
                            // Timer is not running, start it
                            this.bookingStartTime = newStartTime;
                            // Set initial current time
                            this.currentBookingTime = response.data.bookingTime;
                            this.startBookingTimer();
                        }
                    } else {
                        // No booking time, clear timer
                        this.stopBookingTimer();
                        this.bookingStartTime = null;
                        this.currentBookingTime = 0;
                    }
                } else {
                    this.activeBooking = null;
                    this.stopBookingTimer();
                    this.bookingStartTime = null;
                    this.currentBookingTime = 0;
                }
            } catch (error) {
                console.error('Failed to fetch active booking:', error);
                this.activeBooking = null;
                this.stopBookingTimer();
                this.bookingStartTime = null;
                this.currentBookingTime = 0;
            } finally {
                this.activeBookingLoading = false;
            }
        },
        
        startBookingTimer() {
            // Clear any existing timer
            this.stopBookingTimer();
            
            // Update immediately
            if (this.bookingStartTime) {
                this.currentBookingTime = Date.now() - this.bookingStartTime;
            }
            
            // Start new timer that updates every second
            this.bookingTimerInterval = setInterval(() => {
                if (this.bookingStartTime) {
                    // Calculate elapsed time: current time - start time
                    this.currentBookingTime = Date.now() - this.bookingStartTime;
                } else {
                    this.currentBookingTime = 0;
                    this.stopBookingTimer();
                }
            }, 1000);
        },
        
        stopBookingTimer() {
            if (this.bookingTimerInterval) {
                clearInterval(this.bookingTimerInterval);
                this.bookingTimerInterval = null;
            }
            this.currentBookingTime = 0;
        },
        
        getCurrentBookingTime() {
            if (!this.bookingStartTime) {
                return this.currentBookingTime || 0;
            }
            // Return the current booking time (updated by timer)
            return this.currentBookingTime || 0;
        },
        
        async fetchTickets() {
            this.ticketsLoading = true;
            this.ticketsError = '';
            
            try {
                const userId = authService.getUserId();
                if (!userId) {
                    throw new Error('User ID not found');
                }
                
                const response = await api.get(`/ticket/listTickets?taskStatus=mine&user_hid=${userId}&isMyTickets=1`);
                if (response.data && response.data.data) {
                    this.tickets = response.data.data;
                } else {
                    this.tickets = [];
                }
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
                this.ticketsError = 'Tickets yüklenemedi';
                this.tickets = [];
            } finally {
                this.ticketsLoading = false;
            }
        },
        
        async fetchLastComments() {
            this.lastCommentsLoading = true;
            this.lastCommentsError = '';
            
            try {
                const userId = authService.getUserId();
                if (!userId) {
                    throw new Error('User ID not found');
                }
                
                // Build URL with nested filter parameters
                // The filter parameter needs to be in the format: filter[filters][0][advancedFilter][field]=userId&filter[filters][0][advancedFilter][value]=userId
                const baseUrl = '/dataExport/1766888745013001/showTable';
                const params = new URLSearchParams();
                params.append('page', '1');
                params.append('filter[filters][0][advancedFilter][field]', 'userId');
                params.append('filter[filters][0][advancedFilter][value]', userId);
                params.append('skip', '0');
                params.append('take', '25');
                params.append('pageSize', '25');
                
                const response = await api.get(`${baseUrl}?${params.toString()}`);
                if (response.data && response.data.data) {
                    this.lastComments = response.data.data;
                } else {
                    this.lastComments = [];
                }
            } catch (error) {
                console.error('Failed to fetch last comments:', error);
                this.lastCommentsError = 'Son yorumlar yüklenemedi';
                this.lastComments = [];
            } finally {
                this.lastCommentsLoading = false;
            }
        },
        
        formatBookingTime(milliseconds) {
            if (!milliseconds || milliseconds === 0) return '0:00';
            // Convert milliseconds to seconds
            const totalSeconds = Math.floor(milliseconds / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;
            
            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        },
        
        async stopActiveBooking(event) {
            event.stopPropagation(); // Prevent navigation
            this.taskTrackingLoading = true;
            try {
                await api.get('/taskHistory/endTask');
                this.isTaskTracking = false;
                this.stopBookingTimer();
                this.bookingStartTime = null;
                await this.fetchActiveBooking(); // Refresh active booking
            } catch (error) {
                console.error('Failed to stop booking:', error);
                alert('Task takibi durdurulamadı');
            } finally {
                this.taskTrackingLoading = false;
            }
        },
        
        async openActiveTaskDetail() {
            if (this.activeBooking && this.activeBooking.id) {
                await this.openTaskDetail(this.activeBooking.id);
            }
        },
        
        isCurrentUser(commentUserId) {
            const userInfo = authService.getUserInfo();
            return userInfo && userInfo.id === commentUserId;
        },
        
        getUserColor(userId) {
            if (!userId) return 'bg-gray-500';
            // Generate consistent color based on user ID
            const colors = [
                'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
                'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500',
                'bg-orange-500', 'bg-cyan-500', 'bg-amber-500', 'bg-lime-500'
            ];
            // Use modulo to get consistent color for same user
            const index = parseInt(userId.toString().slice(-2)) % colors.length;
            return colors[index];
        },
        
        getUserBackgroundColor(userId) {
            if (!userId) return 'bg-gray-50';
            // Generate consistent light background color based on user ID
            const colors = [
                'bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-pink-50',
                'bg-indigo-50', 'bg-yellow-50', 'bg-red-50', 'bg-teal-50',
                'bg-orange-50', 'bg-cyan-50', 'bg-amber-50', 'bg-lime-50'
            ];
            const index = parseInt(userId.toString().slice(-2)) % colors.length;
            return colors[index];
        },
        
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Az önce';
            if (diffMins < 60) return `${diffMins} dakika önce`;
            if (diffHours < 24) return `${diffHours} saat önce`;
            if (diffDays < 7) return `${diffDays} gün önce`;
            
            return date.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        
        getPriorityColor(priorityName) {
            if (!priorityName) return 'bg-gray-100 text-gray-700';
            const priority = priorityName.toLowerCase();
            if (priority.includes('çok yüksek') || priority.includes('very high')) {
                return 'bg-red-100 text-red-700';
            } else if (priority.includes('yüksek') || priority.includes('high') || priority.includes('hoch')) {
                return 'bg-orange-100 text-orange-700';
            } else if (priority.includes('normal')) {
                return 'bg-blue-100 text-blue-700';
            } else if (priority.includes('düşük') || priority.includes('low')) {
                return 'bg-green-100 text-green-700';
            }
            return 'bg-gray-100 text-gray-700';
        },
    };
}

