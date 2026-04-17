import axios from 'axios';
async function run() {
  try {
    const login = await axios.post('http://localhost:3000/api/v1/auth/login', { email: 'buyer@flowmarket.local', password: 'password123' });
    const token = login.data.accessToken;
    console.log("Logged in");
    const purchases = await axios.get('http://localhost:3000/api/v1/purchases', { headers: { Authorization: `Bearer ${token}` }});
    console.log(JSON.stringify(purchases.data, null, 2));
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
