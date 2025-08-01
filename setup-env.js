const fs = require('fs');
const path = require('path');

console.log('Setting up environment file for backend...');

const envContent = `# MongoDB Connection - Using MongoDB Atlas (production database)
MONGODB_URI=mongodb+srv://villa_ester_admin:Bk5IaRBQjT7Kk2WR@cluster0.tuh5fdh.mongodb.net/villa_ester?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret
JWT_SECRET=villa-ester-super-secret-jwt-key-2024

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Optional: Email Configuration (can be added later)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
`;

const envPath = path.join(__dirname, 'backend', '.env');

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment file created successfully at:', envPath);
    console.log('📝 The file contains:');
    console.log('- MongoDB Atlas connection string');
    console.log('- JWT secret for authentication');
    console.log('- Server configuration');
    console.log('');
    console.log('🚀 You can now start the backend with:');
    console.log('   cd backend && npm run dev');
} catch (error) {
    console.error('❌ Error creating environment file:', error.message);
    console.log('');
    console.log('📝 Please create the file manually:');
    console.log('1. Create a file named ".env" in the backend directory');
    console.log('2. Add the following content:');
    console.log('');
    console.log(envContent);
} 