const { db } = require('@config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendSuccessResponse, sendErrorResponse, sendUnauthorizedResponse } = require('@utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1D';

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db('user')
      .where('username', username)
      .first();

    if (!user) {
      return sendUnauthorizedResponse(res, 'Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendUnauthorizedResponse(res, 'Invalid username or password');
    }

    const accessToken = jwt.sign(
      { id: user.id, type_user_id: user.type_user_id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type_user_id: user.type_user_id, username: user.username },
      JWT_SECRET
    );

    await db('refresh_tokens').insert({
      user_id: user.id,
      refresh_token: refreshToken,
      is_valid: true,
    });

    return sendSuccessResponse(res, 200, { accessToken, refreshToken }, 'Login successful');
  } catch (error) {
    return sendErrorResponse(res, 500, 'Error during login', error);
  }
};

const regenerateToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendUnauthorizedResponse(res, 'Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    const refreshTokenRecord = await db('refresh_tokens')
      .where('refresh_token', refreshToken)
      .andWhere('is_valid', true)
      .first();
    
    if (!refreshTokenRecord) {
      return sendUnauthorizedResponse(res, 'Invalid or used refresh token');
    }

    await db('refresh_tokens')
      .where('refresh_token', refreshToken)
      .update({ is_valid: false })

    
    const newAccessToken = jwt.sign(
      { id: decoded.id, type_user_id: decoded.type_user_id, username: decoded.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id, type_user_id: decoded.type_user_id, username: decoded.username },
      JWT_SECRET
    );

    await db('refresh_tokens').insert({
      user_id: decoded.id,
      refresh_token: newRefreshToken,
      is_valid: true,
    });

    return sendSuccessResponse(res, 200, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Tokens regenerated successfully');
  } catch (error) {
    return sendUnauthorizedResponse(res, 'Invalid or expired refresh token');
  }
};

module.exports = { login, regenerateToken };
