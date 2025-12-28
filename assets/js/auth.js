// Authentication Service
const authService = {
    // Get token from localStorage
    getToken() {
        return localStorage.getItem('token');
    },
    
    // Set token to localStorage
    setToken(token) {
        localStorage.setItem('token', token);
    },
    
    // Remove token from localStorage
    removeToken() {
        localStorage.removeItem('token');
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },
    
    // Login function
    async login(username, password) {
        try {
            const response = await api.post('/login', {
                username,
                password,
            });
            
            // Get token from response
            const token = response.data.token;
            
            if (token) {
                this.setToken(token);
                
                // Get userId from response
                const userId = response.data.userId;
                
                // Store login data (userId, etc.)
                this.setLoginData(response.data);
                
                // Fetch user details if userId exists
                let userData = null;
                if (userId) {
                    try {
                        const userResponse = await api.get(`/user/${userId}`);
                        if (userResponse.data && userResponse.data.data) {
                            userData = userResponse.data.data;
                        }
                    } catch (userError) {
                        console.error('Failed to fetch user data:', userError);
                        // Continue even if user data fetch fails
                    }
                }
                
                return { 
                    success: true, 
                    data: response.data,
                    userData: userData
                };
            } else {
                throw new Error('Token not found in response');
            }
        } catch (error) {
            let errorMessage = 'Giriş yapılamadı. Lütfen tekrar deneyin.';
            
            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data?.message || 
                             error.response.data?.error || 
                             errorMessage;
            } else if (error.request) {
                // Request made but no response
                errorMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
            }
            
            return { success: false, error: errorMessage };
        }
    },
    
    // Logout function
    logout() {
        this.removeToken();
        localStorage.removeItem('loginData');
        localStorage.removeItem('userInfo');
        // Redirect to login page will be handled by app.js
    },
    
    // Get user info (if stored)
    getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    },
    
    // Set user info
    setUserInfo(userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    },
    
    // Get userId from login response or userInfo
    getUserId() {
        const loginData = localStorage.getItem('loginData');
        if (loginData) {
            const data = JSON.parse(loginData);
            return data.userId;
        }
        const userInfo = this.getUserInfo();
        return userInfo?.id || null;
    },
    
    // Set login data (userId, etc.)
    setLoginData(loginData) {
        localStorage.setItem('loginData', JSON.stringify(loginData));
    }
};

