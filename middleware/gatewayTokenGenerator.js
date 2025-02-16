const jwt = require('jsonwebtoken')

const generateServiceToken = () => {
    const payload = { service: 'Finance' };
    return jwt.sign(payload, process.env.GATEWAY_JWT_SECRET, { expiresIn: '10m' });
};

module.exports = {
    generateServiceToken
}