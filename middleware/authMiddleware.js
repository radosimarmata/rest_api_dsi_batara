const jwt = require('jsonwebtoken');
const { sendUnauthorizedResponse } = require('@utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return sendUnauthorizedResponse(res, 'Access denied, token missing');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return sendUnauthorizedResponse(res, 'Invalid or expired token');
  }
};

module.exports = authMiddleware;
