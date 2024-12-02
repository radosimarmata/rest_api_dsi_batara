const fs = require('fs');
const path = require('path');
const { sendUnauthorizedResponse } = require('@utils/response');

const allowedIPsFilePath = path.join(__dirname, '../config/allowedIPs.json');

const loadAllowedIPs = () => {
  try {
    const data = fs.readFileSync(allowedIPsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load allowed IPs:', error.message);
    return [];
  }
};

const ipWhitelist = (req, res, next) => {
  try {
    const allowedIPs = loadAllowedIPs();
    const clientIP = req.ip || req.connection.remoteAddress;
    const forwardedIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    const ipToCheck = forwardedIP || clientIP;

    console.log("ipToCheck :",ipToCheck)

    const normalizedIP = ipToCheck.replace(/^::ffff:/, '');

    if (!allowedIPs.includes(normalizedIP)) {
      console.warn(`Access denied for IP: ${normalizedIP}`);
      return res.status(403).json({ 
        message: 'Forbidden: You are not allowed to access this resource.' 
      });
    }

    next();
  } catch (error) {
    console.error('Error in IP whitelist middleware:', error.message);
    return sendUnauthorizedResponse(res, 'Forbidden: Access denied.');
  }
};

module.exports = ipWhitelist;
