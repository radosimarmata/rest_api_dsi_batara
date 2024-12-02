const { db } = require('@config/db');
const { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } = require('@utils/response');

const getUsers = async (req, res) => {
  const { id } = req.query;

  try {
    if (id) {
      const user = await db('user').where('id', id).first();

      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      return sendSuccessResponse(res, 200, user, 'User retrieved successfully');
    }

    const users = await db('user').select('*');
    if (users.length === 0) {
      return sendNotFoundResponse(res, 'No users found');
    }

    return sendSuccessResponse(res, 200, users, 'Users retrieved successfully');
  } catch (error) {
    return sendErrorResponse(res, 500, 'Error fetching users', error);
  }
};

const createUser = async (req, res) => {
  const { type_user_id, username, password } = req.body;
  try {
    const [userId] = await db('user').insert({
      type_user_id,
      username,
      password,
    }).returning('id');

    return sendSuccessResponse(res, 201, { userId }, 'User created successfully');
  } catch (error) {
    return sendErrorResponse(res, 500, 'Error creating user', error);
  }
};

module.exports = { getUsers, createUser };
