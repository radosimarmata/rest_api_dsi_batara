const { dbconn } = require('@config/db');
const { sendSuccessResponse, sendErrorResponse } = require('@utils/response');
const moment = require('moment');

const getUtilizationofAvailability = async (req, res) => {
  const { database, start_date } = req.query;
  if(!start_date && !database) {
    return sendErrorResponse(res, 400, 'Start date & Database name is required');
  }
  if (!database) {
    return sendErrorResponse(res, 400, 'Database name is required');
  }
  if (!start_date) {
    return sendErrorResponse(res, 400, 'Start date is required');
  }
  const isValidDate = moment(start_date, 'YYYY-MM-DD', true).isValid();
  if (!isValidDate) {
    return sendErrorResponse(res, 400, 'Invalid start date format. Use YYYY-MM-DD');
  }
  const dynamicDb = dbconn(`db_${database}`);
  try {
    const result = await dynamicDb.select(
        'date', 
        'shift_name', 
        'eq_class', 
        'egi', 
        'vehicle_name', 
        'ua'
      )
      .from('vw_pbi_pa_ua_prod')
      .where('date', start_date);

    const formattedResult = result.map(row => ({
      ...row,
      date: moment(row.date).format('YYYY-MM-DD'),
    }));
    return sendSuccessResponse(res, 200, 
      { 
        message: 'utilization of availability fetched successfully',
        data: formattedResult
      }
    );
  } catch (error) {
    return sendErrorResponse(res, 500, 'Error fetching utilization of availability', error);
  }
}

const getPhysicalofAvailability = async (req, res) => {
  const { database, start_date } = req.query;
  if(!start_date && !database) {
    return sendErrorResponse(res, 400, 'Start date & Database name is required');
  }
  if (!database) {
    return sendErrorResponse(res, 400, 'Database name is required');
  }
  if (!start_date) {
    return sendErrorResponse(res, 400, 'Start date is required');
  }
  const isValidDate = moment(start_date, 'YYYY-MM-DD', true).isValid();
  if (!isValidDate) {
    return sendErrorResponse(res, 400, 'Invalid start date format. Use YYYY-MM-DD');
  }
  const dynamicDb = dbconn(`db_${database}`);
  try {
    const result = await dynamicDb.select(
        'date', 
        'shift_name', 
        'eq_class', 
        'egi', 
        'vehicle_name', 
        'pa'
      )
      .from('vw_pbi_pa_ua_prod')
      .where('date', start_date);

    const formattedResult = result.map(row => ({
      ...row,
      date: moment(row.date).format('YYYY-MM-DD'),
    }));
    return sendSuccessResponse(res, 200, 
      { 
        message: 'physical of availability fetched successfully',
        data: formattedResult
      }
    );
  } catch (error) {
    return sendErrorResponse(res, 500, 'Error fetching physical of availability', error);
  }
}

module.exports = { 
  getUtilizationofAvailability,
  getPhysicalofAvailability 
};