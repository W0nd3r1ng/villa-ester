document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginButton = document.querySelector('.btn.btn-primary');

    // Show loading state
    function setLoading(loading) {
        if (loginButton) {
            loginButton.disabled = loading;
            loginButton.textContent = loading ? 'Logging in...' : 'Login';
        }
    }

    // Show error message
    function showError(message) {
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
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
        
        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

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
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user data
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                // Redirect based on role
                const role = data.data.user.role;
                if (role === 'admin' || role === 'clerk') {
                    window.location.href = 'clerk.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                showError(data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    });

    // Clear error when user starts typing
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', clearError);
    });
}); 