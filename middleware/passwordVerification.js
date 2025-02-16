const axios = require('axios');
const bcrypt = require('bcryptjs');
const { generateServiceToken } = require('../middleware/gatewayTokenGenerator');

const verifyPassword = async (userName, password) => {
    try {
        // Get staff accounts using service token
        const serviceToken = generateServiceToken();
        const response = await axios.get(`${process.env.API_GATEWAY_URL}/admin/get-accounts`, {
            headers: { Authorization: `Bearer ${serviceToken}` }
        });

        const accountData = response.data;

        // FIND USER IF IT EXIST
        const user = accountData.find(account => account.userName === userName);

        if (!user) {
            // USER NOT FOUND
            return false;
        }

        // CHECK PASSWORD IF MATCHED
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return false;
        }

        // PASSWORD MATCHED
        return user;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
};

module.exports = {
    verifyPassword
};
