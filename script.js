// Socket.IO connection
const socket = io('https://villa-ester-backend.onrender.com', {
  transports: ['websocket', 'polling']
});

// Socket.IO event handlers
socket.on('connect', () => {
  console.log('Connected to server via Socket.IO');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('booking-created', (data) => {
  console.log('New booking created:', data);
  showNotification('New booking received!', 'success');
});

socket.on('booking-updated', (data) => {
  console.log('Booking updated:', data);
  showNotification('Booking status updated!', 'info');
});

socket.on('review-created', (data) => {
  console.log('New review created:', data);
  showNotification('New review submitted!', 'success');
  // Clear the carousel interval and restart with new data
  if (reviewCarouselInterval) {
    clearInterval(reviewCarouselInterval);
  }
  fetchAndDisplayReviews(); // Refresh reviews display
});

// Notification function
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
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

// Function to handle scroll highlight effect
function handleScrollHighlight() {
  const reviewsSection = document.querySelector('.reviews-section');
  const sectionTop = reviewsSection.getBoundingClientRect().top;
  const windowHeight = window.innerHeight;
  
  // Add 'visible' class when section is in viewport
  if (sectionTop < windowHeight * 0.75) {
    reviewsSection.classList.add('visible');
  }
}

// Add scroll event listener
window.addEventListener('scroll', handleScrollHighlight);

// Check on initial load
handleScrollHighlight();

// Load AI recommendations on page load
loadAIRecommendations();

// Background Slideshow
const hero = document.querySelector('.hero');
let currentImage = 1;
const totalImages = 7;

function changeBackground() {
    currentImage = currentImage % totalImages + 1;
    hero.style.backgroundImage = `url('images/VillaEster${currentImage}.jpg')`;
}

// Change background every 5 seconds
setInterval(changeBackground, 3000);

// Modal logic for booking
const openBookingModalBtn = document.getElementById('open-booking-modal');
const bookingModal = document.getElementById('booking-modal');
const closeBookingModalBtn = document.getElementById('close-booking-modal');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

function openMainBookingModal() {
    // Reset the entire booking form
    const modalBookingForm = document.querySelector('.modal-booking-form');
    if (modalBookingForm) {
        modalBookingForm.reset();
        console.log('Reset entire booking form');
    }
    
    // Reset the cottage type dropdown to blank specifically
    const modalCottageType = document.getElementById('modal-cottage-type');
    if (modalCottageType) {
        modalCottageType.value = '';
        console.log('Reset cottage type dropdown to blank');
    }
    
    // Clear proof of payment preview
    const proofPreview = document.getElementById('modal-proof-preview');
    if (proofPreview) {
        proofPreview.innerHTML = '';
    }
    
    // Reset date fields visibility
    const modalDaytourFields = document.getElementById('modal-daytour-fields');
    const modalOvernightFields = document.getElementById('modal-overnight-fields');
    if (modalDaytourFields) modalDaytourFields.style.display = 'none';
    if (modalOvernightFields) modalOvernightFields.style.display = 'none';
    
    // Open the booking modal
    bookingModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeBookingModal() {
    bookingModal.style.display = 'none';
    document.body.style.overflow = '';
}
if (openBookingModalBtn && bookingModal && closeBookingModalBtn) {
    openBookingModalBtn.addEventListener('click', openMainBookingModal);
    closeBookingModalBtn.addEventListener('click', closeBookingModal);
}
if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', closeBookingModal);
}
// Optional: Close modal when clicking outside content
bookingModal && bookingModal.addEventListener('click', function(e) {
    if (e.target === bookingModal) closeBookingModal();
});

// --- Modal Booking Type Change Handler ---
const modalBookingTypeSelect = document.getElementById('modal-booking-type');
const modalDaytourFields = document.getElementById('modal-daytour-fields');
const modalOvernightFields = document.getElementById('modal-overnight-fields');

if (modalBookingTypeSelect) {
    modalBookingTypeSelect.addEventListener('change', function() {
        if (this.value === 'daytour') {
            modalDaytourFields.style.display = 'block';
            modalOvernightFields.style.display = 'none';
        } else if (this.value === 'overnight') {
            modalDaytourFields.style.display = 'none';
            modalOvernightFields.style.display = 'block';
        } else {
            modalDaytourFields.style.display = 'none';
            modalOvernightFields.style.display = 'none';
        }
    });
}

// --- Proof of Payment Image Preview ---
const proofInput = document.getElementById('modal-proof');
const proofPreview = document.getElementById('modal-proof-preview');
if (proofInput && proofPreview) {
    proofInput.addEventListener('change', function() {
        proofPreview.innerHTML = '';
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                proofPreview.innerHTML = `<img src="${e.target.result}" alt="Proof of Payment" style="max-width:180px;max-height:120px;border-radius:8px;box-shadow:0 2px 8px #ccc;">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

// --- Booking Submission Logic ---
const modalBookingForm = document.querySelector('.modal-booking-form');
if (modalBookingForm) {
    modalBookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Collect form data
        const fullName = document.getElementById('modal-full-name').value.trim();
        const phone = document.getElementById('modal-phone').value.trim();
        const email = document.getElementById('modal-email').value.trim();
        const specialRequests = document.getElementById('modal-special-requests').value.trim();
        const bookingType = document.getElementById('modal-booking-type').value;
        let bookingDate = '';
        let bookingTime = '';
        let duration = 120; // default 2 hours
        if (bookingType === 'daytour') {
            bookingDate = document.getElementById('modal-schedule-date').value;
            bookingTime = '08:00';
            duration = 600; // 10 hours (8am-6pm)
        } else if (bookingType === 'overnight') {
            bookingDate = document.getElementById('modal-checkin-date').value;
            bookingTime = '14:00'; // default check-in time
            duration = 1080; // 18 hours (2pm-8am next day)
        }
        const cottageType = document.getElementById('modal-cottage-type').value;
        const adults = parseInt(document.getElementById('modal-adults').value, 10) || 0;
        const children = parseInt(document.getElementById('modal-children').value, 10) || 0;
        const numberOfPeople = adults + children;
        const proofFile = document.getElementById('modal-proof').files[0];
        
        // Validate cottage type selection
        if (!cottageType) {
            alert('Please select a cottage type');
            return;
        }
        
        // Prepare FormData
        const formData = new FormData();
        formData.append('bookingDate', bookingDate);
        formData.append('bookingTime', bookingTime);
        formData.append('duration', duration);
        formData.append('numberOfPeople', numberOfPeople);
        formData.append('specialRequests', specialRequests);
        formData.append('contactPhone', phone);
        formData.append('contactEmail', email);
        formData.append('notes', `Booking Type: ${bookingType}; Adults: ${adults}; Children: ${children}`);
        formData.append('fullName', fullName);
        formData.append('cottageType', cottageType);
        if (proofFile) formData.append('proofOfPayment', proofFile);
        
        // Debug: Log the data being sent
        console.log('Sending booking data:', {
            bookingDate,
            bookingTime,
            duration,
            numberOfPeople,
            specialRequests,
            contactPhone: phone,
            contactEmail: email,
            fullName,
            cottageType
        });
        // Send to backend
        try {
            const response = await fetch('https://villa-ester-backend.onrender.com/api/bookings', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                alert('Booking submitted successfully!');
                modalBookingForm.reset();
                if (proofPreview) proofPreview.innerHTML = '';
                closeBookingModal();
            } else {
                const error = await response.json();
                alert('Booking failed: ' + (error.message || 'Unknown error'));
            }
        } catch (err) {
            alert('Booking failed: ' + err.message);
        }
    });
}

// --- Review Modal Logic ---
const openReviewModalBtn = document.getElementById('open-review-modal');
const reviewModal = document.getElementById('review-modal');
const closeReviewModalBtn = document.getElementById('close-review-modal');
const reviewForm = document.getElementById('review-form');
const reviewsContainer = document.getElementById('reviews-container');

function openReviewModal() {
    reviewModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeReviewModal() {
    reviewModal.style.display = 'none';
    document.body.style.overflow = '';
}
if (openReviewModalBtn && reviewModal && closeReviewModalBtn) {
    openReviewModalBtn.addEventListener('click', openReviewModal);
    closeReviewModalBtn.addEventListener('click', closeReviewModal);
}
reviewModal && reviewModal.addEventListener('click', function(e) {
    if (e.target === reviewModal) closeReviewModal();
});

// --- Submit Review ---
if (reviewForm) {
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('review-name').value.trim();
        const comment = document.getElementById('review-comment').value.trim();
        const rating = parseInt(document.querySelector('input[name="rating"]:checked').value, 10);
        
        // Client-side validation
        if (name.length < 2) {
            showNotification('Name must be at least 2 characters long', 'error');
            return;
        }
        
        if (name.length > 50) {
            showNotification('Name must be less than 50 characters', 'error');
            return;
        }
        
        if (comment.length < 5) {
            showNotification('Comment must be at least 5 characters long', 'error');
            return;
        }
        
        if (comment.length > 500) {
            showNotification('Comment must be less than 500 characters', 'error');
            return;
        }
        
        const reviewData = { name, comment, rating };
        
        try {
            const response = await fetch('https://villa-ester-backend.onrender.com/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('Thank you for your review!', 'success');
                reviewForm.reset();
                // Reset rating to 5 stars
                document.getElementById('star5').checked = true;
                closeReviewModal();
                
                // Force refresh reviews with a small delay to ensure the review is saved
                setTimeout(() => {
                    console.log('Refreshing reviews after submission...');
                // Clear the carousel interval and restart with new data
                if (reviewCarouselInterval) {
                    clearInterval(reviewCarouselInterval);
                }
                fetchAndDisplayReviews();
                }, 1000);
            } else {
                const errorMessage = result.message || result.errors?.[0]?.msg || 'Unknown error';
                showNotification('Failed to submit review: ' + errorMessage, 'error');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            showNotification('Failed to submit review: ' + err.message, 'error');
        }
    });
}

// --- Review Carousel Variables ---
let allReviews = [];
let currentReviewIndex = 0;
let reviewCarouselInterval;

// --- Fetch and Display Reviews ---
async function fetchAndDisplayReviews() {
    if (!reviewsContainer) {
        console.log('Reviews container not found');
        return;
    }
    try {
        console.log('Fetching reviews from API...');
        const response = await fetch('https://villa-ester-backend.onrender.com/api/reviews');
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Reviews API response:', data);
        
        if (data.success && Array.isArray(data.data)) {
            console.log('Found reviews:', data.data.length);
            allReviews = data.data;
            if (allReviews.length > 0) {
            startReviewCarousel();
        } else {
                reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to share your experience!</p>';
            }
        } else {
            console.log('No reviews found or invalid response format');
            reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to share your experience!</p>';
        }
    } catch (err) {
        console.error('Error fetching reviews:', err);
        reviewsContainer.innerHTML = '<p>Failed to load reviews.</p>';
    }
}

// --- Review Carousel Functions ---
function startReviewCarousel() {
    if (allReviews.length === 0) return;
    
    // Display first set of reviews
    displayReviewSet();
    
    // Start auto-rotation every 5 seconds
    reviewCarouselInterval = setInterval(() => {
        currentReviewIndex = (currentReviewIndex + 3) % allReviews.length;
        displayReviewSet();
    }, 5000);
}

function displayReviewSet() {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;
    
    console.log('Displaying review set. Total reviews:', allReviews.length);
    console.log('Current index:', currentReviewIndex);
    console.log('Reviews to show:', allReviews.slice(currentReviewIndex, currentReviewIndex + 3));
    
    reviewsContainer.innerHTML = '';
    const reviewsToShow = allReviews.slice(currentReviewIndex, currentReviewIndex + 3);
    reviewsToShow.forEach(review => {
        console.log('Creating review card for:', review.name, review.comment);
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <div>
                        <div class="reviewer-name">${review.name}</div>
                        <div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    </div>
                </div>
                <div class="review-date">${review.date || ''}</div>
            </div>
            <div class="review-text">${review.comment}</div>
        `;
        reviewsContainer.appendChild(reviewCard);
    });
    updateCarouselIndicators();
}

function updateCarouselIndicators() {
    const indicatorsContainer = document.getElementById('review-indicators');
    if (!indicatorsContainer) return;
    
    const totalSets = Math.ceil(allReviews.length / 3);
    const currentSet = Math.floor(currentReviewIndex / 3);
    
    indicatorsContainer.innerHTML = Array.from({length: totalSets}, (_, i) => 
        `<span class="carousel-indicator ${i === currentSet ? 'active' : ''}" onclick="goToReviewSet(${i})"></span>`
    ).join('');
}

function goToReviewSet(setIndex) {
    currentReviewIndex = setIndex * 3;
    displayReviewSet();
    
    // Reset the auto-rotation timer
    if (reviewCarouselInterval) {
        clearInterval(reviewCarouselInterval);
        reviewCarouselInterval = setInterval(() => {
            currentReviewIndex = (currentReviewIndex + 3) % allReviews.length;
            displayReviewSet();
        }, 5000);
    }
}

// --- Manual Navigation Functions ---
function nextReviewSet() {
    currentReviewIndex = (currentReviewIndex + 3) % allReviews.length;
    displayReviewSet();
}

function prevReviewSet() {
    currentReviewIndex = (currentReviewIndex - 3 + allReviews.length) % allReviews.length;
    displayReviewSet();
}

// Fetch reviews on page load
fetchAndDisplayReviews();

// Add manual refresh button for reviews
const reviewsSection = document.querySelector('.reviews-section');
if (reviewsSection) {
    const refreshButton = document.createElement('button');
    refreshButton.textContent = '🔄 Refresh Reviews';
    refreshButton.className = 'btn btn-secondary';
    refreshButton.style.cssText = 'margin: 10px auto; display: block; font-size: 0.9rem; padding: 8px 16px;';
    refreshButton.onclick = function() {
        showNotification('Refreshing reviews...', 'info');
        fetchAndDisplayReviews();
    };
    
    // Insert after the "Share Your Experience" button
    const shareButton = document.getElementById('open-review-modal');
    if (shareButton && shareButton.parentNode) {
        shareButton.parentNode.insertBefore(refreshButton, shareButton.nextSibling);
    }
}

// --- Availability Search Functionality ---
const availabilityForm = document.getElementById('availability-form');
const availabilityResults = document.getElementById('availability-results');
const loadingState = document.getElementById('loading-state');
const cottagesGrid = document.getElementById('cottages-grid');
const noResults = document.getElementById('no-results');
const resultsCount = document.getElementById('results-count');

// Handle booking type change
const bookingTypeSelect = document.getElementById('booking-type');
const daytourFields = document.getElementById('daytour-fields');
const overnightFields = document.getElementById('overnight-fields');

if (bookingTypeSelect) {
    bookingTypeSelect.addEventListener('change', function() {
        if (this.value === 'daytour') {
            daytourFields.style.display = 'block';
            overnightFields.style.display = 'none';
        } else if (this.value === 'overnight') {
            daytourFields.style.display = 'none';
            overnightFields.style.display = 'block';
        } else {
            daytourFields.style.display = 'none';
            overnightFields.style.display = 'none';
        }
    });
}

// Handle availability search
if (availabilityForm) {
    availabilityForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        loadingState.style.display = 'block';
        availabilityResults.style.display = 'none';
        
        // Collect form data
        const bookingType = document.getElementById('booking-type').value;
        const guests = parseInt(document.getElementById('guests').value, 10);
        let bookingDate = '';
        let checkoutDate = '';
        
        if (bookingType === 'daytour') {
            bookingDate = document.getElementById('schedule-date').value;
        } else if (bookingType === 'overnight') {
            bookingDate = document.getElementById('checkin-date').value;
            checkoutDate = document.getElementById('checkout-date').value;
        }
        
        try {
            // Fetch available cottages
            console.log('Fetching cottages from API...');
            const response = await fetch('https://villa-ester-backend.onrender.com/api/cottages');
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('API response:', data);
            
            if (data.success && Array.isArray(data.data)) {
                console.log('Found cottages:', data.data.length);
                // Filter cottages based on availability and capacity
                const availableCottages = data.data.filter(cottage => {
                    // Check if cottage is available
                    if (!cottage.available) return false;
                    
                    // Parse capacity string (e.g., "10-15" or "5")
                    let maxCapacity = 0;
                    if (typeof cottage.capacity === 'string') {
                        if (cottage.capacity.includes('-')) {
                            maxCapacity = parseInt(cottage.capacity.split('-')[1]);
                        } else {
                            maxCapacity = parseInt(cottage.capacity);
                        }
                    } else {
                        maxCapacity = cottage.capacity;
                    }
                    
                    return maxCapacity >= guests;
                });
                
                console.log('Available cottages:', availableCottages);
                displayCottages(availableCottages);
            } else {
                console.log('No cottages found or invalid response format');
                showNoResults();
            }
        } catch (error) {
            console.error('Error fetching cottages:', error);
            showNoResults();
        } finally {
            loadingState.style.display = 'none';
        }
    });
}

function displayCottages(cottages) {
    if (cottages.length === 0) {
        showNoResults();
        return;
    }
    
    resultsCount.textContent = cottages.length;
    
    cottagesGrid.innerHTML = cottages.map(cottage => `
        <div class="cottage-card">
            <div class="cottage-image">
                ${cottage.image ? `<img src="images/${cottage.image}" alt="${cottage.name}" style="width:100%;height:100%;object-fit:cover;">` : '🏖️'}
            </div>
            <div class="cottage-content">
                <div class="cottage-header">
                    <div>
                        <h3 class="cottage-title">${cottage.name}</h3>
                        <div class="cottage-type">${cottage.type}</div>
                    </div>
                    <div class="cottage-price">
                        <div class="price-amount">₱${cottage.price}</div>
                        <div class="price-period">per booking</div>
                    </div>
                </div>
                
                <div class="cottage-features">
                    <div class="feature">
                        <span class="feature-icon">👥</span>
                        <span>${cottage.capacity} guests</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🏖️</span>
                        <span>${cottage.available ? 'Available' : 'Not Available'}</span>
                    </div>
                    ${cottage.amenities && cottage.amenities.length > 0 ? `
                    <div class="feature">
                        <span class="feature-icon">✨</span>
                        <span>${cottage.amenities.slice(0, 2).join(', ')}${cottage.amenities.length > 2 ? '...' : ''}</span>
                    </div>
                    ` : ''}
                </div>
                
                <p class="cottage-description">${cottage.description || 'Experience luxury and comfort in this beautiful cottage.'}</p>
                
                <div class="cottage-actions">
                    <button class="book-now-btn" onclick="openBookingModal('${cottage._id}', '${cottage.type}')" ${!cottage.available ? 'disabled' : ''}>
                        ${cottage.available ? 'Book Now' : 'Not Available'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    availabilityResults.style.display = 'block';
    availabilityResults.scrollIntoView({ behavior: 'smooth' });
}

function showNoResults() {
    resultsCount.textContent = '0';
    cottagesGrid.innerHTML = '';
    noResults.style.display = 'block';
    availabilityResults.style.display = 'block';
    availabilityResults.scrollIntoView({ behavior: 'smooth' });
}

function openBookingModal(cottageId, cottageType) {
    console.log('openBookingModal called with:', { cottageId, cottageType });
    
    // Map cottage titles to actual cottage type values
    const cottageTypeMap = {
        'Deluxe Ocean View': 'kubo',
        'Garden Suite': 'garden',
        'Family Villa': 'With Videoke',
        'VE Cottage with Videoke': 'With Videoke',
        'VE Cottage without Videoke': 'Without Videoke',
        'VE Cottage': 'With Videoke', // Default VE Cottage to With Videoke
        'Kubo Type': 'kubo',
        'Garden Table': 'garden'
    };
    
    // Pre-fill the booking modal with cottage details
    const modalCottageType = document.getElementById('modal-cottage-type');
    if (modalCottageType) {
        const mappedCottageType = cottageTypeMap[cottageType] || cottageType;
        console.log('Setting cottage type to:', mappedCottageType);
        console.log('Available options:', Array.from(modalCottageType.options).map(opt => opt.value));
        
        // Check if the mapped value exists in the select options
        const optionExists = Array.from(modalCottageType.options).some(opt => opt.value === mappedCottageType);
        if (optionExists) {
            modalCottageType.value = mappedCottageType;
            console.log('Successfully set cottage type to:', mappedCottageType);
            
            // Add visual feedback
            modalCottageType.style.borderColor = '#4CAF50';
            modalCottageType.style.backgroundColor = '#f0f8f0';
            setTimeout(() => {
                modalCottageType.style.borderColor = '';
                modalCottageType.style.backgroundColor = '';
            }, 2000);
        } else {
            console.error('Cottage type not found in options:', mappedCottageType);
            console.log('Available options:', Array.from(modalCottageType.options).map(opt => ({ value: opt.value, text: opt.text })));
            
            // Try to find a partial match
            const partialMatch = Array.from(modalCottageType.options).find(opt => 
                opt.value.toLowerCase().includes(cottageType.toLowerCase()) ||
                opt.text.toLowerCase().includes(cottageType.toLowerCase())
            );
            
            if (partialMatch) {
                modalCottageType.value = partialMatch.value;
                console.log('Found partial match, set to:', partialMatch.value);
                
                // Add visual feedback
                modalCottageType.style.borderColor = '#FF9800';
                modalCottageType.style.backgroundColor = '#fff3e0';
                setTimeout(() => {
                    modalCottageType.style.borderColor = '';
                    modalCottageType.style.backgroundColor = '';
                }, 2000);
            } else {
                console.error('No match found for cottage type:', cottageType);
            }
        }
    } else {
        console.error('modal-cottage-type element not found');
    }
    
    // Open the booking modal
    const bookingModal = document.getElementById('booking-modal');
    if (bookingModal) {
        bookingModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        console.error('booking-modal element not found');
    }
}

function viewCottageDetails(cottageId) {
    // For now, just show an alert. You can implement a detailed view modal later
    alert('Cottage details feature coming soon!');
}

// --- AI Recommendation Functions ---
async function loadAIRecommendations() {
    try {
        console.log('Loading AI recommendations...');
        
        // Get current form values for personalized recommendations
        const guests = parseInt(document.getElementById('guests')?.value || '2', 10);
        const bookingDate = document.getElementById('schedule-date')?.value || 
                           document.getElementById('checkin-date')?.value || 
                           new Date().toISOString().split('T')[0];
        
        console.log('Recommendation parameters:', { guests, bookingDate });
        
        // Fetch AI recommendations
        const apiUrl = `https://villa-ester-backend.onrender.com/api/recommendations?guest_count=${guests}&booking_date=${bookingDate}`;
        console.log('Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('Response status:', response.status);
        
        const recommendations = await response.json();
        console.log('API response:', recommendations);
        
        if (Array.isArray(recommendations) && recommendations.length > 0) {
            console.log('Displaying AI recommendations:', recommendations.length);
            displayRecommendations(recommendations);
        } else {
            console.log('No AI recommendations available, showing default');
            displayDefaultRecommendations();
        }
    } catch (error) {
        console.error('Error loading AI recommendations:', error);
        console.log('Falling back to default recommendations');
        // Fallback to default recommendations
        displayDefaultRecommendations();
    }
}

function displayRecommendations(recommendations) {
    const recommendCards = document.querySelector('.recommend-cards');
    if (!recommendCards) return;
    
    recommendCards.innerHTML = recommendations.map(rec => `
        <div class="recommend-card">
            <div class="recommend-icon" style="background:#ece8ff;">
                <span style="color:#6c63ff;font-size:1.5rem;">🤖</span>
            </div>
            <div class="recommend-label" style="color:#6c63ff;font-weight:600;font-size:1rem;">
                ${rec.label}
            </div>
            <div class="recommend-title">${rec.title}</div>
            <div class="recommend-desc">${rec.desc}</div>
            ${rec.reasons && rec.reasons.length > 0 ? `
            <div class="recommend-reasons">
                ${rec.reasons.map(reason => `<span class="reason-tag">${reason}</span>`).join('')}
            </div>
            ` : ''}
            <div class="recommend-actions">
                <button class="btn btn-primary" onclick="openBookingModal('${rec.cottage_id || ''}', '${rec.title}')">
                    Book Now
                </button>
            </div>
        </div>
    `).join('');
}

function displayDefaultRecommendations() {
    const recommendCards = document.querySelector('.recommend-cards');
    if (!recommendCards) return;
    
    // Show static recommendations instead of error message
    recommendCards.innerHTML = `
        <div class="recommend-card">
            <div class="recommend-icon" style="background:#ece8ff;"><span style="color:#6c63ff;font-size:1.5rem;">🏷️</span></div>
            <div class="recommend-label" style="color:#6c63ff;font-weight:600;font-size:1rem;">BEST VALUE</div>
            <div class="recommend-title">Garden Table</div>
            <div class="recommend-desc">Perfect for small groups and intimate gatherings. Cozy garden setting with great value.</div>
            <div class="recommend-reasons">
                <span class="reason-tag">Perfect for small groups</span>
                <span class="reason-tag">Great value</span>
                <span class="reason-tag">Garden setting</span>
            </div>
            <div class="recommend-actions">
                <button class="btn btn-primary" onclick="openBookingModal('', 'Garden Table')">Book Now</button>
            </div>
        </div>
        <div class="recommend-card">
            <div class="recommend-icon" style="background:#ece8ff;"><span style="color:#6c63ff;font-size:1.5rem;">🏖️</span></div>
            <div class="recommend-label" style="color:#6c63ff;font-weight:600;font-size:1rem;">POPULAR CHOICE</div>
            <div class="recommend-title">Kubo Type</div>
            <div class="recommend-desc">Traditional Filipino kubo perfect for medium-sized groups and family gatherings.</div>
            <div class="recommend-reasons">
                <span class="reason-tag">Traditional setting</span>
                <span class="reason-tag">Great for families</span>
                <span class="reason-tag">Comfortable space</span>
            </div>
            <div class="recommend-actions">
                <button class="btn btn-primary" onclick="openBookingModal('', 'Kubo Type')">Book Now</button>
            </div>
        </div>
        <div class="recommend-card">
            <div class="recommend-icon" style="background:#ece8ff;"><span style="color:#6c63ff;font-size:1.5rem;">🎉</span></div>
            <div class="recommend-label" style="color:#6c63ff;font-weight:600;font-size:1rem;">CELEBRATION SPECIAL</div>
            <div class="recommend-title">VE Cottage with Videoke</div>
            <div class="recommend-desc">Perfect for celebrations, parties, and large groups. Includes videoke system for entertainment.</div>
            <div class="recommend-reasons">
                <span class="reason-tag">Perfect for celebrations</span>
                <span class="reason-tag">Includes videoke</span>
                <span class="reason-tag">Large capacity</span>
            </div>
            <div class="recommend-actions">
                <button class="btn btn-primary" onclick="openBookingModal('', 'VE Cottage with Videoke')">Book Now</button>
            </div>
        </div>
    `;
}

// Ensure recommendations are loaded on page load
window.addEventListener('DOMContentLoaded', loadAIRecommendations);

// Update recommendations when form values change
function updateRecommendations() {
    // Debounce the function to avoid too many API calls
    clearTimeout(window.recommendationTimeout);
    window.recommendationTimeout = setTimeout(() => {
        loadAIRecommendations();
    }, 500);
}

// Add event listeners for form changes
document.addEventListener('DOMContentLoaded', function() {
    const guestsInput = document.getElementById('guests');
    const scheduleDateInput = document.getElementById('schedule-date');
    const checkinDateInput = document.getElementById('checkin-date');
    
    if (guestsInput) {
        guestsInput.addEventListener('change', updateRecommendations);
    }
    if (scheduleDateInput) {
        scheduleDateInput.addEventListener('change', updateRecommendations);
    }
    if (checkinDateInput) {
        checkinDateInput.addEventListener('change', updateRecommendations);
    }
    
    // Add event listeners for modal guest count changes
    const modalAdultsInput = document.getElementById('modal-adults');
    const modalChildrenInput = document.getElementById('modal-children');
    const modalSpecialRequestsInput = document.getElementById('modal-special-requests');
    
    if (modalAdultsInput) {
        modalAdultsInput.addEventListener('input', updateModalCottageSuggestion);
    }
    if (modalChildrenInput) {
        modalChildrenInput.addEventListener('input', updateModalCottageSuggestion);
    }
    if (modalSpecialRequestsInput) {
        modalSpecialRequestsInput.addEventListener('input', updateModalCottageSuggestion);
    }
    
    // Add event listeners for modal cottage suggestion buttons
    const assignCottageBtn = document.getElementById('modal-assign-cottage-btn');
    const viewCottageOptionsBtn = document.getElementById('modal-view-cottage-options');
    
    if (assignCottageBtn) {
        assignCottageBtn.addEventListener('click', assignSuggestedCottage);
    }
    if (viewCottageOptionsBtn) {
        viewCottageOptionsBtn.addEventListener('click', viewAllCottageOptions);
    }
    
    // Add event listeners for static AI recommendation "Book Now" buttons
    const staticRecommendCards = document.querySelectorAll('.recommend-cards .recommend-card');
    console.log('Found', staticRecommendCards.length, 'static recommendation cards');
    
    staticRecommendCards.forEach((card, index) => {
        const bookNowBtn = card.querySelector('.btn-primary');
        const cottageTitle = card.querySelector('.recommend-title').textContent;
        
        console.log(`Card ${index + 1}:`, { cottageTitle, hasButton: !!bookNowBtn });
        
        if (bookNowBtn) {
            bookNowBtn.addEventListener('click', () => {
                console.log(`Clicked Book Now for: ${cottageTitle}`);
                openBookingModal('', cottageTitle);
            });
        }
    });
});

// Function to update modal cottage suggestion based on guest count
function updateModalCottageSuggestion() {
    const adults = parseInt(document.getElementById('modal-adults')?.value || '0', 10);
    const children = parseInt(document.getElementById('modal-children')?.value || '0', 10);
    const specialRequests = document.getElementById('modal-special-requests')?.value || '';
    const totalGuests = adults + children;
    
    const suggestionDiv = document.getElementById('modal-ai-cottage-assignment');
    const suggestionText = document.getElementById('modal-ai-cottage-suggestion');
    
    if (totalGuests > 0) {
        suggestionDiv.style.display = 'block';
        
        // Get cottage recommendation based on guest count and special requests
        const recommendation = getCottageRecommendation(totalGuests, specialRequests);
        
        suggestionText.innerHTML = `
            <strong>${recommendation.name}</strong> - ${recommendation.capacity} • ₱${recommendation.price}<br>
            <small>${recommendation.description}</small>
        `;
        
        // Store the recommended cottage for later use
        suggestionDiv.dataset.recommendedCottage = recommendation.type;
        suggestionDiv.dataset.recommendedPrice = recommendation.price;
    } else {
        suggestionDiv.style.display = 'none';
    }
}

// Function to get cottage recommendation based on guest count and special requests
function getCottageRecommendation(guestCount, specialRequests = '') {
    const specialRequestsLower = specialRequests.toLowerCase();
    const hasSpecialOccasion = specialRequestsLower.includes('birthday') || 
                              specialRequestsLower.includes('party') || 
                              specialRequestsLower.includes('videoke') ||
                              specialRequestsLower.includes('celebration');
    
    // For special occasions, prioritize VE Cottage with Videoke if guest count allows
    if (hasSpecialOccasion && guestCount >= 10) {
        return {
            name: 'VE Cottage with Videoke',
            type: 'With Videoke',
            capacity: '20-25 guests',
            price: '2,500',
            description: 'Perfect for celebrations and special occasions!'
        };
    }
    
    // Regular recommendations based on guest count
    if (guestCount <= 5) {
        return {
            name: 'Garden Table',
            type: 'garden',
            capacity: '5 guests',
            price: '300',
            description: 'Perfect for small groups and families'
        };
    } else if (guestCount <= 15) {
        return {
            name: 'Kubo Type',
            type: 'kubo',
            capacity: '10-15 guests',
            price: '800',
            description: 'Great for medium-sized groups'
        };
    } else if (guestCount <= 25) {
        return {
            name: 'VE Cottage with Videoke',
            type: 'With Videoke',
            capacity: '20-25 guests',
            price: '2,500',
            description: 'Perfect for large groups and celebrations'
        };
    } else {
        return {
            name: 'VE Cottage without Videoke',
            type: 'Without Videoke',
            capacity: '20-25 guests',
            price: '2,000',
            description: 'Ideal for large groups without entertainment'
        };
    }
}

// Function to assign the suggested cottage
function assignSuggestedCottage() {
    const suggestionDiv = document.getElementById('modal-ai-cottage-assignment');
    const cottageTypeSelect = document.getElementById('modal-cottage-type');
    
    if (suggestionDiv.dataset.recommendedCottage && cottageTypeSelect) {
        cottageTypeSelect.value = suggestionDiv.dataset.recommendedCottage;
        
        // Show success message
        showNotification('Cottage selected successfully!', 'success');
        
        // Highlight the cottage type selection
        cottageTypeSelect.style.borderColor = '#4CAF50';
        cottageTypeSelect.style.backgroundColor = '#f0f8f0';
        
        setTimeout(() => {
            cottageTypeSelect.style.borderColor = '';
            cottageTypeSelect.style.backgroundColor = '';
        }, 2000);
    }
}

// Function to view all cottage options
function viewAllCottageOptions() {
    const cottageTypeSelect = document.getElementById('modal-cottage-type');
    if (cottageTypeSelect) {
        cottageTypeSelect.focus();
        cottageTypeSelect.click();
    }
} 

// Touch support for collage hover effect
function enableCollageTouchEffects() {
    const collageItems = document.querySelectorAll('.collage-item');
    collageItems.forEach(item => {
        item.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        });
        item.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        });
        item.addEventListener('touchcancel', function() {
            this.classList.remove('touch-active');
        });
    });
}
document.addEventListener('DOMContentLoaded', enableCollageTouchEffects); 

// Gallery is now static HTML - no dynamic loading needed

// Gallery functionality
function setupGallery() {
    // Simple gallery setup - just enable lightbox functionality
    console.log('Gallery initialized');
}

// Lightbox functionality
let currentImageIndex = 0;
let galleryImages = [];

function openLightbox(imgElement) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    // Get all visible images
    const visibleItems = Array.from(document.querySelectorAll('.collage-item[style*="display: block"], .collage-item:not([style*="display: none"])'));
    galleryImages = visibleItems.map(item => ({
        src: item.querySelector('img').src,
        alt: item.querySelector('img').alt,
        title: item.querySelector('.image-title')?.textContent || ''
    }));
    
    // Find current image index
    currentImageIndex = galleryImages.findIndex(img => img.src === imgElement.src);
    if (currentImageIndex === -1) currentImageIndex = 0;
    
    // Display image
    lightboxImg.src = galleryImages[currentImageIndex].src;
    lightboxImg.alt = galleryImages[currentImageIndex].alt;
    lightboxCaption.textContent = galleryImages[currentImageIndex].title;
    
    // Show lightbox
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleLightboxKeys);
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleLightboxKeys);
}

function changeImage(direction) {
    event.stopPropagation(); // Prevent closing lightbox
    
    currentImageIndex += direction;
    
    if (currentImageIndex >= galleryImages.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = galleryImages.length - 1;
    }
    
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    lightboxImg.src = galleryImages[currentImageIndex].src;
    lightboxImg.alt = galleryImages[currentImageIndex].alt;
    lightboxCaption.textContent = galleryImages[currentImageIndex].title;
}

function handleLightboxKeys(event) {
    switch(event.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            changeImage(-1);
            break;
        case 'ArrowRight':
            changeImage(1);
            break;
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', setupGallery);

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style); 