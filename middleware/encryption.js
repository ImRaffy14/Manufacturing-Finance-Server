const CryptoJS = require('crypto-js');

// Encryption function
const encryptData = (data, secretKey) => {
  const stringData = JSON.stringify(data);  
  const encrypted = CryptoJS.AES.encrypt(stringData, secretKey).toString();
  return encrypted;
};

module.exports = {encryptData}