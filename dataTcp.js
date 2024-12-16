const net = require('net');
const moment = require('moment');
const { db } = require('./config/db');
require('dotenv').config();

const HOST_FLEETSIGHT = process.env.HOST_FLEETSIGHT;
const PORT_FLEETSIGHT = process.env.PORT_FLEETSIGHT;
const client = new net.Socket();

function buildLoginPacket(imei) {
  const startByte = "#L#";  
  const delimiter = ";";
  const endOfPacket = "\r\n";
  const password = 'NA';
  
  const loginPacket = `${startByte}${imei}${delimiter}${password}${endOfPacket}`;
  return loginPacket;
}

function buildSDPacket(date, time, latDeg, latSign, lonDeg, lonSign, speed, course, alt, sats) {
  const startByte = "#SD#";  
  const delimiter = ";";
  const endOfPacket = "\r\n";
  
  const sdPacket = `${startByte}${date}${delimiter}${time}${delimiter}${latDeg}${delimiter}${latSign}${delimiter}${lonDeg}${delimiter}${lonSign}${delimiter}${speed}${delimiter}${course}${delimiter}${alt}${delimiter}${sats}${endOfPacket}`;
  
  return sdPacket;
}

function convertToNMEA(degrees, isLatitude) {
  const isNegative = degrees < 0;
  const absDegrees = Math.abs(degrees);
  const degree = Math.floor(absDegrees);
  const minutes = (absDegrees - degree) * 60;
  const direction = (isLatitude)
    ? (isNegative ? 'S' : 'N')  // Latitude: S for South, N for North
    : (isNegative ? 'W' : 'E'); // Longitude: W for West, E for East
  
  const coordinate = `${degree.toString().padStart(isLatitude ? 2 : 3, '0')}${minutes.toFixed(5).padStart(7, '0')}`;

  return { coordinate, direction };
}

const now = moment().utcOffset(8)
const thirtySecondsAgo = now.subtract(30, 'seconds').format('YYYY-MM-DD HH:mm:ss');

async function getData(){
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
    .andWhere('timestamp', '>=', thirtySecondsAgo)
    .orderBy('id', 'DESC');
  
  // if (ioLogs.length > 0) {
  //   const idsToUpdate = ioLogs.map(log => log.id);
  //   await db('io_log')
  //     .whereIn('id', idsToUpdate)
  //     .update({ is_send: true });
  // }
  
  // Set from UTC 8 to UTC 0
  const formattedLogs = ioLogs.map(log => ({
    ...log,
    timestamp: moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
    date: moment(log.timestamp).utcOffset(-1).format('DDMMYY'),
    time: moment(log.timestamp).utcOffset(-1).format('HHmmss')
  }));

  await db.destroy();

  // Ambil daftar unik IMEI yang tersedia
  const uniqueImeiList = [...new Set(formattedLogs.map(log => log.imei))];

  const lastLogsPerImei = uniqueImeiList.map(imei => {
    // Filter log berdasarkan imei
    const logsForImei = formattedLogs.filter(log => log.imei === imei);
    // Urutkan berdasarkan timestamp dan ambil data terakhir
    const lastLog = logsForImei.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)))[0];
    
    return lastLog;
  });
  
  console.log("Last Logs per IMEI:", lastLogsPerImei);

  lastLogsPerImei.forEach(log => {
    const imei = log.imei;
    const loginPacket = buildLoginPacket(imei);

    client.connect(PORT_FLEETSIGHT, HOST_FLEETSIGHT, () => {
      console.log('Connected to server');
      client.write(loginPacket);
    });

    client.on('data', (data) => {
      const response = data.toString().trim();
      console.log('Received from server: ', response);
      if (response === '#AL#1') {
        console.log('Login successful, sending SD data...');
        const date = log.date;
        const time = log.time;
        const speed = log.speed;
        const course = 'NA';
        const alt = log.altitude;
        const sats = 'NA';
        const nmeaLatitude = convertToNMEA(log.latitude, true);
        const nmeaLongitude = convertToNMEA(log.longitude, false);
        
        const sdPacket = buildSDPacket(date, time, nmeaLatitude.coordinate, nmeaLatitude.direction, nmeaLongitude.coordinate, nmeaLongitude.direction, speed, course, alt, sats);
        console.log("SD Packet:", sdPacket);
        
        // Kirim paket SD ke server
        client.write(sdPacket);
      // Error Login
      } else if(response === '#AL#0') {
        console.log('Connection rejected.');
        client.end();
      // Error Login
      } else if(response === '#AL#01'){
        console.log('Password verification error.');
        client.end();
      // Error Login
      } else if(response === '#AL#10'){
        console.log('Checksum verification error.');
        client.end();
      // Error send SD Packet 
      } else if(response === '#ASD#-1'){
        console.log('Incorrect packet structure.');
        client.end();
      // Error send SD Packet
      } else if(response === '#ASD#0'){
        console.log('Incorrect time.');
        client.end();
      // Success send SD Packet
      } else if(response === '#ASD#1') {
        console.log('Data SD Packet sent.');
        client.end();
      // Error send SD Packet
      } else if(response === '#ASD#10') {
        console.log('Error receiving coordinates.');
        client.end();
      // Error send SD Packet
      } else if(response === '#ASD#11') {
        console.log('Error receiving speed, course, or altitude.');
        client.end();
      // Error send SD Packet
      } else if(response === '#ASD#12') {
        console.log('Error receiving the number of satellites.');
        client.end();
      // Error send SD Packet
      } else if(response === '#ASD#13') {
        console.log('Checksum verification error');
        client.end();
      } else {
        console.error('Something wrong :', response);
        client.end();
      }
    });

    client.on('close', () => {
      console.log('Connection closed');
    });

    client.on('error', (err) => {
      console.error('Error occurred:', err.message);
    });
  })

}

getData()
