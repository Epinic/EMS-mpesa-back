const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

// Daraja sandbox keys
const consumerKey = 'YOUR_CONSUMER_KEY';
const consumerSecret = 'YOUR_CONSUMER_SECRET';
const shortcode = 'YOUR_SHORTCODE';
const passkey = 'YOUR_PASSKEY';
const callbackURL = 'https://your-railway-app.up.railway.app/callback';

async function getToken() {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const res = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${auth}` }
    });
    return res.data.access_token;
}

app.post('/stkpush', async (req, res) => {
    const { phone, amount, accountReference, transactionDesc } = req.body;
    const token = await getToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0,14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const data = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackURL,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
    };

    try {
        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/callback', (req, res) => {
    console.log('Payment callback received:', req.body);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
