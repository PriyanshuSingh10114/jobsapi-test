const axios = require('axios');
const companies = ['sourcegraph', 'netlify', 'postman', 'drata', 'benchling', 'pilot', 'natera'];

async function test() {
  for (const c of companies) {
    try {
      const res = await axios.get(`https://api.lever.co/v0/postings/${c}?mode=json`);
      console.log(`[Lever] Testing company: ${c}`);
      console.log(`[Lever] Jobs found: ${res.data.length}`);
    } catch (e) {
      console.log(`[Lever] Failed for ${c}: ${e.message}`);
    }
  }
}
test();
