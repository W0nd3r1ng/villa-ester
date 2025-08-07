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

        // Health check - test which backend is responding
        async function testBackendHealth() {
            const backends = [
                'https://villa-ester-resort.onrender.com',
                'https://villa-ester-backend.onrender.com'
            ];
            
            for (const backend of backends) {
                try {
                    console.log(`Testing backend: ${backend}`);
                    const healthResponse = await fetch(`${backend}/`, {
                        method: 'GET',
                        signal: AbortSignal.timeout(5000) // 5 second timeout
                    });
                    console.log(`Backend ${backend} health check:`, healthResponse.status, healthResponse.statusText);
                    
                    if (healthResponse.ok) {
                        const healthText = await healthResponse.text();
                        console.log(`Backend ${backend} response:`, healthText.substring(0, 100));
                        return backend;
                    } else {
                        console.log(`Backend ${backend} returned error status:`, healthResponse.status);
                    }
                } catch (error) {
                    console.log(`Backend ${backend} health check failed:`, error.message);
                }
            }
            return null;
        }

        try {
            console.log('Testing backend health...');
            const workingBackend = await testBackendHealth();
            console.log('Working backend:', workingBackend);

            if (!workingBackend) {
                throw new Error('No backend servers are responding. Please try again later or contact support.');
            }

            // Test the login endpoint specifically
            console.log('Testing login endpoint...');
            try {
                const loginTestResponse = await fetch(`${workingBackend}/api/users/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: 'test@test.com',
                        password: 'test'
                    }),
                    signal: AbortSignal.timeout(5000)
                });
                console.log('Login endpoint test status:', loginTestResponse.status);
                const loginTestText = await loginTestResponse.text();
                console.log('Login endpoint test response:', loginTestText.substring(0, 100));
            } catch (error) {
                console.log('Login endpoint test failed:', error.message);
            }

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
            
            // Use the working backend from health check, or fallback to dynamic URL
            function getBackendUrl() {
                if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    // Use the backend URL directly
                    return 'https://villa-ester-backend.onrender.com';
                } else {
                    return 'http://localhost:5000';
                }
            }
            
            const baseUrl = workingBackend || getBackendUrl();
            const loginUrl = `${baseUrl}/api/users/login`;
            
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
                        console.log('Fallback response status:', response.status);
                        console.log('Fallback response ok:', response.ok);
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

            // Get response text first to debug
            const responseText = await response.text();
            console.log('Raw response text length:', responseText.length);
            console.log('Raw response text:', responseText);
            console.log('Response content-type:', response.headers.get('content-type'));
            
            if (!responseText || responseText.trim() === '') {
                throw new Error('Server returned empty response. The backend might be down or not responding properly.');
            }
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Response data:', data);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text was:', responseText);
                if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
                    throw new Error('Server returned HTML instead of JSON. The backend might be returning an error page.');
                }
                throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}...`);
            }

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
        
        // Remove OTP step if it exists
        const otpStep = document.getElementById('otp-step');
        if (otpStep) {
            otpStep.remove();
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
                // Show OTP input step
                step1.style.display = 'none';
                
                // Create OTP input step
                const otpStep = document.createElement('div');
                otpStep.id = 'otp-step';
                otpStep.className = 'modal-step';
                otpStep.innerHTML = `
                    <div class="success-content">
                        <div class="success-icon">✓</div>
                        <h4>OTP Sent!</h4>
                        <p>We've sent a 6-digit OTP to your email address. Please check your inbox and enter the code below.</p>
                        <form id="otp-form" class="modal-form">
                            <div class="input-container">
                                <input type="text" id="otp-input" name="otp" required maxlength="6" placeholder="Enter 6-digit OTP" style="text-align: center; font-size: 18px; letter-spacing: 2px;">
                            </div>
                            <div class="input-container">
                                <input type="password" id="new-password" name="newPassword" required minlength="6" placeholder="Enter new password">
                            </div>
                            <div class="input-container">
                                <input type="password" id="confirm-password" name="confirmPassword" required minlength="6" placeholder="Confirm new password">
                            </div>
                            <button type="submit" class="submit">Reset Password</button>
                        </form>
                        <p style="font-size: 0.9em; color: #666; margin-top: 15px;">Didn't receive the OTP? <a href="#" id="resend-otp">Resend</a></p>
                    </div>
                `;
                
                // Replace step2 with the OTP step
                const modalContent = document.querySelector('.modal-content');
                if (modalContent) {
                    // Remove existing step2 if it exists
                    const existingStep2 = modalContent.querySelector('#step-2');
                    if (existingStep2) {
                        existingStep2.remove();
                    }
                    
                    // Insert the OTP step before the success step
                    const successStep = modalContent.querySelector('#success-step');
                    if (successStep) {
                        modalContent.insertBefore(otpStep, successStep);
                    } else {
                        modalContent.appendChild(otpStep);
                    }
                }
                
                modalTitle.textContent = 'Enter OTP';
                
                // Handle OTP form submission
                const otpForm = document.getElementById('otp-form');
                otpForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const otp = document.getElementById('otp-input').value.trim();
                    const newPassword = document.getElementById('new-password').value;
                    const confirmPassword = document.getElementById('confirm-password').value;
                    
                    if (!otp || otp.length !== 6) {
                        showModalError('Please enter a valid 6-digit OTP.');
                        return;
                    }
                    
                    if (newPassword.length < 6) {
                        showModalError('Password must be at least 6 characters long.');
                        return;
                    }
                    
                    if (newPassword !== confirmPassword) {
                        showModalError('Passwords do not match.');
                        return;
                    }
                    
                    const otpSubmitBtn = otpForm.querySelector('.submit');
                    const otpOriginalText = otpSubmitBtn.textContent;
                    otpSubmitBtn.disabled = true;
                    otpSubmitBtn.textContent = 'Resetting...';
                    
                    try {
                        const resetResponse = await fetch(`${getBackendUrl()}/api/users/reset-password`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                email: email.toLowerCase(),
                                otp: otp,
                                newPassword: newPassword
                            })
                        });
                        
                        const resetData = await resetResponse.json();
                        
                        if (resetResponse.ok && resetData.success) {
                            // Show success message
                            otpStep.style.display = 'none';
                            successStep.style.display = 'block';
                            modalTitle.textContent = 'Password Reset Success';
                        } else {
                            showModalError(resetData.message || 'Failed to reset password. Please try again.');
                        }
                    } catch (error) {
                        console.error('Reset password error:', error);
                        showModalError('Network error. Please try again.');
                    } finally {
                        otpSubmitBtn.disabled = false;
                        otpSubmitBtn.textContent = otpOriginalText;
                    }
                });
                
                // Handle resend OTP
                const resendLink = document.getElementById('resend-otp');
                resendLink.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    try {
                        const resendResponse = await fetch(`${getBackendUrl()}/api/users/check-email`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ email: email.toLowerCase() })
                        });
                        
                        const resendData = await resendResponse.json();
                        
                        if (resendResponse.ok && resendData.success) {
                            showModalError('New OTP sent to your email address.');
                        } else {
                            showModalError(resendData.message || 'Failed to resend OTP.');
                        }
                    } catch (error) {
                        showModalError('Network error. Please try again.');
                    }
                });
                
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