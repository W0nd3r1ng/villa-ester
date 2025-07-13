require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('./models/Review');

// MongoDB connection string - using the same as in app.js
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://villa_ester_admin:Bk5IaRBQjT7Kk2WR@cluster0.tuh5fdh.mongodb.net/villa_ester?retryWrites=true&w=majority&appName=Cluster0';

// Sample reviews data
const sampleReviews = [
  {
    name: "Maria Santos",
    comment: "Amazing experience at Villa Ester! The cottages are beautiful and the staff is very friendly. Perfect for our family vacation. The food was delicious and the surroundings are breathtaking. Highly recommended!",
    image: "reviewer1.jpg",
    rating: 5,
    date: new Date('2024-01-15')
  },
  {
    name: "John Dela Cruz",
    comment: "Great place for a weekend getaway. The cottages are clean and well-maintained. The swimming area is perfect for kids. We enjoyed the fresh air and peaceful environment. Will definitely come back!",
    image: "reviewer2.jpg",
    rating: 5,
    date: new Date('2024-01-20')
  },
  {
    name: "Ana Rodriguez",
    comment: "Perfect venue for our company outing. The facilities are excellent and the staff accommodated all our needs. The food was superb and the activities were fun. Everyone had a great time!",
    image: "reviewer3.jpg",
    rating: 5,
    date: new Date('2024-02-05')
  },
  {
    name: "Carlos Martinez",
    comment: "Beautiful resort with stunning views. The cottages are spacious and comfortable. The staff is very helpful and the service is excellent. Great value for money. Highly recommend for families!",
    image: "reviewer4.jpg",
    rating: 4,
    date: new Date('2024-02-12')
  },
  {
    name: "Isabella Garcia",
    comment: "Wonderful experience! The resort is clean, peaceful, and perfect for relaxation. The staff is friendly and the food is delicious. The cottages are well-equipped and comfortable. Will visit again!",
    image: "reviewer5.jpg",
    rating: 5,
    date: new Date('2024-02-18')
  },
  {
    name: "Miguel Lopez",
    comment: "Excellent service and beautiful location. The cottages are well-maintained and the surroundings are peaceful. Perfect for a quiet getaway. The staff is very accommodating. Highly recommended!",
    image: "reviewer6.jpg",
    rating: 4,
    date: new Date('2024-02-25')
  },
  {
    name: "Sofia Hernandez",
    comment: "Amazing place for family bonding. The kids loved the swimming area and the activities. The cottages are clean and comfortable. The food is great and the staff is very friendly. Perfect vacation spot!",
    image: "reviewer7.jpg",
    rating: 5,
    date: new Date('2024-03-01')
  },
  {
    name: "Diego Torres",
    comment: "Great resort with excellent facilities. The cottages are spacious and well-equipped. The staff is professional and friendly. The food is delicious and the service is outstanding. Highly recommend!",
    image: "reviewer8.jpg",
    rating: 5,
    date: new Date('2024-03-08')
  }
];

async function populateReviews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Clear existing reviews
    await Review.deleteMany({});
    console.log('Cleared existing reviews');

    // Insert sample reviews
    const reviews = await Review.insertMany(sampleReviews);
    console.log(`Successfully inserted ${reviews.length} reviews`);

    // Display inserted reviews
    console.log('\nInserted reviews:');
    reviews.forEach((review, index) => {
      console.log(`${index + 1}. ${review.name} - ${review.rating} stars - ${review.date.toLocaleDateString()}`);
    });

    console.log('\nReviews population completed successfully!');
  } catch (error) {
    console.error('Error populating reviews:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the population script
populateReviews(); 