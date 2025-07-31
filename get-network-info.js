const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push({
          name: name,
          address: interface.address,
          netmask: interface.netmask,
          mac: interface.mac
        });
      }
    }
  }
  
  return addresses;
}

function displayNetworkInfo() {
  console.log('=== NETWORK ACCESS SETUP ===');
  console.log('');
  
  const localIPs = getLocalIPAddress();
  
  if (localIPs.length === 0) {
    console.log('❌ No network interfaces found!');
    console.log('Make sure you are connected to a network.');
    return;
  }
  
  console.log('✅ Found network interfaces:');
  localIPs.forEach((ip, index) => {
    console.log(`   ${index + 1}. ${ip.name}: ${ip.address}`);
  });
  
  console.log('');
  console.log('🌐 To access from other devices:');
  console.log('');
  
  // Use the first available IP (usually the main one)
  const mainIP = localIPs[0].address;
  const port = process.env.PORT || 5000;
  
  console.log(`📱 Phone/Tablet: http://${mainIP}:${port}`);
  console.log(`💻 Other computers: http://${mainIP}:${port}`);
  console.log(`🔗 API endpoint: http://${mainIP}:${port}/api/bookings/get-cottage-numbers`);
  console.log('');
  
  console.log('📋 Test URLs:');
  console.log(`   • Main site: http://${mainIP}:${port}`);
  console.log(`   • API health: http://${mainIP}:${port}/`);
  console.log(`   • Cottage availability: http://${mainIP}:${port}/api/bookings/get-cottage-numbers?cottageType=kubo&bookingDate=2024-01-15&bookingTime=day`);
  console.log('');
  
  console.log('⚠️  IMPORTANT NOTES:');
  console.log('   1. Make sure your firewall allows connections on port ' + port);
  console.log('   2. Both devices must be on the same network (same WiFi)');
  console.log('   3. If using Windows, you may need to allow the app through firewall');
  console.log('   4. Some antivirus software may block network connections');
  console.log('');
  
  console.log('🔧 Troubleshooting:');
  console.log('   • If connection fails, try disabling firewall temporarily');
  console.log('   • Check if port ' + port + ' is not used by another application');
  console.log('   • Ensure both devices are on the same WiFi network');
  console.log('   • Try using a different port: HOST=0.0.0.0 PORT=3001 npm start');
  console.log('');
  
  console.log('📱 Testing from phone:');
  console.log('   1. Open browser on your phone');
  console.log('   2. Go to: http://' + mainIP + ':' + port);
  console.log('   3. Test the cottage availability functionality');
  console.log('');
  
  return mainIP;
}

// Run the network info display
const mainIP = displayNetworkInfo();

// Export for use in other scripts
module.exports = { getLocalIPAddress, displayNetworkInfo }; 