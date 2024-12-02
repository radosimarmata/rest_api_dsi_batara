const { db } = require('@config/db');
const { sendSuccessResponse, sendErrorResponse } = require('@utils/response');

const getIoLogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;

  try {
    const totalCountResult = await db('io_log').count('id as total').first();
    const totalCount = totalCountResult.total;

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
      .limit(limit)
      .offset(offset);

    if (ioLogs.length > 0) {
      const idsToUpdate = ioLogs.map(log => log.id);
      await db('io_log')
        .whereIn('id', idsToUpdate)
        .update({ is_send: true });
    }
    return sendSuccessResponse(res, 200, {
      log : ioLogs,
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
    const now = new Date();    
    const fiveSecondsAgo = new Date(now.getTime() - 5000);
    const formattedFiveSecondsAgo = fiveSecondsAgo.toISOString();

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
      .andWhere('server_time', '>=', formattedFiveSecondsAgo);

    if (ioLogs.length > 0) {
      const idsToUpdate = ioLogs.map(log => log.id);
      await db('io_log')
        .whereIn('id', idsToUpdate)
        .update({ is_send: true });
    }
    
    return sendSuccessResponse(res, 200, {log: ioLogs}, 'Logs fetched successfully');
  } catch (error) {
    return sendErrorResponse(res, 500, 'Error fetching Logs', error);
  }
}

module.exports = { getIoLogs, getIoLogsNow };
