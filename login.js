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
                    // Try the main resort URL first, fallback to backend URL
                    return 'https://villa-ester-resort.onrender.com';
                } else {
                    return 'http://localhost:5000';
                }
            }
            
            const loginUrl = `${getBackendUrl()}/api/users/login`;
            
            let response;
            let usedFallback = false;
            
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
                
                // Try fallback URL if first attempt fails
                if (!usedFallback && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    const fallbackUrl = 'https://villa-ester-backend.onrender.com/api/users/login';
                    console.log(`Trying fallback URL: ${fallbackUrl}`);
                    
                    try {
                        response = await fetch(fallbackUrl, {
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
                        
                        usedFallback = true;
                        console.log(`Success with fallback URL: ${fallbackUrl}`);
                    } catch (fallbackError) {
                        console.log(`Failed with fallback URL ${fallbackUrl}:`, fallbackError.message);
                        throw error; // Throw original error
                    }
                } else {
                    throw error;
                }
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

    // ===== FORGOT PASSWORD FUNCTIONALITY =====
    
    // Modal elements
    const modal = document.getElementById('forgot-password-modal');
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const emailForm = document.getElementById('email-form');
    const modalError = document.getElementById('modal-error');
    const step1 = document.getElementById('step-1');
    const successStep = document.getElementById('success-step');
    const modalTitle = document.getElementById('modal-title');
    
    let resetEmail = '';
    
    // Show modal
    function showModal() {
        modal.style.display = 'flex';
        resetModal();
    }
    
    // Hide modal
    function hideModal() {
        modal.style.display = 'none';
        resetModal();
    }
    
    // Reset modal to initial state
    function resetModal() {
        step1.style.display = 'block';
        successStep.style.display = 'none';
        modalTitle.textContent = 'Forgot Password';
        clearModalError();
        emailForm.reset();
        resetEmail = '';
        
        // Remove reset link step if it exists
        const resetLinkStep = document.getElementById('reset-link-step');
        if (resetLinkStep) {
            resetLinkStep.remove();
        }
        
        // Remove any existing step2
        const existingStep2 = document.querySelector('#step-2');
        if (existingStep2) {
            existingStep2.remove();
        }
    }
    
    // Show modal error
    function showModalError(message) {
        modalError.textContent = message;
        modalError.style.display = 'block';
    }
    
    // Clear modal error
    function clearModalError() {
        modalError.textContent = '';
        modalError.style.display = 'none';
    }
    
    // Get backend URL
    function getBackendUrl() {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // Try the main resort URL first, fallback to backend URL
            return 'https://villa-ester-resort.onrender.com';
        } else {
            return 'http://localhost:5000';
        }
    }
    
    // Event listeners
    forgotPasswordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showModal();
    });
    
    closeModalBtn.addEventListener('click', hideModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideModal();
        }
    });
    
    // Email form submission
    emailForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearModalError();
        
        const email = document.getElementById('reset-email').value.trim();
        
        if (!email) {
            showModalError('Please enter your email address.');
            return;
        }
        
        if (!email.includes('@')) {
            showModalError('Please enter a valid email address.');
            return;
        }
        
        const submitBtn = emailForm.querySelector('.submit');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            const response = await fetch(`${getBackendUrl()}/api/users/check-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.toLowerCase() })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Show the reset link to the user (in production, this would be sent via email)
                const resetLink = data.resetLink;
                step1.style.display = 'none';
                
                // Create a new step to show the reset link
                const resetLinkStep = document.createElement('div');
                resetLinkStep.id = 'reset-link-step';
                resetLinkStep.className = 'modal-step';
                resetLinkStep.innerHTML = `
                    <div class="success-content">
                        <div class="success-icon">✓</div>
                        <h4>Reset Link Generated!</h4>
                        <p>Your password reset link has been created. Click the link below to reset your password:</p>
                        <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; word-break: break-all;">
                            <a href="${resetLink}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold;">${resetLink}</a>
                        </div>
                        <p style="font-size: 0.9em; color: #666;">This link will expire in 1 hour.</p>
                        <button type="button" class="submit" onclick="hideModal()">Close</button>
                    </div>
                `;
                
                // Replace step2 with the reset link step
                const modalContent = document.querySelector('.modal-content');
                if (modalContent) {
                    // Remove existing step2 if it exists
                    const existingStep2 = modalContent.querySelector('#step-2');
                    if (existingStep2) {
                        existingStep2.remove();
                    }
                    
                    // Insert the reset link step before the success step
                    const successStep = modalContent.querySelector('#success-step');
                    if (successStep) {
                        modalContent.insertBefore(resetLinkStep, successStep);
                    } else {
                        modalContent.appendChild(resetLinkStep);
                    }
                }
                
                modalTitle.textContent = 'Reset Link Sent';
            } else {
                showModalError(data.message || 'Email not found. Please check your email address.');
            }
        } catch (error) {
            console.error('Email check error:', error);
            showModalError('Network error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    
    // Password form submission - REMOVED since we now use token-based reset
    // The password reset is now handled on the separate reset-password page
    
    // Close modal and redirect to login
    window.closeModalAndRedirect = function() {
        hideModal();
        // Optionally refresh the page to clear any cached data
        window.location.reload();
    };
    
    // Clear modal errors when typing
    const modalInputs = modal.querySelectorAll('input');
    modalInputs.forEach(input => {
        input.addEventListener('input', clearModalError);
    });
}); 