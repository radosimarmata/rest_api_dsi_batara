const { db } = require('@config/db');
const { sendSuccessResponse, sendErrorResponse } = require('@utils/response');
const moment = require('moment');

const getIoLogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;

  const from = req.query.from ? moment(req.query.from).format('YYYY-MM-DD HH:mm:ss') : null;
  const to = req.query.to ? moment(req.query.to).format('YYYY-MM-DD HH:mm:ss') : null;

  try {
    const totalCountQuery = db('io_log').count('id as total').where('is_send', false);
    if (from) totalCountQuery.where('timestamp', '>=', from);
    if (to) totalCountQuery.where('timestamp', '<=', to);
    const totalCountResult = await totalCountQuery.first();
    const totalCount = totalCountResult.total;

    const ioLogsQuery = db('io_log')
      .select(
        'id',
        'vehicle_name',
        'imei',
        'longitude',
        'latitude',
        'altitude',
        'speed',
        'timestamp',
      )
      .where('is_send', false)
      .limit(limit)
      .offset(offset);

    if(from) ioLogsQuery.where('timestamp', '>=', from);
    if(to) ioLogsQuery.where('timestamp', '<=', to);

    const ioLogs = await ioLogsQuery;

    const formattedLogs = ioLogs.map(log => ({
      ...log,
      timestamp: moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
    }));

    if (ioLogs.length > 0) {
      const idsToUpdate = ioLogs.map(log => log.id);
      await db('io_log')
        .whereIn('id', idsToUpdate)
        .update({ is_send: true });
    }
    return sendSuccessResponse(res, 200, {
      log : formattedLogs,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit,
      }
    }, 'Logs fetched successfully');
  } catch (error) {
    return sendErrorResponse(res, 500, 'Error fetching Logs', error);
  }
};

const getIoLogsNow = async (req, res) => {
  try {
    const now = moment().utcOffset(8)
    const fiveSecondsAgo = now.subtract(30, 'seconds').format('YYYY-MM-DD HH:mm:ss');

    const ioLogs = await db('io_log')
      .select(
        'id',
        'vehicle_name',
        'imei',
        'longitude',
        'latitude',
        'altitude',
        'speed',
        'timestamp',
      )
      .where('is_send', false)
      .andWhere('timestamp', '>=', fiveSecondsAgo);

    if (ioLogs.length > 0) {
      const idsToUpdate = ioLogs.map(log => log.id);
      await db('io_log')
        .whereIn('id', idsToUpdate)
        .update({ is_send: true });
    }

    const formattedLogs = ioLogs.map(log => ({
      ...log,
      timestamp: moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
    }));
    
    return sendSuccessResponse(res, 200, {log: formattedLogs}, 'Logs fetched successfully');
  } catch (error) {
    return sendErrorResponse(res, 500, 'Error fetching Logs', error);
  }
}

module.exports = { getIoLogs, getIoLogsNow };
