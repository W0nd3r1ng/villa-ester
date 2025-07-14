const mongoose = require('mongoose');
const Cottage = require('../models/cottage');
require('dotenv').config();

// MongoDB connection string - use environment variable
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not set');
  console.log('Please set your MongoDB Atlas connection string in the .env file');
  process.exit(1);
}

// Cottage data from Atlas database - creating cottages with proper quantities
const cottagesData = [
  // Kubo Type - 10 cottages available
  {
    name: "Kubo Type",
    description: "Traditional Filipino cottage near the garden, perfect for small groups and family gatherings",
    price: 800,
    capacity: "10-15",
    amenities: ["Garden View", "Basic Amenities", "Outdoor Seating", "Natural Setting", "Peaceful Environment"],
    image: "kubo.jpg",
    available: true,
    quantity: 10,
    type: "kubo"
  },
  // VE Cottage with Videoke - 2 cottages available
  {
    name: "VE Cottage with Videoke",
    description: "Spacious cottage perfect for families with built-in videoke system for entertainment",
    price: 2500,
    capacity: "20-25",
    amenities: ["Videoke System", "Spacious Interior", "Family-Friendly", "Entertainment Area", "Comfortable Seating"],
    image: "vecottage.jpg",
    available: true,
    quantity: 2,
    type: "With Videoke"
  },
  // VE Cottage without Videoke - 2 cottages available
  {
    name: "VE Cottage without Videoke",
    description: "Spacious cottage perfect for families seeking a peaceful environment",
    price: 2000,
    capacity: "20-25",
    amenities: ["Spacious Interior", "Family-Friendly", "Comfortable Seating", "Peaceful Environment"],
    image: "vecottage.jpg",
    available: true,
    quantity: 2,
    type: "Without Videoke"
  },
  // Garden Table - 10 tables available
  {
    name: "Garden Table",
    description: "Charming garden tables with breathtaking views, perfect for romantic getaways and intimate gatherings",
    price: 300,
    capacity: "5",
    amenities: ["Garden View", "Intimate Setting", "Romantic Atmosphere"],
    image: "gardentable.jpg",
    available: true,
    quantity: 10,
    type: "garden"
  }
];

async function populateCottages() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('Connection string:', MONGODB_URI.substring(0, 20) + '...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas successfully');

    // Clear existing cottages
    await Cottage.deleteMany({});
    console.log('🗑️  Cleared existing cottages');

    // Insert new cottages
    const cottages = await Cottage.insertMany(cottagesData);
    console.log(`✅ Successfully inserted ${cottages.length} cottages:`);
    
    cottages.forEach(cottage => {
      console.log(`  - ${cottage.name} (${cottage.type}): ₱${cottage.price} - ${cottage.capacity} guests`);
    });

    console.log('\n🎉 Database population completed successfully!');
    console.log('You can now test the booking system.');
  } catch (error) {
    console.error('❌ Error populating database:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure your .env file contains the correct MONGODB_URI');
      console.log('Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
populateCottages(); 