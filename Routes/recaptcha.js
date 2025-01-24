const express = require('express')
const axios = require('axios');

//ROUTER
const router = express.Router()

router.post('/', async (req, res) => {
    const { rcToken } = req.body
    
    if (!rcToken) {
        return res.status(400).json({ msg: 'No token provided' });
      }

      try {
        const secretKey = process.env.RC_SECRET_KEY; // Replace with your Secret Key
        const response = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify`,
          null,
          {
            params: {
              secret: secretKey,
              response: rcToken,
            },
          }
        );
    
        const { success, score, action } = response.data;
    
        if (success && score > 0.5) {
          return res.json({ success: true, message: 'Verification successful', score });
        } else {
          return res.status(400).json({ success: false, message: 'Verification failed', score });
        }
      } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
})

module.exports = router