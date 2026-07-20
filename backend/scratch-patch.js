const axios = require('axios');

async function testPatch() {
  try {
    let res = await axios.patch('http://localhost:5000/api/user/profile', {
      basicInfo: { email: 'test@example.com' }
    });
    console.log('After email patch:', res.data.profile.basicInfo);

    res = await axios.patch('http://localhost:5000/api/user/profile', {
      basicInfo: { firstName: 'MergedFirst' }
    });
    console.log('After firstName patch:', res.data.profile.basicInfo);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testPatch();
