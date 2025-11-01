// Simple test to check if server is running
const testConnection = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/user', {
      credentials: 'include'
    });
    console.log('Server response status:', response.status);
    console.log('Server is running and accessible');
  } catch (error) {
    console.error('Connection failed:', error.message);
    console.log('Make sure the server is running on port 3000');
  }
};

testConnection();