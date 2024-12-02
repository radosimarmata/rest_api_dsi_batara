/**
 * Utility functions for standardizing API responses
 */

/**
 * Fungsi untuk mengirimkan respons sukses
 * @param {Object} res - objek respons Express
 * @param {number} statusCode - kode status HTTP
 * @param {Object} data - data yang ingin dikirim dalam respons
 * @param {string} message - pesan yang ingin ditampilkan dalam respons
 */

const sendSuccessResponse = (res, statusCode = 200, data = {}, message = 'Request succeeded') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendCreatedResponse = (res, data = {}, message = 'Resource created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

const sendNoContentResponse = (res, message = 'No content available') => {
  return res.status(204).json({
    success: true,
    message,
  });
};

const sendUnauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message,
  });
};

const sendForbiddenResponse = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message,
  });
};

const sendNotFoundResponse = (res, message = 'Not Found') => {
  return res.status(404).json({
    success: false,
    message,
  });
};

const sendErrorResponse = (res, statusCode = 400, message = 'An error occurred', error = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

const sendInternalServerErrorResponse = (res, message = 'Internal Server Error', error = {}) => {
  return res.status(500).json({
    success: false,
    message,
    error,
  });
};

module.exports = {
  sendSuccessResponse,
  sendCreatedResponse,
  sendNoContentResponse,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendNotFoundResponse,
  sendErrorResponse,
  sendInternalServerErrorResponse,
};