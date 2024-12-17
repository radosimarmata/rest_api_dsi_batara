const { db, dbprimary, dbsecondary } = require('./config/db');
const ping = require('ping');

let isServer1Alive = true;
let isOk = true;
const checkServerStatus = async () => {
  try {
    const res1 = await ping.promise.probe(process.env.DB_HOST_PRIMARY);
    isServer1Alive = res1.alive;
    console.log(isServer1Alive ? "Server 1 is alive." : "Server 1 is down.");
  } catch (error) {
    console.error('Error checking server status:', error.message);
    isServer1Alive = false;
  }
};

const fetchDataFromDatabase = async (dbexist) => {
  try {
    const lastId = await db('io_log').select('id').orderBy('id', 'desc').first();
    console.log("Last ID => ",lastId);

    const baseQuery = dbexist('io_log')
      .select(
        'io_log.id',
        'vehicle.name as vehicle_name',
        'io_log.imei',
        'io_log.longitude',
        'io_log.latitude',
        'io_log.altitude',
        'io_log.speed',
        'io_log.angle',
        'io_log.satellites',
        'io_log.timestamp',
        'io_log.server_time'
      )
      .innerJoin('vehicle', 'vehicle.imei', 'io_log.imei')
      .innerJoin('egi', 'egi.id', 'vehicle.egi_id')
      .innerJoin('eq_class', 'eq_class.id', 'egi.eq_class_id')
      .where('eq_class.id', 3);

    if (lastId) {
      console.log(`Fetching data with ID greater than ${lastId.id}`);
      return await baseQuery.where('io_log.id', '>', lastId.id);
    }

    return await baseQuery;
  } catch (error) {
    console.error(`Error fetching data from database:`, error.message);
    return null;
  }
};

const insertDataToIoLog = async (data) => {
  try {
    await db('io_log').insert(data);
  } catch (error) {
    console.error('Error inserting data into io_log:', error.message);
  }
};

const startPolling = () => {
  setInterval(async () => {
    try {
      if(isOk){
        console.log('----------start----------');
        isOk = false;
        await checkServerStatus();
        const dbexist = isServer1Alive ? dbprimary : dbsecondary;
        const serverName = isServer1Alive ? 'DB1' : 'DB2';
        console.log(`Fetching data from ${serverName}...`);
        const data = await fetchDataFromDatabase(dbexist);

        if (data && data.length > 0) {
          console.log(`Data from ${serverName}:`, data.length);
          const batchSize = 1000;
          for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            await insertDataToIoLog(batch);
          }
        } else {
          console.error(`No data fetched from ${serverName}`);
        }
        isOk = true;
        console.log('----------finish----------');
      }
    } catch (error) {
      console.error('Error occurred during polling:', error.message);
    }
  }, 3000);
};

startPolling();
