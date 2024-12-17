const net = require('net');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { db } = require('./config/db');

const HOST_FLEETSIGHT = process.env.HOST_FLEETSIGHT;
const PORT_FLEETSIGHT = process.env.PORT_FLEETSIGHT;


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

function logSDPacket(vehicle_name, imei, packet) {
  const logFolder = path.join(__dirname, 'logs');
  const logFileName = `${moment().format('YYYY-MM-DD')}.log`;
  const logFilePath = path.join(logFolder, logFileName);

  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }

  const logEntry = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] [${vehicle_name}] [${imei}] ${packet}\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Error writing log file:', err);
    } else {
      console.log('SD Packet logged successfully.');
    }
  });
}

async function getData(){
  const now = moment().utcOffset(8)
  const thirtySecondsAgo = now.subtract(30, 'seconds').format('YYYY-MM-DD HH:mm:ss');
  
  try {
    const ioLogs = await db('io_log')
      .select(
        'id',
        'vehicle_name',
        'imei',
        'longitude',
        'latitude',
        'altitude',
        'speed',
        'angle',
        'satellites',
        'timestamp'
      )
      .where('is_send', false)
      .andWhere('timestamp', '>=', thirtySecondsAgo)
      .orderBy('id', 'DESC');
    
    // Update ioLog to send is true
    if (ioLogs.length > 0) {
      const idsToUpdate = ioLogs.map(log => log.id);
      await db('io_log')
        .whereIn('id', idsToUpdate)
        .update({ is_send: true });
    }
    
    // Set from UTC 8 to UTC 0
    const formattedLogs = ioLogs.map(log => ({
      ...log,
      timestamp: moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
      date: moment(log.timestamp).utcOffset(-1).format('DDMMYY'),
      time: moment(log.timestamp).utcOffset(-1).format('HHmmss')
    }));
  
    // Ambil daftar unik IMEI yang tersedia
    const uniqueImeiList = [...new Set(formattedLogs.map(log => log.imei))];
  
    const lastLogsPerImei = uniqueImeiList.map(imei => {
      const logsForImei = formattedLogs.filter(log => log.imei === imei);
      const lastLog = logsForImei.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)))[0];
      return lastLog;
    });
    
    lastLogsPerImei.forEach(log => {
      const client = new net.Socket();
      const imei = log.imei;
      const vehicle_name = log.vehicle_name;
      const loginPacket = buildLoginPacket(imei);
      let sdPacket
  
      client.connect(PORT_FLEETSIGHT, HOST_FLEETSIGHT, () => {
        console.log('Connected to server');
        client.write(loginPacket);
      });
      
      client.on('data', (data) => {
        const response = data.toString().trim();
        if (response === '#AL#1') {
          console.log('Login successful, sending SD data..: ', vehicle_name);
          const date = log.date;
          const time = log.time;
          const speed = log.speed;
          const course = log.angle;
          const alt = log.altitude;
          const sats = log.satellites;
          const nmeaLatitude = convertToNMEA(log.latitude, true);
          const nmeaLongitude = convertToNMEA(log.longitude, false);
          
          sdPacket = buildSDPacket(date, time, nmeaLatitude.coordinate, nmeaLatitude.direction, nmeaLongitude.coordinate, nmeaLongitude.direction, speed, course, alt, sats);
          console.log("SD Packet:", sdPacket);
          
          // Kirim paket SD ke server
          client.write(sdPacket);
          
        // Error Login
        } else if(response === '#AL#0') {
          console.log('Connection rejected : ', vehicle_name);
          client.end();
        // Error Login
        } else if(response === '#AL#01'){
          console.log('Password verification error: ', vehicle_name);
          client.end();
        // Error Login
        } else if(response === '#AL#10'){
          console.log('Checksum verification error: ', vehicle_name);
          client.end();
        // Error send SD Packet 
        } else if(response === '#ASD#-1'){
          console.log('Incorrect packet structure: ', vehicle_name);
          client.end();
        // Error send SD Packet
        } else if(response === '#ASD#0'){
          console.log('Incorrect time: ', vehicle_name);
          client.end();
        // Success send SD Packet
        } else if(response === '#ASD#1') {
          console.log('Data SD Packet sent: ', vehicle_name);
          // Log SD Packet ke file
          logSDPacket(vehicle_name, imei, sdPacket);
          client.end();
        // Error send SD Packet
        } else if(response === '#ASD#10') {
          console.log('Error receiving coordinates: ', vehicle_name);
          client.end();
        // Error send SD Packet
        } else if(response === '#ASD#11') {
          console.log('Error receiving speed, course, or altitude: ', vehicle_name);
          client.end();
        // Error send SD Packet
        } else if(response === '#ASD#12') {
          console.log('Error receiving the number of satellites: ', vehicle_name);
          client.end();
        // Error send SD Packet
        } else if(response === '#ASD#13') {
          console.log('Checksum verification error: ', vehicle_name);
          client.end();
        } else {
          console.error('Something wrong: ', response);
          client.end();
        }
      });
  
      client.on('close', () => {
        console.log('Connection closed: ', vehicle_name);
      });
  
      client.on('error', (err) => {
        console.error(`Error occurred ${vehicle_name}:`, err.message);
      });
    })
  } catch (error) {
    console.error('Error during getData execution:', error.message);
    await db.destroy();
  }
}

setInterval(() => {
  console.log('Executing at ', moment().format('YYYY-MM-DD HH:mm:ss'))
  getData();
}, 15000)   // 15s
