document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginButton = document.querySelector('.submit');

    console.log('Login form found:', loginForm);
    console.log('Login button found:', loginButton);
    console.log('Login error div found:', loginError);

    // Show loading state
    function setLoading(loading) {
        console.log('Setting loading state:', loading);
        if (loginButton) {
            loginButton.disabled = loading;
            loginButton.textContent = loading ? 'Logging in...' : 'Login';
        } else {
            console.error('Login button not found!');
        }
    }

    // Show error message
    function showError(message) {
        console.log('Showing error:', message);
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
        } else {
            console.error('Login error div not found!');
        }
    }

    // Clear error message
    function clearError() {
        if (loginError) {
            loginError.textContent = '';
            loginError.style.display = 'none';
        }
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        console.log('Email:', email);
        console.log('Password length:', password.length);

        // Clear previous errors
        clearError();

        // Basic validation
        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        // Show loading state
        setLoading(true);

        try {
            console.log('Making API call to login endpoint...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log('Request timeout - aborting');
                controller.abort();
            }, 15000); // 15 second timeout
            
            // Add more detailed logging
            console.log('Request URL:', 'https://villa-ester-backend.onrender.com/api/users/login');
            console.log('Request headers:', {
                'Content-Type': 'application/json'
            });
            console.log('Request body:', JSON.stringify({
                email: email,
                password: password
            }));
            
            // Use dynamic backend URL based on environment
            function getBackendUrl() {
                if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    return 'https://villa-ester-backend.onrender.com';
                } else {
                    return 'http://localhost:5000';
                }
            }
            
            const loginUrl = `${getBackendUrl()}/api/users/login`;
            
            let response;
            
            try {
                console.log(`Using backend URL: ${loginUrl}`);
                response = await fetch(loginUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    }),
                    signal: controller.signal
                });
                
                console.log(`Success with URL: ${loginUrl}`);
                
            } catch (error) {
                console.log(`Failed with URL ${loginUrl}:`, error.message);
                throw error;
            }
            
            clearTimeout(timeoutId);
            console.log('Response received');
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data && (data.token || (data.data && data.data.token))) {
                // Support both {token, user} and {data: {token, user}} response
                const token = data.token || (data.data && data.data.token);
                const user = data.user || (data.data && data.data.user);
                
                console.log('Token received:', token ? 'Yes' : 'No');
                console.log('User data:', user);
                
                localStorage.setItem('token', token);
                if (user) localStorage.setItem('user', JSON.stringify(user));
                
                // Redirect based on role if user info is present
                const role = user && user.role;
                console.log('User role:', role);
                
                if (role === 'admin' || role === 'clerk') {
                    console.log('Redirecting to clerk.html');
                    window.location.href = 'clerk.html';
                } else {
                    console.log('Redirecting to index.html');
                    window.location.href = 'index.html';
                }
            } else {
                console.log('Login failed - no token in response');
                showError(data.message || 'Login failed. Please check your credentials and try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.name === 'AbortError') {
                showError('Request timeout. The server is taking too long to respond. Please try again.');
            } else if (error.message.includes('Failed to fetch')) {
                showError('Network error. Please check your internet connection and try again. If the problem persists, the server might be down.');
            } else if (error.message.includes('HTTP 404')) {
                showError('Login service not found. Please contact support.');
            } else if (error.message.includes('HTTP 500')) {
                showError('Server error. Please try again later.');
            } else if (error.message.includes('CORS')) {
                showError('CORS error. Please try refreshing the page or contact support.');
            } else {
                showError(`Login error: ${error.message}. Please try again or contact support if the problem persists.`);
            }
        } finally {
            console.log('Finally block - setting loading to false');
            setLoading(false);
        }
    });

    // Clear error when user starts typing
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', clearError);
    });
}); 