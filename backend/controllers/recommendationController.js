const { spawn } = require('child_process');
const path = require('path');
const Cottage = require('../models/cottage');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

exports.getRecommendations = async (req, res) => {
  try {
    const { guest_count, booking_date, special_requests } = req.query;
    
    // Fetch data from database
    const cottages = await Cottage.find({ available: true });
    const bookings = await Booking.find({ 
      status: { $in: ['confirmed', 'completed'] } 
    }); // Removed .populate('cottageId')
    const reviews = await Review.find({}); // Removed .populate('cottageId')
    
    // Prepare data for AI service
    const cottagesData = cottages.map(cottage => ({
      _id: cottage._id.toString(),
      name: cottage.name,
      description: cottage.description,
      price: cottage.price,
      capacity: cottage.capacity,
      image: cottage.image,
      type: cottage.type,
      amenities: cottage.amenities
    }));
    
    const bookingsData = bookings.map(booking => ({
      _id: booking._id.toString(),
      cottageId: booking.cottageId ? booking.cottageId.toString() : '',
      status: booking.status,
      bookingDate: booking.bookingDate ? booking.bookingDate.toISOString() : '',
      numberOfPeople: booking.numberOfPeople,
      specialRequests: booking.specialRequests
    }));
    
    const reviewsData = reviews.map(review => ({
      _id: review._id.toString(),
      cottageId: review.cottageId ? review.cottageId.toString() : '',
      rating: review.rating,
      comment: review.comment
    }));
    
    // Call Python recommender script
    const pythonScript = path.join(__dirname, '../../ai/simple_recommender.py');
    const pythonProcess = spawn('python', [pythonScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Send data to Python script
    const inputData = {
      guest_count: parseInt(guest_count) || 2,
      booking_date: booking_date || new Date().toISOString(),
      special_requests: special_requests || '',
      cottages: cottagesData,
      bookings: bookingsData,
      reviews: reviewsData
    };
    
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const recommendations = JSON.parse(output.trim());
          
          // Format recommendations for frontend
          const formattedRecommendations = recommendations.map(rec => ({
            label: `AI RECOMMENDED (${rec.score}%)`,
            title: rec.name,
            desc: `${rec.description} - ${rec.capacity} - ₱${rec.price}`,
            reasons: rec.reasons,
            cottage_id: rec.cottage_id,
            image: rec.image,
            price: rec.price,
            capacity: rec.capacity
          }));
          
          res.json(formattedRecommendations);
        } catch (parseError) {
          console.error('Error parsing Python output:', parseError);
          res.json(getFallbackRecommendations(guest_count, special_requests));
        }
      } else {
        console.error('Python script error:', errorOutput);
        res.json(getFallbackRecommendations(guest_count, special_requests));
      }
    });
    
  } catch (error) {
    console.error('AI recommendation error:', error.message);
    
    // Fallback to simple recommendations
    const fallbackRecs = getFallbackRecommendations(
      parseInt(req.query.guest_count) || 2,
      req.query.special_requests || ''
    );
    
    res.json(fallbackRecs);
  }
};

function getFallbackRecommendations(guestCount, specialRequests) {
  const specialRequestsLower = (specialRequests || '').toLowerCase();
  const hasSpecialOccasion = specialRequestsLower.includes('birthday') || 
                            specialRequestsLower.includes('party') || 
                            specialRequestsLower.includes('videoke');
  
  const recommendations = [];
  
  // Special occasion recommendation
  if (hasSpecialOccasion) {
    recommendations.push({
      label: 'PERFECT FOR CELEBRATIONS',
      title: 'VE Cottage with Videoke',
      desc: 'Perfect for celebrations with videoke system - 20-25 guests - ₱2,500',
      reasons: ['Perfect for celebrations', 'Includes videoke system', 'Great for large groups'],
      cottage_id: 'With Videoke',
      image: 'vecottage.jpg',
      price: 2500,
      capacity: '20-25 guests'
    });
  }
  
  // Guest count based recommendations
  if (guestCount <= 5) {
    recommendations.push({
      label: 'PERFECT FOR SMALL GROUPS',
      title: 'Garden Table',
      desc: 'Cozy garden setting perfect for small groups - 5 guests - ₱300',
      reasons: ['Perfect for small groups', 'Great value', 'Garden setting'],
      cottage_id: 'garden',
      image: 'gardentable.jpg',
      price: 300,
      capacity: '5 guests'
    });
  } else if (guestCount <= 15) {
    recommendations.push({
      label: 'GREAT FOR MEDIUM GROUPS',
      title: 'Kubo Type',
      desc: 'Traditional kubo perfect for medium-sized groups - 10-15 guests - ₱800',
      reasons: ['Great for medium groups', 'Traditional setting', 'Comfortable space'],
      cottage_id: 'kubo',
      image: 'kubo.jpg',
      price: 800,
      capacity: '10-15 guests'
    });
  } else {
    recommendations.push({
      label: 'PERFECT FOR LARGE GROUPS',
      title: 'VE Cottage without Videoke',
      desc: 'Spacious cottage perfect for large groups - 20-25 guests - ₱2,000',
      reasons: ['Perfect for large groups', 'Spacious accommodation', 'Great value'],
      cottage_id: 'Without Videoke',
      image: 'vecottage.jpg',
      price: 2000,
      capacity: '20-25 guests'
    });
  }
  
  return recommendations.slice(0, 3);
} 