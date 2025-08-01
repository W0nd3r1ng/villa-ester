// Clerk Panel UI Logic

// Function to get the correct backend URL based on environment
function getBackendUrl() {
    // Check if we're in production (live) or development (localhost)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // We're in production - use the live backend URL
        return 'https://villa-ester-backend.onrender.com';
    } else {
        // We're in development - use localhost
        return 'http://localhost:5000';
    }
}

// Utility function to get backend URL
function getBackendUrl() {
    return 'https://villa-ester-backend.onrender.com';
}

document.addEventListener('DOMContentLoaded', async function() {
    // Authentication check
    function checkAuth() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || !user.role) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Allow both admin and clerk
        if (user.role !== 'clerk' && user.role !== 'admin') {
            window.location.href = 'login.html';
            return false;
        }
        
        return true;
    }
    
    // Check authentication before proceeding
    if (!checkAuth()) {
        return;
    }
    
    // Update user info in sidebar
    function updateUserInfo() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const profileName = document.querySelector('.profile-name');
        const profileStatus = document.querySelector('.profile-status');
        
        if (profileName) {
            profileName.textContent = user.name || 'Clerk';
        }
        if (profileStatus) {
            profileStatus.textContent = 'Clerk';
        }
    }
    
    updateUserInfo();

    // Debug function to check authentication
    function debugAuth() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('=== AUTH DEBUG ===');
        console.log('Token present:', !!token);
        console.log('User:', user);
        console.log('User role:', user.role);
        console.log('==================');
    }
    debugAuth();

    // Role-based UI for Reports & Analytics
    function updateRoleBasedUI() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        // Sidebar menu item
        const reportsMenu = document.querySelector('a[data-panel="clerk-reports-panel"]');
        const reportsPanel = document.getElementById('clerk-reports-panel');
        const userMgmtMenu = document.getElementById('user-management-link');
        const userMgmtPanel = document.getElementById('user-management-panel');
        if (user.role === 'clerk') {
            if (reportsMenu) reportsMenu.style.display = 'none';
            if (reportsPanel) reportsPanel.style.display = 'none';
            if (userMgmtMenu) userMgmtMenu.style.display = 'none';
            if (userMgmtPanel) userMgmtPanel.style.display = 'none';
        } else if (user.role === 'admin') {
            if (reportsMenu) reportsMenu.style.display = '';
            if (userMgmtMenu) userMgmtMenu.style.display = '';
        }
    }
    updateRoleBasedUI();

    // Elements
    const mainDashboardView = document.getElementById('main-dashboard-view');
    const addBookingBtn = document.getElementById('add-booking-btn');
    const addBookingModal = document.getElementById('add-booking-modal');
    const closeModal = document.getElementById('close-modal');
    const addBookingForm = document.getElementById('add-booking-form');

    // New elements for panel switching
    const checkInOutPanel = document.getElementById('check-in-out-panel');
    const quickBookingPanel = document.getElementById('quick-booking-panel');
    const guestManagementPanel = document.getElementById('guest-management-panel');

    // --- Socket.IO for real-time updates ---
    const socket = io(getBackendUrl(), {
      transports: ['websocket', 'polling']
    });

    let bookingsData = [];

    // Fetch bookings from backend
    async function fetchBookings() {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('Fetching bookings with token:', token ? 'Present' : 'Missing');
            console.log('User role:', user.role);
            
            const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            const response = await fetch(`${getBackendUrl()}/api/bookings`, { headers });
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Bookings response:', data);
            
            if (data.success && Array.isArray(data.data)) {
                bookingsData = data.data;
                console.log('Found bookings:', bookingsData.length);
            } else if (Array.isArray(data)) {
                bookingsData = data; // fallback for old API
                console.log('Found bookings (fallback):', bookingsData.length);
            } else {
                bookingsData = [];
                console.log('No bookings found');
            }
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            bookingsData = [];
        }
        updatePendingBookingsBadge();
        renderCancelledBookings();
    }

    // --- Utility Functions ---
    function updatePendingBookingsBadge() {
        const badge = document.getElementById('pending-bookings-badge');
        if (!badge) return;
        const pendingCount = bookingsData.filter(b => b.status === 'pending').length;
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = 'inline-block';
            // Optionally, add color classes for high/medium/low
            badge.classList.remove('high', 'medium', 'low');
            if (pendingCount >= 10) {
                badge.classList.add('high');
            } else if (pendingCount >= 5) {
                badge.classList.add('medium');
            } else {
                badge.classList.add('low');
            }
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
            badge.classList.remove('high', 'medium', 'low');
        }
    }

    // Listen for real-time booking events
    socket.on('booking-created', async (data) => {
        console.log('New booking created:', data);
        await fetchBookings();
        renderBookingList();
        renderCheckoutList && renderCheckoutList();
        renderPendingBookingList && renderPendingBookingList();
        updateDashboardOverview && updateDashboardOverview();
        updatePendingBookingsBadge();
        renderCancelledBookings();
        showNotification('New booking received!', 'success');
    });
    
    socket.on('booking-updated', async (data) => {
        console.log('Booking updated:', data);
        await fetchBookings();
        renderBookingList();
        renderCheckoutList && renderCheckoutList();
        renderPendingBookingList && renderPendingBookingList();
        updateDashboardOverview && updateDashboardOverview();
        updatePendingBookingsBadge();
        renderCancelledBookings();
        showNotification('Booking status updated!', 'info');
    });
    
    socket.on('booking-deleted', async (data) => {
        console.log('Booking deleted:', data);
        await fetchBookings();
        renderBookingList();
        renderCheckoutList && renderCheckoutList();
        renderPendingBookingList && renderPendingBookingList();
        updateDashboardOverview && updateDashboardOverview();
        updatePendingBookingsBadge();
        renderCancelledBookings();
        showNotification('Booking deleted!', 'warning');
    });
    
    // Socket connection status
    socket.on('connect', () => {
        console.log('Connected to server via Socket.IO');
        showNotification('Connected to real-time updates', 'success');
        
        // Test real-time connection by emitting a test event
        socket.emit('test-connection', { message: 'Clerk panel connected' });
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showNotification('Lost connection to real-time updates', 'error');
    });
    
    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        showNotification('Connection error - real-time updates may not work', 'error');
    });
    
    // Test event to verify real-time communication
    socket.on('test-response', (data) => {
        console.log('Real-time test successful:', data);
    });
    
    // Debug: Log all incoming socket events
    socket.onAny((eventName, ...args) => {
        console.log('Socket event received:', eventName, args);
    });

    // Function to automatically check out day tour bookings at 6pm
    function startDayTourAutoCheckout() {
        // Check every minute for day tour bookings that need to be checked out
        setInterval(async () => {
            await checkAndAutoCheckoutDayTours();
        }, 60000); // Check every minute

        // Also check immediately when the function is called
        checkAndAutoCheckoutDayTours();
        
        console.log('Day tour auto-checkout monitoring started');
    }

    // Function to check and automatically check out day tour bookings at 6pm
    async function checkAndAutoCheckoutDayTours() {
        try {
            // Get current time
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
            const sixPM = 18 * 60; // 6pm in minutes
            
            // Only proceed if it's 6pm or later
            if (currentTime < sixPM) {
                return;
            }

            // Fetch latest bookings data
            await fetchBookings();
            
            // Find day tour bookings that are still checked in
            const dayTourBookings = bookingsData.filter(booking => {
                return booking.status === 'completed' && 
                       booking.notes?.includes('daytour') &&
                       booking.bookingDate;
            });

            if (dayTourBookings.length === 0) {
                return;
            }

            console.log(`Found ${dayTourBookings.length} day tour bookings to auto-checkout`);

            // Check out each day tour booking
            for (const booking of dayTourBookings) {
                const bookingDate = new Date(booking.bookingDate);
                const today = new Date();
                
                // Only auto-checkout if it's the same day
                if (bookingDate.toDateString() === today.toDateString()) {
                    console.log(`Auto-checking out day tour booking: ${booking.fullName}`);
                    
                    try {
                        const response = await fetch(`${getBackendUrl()}/api/bookings/${booking._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                status: 'checked_out',
                                notes: `${booking.notes || ''}; Auto-checked out at 6pm (day tour)`
                            })
                        });
                        
                        if (response.ok) {
                            console.log(`Successfully auto-checked out: ${booking.fullName}`);
                            showNotification(`Day tour guest ${booking.fullName} automatically checked out at 6pm`, 'info');
                        } else {
                            console.error(`Failed to auto-checkout: ${booking.fullName}`);
                        }
                    } catch (error) {
                        console.error(`Error auto-checking out ${booking.fullName}:`, error);
                    }
                }
            }

            // Refresh the checkout list if it's currently visible
            const checkoutTab = document.querySelector('.arrival-tab[data-tab="checkout"]');
            if (checkoutTab && checkoutTab.classList.contains('active')) {
                await fetchBookings();
                renderCheckoutList();
            }

        } catch (error) {
            console.error('Error in day tour auto-checkout:', error);
        }
    }

    // Start day tour auto-checkout monitoring
    startDayTourAutoCheckout();

    // Notification function for real-time updates
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
            font-weight: 600;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // --- Walk-in Guest List State ---
    let walkinGuests = [
        { name: 'Juan Dela Cruz', cottage: 'Standard Cottage', bookingType: 'Day Tour', date: '2024-06-10 (8am–6pm)' },
        { name: 'Maria Santos', cottage: 'Villa', bookingType: 'Overnight Stay', date: '2024-06-10 to 2024-06-11' }
    ];

    // Show Add Booking Modal
    if (addBookingBtn) {
        addBookingBtn.addEventListener('click', function() {
            addBookingModal.style.display = 'block';
        });
    }

    // Close Modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            addBookingModal.style.display = 'none';
            if (addBookingForm) addBookingForm.reset();
        });
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === addBookingModal) {
            addBookingModal.style.display = 'none';
            if (addBookingForm) addBookingForm.reset();
        }
    };

    // Function to show a specific panel and update active link
    function showPanel(panelToShow, activeLink) {
        console.log('showPanel called with panel:', panelToShow.id, 'activeLink:', activeLink ? activeLink.textContent.trim() : 'none');
        document.querySelectorAll('.dashboard-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        document.querySelectorAll('.sidebar-nav ul li a').forEach(link => {
            link.classList.remove('active');
        });
        if (panelToShow) {
            panelToShow.style.display = 'block';
            // Real-time: If user management panel is shown and update is needed, update the user table
            if (panelToShow.id === 'user-management-panel' && window._userTableNeedsUpdate) {
                if (typeof fetchUsers === 'function' && typeof renderUserTable === 'function') {
                    fetchUsers().then(() => {
                        renderUserTable();
                        window._userTableNeedsUpdate = false;
                        console.log('User table updated on panel show.');
                    });
                }
            }
        }
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Event Listeners for sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-nav ul li a');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const panelId = link.getAttribute('data-panel');
            const panel = document.getElementById(panelId);
            if (panel) {
                showPanel(panel, link);
                if (panelId === 'check-in-out-panel') {
                    renderBookingList();
                } else if (panelId === 'guest-management-panel') {
                    // Reset status tab to Pending when switching to Guest Management
                    const statusTabs = document.querySelectorAll('.booking-status-tab');
                    if (statusTabs.length) {
                        statusTabs.forEach(t => t.classList.remove('active'));
                        statusTabs[0].classList.add('active');
                    }
                    await fetchBookings();
                    renderPendingBookingList('pending');
                } else if (panelId === 'clerk-reports-panel') {
                    // Update revenue overview when switching to Reports panel
                    await updateClerkRevenueOverview();
                }
            }
        });
    });

    // Event listener for the 'New Walk-in' button in Today's Arrivals
    const todayArrivalsNewWalkInBtn = document.querySelector('#check-in-out-panel .action-card .btn.action-btn-primary');
    if (todayArrivalsNewWalkInBtn) {
        todayArrivalsNewWalkInBtn.addEventListener('click', () => {
            const quickBookingLink = document.querySelector('.sidebar-nav ul li a[data-panel="quick-booking-panel"]');
            if (quickBookingLink) {
                quickBookingLink.click();
            }
        });
    }

    // Event listener for the 'New Walk-in' button in Dashboard Overview
    const dashboardNewWalkInBtn = document.getElementById('dashboard-walkin-btn');
    if (dashboardNewWalkInBtn) {
        dashboardNewWalkInBtn.addEventListener('click', () => {
            const quickBookingLink = document.querySelector('.sidebar-nav ul li a[data-panel="quick-booking-panel"]');
            if (quickBookingLink) {
                quickBookingLink.click();
            }
        });
    }
    
    // Add manual refresh button for testing real-time updates
    const sidebarRefreshBtn = document.getElementById('refresh-data-btn');
    if (sidebarRefreshBtn) {
        sidebarRefreshBtn.addEventListener('click', async () => {
            console.log('Sidebar refresh triggered');
            await fetchBookings();
            renderBookingList();
            renderCheckoutList && renderCheckoutList();
            renderPendingBookingList && renderPendingBookingList();
            updateDashboardOverview && updateDashboardOverview();
    
            showNotification('Data refreshed manually', 'info');
        });
    }

    // --- Dashboard Data ---
    let cottagesData = [];

    // Fetch cottages from backend
    async function fetchCottages() {
        try {
            const response = await fetch(`${getBackendUrl()}/api/cottages`);
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                cottagesData = data.data;
            } else if (Array.isArray(data)) {
                cottagesData = data;
            } else {
                cottagesData = [];
            }
        } catch (err) {
            console.error('Failed to fetch cottages:', err);
            cottagesData = [];
        }
    }

    // Update dashboard overview
    async function updateDashboardOverview() {
        // Ensure we have the latest data
        await fetchBookings();
        await fetchCottages();
        
        // Calculate occupancy and revenue with real database data
        const today = new Date().toISOString().slice(0, 10);
        let occupiedCount = 0;
        let todayRevenue = 0;
        let todayBookings = 0;
        const occupiedCottageIds = new Set();

        // Create a map of cottage prices from database
        const cottagePriceMap = {};
        cottagesData.forEach(cottage => {
            cottagePriceMap[cottage.type] = cottage.price;
        });
        
        // Fallback prices if database doesn't have them
        const fallbackPrices = {
            'kubo': 800,
            'With Videoke': 2500,
            'Without Videoke': 2000,
            'garden': 300
        };

        bookingsData.forEach(booking => {
            // Only count confirmed or completed bookings as occupied
            const bookingDate = (booking.bookingDate || '').slice(0, 10);
            if ((booking.status === 'confirmed' || booking.status === 'completed') && bookingDate === today) {
                let cottageKey = booking.cottageId;
                if (typeof cottageKey === 'object' && cottageKey !== null && cottageKey._id) {
                    cottageKey = cottageKey._id;
                }
                // fallback to string if not object
                if (!cottageKey) {
                    cottageKey = booking.cottage || booking.cottageName;
                }
                console.log('Counting occupied cottage:', cottageKey, 'for booking:', booking);
                occupiedCottageIds.add(cottageKey);
                
                // Calculate revenue with real pricing structure
                const cottageType = booking.cottageType;
                const cottagePrice = cottagePriceMap[cottageType] || fallbackPrices[cottageType] || 0;
                
                // Calculate entrance fees
                const adults = booking.numberOfPeople || booking.adults || 1;
                const children = booking.children || 0;
                const adultEntranceFee = adults * 150; // ₱150 per adult
                const childEntranceFee = children * 100; // ₱100 per child
                const entranceFees = adultEntranceFee + childEntranceFee;
                
                // Total revenue for this booking
                const bookingTotal = cottagePrice + entranceFees;
                todayRevenue += bookingTotal;
                todayBookings++;
            }
        });
        
        console.log('Total unique occupied cottages:', occupiedCottageIds.size, Array.from(occupiedCottageIds));
        console.log('Total cottages:', cottagesData.length, cottagesData.map(c => c._id || c.name));
        occupiedCount = occupiedCottageIds.size;
        
        // Calculate total cottages from database
        const totalCottages = cottagesData.reduce((total, cottage) => total + (cottage.quantity || 1), 0);
        const occupancy = totalCottages ? Math.round((occupiedCount / totalCottages) * 100) : 0;

        // Update DOM
        const occupancyCard = document.querySelector('#dashboard-overview-panel .card:nth-child(1) p');
        const revenueCard = document.querySelector('#dashboard-overview-panel .card:nth-child(2) p');
        if (occupancyCard) {
            occupancyCard.textContent = `${occupancy}% of rooms currently occupied`;
        }
        if (revenueCard) {
            revenueCard.textContent = `₱${todayRevenue.toLocaleString()} from ${todayBookings} bookings`;
        }
    }



    // Update dashboard and table after fetching data
    async function updateDashboardAndTable() {
        await Promise.all([fetchBookings(), fetchCottages()]);
        await updateDashboardOverview();
        renderCottageNumberStatus();
    }

    // On dashboard load, update with real data
    function showDashboard() {
        mainDashboardView.style.display = 'flex';
        const defaultLink = document.querySelector('.sidebar-nav ul li a.active');
        const defaultPanelId = defaultLink ? defaultLink.getAttribute('data-panel') : 'check-in-out-panel';
        const defaultPanel = document.getElementById(defaultPanelId);
        if (defaultPanel && defaultLink) {
            showPanel(defaultPanel, defaultLink);
        } else if (defaultPanel) {
            showPanel(defaultPanel, null);
        }
        updateDashboardAndTable();
        
        // Set up periodic refresh as fallback (every 30 seconds)
        setInterval(async () => {
            console.log('Periodic refresh triggered');
            await fetchBookings();
            renderBookingList();
            renderCheckoutList && renderCheckoutList();
            renderPendingBookingList && renderPendingBookingList();
        }, 30000);
    }

    function renderBookingList() {
        const container = document.getElementById('arrival-list-container');
        if (!container) return;

        container.innerHTML = '';

        // Get today's date in YYYY-MM-DD
        const today = new Date().toISOString().slice(0, 10);
        // Filter bookings for today and not cancelled/rejected/completed/checked_out
        const todaysArrivals = bookingsData.filter(booking => {
            const bookingDate = (booking.bookingDate || '').slice(0, 10);
            return (
                bookingDate === today &&
                booking.status !== 'cancelled' &&
                booking.status !== 'rejected' &&
                booking.status !== 'completed' &&
                booking.status !== 'checked_out'
            );
        });

        if (todaysArrivals.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No arrivals scheduled for today.</p>';
            return;
        }

        todaysArrivals.forEach(booking => {
            const arrivalCard = document.createElement('div');
            arrivalCard.className = 'arrival-card';
            arrivalCard.innerHTML = `
                <div class="arrival-info">
                    <h3>${booking.fullName || 'Guest'}</h3>
                    <p><strong>Cottage:</strong> ${booking.cottageType}${booking.cottageNumber ? ' #' + booking.cottageNumber : ''}</p>
                    <p><strong>Booking Type:</strong> ${booking.notes?.includes('daytour') ? 'Day Tour' : 'Overnight'}</p>
                    <p><strong>Time:</strong> ${booking.bookingTime || 'N/A'}</p>
                    <p><strong>Guests:</strong> ${booking.numberOfPeople || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${booking.contactPhone || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status ${booking.status || 'pending'}">${booking.status || 'Pending'}</span></p>
                </div>
                <div class="arrival-actions">
                    ${booking.status === 'completed' ? 
                        '<button class="btn btn-success" disabled>✓ Checked In</button>' :
                        '<button class="btn btn-primary check-in-btn" data-booking-id="' + booking._id + '">Check In</button>'
                    }
                </div>
            `;
            container.appendChild(arrivalCard);
        });

        // Add event listeners for check-in buttons
        document.querySelectorAll('.check-in-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const bookingId = e.target.getAttribute('data-booking-id');
                await markBookingAsCompleted(bookingId);
            });
        });

        // Update the header count
        const guestListHeader = document.querySelector('.guest-list-header');
        if (guestListHeader) {
            guestListHeader.textContent = `Today's Arrivals (${todaysArrivals.length})`;
        }
    }

    // Function to mark booking as completed (check-in)
    async function markBookingAsCompleted(bookingId) {
        try {
                    const response = await fetch(`${getBackendUrl()}/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
        });
            
            if (response.ok) {
                await fetchBookings();
                renderBookingList();
                showAlert('Guest checked in successfully!', 'success');
                // No automatic tab switch; just update the data
                return;
            } else {
                showAlert('Failed to check in guest.', 'error');
            }
        } catch (err) {
            console.error('Error checking in guest:', err);
            showAlert('Error checking in guest: ' + err.message, 'error');
        }
    }

    // Add status tab filtering for Guest Management
    const statusTabs = document.querySelectorAll('.booking-status-tab');
    let currentStatusFilter = 'pending';
    if (statusTabs.length) {
        statusTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                statusTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentStatusFilter = this.getAttribute('data-status');
                renderPendingBookingList(currentStatusFilter);
            });
        });
    }

    function renderPendingBookingList(status = 'pending') {
        const container = document.getElementById('pending-bookings-container');
        const noBookingsMessage = document.getElementById('no-pending-bookings');
        if (!container || !noBookingsMessage) return;
        container.innerHTML = '';
        // Filter bookings by status
        let filteredBookings = bookingsData;
        if (status === 'completed') {
            filteredBookings = bookingsData.filter(booking => booking.status === 'checked_out');
        } else if (status === 'cancelled') {
            filteredBookings = bookingsData.filter(booking => booking.status === 'cancelled');
        } else if (status !== 'all') {
            filteredBookings = bookingsData.filter(booking => booking.status === status);
        }
        if (!filteredBookings.length) {
            noBookingsMessage.style.display = 'block';
            return;
        } else {
            noBookingsMessage.style.display = 'none';
        }
        filteredBookings.forEach(booking => {
            const item = document.createElement('div');
            item.classList.add('pending-booking-item');
            let guestName = booking.fullName || (booking.userId && booking.userId.name) || booking.name || booking.contactName || 'Guest';
            const roomType = booking.cottageType || booking.roomType || 'Cottage';
            const cottageNumber = booking.cottageNumber ? ` #${booking.cottageNumber}` : '';
            const fullRoomInfo = roomType + cottageNumber;
            const bookingType = booking.bookingType || (booking.notes && booking.notes.toLowerCase().includes('overnight') ? 'Overnight' : 'Day Tour');
            let checkinTime = '-';
            let checkoutTime = '-';
            if (bookingType.toLowerCase() === 'day tour') {
                checkinTime = '8:00 AM';
                checkoutTime = '6:00 PM';
            } else if (bookingType.toLowerCase() === 'overnight') {
                checkinTime = '6:00 PM';
                checkoutTime = '7:00 AM (next day)';
            }
            function formatDate(dateStr) {
                if (!dateStr || dateStr === '-') return '-';
                const d = new Date(dateStr);
                if (isNaN(d)) return dateStr;
                return d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
            }
            let checkin = formatDate(booking.checkinDate || booking.bookingDate || '-') + ' ' + checkinTime;
            let checkout;
            if (bookingType.toLowerCase() === 'overnight') {
                let checkinDate = booking.checkinDate || booking.bookingDate;
                if (checkinDate) {
                    let d = new Date(checkinDate);
                    d.setDate(d.getDate() + 1);
                    checkout = formatDate(d.toISOString()) + ' 7:00 AM';
                } else {
                    checkout = '- 7:00 AM';
                }
            } else {
                checkout = formatDate(booking.checkoutDate || '-') + ' ' + checkoutTime;
            }
            const adults = booking.adults || booking.numberOfPeople || 1;
            const children = booking.children || 0;
            const proofUrl = booking.proofOfPayment ? (booking.proofOfPayment.startsWith('http') ? booking.proofOfPayment : `${getBackendUrl()}${booking.proofOfPayment}`) : '';
            const isWalkIn = booking.notes?.includes('Walk-in booking');
            item.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    <i class="material-icons">person</i>
                    <span style="font-weight:600;">${guestName}</span>
                    ${isWalkIn ? '<span style="color: #e67e22; font-size: 0.8em; font-weight: 600; margin-left: 8px; padding: 2px 6px; background: #fdf2e9; border-radius: 4px;">WALK-IN</span>' : ''}
                </div>
                <div style="margin-left:32px;min-width:180px;">${fullRoomInfo}<br><span style="font-size:0.95em;color:#888;">Check-in: ${checkin}<br>Check-out: ${checkout}</span></div>
                <div style="margin-left:32px;min-width:120px;">${adults} Adult${adults>1?'s':''}, ${children} Child${children!==1?'ren':''}</div>
                <div style="margin-left:32px;min-width:120px;">Status: <span style="font-weight:600;">${booking.status.charAt(0).toUpperCase()+booking.status.slice(1)}</span></div>
                <div style="margin-left:32px;min-width:120px;">
                    <strong>GCash Ref:</strong> ${booking.gcashReference || '<span style=\'color:#888\'>N/A</span>'}<br>
                    ${proofUrl ? `<a href="${proofUrl}" target="_blank" title="View Proof of Payment"><img src="${proofUrl}" alt="Proof of Payment" style="max-width:60px;max-height:40px;border-radius:4px;box-shadow:0 1px 4px #ccc;vertical-align:middle;"></a>` : '<span style="color:#888;font-size:0.95em;">No proof uploaded</span>'}
                </div>
                <div style="margin-left:auto;display:flex;gap:16px;">
                    ${(booking.status === 'pending') ? `<button class="btn-approve" title="Approve" style="color:#43a047;background:none;border:none;cursor:pointer;font-size:1.1em;display:flex;align-items:center;"><i class="material-icons">check_circle</i> Approve</button>
                    <button class="btn-reject" title="Reject" style="color:#1976d2;background:none;border:none;cursor:pointer;font-size:1.1em;display:flex;align-items:center;"><i class="material-icons">cancel</i> Reject</button>` : ''}
                </div>
            `;
            if (booking.status === 'pending') {
                item.querySelector('.btn-approve').onclick = async () => {
                    await confirmBooking(booking._id);
                };
                item.querySelector('.btn-reject').onclick = async () => {
                    await rejectBooking(booking._id);
                };
            }
            container.appendChild(item);
        });
    }

    async function updateBookingStatus(bookingId, status) {
        try {
            const response = await fetch(`${getBackendUrl()}/api/bookings/${bookingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                await fetchBookings();
                renderPendingBookingList();
                renderBookingList(); // update arrivals too
                updatePendingBookingsBadge();
                showAlert(`Booking ${status} successfully!`, 'success');
            } else {
                const result = await response.json();
                if (result.errors && Array.isArray(result.errors)) {
                    showAlert('Failed to update booking status: ' + result.errors.map(e => e.msg).join(' | '), 'error');
                } else {
                    showAlert('Failed to update booking status: ' + (result.message || response.status), 'error');
                }
            }
        } catch (err) {
            showAlert('Error updating booking: ' + err.message, 'error');
        }
    }

    // --- Utility Functions ---
    function renderWalkinGuestList() {
        const guestDetails = document.getElementById('quick-booking-guest-details');
        const tbody = guestDetails.querySelector('tbody');
        const count = guestDetails.querySelector('.walkin-count');
        tbody.innerHTML = '';
        if (walkinGuests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No walk-in guests yet.</td></tr>';
        } else {
            walkinGuests.forEach((guest, idx) => {
                const bookingType = guest.bookingType || 'Day Tour';
                const cottage = guest.cottage || guest.cottageType || 'N/A';
                const cottageNumber = guest.cottageNumber ? ` #${guest.cottageNumber}` : '';
                const fullCottageInfo = cottage + cottageNumber;
                const name = guest.name || guest.fullName || 'Guest';
                const numPeople = guest.numberOfPeople || guest.adults || 1;
                const phone = guest.phone || guest.contactPhone || '';
                const email = guest.email || guest.contactEmail || '';
                const specialRequests = guest.specialRequests || guest.notes || '';
                tbody.innerHTML += `
                    <tr>
                        <td style="padding:8px;">${name}</td>
                        <td style="padding:8px;">${bookingType}</td>
                        <td style="padding:8px;">${fullCottageInfo}</td>
                        <td style="padding:8px;">${numPeople}</td>
                        <td style="padding:8px;">${phone}</td>
                        <td style="padding:8px;">${email}</td>
                        <td style="padding:8px;">${specialRequests}</td>
                        <td style="padding:8px;"><button class="remove-guest-btn" data-idx="${idx}" style="color:#fff;background:#e74c3c;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;">Remove</button></td>
                    </tr>
                `;
            });
        }
        if (count) count.textContent = walkinGuests.length;
        // Add remove event listeners
        guestDetails.querySelectorAll('.remove-guest-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = +this.getAttribute('data-idx');
                walkinGuests.splice(idx, 1);
                renderWalkinGuestList();
                showAlert('Guest removed.', 'success');
            };
        });
    }

    function showAlert(msg, type) {
        let alert = document.getElementById('quick-booking-alert');
        if (!alert) {
            alert = document.createElement('div');
            alert.id = 'quick-booking-alert';
            alert.style.position = 'fixed';
            alert.style.top = '24px';
            alert.style.right = '24px';
            alert.style.zIndex = '2000';
            alert.style.padding = '14px 24px';
            alert.style.borderRadius = '8px';
            alert.style.fontWeight = '600';
            alert.style.fontSize = '1.1em';
            alert.style.boxShadow = '0 2px 12px rgba(80,80,120,0.10)';
            document.body.appendChild(alert);
        }
        alert.textContent = msg;
        alert.style.background = type === 'success' ? '#6c63ff' : '#e74c3c';
        alert.style.color = '#fff';
        alert.style.display = 'block';
        setTimeout(() => { alert.style.display = 'none'; }, 2200);
    }

    // --- Quick Booking Form Submission ---
    const quickBookingForm = document.querySelector('.quick-booking-form');
    const quickBookingAlert = document.getElementById('quick-booking-alert');
    if (quickBookingForm) {
        quickBookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Collect form data
            const fullName = document.getElementById('qb-full-name').value.trim();
            const phone = document.getElementById('qb-phone').value.trim();
            const email = document.getElementById('qb-email').value.trim();
            const specialRequests = document.getElementById('qb-special-requests').value.trim();
            const bookingType = document.getElementById('qb-booking-type').value;
            if (!bookingType) {
                if (quickBookingAlert) {
                    quickBookingAlert.style.display = 'block';
                    quickBookingAlert.style.color = '#dc3545';
                    quickBookingAlert.textContent = 'Please select a booking type.';
                    setTimeout(() => { quickBookingAlert.style.display = 'none'; }, 4000);
                }
                return;
            }
            const cottageType = document.getElementById('qb-cottage-type').value;
            let bookingDate = new Date().toISOString().slice(0, 10); // Always set bookingDate to today
            let bookingTime = '';
            let duration = 0;
            let checkinDate = '';
            let checkoutDate = '';
            if (bookingType === 'daytour') {
                bookingTime = '08:00'; // Default time for walk-in
                duration = 600; // Default duration (10 hours)
            } else if (bookingType === 'overnight') {
                checkinDate = document.getElementById('qb-checkin-date').value;
                checkoutDate = document.getElementById('qb-checkout-date').value;
                bookingTime = '18:00'; // Default check-in time for overnight
                duration = 1080; // Default duration (18 hours)
            }
            const adults = parseInt(document.getElementById('qb-adults').value, 10) || 1;
            const children = parseInt(document.getElementById('qb-children').value, 10) || 0;
            // Prepare booking data
            const now = new Date();
            const dateString = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
            const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const bookingData = {
                fullName: fullName,
                contactPhone: phone,
                specialRequests,
                cottageType,
                bookingDate,
                bookingTime,
                duration,
                numberOfPeople: adults + children,
                notes: `Booking Type: ${bookingType}; Adults: ${adults}; Children: ${children}; Walk-in booking`,
                status: 'completed', // Automatically set to completed for walk-in bookings
                createdAt: now,
                walkinDate: `${dateString} ${timeString}` // Add walk-in date for log
            };
            if (email) {
                bookingData.contactEmail = email;
            }
            if (bookingType === 'overnight') {
                bookingData.checkinDate = checkinDate;
                bookingData.checkoutDate = checkoutDate;
            }
            const selectedNumber = document.getElementById('qb-cottage-number').value;
            if (selectedNumber) bookingData.cottageNumber = selectedNumber;
            console.log('Submitting bookingData:', bookingData);
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = 'Bearer ' + token;
                const response = await fetch(`${getBackendUrl()}/api/bookings`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(bookingData)
                });
                if (response.ok) {
                    quickBookingForm.reset();
                    if (quickBookingAlert) {
                        quickBookingAlert.style.display = 'block';
                        quickBookingAlert.style.color = '#4CAF50';
                        quickBookingAlert.textContent = 'Walk-in booking successful! Guest automatically checked in.';
                        setTimeout(() => { quickBookingAlert.style.display = 'none'; }, 3000);
                    }
                    
                    // Update the data
                    await fetchBookings();
                    renderBookingList();
                    renderCheckoutList && renderCheckoutList();
                    
                    // Automatically redirect to Check-in & Check-out panel and show checkout tab
                    const checkInOutLink = document.querySelector('.sidebar-nav ul li a[data-panel="check-in-out-panel"]');
                    if (checkInOutLink) {
                        checkInOutLink.click();
                        
                        // Switch to checkout tab after a short delay
                        setTimeout(() => {
                            const checkoutTab = document.querySelector('.arrival-tab[data-tab="checkout"]');
                            if (checkoutTab) {
                                checkoutTab.click();
                            }
                        }, 300);
                    }
                    
                    return;
                } else {
                    const error = await response.json();
                    if (quickBookingAlert) {
                        quickBookingAlert.style.display = 'block';
                        quickBookingAlert.style.color = '#dc3545';
                        if (error.errors && Array.isArray(error.errors)) {
                            quickBookingAlert.textContent = 'Booking failed: ' + error.errors.map(e => e.msg).join(' | ');
                        } else {
                            quickBookingAlert.textContent = 'Booking failed: ' + (error.message || 'Unknown error');
                        }
                        setTimeout(() => { quickBookingAlert.style.display = 'none'; }, 4000);
                    }
                }
            } catch (err) {
                if (quickBookingAlert) {
                    quickBookingAlert.style.display = 'block';
                    quickBookingAlert.style.color = '#dc3545';
                    quickBookingAlert.textContent = 'Booking failed: ' + err.message;
                    setTimeout(() => { quickBookingAlert.style.display = 'none'; }, 4000);
                }
            }
        });
    }

    // Render guest list on load and when switching tabs
    const guestDetailsTab = document.querySelector('.quick-booking-tabs .tab:nth-child(2)');
    if (guestDetailsTab) {
        guestDetailsTab.addEventListener('click', renderWalkinGuestList);
    }
    // Also render on page load in case tab is already active
    renderWalkinGuestList();

    // Dashboard buttons: View Details and View Report
    const viewDetailsBtn = document.querySelector('.dashboard-overview .card .action-btn-primary');
    const viewReportBtn = document.querySelectorAll('.dashboard-overview .card .action-btn-primary')[1];
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', function() {
            // Calculate real occupancy details with cottage type breakdown
            const today = new Date().toISOString().slice(0, 10);
            
            // Define cottage types and their counts
            const cottageTypes = {
                'kubo': { name: 'Kubo Type', total: 8, price: 800 },
                'With Videoke': { name: 'VE Cottage with Videoke', total: 2, price: 2500 },
                'Without Videoke': { name: 'VE Cottage without Videoke', total: 2, price: 2000 },
                'garden': { name: 'Garden Table', total: 10, price: 300 }
            };
            
            // Count occupied cottages by type
            const occupiedCounts = {};
            const vacantCounts = {};
            let totalOccupied = 0;
            let totalVacant = 0;
            
            bookingsData.forEach(booking => {
                const bookingDate = (booking.bookingDate || '').slice(0, 10);
                if ((booking.status !== 'cancelled' && booking.status !== 'rejected') && bookingDate === today) {
                    const cottageType = booking.cottageType;
                    if (cottageType && cottageTypes[cottageType]) {
                        occupiedCounts[cottageType] = (occupiedCounts[cottageType] || 0) + 1;
                        totalOccupied++;
                    }
                }
            });
            
            // Calculate vacant counts
            Object.keys(cottageTypes).forEach(type => {
                const cottage = cottageTypes[type];
                const occupied = occupiedCounts[type] || 0;
                const vacant = cottage.total - occupied;
                vacantCounts[type] = vacant;
                totalVacant += vacant;
            });
            
            const totalCottages = Object.values(cottageTypes).reduce((sum, cottage) => sum + cottage.total, 0);
            const occupancy = totalCottages ? Math.round((totalOccupied / totalCottages) * 100) : 0;
            
            // Find most popular cottage type
            let mostPopularType = 'N/A';
            let maxBookings = 0;
            Object.keys(occupiedCounts).forEach(type => {
                if (occupiedCounts[type] > maxBookings) {
                    maxBookings = occupiedCounts[type];
                    mostPopularType = cottageTypes[type].name;
                }
            });
            
            // Find most vacant cottage type
            let mostVacantType = 'N/A';
            let maxVacant = 0;
            Object.keys(vacantCounts).forEach(type => {
                if (vacantCounts[type] > maxVacant) {
                    maxVacant = vacantCounts[type];
                    mostVacantType = cottageTypes[type].name;
                }
            });
            
            const detailedContent = `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1em;">Overall Statistics</h3>
                    <ul style="padding-left: 18px; margin-bottom: 20px;">
                        <li><strong>Total Cottages:</strong> ${totalCottages}</li>
                        <li><strong>Occupied Cottages:</strong> ${totalOccupied}</li>
                        <li><strong>Vacant Cottages:</strong> ${totalVacant}</li>
                        <li><strong>Occupancy Rate:</strong> ${occupancy}%</li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1em;">Cottage Type Breakdown</h3>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                        ${Object.keys(cottageTypes).map(type => {
                            const cottage = cottageTypes[type];
                            const occupied = occupiedCounts[type] || 0;
                            const vacant = vacantCounts[type] || cottage.total;
                            const status = vacant > 0 ? 'Available' : 'Fully Booked';
                            const statusColor = vacant > 0 ? '#27ae60' : '#e74c3c';
                            return `
                                <div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 6px; border-left: 4px solid ${statusColor};">
                                    <div style="font-weight: 600; color: #2c3e50;">${cottage.name}</div>
                                    <div style="font-size: 0.9em; color: #666;">
                                        Occupied: ${occupied} | Vacant: ${vacant} | Status: <span style="color: ${statusColor}; font-weight: 500;">${status}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div>
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1em;">Highlights</h3>
                    <ul style="padding-left: 18px;">
                        <li><strong>Most Popular:</strong> ${mostPopularType} (${maxBookings} bookings)</li>
                        <li><strong>Most Available:</strong> ${mostVacantType} (${maxVacant} vacant)</li>
                    </ul>
                </div>
            `;
            
            showDashboardModal('Total Occupancy Details', detailedContent);
        });
    }
    if (viewReportBtn) {
        viewReportBtn.addEventListener('click', function() {
            // Calculate real revenue details with cottage prices + entrance fees
            const today = new Date().toISOString().slice(0, 10);
            let todayRevenue = 0;
            let todayBookings = 0;
            let totalEntranceFees = 0;
            let totalCottageRevenue = 0;
            let highestSale = 0;
            let highestSaleCottage = 'N/A';
            const cottageBookingCounts = {};
            const cottageRevenueBreakdown = {};
            
            // Define cottage prices
            const cottagePrices = {
                'kubo': 800,
                'With Videoke': 2500,
                'Without Videoke': 2000,
                'garden': 300
            };
            
            bookingsData.forEach(booking => {
                const bookingDate = (booking.bookingDate || '').slice(0, 10);
                if ((booking.status !== 'cancelled' && booking.status !== 'rejected') && bookingDate === today) {
                    todayBookings++;
                    
                    // Calculate cottage revenue
                    const cottageType = booking.cottageType;
                    const cottagePrice = cottagePrices[cottageType] || 0;
                    totalCottageRevenue += cottagePrice;
                    
                    // Calculate entrance fees
                    const adults = booking.numberOfPeople || booking.adults || 1;
                    const children = booking.children || 0;
                    const adultEntranceFee = adults * 150; // ₱150 per adult
                    const childEntranceFee = children * 100; // ₱100 per child
                    const entranceFees = adultEntranceFee + childEntranceFee;
                    totalEntranceFees += entranceFees;
                    
                    // Total revenue for this booking
                    const bookingTotal = cottagePrice + entranceFees;
                    todayRevenue += bookingTotal;
                    
                    // Track highest sale
                    if (bookingTotal > highestSale) {
                        highestSale = bookingTotal;
                        highestSaleCottage = cottageType || 'Unknown';
                    }
                    
                    // Track cottage booking counts and revenue
                    if (cottageType) {
                        cottageBookingCounts[cottageType] = (cottageBookingCounts[cottageType] || 0) + 1;
                        cottageRevenueBreakdown[cottageType] = (cottageRevenueBreakdown[cottageType] || 0) + bookingTotal;
                    }
                }
            });
            
            // Find most booked cottage type
            let mostBookedCottage = 'N/A';
            let maxBookings = 0;
            Object.keys(cottageBookingCounts).forEach(type => {
                if (cottageBookingCounts[type] > maxBookings) {
                    maxBookings = cottageBookingCounts[type];
                    mostBookedCottage = type;
                }
            });
            
            // Find highest revenue cottage type
            let highestRevenueCottage = 'N/A';
            let maxRevenue = 0;
            Object.keys(cottageRevenueBreakdown).forEach(type => {
                if (cottageRevenueBreakdown[type] > maxRevenue) {
                    maxRevenue = cottageRevenueBreakdown[type];
                    highestRevenueCottage = type;
                }
            });
            
            const detailedContent = `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1em;">Revenue Summary</h3>
                    <ul style="padding-left: 18px; margin-bottom: 20px;">
                        <li><strong>Total Revenue:</strong> ₱${todayRevenue.toLocaleString()}</li>
                        <li><strong>Total Bookings:</strong> ${todayBookings}</li>
                        <li><strong>Average per Booking:</strong> ₱${todayBookings > 0 ? Math.round(todayRevenue / todayBookings) : 0}</li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1em;">Revenue Breakdown</h3>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                        <div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 6px; border-left: 4px solid #27ae60;">
                            <div style="font-weight: 600; color: #2c3e50;">Cottage Revenue</div>
                            <div style="font-size: 0.9em; color: #666;">₱${totalCottageRevenue.toLocaleString()}</div>
                        </div>
                        <div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 6px; border-left: 4px solid #3498db;">
                            <div style="font-weight: 600; color: #2c3e50;">Entrance Fees</div>
                            <div style="font-size: 0.9em; color: #666;">₱${totalEntranceFees.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1em;">Cottage Type Revenue</h3>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                        ${Object.keys(cottageRevenueBreakdown).map(type => {
                            const revenue = cottageRevenueBreakdown[type];
                            const bookings = cottageBookingCounts[type];
                            const avgRevenue = bookings > 0 ? Math.round(revenue / bookings) : 0;
                            return `
                                <div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 6px; border-left: 4px solid #667eea;">
                                    <div style="font-weight: 600; color: #2c3e50;">${type}</div>
                                    <div style="font-size: 0.9em; color: #666;">
                                        Revenue: ₱${revenue.toLocaleString()} | Bookings: ${bookings} | Avg: ₱${avgRevenue}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div>
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1em;">Highlights</h3>
                    <ul style="padding-left: 18px;">
                        <li><strong>Highest Sale:</strong> ${highestSaleCottage} - ₱${highestSale.toLocaleString()}</li>
                        <li><strong>Most Booked:</strong> ${mostBookedCottage} (${maxBookings} bookings)</li>
                        <li><strong>Highest Revenue:</strong> ${highestRevenueCottage} - ₱${maxRevenue.toLocaleString()}</li>
                    </ul>
                </div>
            `;
            
            showDashboardModal("Today's Revenue Report", detailedContent);
        });
    }
    function showDashboardModal(title, content) {
        let modal = document.getElementById('dashboard-info-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dashboard-info-modal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(30,30,50,0.18)';
            modal.style.zIndex = '3000';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.innerHTML = `<div style='background:#fff;max-width:400px;width:90%;border-radius:14px;box-shadow:0 8px 32px rgba(80,80,120,0.18);padding:32px 24px 18px 24px;position:relative;'>
                <span id='close-dashboard-info-modal' style='position:absolute;top:12px;right:18px;font-size:1.7em;cursor:pointer;color:#888;'>&times;</span>
                <h2 style='margin-top:0;font-size:1.3em;color:#6c63ff;'>${title}</h2>
                <div style='margin-top:12px;'>${content}</div>
            </div>`;
            document.body.appendChild(modal);
        } else {
            modal.querySelector('h2').textContent = title;
            modal.querySelector('div[style*="margin-top:12px;"]').innerHTML = content;
            modal.style.display = 'flex';
        }
        document.getElementById('close-dashboard-info-modal').onclick = function() {
            modal.style.display = 'none';
        };
    }

    // Print Reports: Export today's arrivals as Excel
    function exportTodaysArrivalsToExcel() {
        const today = new Date().toISOString().slice(0, 10);
        const todaysArrivals = bookingsData.filter(booking => {
            const bookingDate = (booking.bookingDate || '').slice(0, 10);
            return (
                bookingDate === today &&
                booking.status !== 'cancelled' &&
                booking.status !== 'rejected'
            );
        });
        const data = todaysArrivals.map(booking => ({
            'Guest Name': booking.fullName || booking.guestName || booking.name || booking.contactName || 'Guest',
            'Cottage': booking.cottageType || booking.cottageName || booking.cottage || '',
            'Booking Type': booking.notes?.includes('daytour') ? 'Day Tour' : 'Overnight',
            'Time': booking.bookingTime || booking.eta || '-',
            'Number of Guests': booking.numberOfPeople || booking.adults || 1,
            'Phone': booking.contactPhone || '',
            'Status': booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'
        }));
        if (data.length === 0) {
            showAlert('No arrivals scheduled for today.', 'error');
            return;
        }
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Today's Arrivals");
        XLSX.writeFile(wb, `Todays_Arrivals_${today}.xlsx`);
    }
    // Update Print button to use Excel export
    const printReportsBtn = document.getElementById('print-reports-btn');
    if (printReportsBtn) {
        printReportsBtn.onclick = exportTodaysArrivalsToExcel;
    }

    // Modify Stay: Show a modal (placeholder for now)
    function showModifyStayModal() {
        alert('Modify Stay feature coming soon! Here you will be able to change dates, room, or guest details for current guests.');
    }

    // --- Settings: Real Backend Integration ---
    const token = localStorage.getItem('token');
    const usernameInput = document.getElementById('profile-username');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    // Fetch user profile on settings panel load
    async function fetchUserProfile() {
        if (!token) return;
        try {
            const res = await fetch(`${getBackendUrl()}/api/users/me`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success && data.data) {
                if (usernameInput) usernameInput.value = data.data.name || 'clerk';
                if (emailInput) emailInput.value = data.data.email || '';
                if (phoneInput) phoneInput.value = data.data.phone || '';
            }
        } catch (err) { /* ignore */ }
    }
    // Call on load
    fetchUserProfile();

    // Change Number logic
    const changeNumberBtn = document.getElementById('change-number-btn');
    if (changeNumberBtn && phoneInput) {
        changeNumberBtn.addEventListener('click', async function() {
            if (phoneInput.readOnly) {
                phoneInput.readOnly = false;
                phoneInput.focus();
                changeNumberBtn.textContent = 'Save Number';
            } else {
                const newPhone = phoneInput.value.trim();
                if (!/^\+?\d[\d\s-]{7,}$/.test(newPhone)) {
                    showAlert('Please enter a valid phone number.', 'error');
                    return;
                }
                try {
                    const res = await fetch(`${getBackendUrl()}/api/users/me`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ phone: newPhone })
                    });
                    const data = await res.json();
                    if (data.success) {
                        phoneInput.readOnly = true;
                        changeNumberBtn.textContent = 'Change Number';
                        showAlert('Phone number updated!', 'success');
                    } else {
                        showAlert(data.message || 'Failed to update phone.', 'error');
                    }
                } catch (err) {
                    showAlert('Failed to update phone.', 'error');
                }
            }
        });
    }
    // Sign Out logic
    const signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', function() {
            // Clear authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showAlert('Signed out!', 'success');
            setTimeout(() => window.location.href = 'login.html', 800);
        });
    }

    // --- Fetch and Render Customer List ---
    // async function fetchCustomers() {
    //     try {
    //         const response = await fetch('https://villa-ester-backend.onrender.com/api/users');
    //         const data = await response.json();
    //         if (data.success && Array.isArray(data.data)) {
    //             return data.data;
    //         } else {
    //             return [];
    //         }
    //     } catch (err) {
    //         console.error('Failed to fetch customers:', err);
    //         return [];
    //     }
    // }

    // function renderCustomerList(customers) {
    //     const panel = document.getElementById('guest-management-panel');
    //     let container = document.getElementById('customer-list-container');
    //     if (!container) {
    //         container = document.createElement('div');
    //         container.id = 'customer-list-container';
    //         panel.appendChild(container);
    //     }
    //     container.innerHTML = '';
    //     if (!customers.length) {
    //         container.innerHTML = '<p style="text-align:center; color:#888;">No customers found.</p>';
    //         return;
    //     }
    //     const table = document.createElement('table');
    //     table.style.width = '100%';
    //     table.style.borderCollapse = 'collapse';
    //     table.innerHTML = `<thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead><tbody></tbody>`;
    //     const tbody = table.querySelector('tbody');
    //     customers.forEach(cust => {
    //         const tr = document.createElement('tr');
    //         tr.innerHTML = `<td>${cust.name || ''}</td><td>${cust.email || ''}</td><td>${cust.phone || ''}</td>`;
    //         tbody.appendChild(tr);
    //     });
    //     container.appendChild(table);
    // }

    // --- Fetch and Render Reviews ---
    // async function fetchReviews() {
    //     try {
    //         const response = await fetch('https://villa-ester-backend.onrender.com/api/reviews');
    //         const data = await response.json();
    //         if (data.success && Array.isArray(data.data)) {
    //             return data.data;
    //         } else {
    //             return [];
    //         }
    //     } catch (err) {
    //         console.error('Failed to fetch reviews:', err);
    //         return [];
    //     }
    // }

    // function renderReviews(reviews) {
    //     const panel = document.getElementById('dashboard-overview-panel');
    //     let container = document.getElementById('reviews-list-container');
    //     if (!container) {
    //         container = document.createElement('div');
    //         container.id = 'reviews-list-container';
    //         panel.appendChild(container);
    //     }
    //     container.innerHTML = '';
    //     if (!reviews.length) {
    //         container.innerHTML = '<p style="text-align:center; color:#888;">No reviews yet.</p>';
    //         return;
    //     }
    //     reviews.forEach(review => {
    //         const div = document.createElement('div');
    //         div.className = 'review-item';
    //         div.style.marginBottom = '16px';
    //         div.innerHTML = `<strong>${review.name || 'Guest'}</strong>: <span>${review.comment || ''}</span>`;
    //         if (review.image) {
    //             div.innerHTML += `<br><img src="${review.image}" alt="Review Image" style="max-width:80px;max-height:60px;border-radius:6px;margin-top:4px;">`;
    //         }
    //         container.appendChild(div);
    //     });
    // }

    // --- Update dashboard panels with live data on load ---
    // const customers = await fetchCustomers();
    // renderCustomerList(customers);
    // // Fetch and render reviews in Dashboard Overview panel
    // const reviews = await fetchReviews();
    // renderReviews(reviews);

    // Tab switching for arrivals/checkout
    const arrivalTabs = document.querySelectorAll('.arrival-tab');
    const arrivalListContainer = document.getElementById('arrival-list-container');
    const checkoutListContainer = document.getElementById('checkout-list-container');
    const arrivalsHeader = document.querySelectorAll('.guest-list-header')[0];
    const checkoutHeader = document.querySelectorAll('.guest-list-header')[1];
    if (arrivalTabs.length) {
        arrivalTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                arrivalTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                if (this.getAttribute('data-tab') === 'arrivals') {
                    arrivalListContainer.style.display = '';
                    arrivalsHeader.style.display = '';
                    checkoutListContainer.style.display = 'none';
                    checkoutHeader.style.display = 'none';
                    renderBookingList();
                } else {
                    arrivalListContainer.style.display = 'none';
                    arrivalsHeader.style.display = 'none';
                    checkoutListContainer.style.display = '';
                    checkoutHeader.style.display = '';
                    renderCheckoutList();
                }
            });
        });
        // Ensure only the first tab is active on load
        arrivalTabs.forEach((t, i) => t.classList.toggle('active', i === 0));
    }

    function renderCheckoutList() {
        if (!checkoutListContainer) return;
        checkoutListContainer.innerHTML = '';
        // Show bookings with status: completed (checked-in, not yet checked out)
        const checkedIn = bookingsData.filter(booking => booking.status === 'completed');
        if (checkedIn.length === 0) {
            checkoutListContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No guests currently checked in.</p>';
            return;
        }
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const sixPM = 18 * 60;
        checkedIn.forEach(booking => {
            const isDayTour = booking.notes?.includes('daytour');
            let cardColor = '';
            let statusMsg = '';
            let showForceCheckout = false;
            if (isDayTour) {
                // Calculate time to 6pm
                const bookingDate = new Date(booking.bookingDate);
                const today = new Date();
                let minutesTo6pm = sixPM - (now.getHours() * 60 + now.getMinutes());
                let isToday = bookingDate.toDateString() === today.toDateString();
                if (isToday) {
                    if (currentMinutes < sixPM) {
                        if (minutesTo6pm > 30) {
                            cardColor = 'daytour-green';
                            statusMsg = 'At 6:00 PM';
                        } else if (minutesTo6pm > 0) {
                            cardColor = 'daytour-orange';
                            statusMsg = `In ${minutesTo6pm} minute${minutesTo6pm !== 1 ? 's' : ''}`;
                        }
                    } else {
                        cardColor = 'daytour-red';
                        statusMsg = 'OVERDUE - Will auto-checkout';
                        showForceCheckout = true;
                    }
                } else {
                    cardColor = 'daytour-green';
                    statusMsg = 'At 6:00 PM';
                }
            }
            const card = document.createElement('div');
            card.className = 'arrival-card' + (isDayTour ? ' ' + cardColor : '');
            card.innerHTML = `
                <div class="arrival-info">
                    <h3>${booking.fullName || 'Guest'}</h3>
                    <p><strong>Cottage:</strong> ${booking.cottageType}${booking.cottageNumber ? ' #' + booking.cottageNumber : ''}</p>
                    <p><strong>Booking Type:</strong> ${isDayTour ? 'Day Tour' : 'Overnight'}</p>
                    <p><strong>Time:</strong> ${booking.bookingTime || 'N/A'}</p>
                    <p><strong>Guests:</strong> ${booking.numberOfPeople || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${booking.contactPhone || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status completed">Checked In</span></p>
                    ${isDayTour ? `<p style="font-weight:600;margin-top:8px;">Day Tour Status: <span class="daytour-status-msg">${statusMsg}</span></p>` : ''}
                </div>
                <div class="arrival-actions">
                    <button class="btn btn-primary check-out-btn" data-booking-id="${booking._id}">Check Out</button>
                    ${showForceCheckout ? `<button class="btn btn-danger force-checkout-btn" data-booking-id="${booking._id}">Force Checkout</button>` : ''}
                </div>
            `;
            checkoutListContainer.appendChild(card);
        });
        // Add event listeners for check-out buttons
        document.querySelectorAll('.check-out-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const bookingId = e.target.getAttribute('data-booking-id');
                await markBookingAsCheckedOut(bookingId);
            });
        });
        // Add event listeners for force checkout buttons
        document.querySelectorAll('.force-checkout-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const bookingId = e.target.getAttribute('data-booking-id');
                await markBookingAsCheckedOut(bookingId);
            });
        });
    }

    async function markBookingAsCheckedOut(bookingId) {
        try {
            const response = await fetch(`${getBackendUrl()}/api/bookings/${bookingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'checked_out' })
            });
            if (response.ok) {
                await fetchBookings();
                renderCheckoutList();
                showAlert('Guest checked out successfully!', 'success');
                // Automatically switch to Guest Management > Completed tab
                const guestManagementLink = document.querySelector('.sidebar-nav ul li a[data-panel="guest-management-panel"]');
                if (guestManagementLink) {
                    guestManagementLink.click();
                    setTimeout(() => {
                        const completedTab = document.querySelector('.booking-status-tab[data-status="completed"]');
                        if (completedTab) completedTab.click();
                    }, 300);
                }
            } else {
                showAlert('Failed to check out guest.', 'error');
            }
        } catch (err) {
            showAlert('Error checking out guest: ' + err.message, 'error');
        }
    }

    // --- Clerk Reports & Analytics Functions ---
    
    // Calculate revenue stats with real database data
    async function calculateClerkRevenueStats(startDate, endDate) {
        // Ensure we have the latest data
        await fetchBookings();
        await fetchCottages();
        
        const filteredBookings = bookingsData.filter(booking => {
            const bookingDate = new Date(booking.bookingDate);
            return bookingDate >= startDate && bookingDate <= endDate && 
                   (booking.status === 'confirmed' || booking.status === 'completed');
        });
        
        let totalRevenue = 0;
        let totalBookings = 0;
        const revenueByCottageType = {};
        const revenueByDay = {};
        const bookingDetails = [];
        
        // Create a map of cottage prices from database
        const cottagePriceMap = {};
        cottagesData.forEach(cottage => {
            cottagePriceMap[cottage.type] = cottage.price;
        });
        
        // Fallback prices if database doesn't have them
        const fallbackPrices = {
            'kubo': 800,
            'With Videoke': 2500,
            'Without Videoke': 2000,
            'garden': 300
        };
        
        filteredBookings.forEach(booking => {
            // Get cottage price from database or fallback
            const cottageType = booking.cottageType;
            const cottagePrice = cottagePriceMap[cottageType] || fallbackPrices[cottageType] || 0;
            
            // Calculate entrance fees
            const adults = booking.numberOfPeople || booking.adults || 1;
            const children = booking.children || 0;
            const adultEntranceFee = adults * 150; // ₱150 per adult
            const childEntranceFee = children * 100; // ₱100 per child
            const entranceFees = adultEntranceFee + childEntranceFee;
            
            // Total revenue for this booking
            const bookingTotal = cottagePrice + entranceFees;
            totalRevenue += bookingTotal;
            totalBookings++;
            
            // Revenue by cottage type
            if (cottageType) {
                revenueByCottageType[cottageType] = (revenueByCottageType[cottageType] || 0) + bookingTotal;
            }
            
            // Revenue by day
            const day = booking.bookingDate.slice(0, 10);
            revenueByDay[day] = (revenueByDay[day] || 0) + bookingTotal;
            
            // Store booking details for detailed reports
            bookingDetails.push({
                id: booking._id,
                guestName: booking.fullName,
                cottageType: cottageType,
                cottagePrice: cottagePrice,
                adults: adults,
                children: children,
                entranceFees: entranceFees,
                totalRevenue: bookingTotal,
                bookingDate: booking.bookingDate,
                status: booking.status,
                contactPhone: booking.contactPhone
            });
        });
        
        return {
            totalRevenue,
            totalBookings,
            revenueByCottageType,
            revenueByDay,
            averageRevenue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
            bookingDetails,
            cottagePriceMap
        };
    }
    
    // Generate daily revenue report with real data
    async function generateClerkDailyRevenueReport() {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        
        const stats = await calculateClerkRevenueStats(startDate, endDate);
        
        // Find most popular cottage type
        const mostPopularCottage = Object.entries(stats.revenueByCottageType)
            .sort(([,a], [,b]) => b - a)[0];
        
        const reportContent = `
            <div class="revenue-report">
                <h3>Daily Revenue Report - ${today.toLocaleDateString()}</h3>
                <div class="revenue-summary">
                    <div class="revenue-stat">
                        <span class="label">Total Revenue:</span>
                        <span class="value">₱${stats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div class="revenue-stat">
                        <span class="label">Total Bookings:</span>
                        <span class="value">${stats.totalBookings}</span>
                    </div>
                    <div class="revenue-stat">
                        <span class="label">Average per Booking:</span>
                        <span class="value">₱${stats.averageRevenue.toLocaleString()}</span>
                    </div>
                    ${mostPopularCottage ? `
                    <div class="revenue-stat">
                        <span class="label">Most Popular:</span>
                        <span class="value">${mostPopularCottage[0]} (₱${mostPopularCottage[1].toLocaleString()})</span>
                    </div>
                    ` : ''}
                </div>
                
                <h4>Revenue by Cottage Type</h4>
                <div class="revenue-breakdown">
                    ${Object.entries(stats.revenueByCottageType).map(([type, revenue]) => `
                        <div class="breakdown-item">
                            <span class="type">${type}</span>
                            <span class="amount">₱${revenue.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                
                ${stats.bookingDetails.length > 0 ? `
                <h4>Today's Bookings</h4>
                <div class="booking-details-table">
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Guest</th>
                                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Cottage</th>
                                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">People</th>
                                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.bookingDetails.map(booking => `
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.guestName}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.cottageType}${booking.cottageNumber ? ' #' + booking.cottageNumber : ''}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.adults + booking.children} (${booking.adults}A, ${booking.children}C)</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₱${booking.totalRevenue.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<p style="text-align: center; color: #888; margin-top: 20px;">No bookings found for today.</p>'}
            </div>
        `;
        
        showDashboardModal("Daily Revenue Report", reportContent);
    }
    
    // Generate weekly revenue report with real data
    async function generateClerkWeeklyRevenueReport() {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        
        const stats = await calculateClerkRevenueStats(startDate, endDate);
        
        // Calculate daily averages and trends
        const dailyAverage = stats.totalRevenue / 7;
        const sortedDays = Object.entries(stats.revenueByDay).sort(([a], [b]) => new Date(a) - new Date(b));
        
        const reportContent = `
            <div class="revenue-report">
                <h3>Weekly Revenue Report - Last 7 Days</h3>
                <div class="revenue-summary">
                    <div class="revenue-stat">
                        <span class="label">Total Revenue:</span>
                        <span class="value">₱${stats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div class="revenue-stat">
                        <span class="label">Total Bookings:</span>
                        <span class="value">${stats.totalBookings}</span>
                    </div>
                    <div class="revenue-stat">
                        <span class="label">Daily Average:</span>
                        <span class="value">₱${dailyAverage.toLocaleString()}</span>
                    </div>
                    <div class="revenue-stat">
                        <span class="label">Average per Booking:</span>
                        <span class="value">₱${stats.averageRevenue.toLocaleString()}</span>
                    </div>
                </div>
                
                <h4>Daily Breakdown</h4>
                <div class="revenue-breakdown">
                    ${sortedDays.map(([day, revenue]) => `
                        <div class="breakdown-item">
                            <span class="type">${new Date(day).toLocaleDateString()}</span>
                            <span class="amount">₱${revenue.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                
                <h4>Revenue by Cottage Type</h4>
                <div class="revenue-breakdown">
                    ${Object.entries(stats.revenueByCottageType).map(([type, revenue]) => `
                        <div class="breakdown-item">
                            <span class="type">${type}</span>
                            <span class="amount">₱${revenue.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        showDashboardModal("Weekly Revenue Report", reportContent);
    }
    
    // Generate monthly revenue report with real data
    async function generateClerkMonthlyRevenueReport() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        
        const stats = await calculateClerkRevenueStats(startDate, endDate);
        
        // Calculate monthly insights
        const daysInMonth = today.getDate();
        const dailyAverage = stats.totalRevenue / daysInMonth;
        const mostPopularCottage = Object.entries(stats.revenueByCottageType)
            .sort(([,a], [,b]) => b - a)[0];
        
        const reportContent = `
            <div class="revenue-report">
                <h3>Monthly Revenue Report - ${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <div class="revenue-summary">
                    <div class="revenue-stat">
                        <span class="label">Total Revenue:</span>
                        <span class="value">₱${stats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div class="revenue-stat">
                        <span class="label">Total Bookings:</span>
                        <span class="value">${stats.totalBookings}</span>
                    </div>
                    <div class="revenue-stat">
                        <span class="label">Daily Average:</span>
                        <span class="value">₱${dailyAverage.toLocaleString()}</span>
                    </div>
                    <div class="revenue-stat">
                        <span class="label">Average per Booking:</span>
                        <span class="value">₱${stats.averageRevenue.toLocaleString()}</span>
                    </div>
                    ${mostPopularCottage ? `
                    <div class="revenue-stat">
                        <span class="label">Most Popular:</span>
                        <span class="value">${mostPopularCottage[0]} (₱${mostPopularCottage[1].toLocaleString()})</span>
                    </div>
                    ` : ''}
                </div>
                
                <h4>Revenue by Cottage Type</h4>
                <div class="revenue-breakdown">
                    ${Object.entries(stats.revenueByCottageType).map(([type, revenue]) => `
                        <div class="breakdown-item">
                            <span class="type">${type}</span>
                            <span class="amount">₱${revenue.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                
                <h4>Daily Revenue Trend</h4>
                <div class="revenue-breakdown">
                    ${Object.entries(stats.revenueByDay).sort(([a], [b]) => new Date(a) - new Date(b)).map(([day, revenue]) => `
                        <div class="breakdown-item">
                            <span class="type">${new Date(day).toLocaleDateString()}</span>
                            <span class="amount">₱${revenue.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        showDashboardModal("Monthly Revenue Report", reportContent);
    }
    
    // Export revenue data to CSV with real data
    async function exportClerkRevenueData(startDate, endDate, filename) {
        const stats = await calculateClerkRevenueStats(startDate, endDate);
        
        let csvContent = "Date,Guest Name,Cottage Type,Cottage Price,Adults,Children,Entrance Fees,Total Revenue,Status,Contact Phone\n";
        
        stats.bookingDetails.forEach(booking => {
            csvContent += `"${new Date(booking.bookingDate).toLocaleDateString()}","${booking.guestName}","${booking.cottageType}",${booking.cottagePrice},${booking.adults},${booking.children},${booking.entranceFees},${booking.totalRevenue},"${booking.status}","${booking.contactPhone}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    // Calculate booking trends and analytics
    async function calculateBookingAnalytics(startDate, endDate) {
        await fetchBookings();
        await fetchCottages();
        
        const filteredBookings = bookingsData.filter(booking => {
            const bookingDate = new Date(booking.bookingDate);
            return bookingDate >= startDate && bookingDate <= endDate;
        });
        
        // Booking status distribution
        const statusDistribution = {};
        const cottageTypeDistribution = {};
        const hourlyDistribution = {};
        const dayOfWeekDistribution = {};
        
        filteredBookings.forEach(booking => {
            // Status distribution
            statusDistribution[booking.status] = (statusDistribution[booking.status] || 0) + 1;
            
            // Cottage type distribution
            cottageTypeDistribution[booking.cottageType] = (cottageTypeDistribution[booking.cottageType] || 0) + 1;
            
            // Hourly distribution
            const hour = booking.bookingTime ? booking.bookingTime.split(':')[0] : '00';
            hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
            
            // Day of week distribution
            const dayOfWeek = new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'long' });
            dayOfWeekDistribution[dayOfWeek] = (dayOfWeekDistribution[dayOfWeek] || 0) + 1;
        });
        
        return {
            totalBookings: filteredBookings.length,
            statusDistribution,
            cottageTypeDistribution,
            hourlyDistribution,
            dayOfWeekDistribution,
            confirmedBookings: statusDistribution['confirmed'] || 0,
            completedBookings: statusDistribution['completed'] || 0,
            pendingBookings: statusDistribution['pending'] || 0
        };
    }
    
    // Update clerk revenue overview section with real data
    async function updateClerkRevenueOverview() {
        const today = new Date();
        
        // Today's stats
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const todayStats = await calculateClerkRevenueStats(todayStart, todayEnd);
        const todayAnalytics = await calculateBookingAnalytics(todayStart, todayEnd);
        
        // Week's stats
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekStats = await calculateClerkRevenueStats(weekStart, todayEnd);
        const weekAnalytics = await calculateBookingAnalytics(weekStart, todayEnd);
        
        // Month's stats
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthStats = await calculateClerkRevenueStats(monthStart, todayEnd);
        const monthAnalytics = await calculateBookingAnalytics(monthStart, todayEnd);
        
        // All time average
        const allTimeStats = await calculateClerkRevenueStats(new Date(0), todayEnd);
        
        // Update DOM elements
        const todayRevenueEl = document.getElementById('clerk-today-revenue-amount');
        const todayCountEl = document.getElementById('clerk-today-booking-count');
        const weekRevenueEl = document.getElementById('clerk-week-revenue-amount');
        const weekCountEl = document.getElementById('clerk-week-booking-count');
        const monthRevenueEl = document.getElementById('clerk-month-revenue-amount');
        const monthCountEl = document.getElementById('clerk-month-booking-count');
        const avgRevenueEl = document.getElementById('clerk-avg-revenue-amount');
        
        if (todayRevenueEl) todayRevenueEl.textContent = `₱${todayStats.totalRevenue.toLocaleString()}`;
        if (todayCountEl) todayCountEl.textContent = `${todayStats.totalBookings} bookings`;
        if (weekRevenueEl) weekRevenueEl.textContent = `₱${weekStats.totalRevenue.toLocaleString()}`;
        if (weekCountEl) weekCountEl.textContent = `${weekStats.totalBookings} bookings`;
        if (monthRevenueEl) monthRevenueEl.textContent = `₱${monthStats.totalRevenue.toLocaleString()}`;
        if (monthCountEl) monthCountEl.textContent = `${monthStats.totalBookings} bookings`;
        if (avgRevenueEl) avgRevenueEl.textContent = `₱${allTimeStats.averageRevenue.toLocaleString()}`;
        
        // Add analytics insights to the overview
        const analyticsInsights = document.getElementById('clerk-analytics-insights');
        if (analyticsInsights) {
            const insights = [];
            
            // Today's insights
            if (todayAnalytics.confirmedBookings > 0) {
                insights.push(`Today: ${todayAnalytics.confirmedBookings} confirmed bookings`);
            }
            if (todayAnalytics.pendingBookings > 0) {
                insights.push(`${todayAnalytics.pendingBookings} pending bookings`);
            }
            
            // Week's insights
            if (weekAnalytics.totalBookings > 0) {
                const avgDailyBookings = (weekAnalytics.totalBookings / 7).toFixed(1);
                insights.push(`Weekly avg: ${avgDailyBookings} bookings/day`);
            }
            
            // Most popular cottage type this week
            const popularCottage = Object.entries(weekAnalytics.cottageTypeDistribution)
                .sort(([,a], [,b]) => b - a)[0];
            if (popularCottage) {
                insights.push(`Most popular: ${popularCottage[0]}`);
            }
            
            analyticsInsights.innerHTML = insights.length > 0 ? 
                `<p style="color: #6c63ff; font-size: 0.9em; margin-top: 10px;">${insights.join(' • ')}</p>` : '';
        }
    }
    
    // Generate comprehensive analytics report with dashboard grid layout
    async function generateClerkAnalyticsReport() {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30); // Last 30 days
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        const analytics = await calculateBookingAnalytics(startDate, endDate);
        const revenueStats = await calculateClerkRevenueStats(startDate, endDate);

        // Card data
        const cards = [
            {
                icon: 'event',
                label: 'Total Bookings',
                value: analytics.totalBookings,
                color: 'dashboard-card-primary'
            },
            {
                icon: 'check_circle',
                label: 'Confirmed/Completed',
                value: analytics.confirmedBookings + analytics.completedBookings,
                color: 'dashboard-card-success'
            },
            {
                icon: 'hourglass_empty',
                label: 'Pending',
                value: analytics.pendingBookings,
                color: 'dashboard-card-warning'
            },
            {
                icon: 'percent',
                label: 'Success Rate',
                value: (analytics.totalBookings > 0 ? ((analytics.confirmedBookings + analytics.completedBookings) / analytics.totalBookings * 100).toFixed(1) : 0) + '%',
                color: 'dashboard-card-info'
            },
            {
                icon: 'attach_money',
                label: 'Total Revenue',
                value: '₱' + revenueStats.totalRevenue.toLocaleString(),
                color: 'dashboard-card-revenue'
            },
            {
                icon: 'equalizer',
                label: 'Average per Booking',
                value: '₱' + revenueStats.averageRevenue.toLocaleString(),
                color: 'dashboard-card-info'
            },
            {
                icon: 'show_chart',
                label: 'Daily Average',
                value: '₱' + (revenueStats.totalRevenue / 30).toLocaleString(),
                color: 'dashboard-card-info'
            }
        ];

        // Breakdown tables
        function renderBreakdownTable(title, data, label1, label2) {
            return `
                <div class="analytics-table-card">
                    <h4 style="margin-bottom: 8px; color: #2c3e50;">${title}</h4>
                    <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden;">
                        <thead>
                            <tr style="background:#f5f5f5;">
                                <th style="text-align:left; padding:8px;">${label1}</th>
                                <th style="text-align:right; padding:8px;">${label2}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(data).map(([key, value]) => `
                                <tr>
                                    <td style="padding:8px;">${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                                    <td style="padding:8px; text-align:right;">${value}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        const reportContent = `
            <div class="analytics-dashboard-grid">
                <div class="analytics-cards-row">
                    ${cards.map(card => `
                        <div class="card ${card.color}">
                            <div class="icon"><i class="material-icons">${card.icon}</i></div>
                            <h3>${card.label}</h3>
                            <p style="font-size:2em; font-weight:700; color:#222; margin:0;">${card.value}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="analytics-tables-row">
                    ${renderBreakdownTable('Booking Status Distribution', analytics.statusDistribution, 'Status', 'Bookings')}
                    ${renderBreakdownTable('Cottage Type Popularity', analytics.cottageTypeDistribution, 'Cottage Type', 'Bookings')}
                </div>
            </div>
        `;

        showDashboardModal("Comprehensive Analytics Report", reportContent);
    }

    // Setup clerk revenue report buttons
    function setupClerkRevenueButtons() {
        const dailyRevenueBtn = document.getElementById('clerk-daily-revenue-btn');
        const weeklyRevenueBtn = document.getElementById('clerk-weekly-revenue-btn');
        const monthlyRevenueBtn = document.getElementById('clerk-monthly-revenue-btn');
        const exportRevenueBtn = document.getElementById('clerk-export-revenue-btn');
        const analyticsBtn = document.getElementById('clerk-analytics-btn');
        
        if (dailyRevenueBtn) {
            dailyRevenueBtn.addEventListener('click', async () => {
                try {
                    await generateClerkDailyRevenueReport();
                } catch (error) {
                    console.error('Error generating daily report:', error);
                    showAlert('Error generating daily report. Please try again.', 'error');
                }
            });
        }
        
        if (weeklyRevenueBtn) {
            weeklyRevenueBtn.addEventListener('click', async () => {
                try {
                    await generateClerkWeeklyRevenueReport();
                } catch (error) {
                    console.error('Error generating weekly report:', error);
                    showAlert('Error generating weekly report. Please try again.', 'error');
                }
            });
        }
        
        if (monthlyRevenueBtn) {
            monthlyRevenueBtn.addEventListener('click', async () => {
                try {
                    await generateClerkMonthlyRevenueReport();
                } catch (error) {
                    console.error('Error generating monthly report:', error);
                    showAlert('Error generating monthly report. Please try again.', 'error');
                }
            });
        }
        
        if (exportRevenueBtn) {
            exportRevenueBtn.addEventListener('click', async () => {
                try {
                    const today = new Date();
                    const startDate = new Date(today);
                    startDate.setDate(today.getDate() - 30); // Last 30 days
                    await exportClerkRevenueData(startDate, today, `clerk_revenue_report_${today.toISOString().slice(0, 10)}.csv`);
                    showAlert('Revenue data exported successfully!', 'success');
                } catch (error) {
                    console.error('Error exporting revenue data:', error);
                    showAlert('Error exporting revenue data. Please try again.', 'error');
                }
            });
        }
        
        if (analyticsBtn) {
            analyticsBtn.addEventListener('click', async () => {
                try {
                    await generateClerkAnalyticsReport();
                } catch (error) {
                    console.error('Error generating analytics report:', error);
                    showAlert('Error generating analytics report. Please try again.', 'error');
                }
            });
        }
    }

    // Download analytics report as CSV
    async function downloadClerkAnalyticsReport() {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30); // Last 30 days
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        const analytics = await calculateBookingAnalytics(startDate, endDate);
        const revenueStats = await calculateClerkRevenueStats(startDate, endDate);

        let csvContent = 'Metric,Value\n';
        csvContent += `Total Bookings,${analytics.totalBookings}\n`;
        csvContent += `Confirmed/Completed,${analytics.confirmedBookings + analytics.completedBookings}\n`;
        csvContent += `Pending,${analytics.pendingBookings}\n`;
        csvContent += `Success Rate,${analytics.totalBookings > 0 ? ((analytics.confirmedBookings + analytics.completedBookings) / analytics.totalBookings * 100).toFixed(1) : 0}%\n`;
        csvContent += `Total Revenue,${revenueStats.totalRevenue}\n`;
        csvContent += `Average per Booking,${revenueStats.averageRevenue}\n`;
        csvContent += `Daily Average,${(revenueStats.totalRevenue / 30).toFixed(2)}\n`;
        csvContent += '\nBooking Status Distribution\nStatus,Bookings\n';
        Object.entries(analytics.statusDistribution).forEach(([status, count]) => {
            csvContent += `${status},${count}\n`;
        });
        csvContent += '\nCottage Type Popularity\nCottage Type,Bookings\n';
        Object.entries(analytics.cottageTypeDistribution).forEach(([type, count]) => {
            csvContent += `${type},${count}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_report_${today.toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Setup download analytics button
    const downloadAnalyticsBtn = document.getElementById('clerk-download-analytics-btn');
    if (downloadAnalyticsBtn) {
        downloadAnalyticsBtn.addEventListener('click', async () => {
            try {
                await downloadClerkAnalyticsReport();
                showAlert('Analytics report downloaded!', 'success');
            } catch (error) {
                console.error('Error downloading analytics report:', error);
                showAlert('Error downloading analytics report. Please try again.', 'error');
            }
        });
    }

    // Render comprehensive analytics dashboard directly on the page (auto-load)
    async function renderClerkAnalyticsDashboard() {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30); // Last 30 days
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        const analytics = await calculateBookingAnalytics(startDate, endDate);
        const revenueStats = await calculateClerkRevenueStats(startDate, endDate);

        // Card data
        const cards = [
            {
                icon: 'event',
                label: 'Total Bookings',
                value: analytics.totalBookings,
                color: 'dashboard-card-primary'
            },
            {
                icon: 'check_circle',
                label: 'Confirmed/Completed',
                value: analytics.confirmedBookings + analytics.completedBookings,
                color: 'dashboard-card-success'
            },
            {
                icon: 'hourglass_empty',
                label: 'Pending',
                value: analytics.pendingBookings,
                color: 'dashboard-card-warning'
            },
            {
                icon: 'percent',
                label: 'Success Rate',
                value: (analytics.totalBookings > 0 ? ((analytics.confirmedBookings + analytics.completedBookings) / analytics.totalBookings * 100).toFixed(1) : 0) + '%',
                color: 'dashboard-card-info'
            },
            {
                icon: 'attach_money',
                label: 'Total Revenue',
                value: '₱' + revenueStats.totalRevenue.toLocaleString(),
                color: 'dashboard-card-revenue'
            },
            {
                icon: 'equalizer',
                label: 'Average per Booking',
                value: '₱' + revenueStats.averageRevenue.toLocaleString(),
                color: 'dashboard-card-info'
            },
            {
                icon: 'show_chart',
                label: 'Daily Average',
                value: '₱' + (revenueStats.totalRevenue / 30).toLocaleString(),
                color: 'dashboard-card-info'
            }
        ];

        // Breakdown tables
        function renderBreakdownTable(title, data, label1, label2) {
            return `
                <div class="analytics-table-card">
                    <h4 style="margin-bottom: 8px; color: #2c3e50;">${title}</h4>
                    <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden;">
                        <thead>
                            <tr style="background:#f5f5f5;">
                                <th style="text-align:left; padding:8px;">${label1}</th>
                                <th style="text-align:right; padding:8px;">${label2}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(data).map(([key, value]) => `
                                <tr>
                                    <td style="padding:8px;">${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                                    <td style="padding:8px; text-align:right;">${value}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        const dashboardHtml = `
            <div class="analytics-dashboard-grid">
                <div class="analytics-cards-row">
                    ${cards.map(card => `
                        <div class="card ${card.color}">
                            <div class="icon"><i class="material-icons">${card.icon}</i></div>
                            <div class="metrics-value">${card.value}</div>
                            <div class="metrics-label">${card.label}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="analytics-tables-row">
                    ${renderBreakdownTable('Booking Status Distribution', analytics.statusDistribution, 'Status', 'Bookings')}
                    ${renderBreakdownTable('Cottage Type Popularity', analytics.cottageTypeDistribution, 'Cottage Type', 'Bookings')}
                </div>
            </div>
        `;

        const container = document.getElementById('clerk-analytics-dashboard');
        if (container) {
            container.innerHTML = dashboardHtml;
        }
    }

    // Automatically render analytics dashboard when Reports & Analytics panel is shown
    const reportsPanel = document.getElementById('clerk-reports-panel');
    if (reportsPanel) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && reportsPanel.style.display !== 'none') {
                    renderClerkAnalyticsDashboard();
                }
            });
        });
        observer.observe(reportsPanel, { attributes: true, attributeFilter: ['style'] });
    }

    showDashboard();
    setupClerkRevenueButtons();

    // --- User Management Logic (admin only) ---
    const userMgmtMenu = document.getElementById('user-management-link');
    const userMgmtPanel = document.getElementById('user-management-panel');
    const userMgmtTableContainer = document.getElementById('user-management-table-container');
    const createUserBtn = document.getElementById('create-user-btn');
    let usersData = [];

    // Modal elements
    const createUserModal = document.getElementById('create-user-modal');
    const closeCreateUserModal = document.getElementById('close-create-user-modal');
    const createUserForm = document.getElementById('create-user-form');
    const editUserModal = document.getElementById('edit-user-modal');
    const closeEditUserModal = document.getElementById('close-edit-user-modal');
    const editUserForm = document.getElementById('edit-user-form');
    const changeUserPasswordModal = document.getElementById('change-user-password-modal');
    const closeChangeUserPasswordModal = document.getElementById('close-change-user-password-modal');
    const changeUserPasswordForm = document.getElementById('change-user-password-form');

    async function fetchUsers() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${getBackendUrl()}/api/users`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                usersData = data.data;
                renderUserTable();
            } else {
                usersData = [];
                renderUserTable();
            }
        } catch (err) {
            usersData = [];
            renderUserTable();
        }
    }

    function renderUserTable() {
        if (!userMgmtTableContainer) return;
        if (!usersData.length) {
            userMgmtTableContainer.innerHTML = '<p style="text-align:center; color:#888;">No users found.</p>';
            return;
        }
        let html = `<table class="user-table" style="width:100%;border-collapse:collapse;margin-top:18px;">
            <thead><tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Actions</th>
            </tr></thead><tbody>`;
        usersData.forEach(user => {
            html += `<tr>
                <td>${user.name || ''}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.phone || ''}</td>
                <td>${user.isActive === false ? '<span style=\'color:#e74c3c\'>Inactive</span>' : 'Active'}</td>
                <td>
                    <button class="btn btn-outline btn-sm" data-action="edit" data-id="${user._id}">Edit</button>
                    <button class="btn btn-outline btn-sm" data-action="password" data-id="${user._id}">Change Password</button>
                    <button class="btn btn-danger btn-sm" data-action="delete" data-id="${user._id}" style="margin-left:4px;">Delete</button>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        userMgmtTableContainer.innerHTML = html;
        // Add event listeners for edit/password/delete
        userMgmtTableContainer.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                openEditUserModal(userId);
            });
        });
        userMgmtTableContainer.querySelectorAll('button[data-action="password"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                openChangePasswordModal(userId);
            });
        });
        userMgmtTableContainer.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                deleteUser(userId);
            });
        });
    }

    // Delete user function
    async function deleteUser(userId) {
        const user = usersData.find(u => u._id === userId);
        if (!user) return;
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete user "${user.name || user.email}"? This action cannot be undone.`)) {
            return;
        }
        
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${getBackendUrl()}/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showAlert('User deleted successfully!', 'success');
                fetchUsers(); // Refresh the table
            } else {
                showAlert(data.message || 'Failed to delete user.', 'error');
            }
        } catch (err) {
            showAlert('Failed to delete user.', 'error');
        }
    }

    // Show panel when menu is clicked
    if (userMgmtMenu && userMgmtPanel) {
        userMgmtMenu.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.dashboard-panel').forEach(panel => panel.style.display = 'none');
            userMgmtPanel.style.display = 'block';
            fetchUsers();
            document.querySelectorAll('.sidebar-nav ul li a').forEach(link => link.classList.remove('active'));
            userMgmtMenu.classList.add('active');
        });
    }
    // Create user button
    if (createUserBtn) {
        createUserBtn.addEventListener('click', function() {
            openCreateUserModal();
        });
    }

    // Modal open/close logic
    function openCreateUserModal() {
        if (createUserForm) createUserForm.reset();
        createUserModal.style.display = 'flex';
    }
    function closeCreateUserModalFn() {
        createUserModal.style.display = 'none';
        if (createUserForm) createUserForm.reset();
    }
    if (closeCreateUserModal) closeCreateUserModal.addEventListener('click', closeCreateUserModalFn);
    window.addEventListener('click', function(event) {
        if (event.target === createUserModal) closeCreateUserModalFn();
    });

    function openEditUserModal(userId) {
        const user = usersData.find(u => u._id === userId);
        if (!user) return;
        if (editUserForm) editUserForm.reset();
        document.getElementById('edit-user-id').value = user._id;
        document.getElementById('edit-user-name').value = user.name || '';
        document.getElementById('edit-user-email').value = user.email || '';
        document.getElementById('edit-user-phone').value = user.phone || '';
        document.getElementById('edit-user-role').value = user.role || 'clerk';
        editUserModal.style.display = 'flex';
    }
    function closeEditUserModalFn() {
        editUserModal.style.display = 'none';
        if (editUserForm) editUserForm.reset();
    }
    if (closeEditUserModal) closeEditUserModal.addEventListener('click', closeEditUserModalFn);
    window.addEventListener('click', function(event) {
        if (event.target === editUserModal) closeEditUserModalFn();
    });

    function openChangePasswordModal(userId) {
        document.getElementById('change-password-user-id').value = userId;
        if (changeUserPasswordForm) changeUserPasswordForm.reset();
        changeUserPasswordModal.style.display = 'flex';
    }
    function closeChangeUserPasswordModalFn() {
        changeUserPasswordModal.style.display = 'none';
        if (changeUserPasswordForm) changeUserPasswordForm.reset();
    }
    if (closeChangeUserPasswordModal) closeChangeUserPasswordModal.addEventListener('click', closeChangeUserPasswordModalFn);
    window.addEventListener('click', function(event) {
        if (event.target === changeUserPasswordModal) closeChangeUserPasswordModalFn();
    });

    // Form submissions
    if (createUserForm) {
        createUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const token = localStorage.getItem('token');
            const name = document.getElementById('create-user-name').value.trim();
            const email = document.getElementById('create-user-email').value.trim();
            const phone = document.getElementById('create-user-phone').value.trim();
            const role = document.getElementById('create-user-role').value;
            const password = document.getElementById('create-user-password').value;
            try {
                const res = await fetch(`${getBackendUrl()}/api/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ name, email, phone, role, password })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    showAlert('User created successfully!', 'success');
                    closeCreateUserModalFn();
                    fetchUsers();
                } else {
                    showAlert(data.message || 'Failed to create user.', 'error');
                }
            } catch (err) {
                showAlert('Failed to create user.', 'error');
            }
        });
    }
    if (editUserForm) {
        editUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const token = localStorage.getItem('token');
            const userId = document.getElementById('edit-user-id').value;
            const name = document.getElementById('edit-user-name').value.trim();
            const email = document.getElementById('edit-user-email').value.trim();
            const phone = document.getElementById('edit-user-phone').value.trim();
            const role = document.getElementById('edit-user-role').value;
            try {
                const res = await fetch(`${getBackendUrl()}/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ name, email, phone, role })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    showAlert('User updated successfully!', 'success');
                    closeEditUserModalFn();
                    fetchUsers();
                } else {
                    showAlert(data.message || 'Failed to update user.', 'error');
                }
            } catch (err) {
                showAlert('Failed to update user.', 'error');
            }
        });
    }
    if (changeUserPasswordForm) {
        changeUserPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const token = localStorage.getItem('token');
            const userId = document.getElementById('change-password-user-id').value;
            const newPassword = document.getElementById('change-user-new-password').value;
            const confirmPassword = document.getElementById('change-user-confirm-password').value;
            if (newPassword.length < 4) {
                showAlert('Password must be at least 4 characters.', 'error');
                return;
            }
            if (newPassword !== confirmPassword) {
                showAlert('Passwords do not match.', 'error');
                return;
            }
            try {
                const res = await fetch(`${getBackendUrl()}/api/users/${userId}/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ newPassword })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    showAlert('Password changed successfully!', 'success');
                    closeChangeUserPasswordModalFn();
                } else {
                    showAlert(data.message || 'Failed to change password.', 'error');
                }
            } catch (err) {
                showAlert('Failed to change password.', 'error');
            }
        });
    }

    // Add this function:
    async function confirmBooking(bookingId) {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('Confirming booking:', bookingId);
            console.log('Token:', token ? 'Present' : 'Missing');
            console.log('User role:', user.role);
            
            if (!token) {
                showAlert('Authentication required. Please log in again.', 'error');
                return;
            }

            // Skip health check - proceed directly with booking operation
            console.log('Proceeding with booking confirmation...');
            
            const response = await fetch(`${getBackendUrl()}/api/bookings/${bookingId}/confirm`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                mode: 'cors'
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                await fetchBookings();
                renderPendingBookingList();
                renderBookingList();
                updatePendingBookingsBadge();
                showAlert('Booking confirmed successfully!', 'success');
            } else {
                const result = await response.json();
                console.log('Error response:', result);
                showAlert('Failed to confirm booking: ' + (result.message || response.status), 'error');
            }
        } catch (err) {
            console.error('Error in confirmBooking:', err);
            
            // Check if it's a network error and suggest solutions
            if (err.message.includes('Failed to fetch') || err.message.includes('ERR_BLOCKED_BY_CLIENT')) {
                showAlert('Network error: Request was blocked. Please try:\n1. Disable ad blocker for localhost\n2. Use incognito mode\n3. Check if backend server is running', 'error');
            } else {
                showAlert('Error confirming booking: ' + err.message, 'error');
            }
        }
    }

    // Add reject booking function:
    async function rejectBooking(bookingId) {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('Rejecting booking:', bookingId);
            console.log('Token:', token ? 'Present' : 'Missing');
            console.log('User role:', user.role);
            
            if (!token) {
                showAlert('Authentication required. Please log in again.', 'error');
                return;
            }

            // Skip health check - proceed directly with booking operation
            console.log('Proceeding with booking rejection...');
            
            const response = await fetch(`${getBackendUrl()}/api/bookings/${bookingId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                mode: 'cors',
                body: JSON.stringify({ reason: 'Booking rejected by staff' })
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                await fetchBookings();
                renderPendingBookingList();
                renderBookingList();
                updatePendingBookingsBadge();
                showAlert('Booking rejected successfully!', 'success');
            } else {
                const result = await response.json();
                console.log('Error response:', result);
                showAlert('Failed to reject booking: ' + (result.message || response.status), 'error');
            }
        } catch (err) {
            console.error('Error in rejectBooking:', err);
            
            // Check if it's a network error and suggest solutions
            if (err.message.includes('Failed to fetch') || err.message.includes('ERR_BLOCKED_BY_CLIENT')) {
                showAlert('Network error: Request was blocked. Please try:\n1. Disable ad blocker for localhost\n2. Use incognito mode\n3. Check if backend server is running', 'error');
            } else {
                showAlert('Error rejecting booking: ' + err.message, 'error');
            }
        }
    }

    // Clerk change password button logic
    const clerkChangePasswordBtn = document.getElementById('clerk-change-password-btn');
    if (clerkChangePasswordBtn && changeUserPasswordModal && changeUserPasswordForm) {
        clerkChangePasswordBtn.addEventListener('click', function() {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            document.getElementById('change-password-user-id').value = user._id || '';
            changeUserPasswordForm.reset();
            changeUserPasswordModal.style.display = 'flex';
        });
    }

    // Password Change Modal Integration
    const changePasswordBtn = document.getElementById('change-password-btn');
    const changeOwnPasswordModal = document.getElementById('change-own-password-modal');
    const closeChangeOwnPasswordModal = document.getElementById('close-change-own-password-modal');
    const changeOwnPasswordForm = document.getElementById('change-own-password-form');
    const passwordChangeAlert = document.getElementById('password-change-alert');

    function showPasswordAlert(msg, type) {
        if (!passwordChangeAlert) return;
        passwordChangeAlert.textContent = msg;
        passwordChangeAlert.style.display = 'block';
        passwordChangeAlert.style.background = type === 'success' ? '#27ae60' : '#e74c3c';
        passwordChangeAlert.style.color = '#fff';
        passwordChangeAlert.style.padding = '10px 16px';
        passwordChangeAlert.style.borderRadius = '6px';
        passwordChangeAlert.style.marginTop = '12px';
        passwordChangeAlert.style.textAlign = 'center';
        setTimeout(() => { passwordChangeAlert.style.display = 'none'; }, 5000);
    }

    if (changePasswordBtn && changeOwnPasswordModal) {
        changePasswordBtn.addEventListener('click', function() {
            changeOwnPasswordModal.style.display = 'flex';
        });
    }
    if (closeChangeOwnPasswordModal && changeOwnPasswordModal) {
        closeChangeOwnPasswordModal.addEventListener('click', function() {
            changeOwnPasswordModal.style.display = 'none';
            if (changeOwnPasswordForm) changeOwnPasswordForm.reset();
            if (passwordChangeAlert) passwordChangeAlert.style.display = 'none';
        });
    }
    if (changeOwnPasswordForm) {
        changeOwnPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            // Validation
            if (newPassword !== confirmNewPassword) {
                showPasswordAlert('New passwords do not match.', 'error');
                return;
            }
            if (newPassword.length < 6) {
                showPasswordAlert('New password must be at least 6 characters long.', 'error');
                return;
            }
            const hasLetter = /[a-zA-Z]/.test(newPassword);
            const hasNumber = /\d/.test(newPassword);
            if (!hasLetter || !hasNumber) {
                showPasswordAlert('Password must contain at least one letter and one number.', 'error');
                return;
            }
            // API call
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${getBackendUrl()}/api/users/me/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    showPasswordAlert('Password changed successfully!', 'success');
                    changeOwnPasswordForm.reset();
                    setTimeout(() => {
                        changeOwnPasswordModal.style.display = 'none';
                        passwordChangeAlert.style.display = 'none';
                    }, 1200);
                } else {
                    showPasswordAlert(result.message || 'Failed to change password.', 'error');
                }
            } catch (err) {
                showPasswordAlert('Network error. Please try again.', 'error');
            }
        });
    }

    // Add phone number input restrictions for the quick booking form
    const quickPhoneInput = document.getElementById('modal-phone');
    if (quickPhoneInput) {
        quickPhoneInput.setAttribute('maxlength', '11'); // Only 11 digits
        quickPhoneInput.setAttribute('pattern', '[0-9]{11}');
        quickPhoneInput.addEventListener('input', function(e) {
            // Only allow numbers, and limit to 11 chars
            let value = this.value.replace(/[^0-9]/g, '');
            this.value = value.slice(0, 11);
            if (this.value.length === 11) {
                this.disabled = true;
                setTimeout(() => { this.blur(); }, 100); // Remove focus
            } else {
                this.disabled = false;
            }
        });
        // Allow re-enabling on backspace/delete
        quickPhoneInput.addEventListener('keydown', function(e) {
            if (this.disabled && (e.key === 'Backspace' || e.key === 'Delete')) {
                this.disabled = false;
            }
        });
    }

    // Render Cancelled Bookings Section
    function renderCancelledBookings() {
        const container = document.getElementById('cancelled-bookings-container');
        const noCancelled = document.getElementById('no-cancelled-bookings');
        if (!container) return;
        container.innerHTML = '';
        const cancelled = bookingsData.filter(b => b.status === 'cancelled');
        if (cancelled.length === 0) {
            if (noCancelled) noCancelled.style.display = '';
            return;
        } else {
            if (noCancelled) noCancelled.style.display = 'none';
        }
        cancelled.forEach(booking => {
            const card = document.createElement('div');
            card.className = 'cancelled-booking-card';
            card.style = 'border:1px solid #e0e0e0; border-radius:8px; margin-bottom:12px; padding:16px; background:#fafafa;';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; margin-bottom:8px;">
                            <strong style="font-size:1.1em; color:#b93a2b;">${booking.fullName || 'Guest'}</strong>
                            <span class="status cancelled" style="margin-left:12px; color:#b93a2b;">Cancelled</span>
                        </div>
                        <div style="color:#666; font-size:0.95em; line-height:1.4;">
                            <div><strong>Cottage:</strong> ${booking.cottageType}${booking.cottageNumber ? ' #' + booking.cottageNumber : ''}</div>
                            <div><strong>Date:</strong> ${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : ''} ${booking.bookingTime || ''}</div>
                            <div><strong>Guests:</strong> ${booking.numberOfPeople || 'N/A'}</div>
                            <div><strong>Phone:</strong> ${booking.contactPhone || 'N/A'}</div>
                            <div><strong>Cancelled On:</strong> ${booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleDateString() : ''}</div>
                            ${booking.cancellationReason ? `<div><strong>Reason:</strong> ${booking.cancellationReason}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Real-time update: listen for new user registrations
    socket.on('user-created', async function(data) {
      console.log('Received user-created event:', data);
      if (typeof showNotification === 'function') {
        showNotification('A new user has registered!', 'info');
      }
      if (typeof fetchUsers === 'function' && typeof renderUserTable === 'function') {
        await fetchUsers();
        renderUserTable();
      }
    });


    function renderCottageNumberStatus() {
      const container = document.getElementById('cottage-number-status');
      if (!container) return;
      container.innerHTML = '';
      const today = new Date().toISOString().slice(0, 10);
      // Define cottage types and their counts
      const cottageTypes = {
        'kubo': { name: 'Kubo Type', total: 8 },
        'With Videoke': { name: 'VE Cottage with Videoke', total: 2 },
        'Without Videoke': { name: 'VE Cottage without Videoke', total: 2 },
        'garden': { name: 'Garden Table', total: 10 }
      };
      
      // For each type, build a detailed view
      Object.keys(cottageTypes).forEach(type => {
        const { name, total } = cottageTypes[type];
        
        // Get today's bookings for this cottage type
        const todayBookings = bookingsData.filter(b => 
          b.cottageType === type && 
          b.bookingDate && 
          b.bookingDate.slice(0,10) === today && 
          b.status !== 'cancelled' && 
          b.status !== 'rejected'
        );
        
        // Create a map of cottage numbers to booking details
        const cottageBookings = {};
        todayBookings.forEach(booking => {
          if (booking.cottageNumber) {
            cottageBookings[booking.cottageNumber] = booking;
          }
        });
        
        // Build detailed cottage status
        let cottageHtml = '';
        for (let i = 1; i <= total; i++) {
          const booking = cottageBookings[i];
          if (booking) {
            // Occupied cottage with booking details
            const guestName = booking.guestName || booking.fullName || 'Unknown Guest';
            const bookingType = booking.bookingType || 'N/A';
            const numberOfPeople = booking.numberOfPeople || 'N/A';
            const time = booking.bookingTime || '';
            
            cottageHtml += `
              <div class="cottage-detail-badge occupied" 
                   style="display: inline-block; margin: 4px; padding: 8px 12px; border-radius: 6px; background: #ffebee; border: 1px solid #f44336; color: #d32f2f; min-width: 120px; text-align: center; cursor: pointer;"
                   onclick="showCottageDetails('${name} #${i}', '${guestName}', '${bookingType}', '${numberOfPeople}', '${time}', '${booking._id}')">
                <div style="font-weight: bold; font-size: 14px;">${name} #${i}</div>
                <div style="font-size: 12px; margin-top: 2px;"><strong>${guestName}</strong></div>
                <div style="font-size: 11px; color: #666;">${bookingType} • ${numberOfPeople} guests</div>
                ${time ? `<div style="font-size: 11px; color: #666;">${time}</div>` : ''}
                <div style="font-size: 10px; color: #999; margin-top: 4px;">Click for details</div>
              </div>
            `;
          } else {
            // Available cottage
            cottageHtml += `
              <div class="cottage-detail-badge available" style="display: inline-block; margin: 4px; padding: 8px 12px; border-radius: 6px; background: #e8f5e8; border: 1px solid #4caf50; color: #2e7d32; min-width: 120px; text-align: center;">
                <div style="font-weight: bold; font-size: 14px;">${name} #${i}</div>
                <div style="font-size: 12px; margin-top: 2px;"><strong>Available</strong></div>
                <div style="font-size: 11px; color: #666;">Ready for booking</div>
              </div>
            `;
          }
        }
        
        container.innerHTML += `
          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 12px; color: #333; font-size: 16px;">${name}</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${cottageHtml}
            </div>
          </div>
        `;
      });
    }

    // Function to show detailed cottage information
    window.showCottageDetails = function(cottageName, guestName, bookingType, numberOfPeople, time, bookingId) {
        // Find the full booking details from the bookingsData
        const booking = bookingsData.find(b => b._id === bookingId);
        
        let detailsHtml = `
            <div style="padding: 20px;">
                <h3 style="color: #d32f2f; margin-bottom: 20px; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">${cottageName} - Occupied</h3>
                
                <!-- Tab Navigation -->
                <div style="display: flex; border-bottom: 1px solid #ddd; margin-bottom: 20px;">
                    <div style="padding: 10px 20px; background: #d32f2f; color: white; border-radius: 5px 5px 0 0; font-weight: 600;">Guest Info</div>
                    ${booking?.specialRequests ? `<div style="padding: 10px 20px; background: #f8f9fa; color: #666; border-radius: 5px 5px 0 0; margin-left: 5px;">Requests</div>` : ''}
                    ${booking?.notes ? `<div style="padding: 10px 20px; background: #f8f9fa; color: #666; border-radius: 5px 5px 0 0; margin-left: 5px;">Notes</div>` : ''}
                </div>
                
                <!-- Tab Content -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 0 8px 8px 8px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Guest Name</div>
                            <div style="color: #666;">${guestName}</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Phone</div>
                            <div style="color: #666;">${booking?.contactPhone || 'N/A'}</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Email</div>
                            <div style="color: #666;">${booking?.contactEmail || 'N/A'}</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Number of People</div>
                            <div style="color: #666;">${numberOfPeople}</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Booking Type</div>
                            <div style="color: #666;">${bookingType}</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Booking Time</div>
                            <div style="color: #666;">${time || 'N/A'}</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Booking Date</div>
                            <div style="color: #666;">${booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Status</div>
                            <div style="color: ${booking?.status === 'completed' ? '#4caf50' : '#ff9800'}; font-weight: 600;">${booking?.status || 'N/A'}</div>
                        </div>
                    </div>
                </div>
                
                ${booking?.specialRequests ? `
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ffc107;">
                    <h4 style="color: #856404; margin-bottom: 10px; font-size: 16px;">Special Requests</h4>
                    <p style="color: #856404; margin: 0; line-height: 1.5;">${booking.specialRequests}</p>
                </div>
                ` : ''}
                
                ${booking?.notes ? `
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196f3;">
                    <h4 style="color: #1976d2; margin-bottom: 10px; font-size: 16px;">Notes</h4>
                    <p style="color: #1976d2; margin: 0; line-height: 1.5;">${booking.notes}</p>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                    <button onclick="closeCottageDetailsModal()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin-right: 10px; font-weight: 600;">Close</button>
                    ${booking?.status === 'pending' ? `
                    <button onclick="confirmBookingFromDetails('${bookingId}')" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin-right: 10px; font-weight: 600;">Confirm Booking</button>
                    ` : ''}
                    ${booking?.status === 'confirmed' ? `
                    <button onclick="completeBookingFromDetails('${bookingId}')" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: 600;">Check In</button>
                    ` : ''}
                </div>
            </div>
        `;
        
        showDashboardModal('Cottage Details', detailsHtml);
    };

    // Function to close cottage details modal
    window.closeCottageDetailsModal = function() {
        const modal = document.getElementById('dashboard-info-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // Function to confirm booking from details modal
    window.confirmBookingFromDetails = async function(bookingId) {
        try {
            await confirmBooking(bookingId);
            closeCottageDetailsModal();
        } catch (error) {
            console.error('Error confirming booking:', error);
        }
    };

    // Function to complete booking from details modal
    window.completeBookingFromDetails = async function(bookingId) {
        try {
            await markBookingAsCompleted(bookingId);
            closeCottageDetailsModal();
        } catch (error) {
            console.error('Error completing booking:', error);
        }
    };

    // Call this after updating bookings/cottages
    // ... existing code ...

    renderCottageNumberStatus();

    // Settings tab switching function
    window.showSettingsTab = function(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.settings-tab-content');
        tabContents.forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabName + '-tab');
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }
        
        // Update tab navigation styling
        const tabButtons = document.querySelectorAll('#settings-panel > div:first-child + div > div');
        tabButtons.forEach((button, index) => {
            if (index === 0 && tabName === 'profile') {
                button.style.background = '#6c63ff';
                button.style.color = 'white';
            } else if (index === 1 && tabName === 'security') {
                button.style.background = '#6c63ff';
                button.style.color = 'white';
            } else if (index === 2 && tabName === 'preferences') {
                button.style.background = '#6c63ff';
                button.style.color = 'white';
            } else {
                button.style.background = '#f8f9fa';
                button.style.color = '#666';
            }
        });
    };
    // ... existing code ...

    // Add after walk-in/quick booking form cottage type selection
    function updateQuickBookingCottageNumbers() {
      const type = document.getElementById('qb-cottage-type').value;
      const numberSelect = document.getElementById('qb-cottage-number');
      if (!type || !numberSelect) {
        numberSelect.innerHTML = '<option value="">Select a type first</option>';
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      numberSelect.innerHTML = '<option value="">Loading...</option>';
      fetch(`${getBackendUrl()}/api/bookings/get-cottage-numbers?cottageType=${encodeURIComponent(type)}&bookingDate=${encodeURIComponent(today)}&bookingTime=08:00`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.availableNumbers)) {
            numberSelect.innerHTML = data.availableNumbers.map(n => `<option value="${n}">${n}</option>`).join('');
          } else {
            numberSelect.innerHTML = '<option value="">No available numbers</option>';
          }
        })
        .catch(() => {
          numberSelect.innerHTML = '<option value="">Error loading numbers</option>';
        });
    }
    // ... existing code ...
    // Add event listeners for cottage type selection in walk-in form
    const qbCottageType = document.getElementById('qb-cottage-type');
    if (qbCottageType) {
      qbCottageType.addEventListener('change', updateQuickBookingCottageNumbers);
    }
    // ... existing code ...
    // In quick booking form submit logic, add:
    // const selectedNumber = document.getElementById('qb-cottage-number').value;
    // Include selectedNumber as cottageNumber in the booking POST request.
    // ... existing code ...
}); 