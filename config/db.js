require('dotenv').config();
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
});

const dbprimary = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST_PRIMARY,
    port: process.env.DB_PORT_PRIMARY || 5432,
    database: process.env.DB_NAME_PRIMARY,
    user: process.env.DB_USER_PRIMARY,
    password: process.env.DB_PASSWORD_PRIMARY
  },
});

const dbsecondary = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST_SECONDARY,
    port: process.env.DB_PORT_SECONDARY || 5432,
    database: process.env.DB_NAME_SECONDARY,
    user: process.env.DB_USER_SECONDARY,
    password: process.env.DB_PASSWORD_SECONDARY
  },
});

const dbconn = (database) => {
  if (!database) {
    throw new Error('Database name is required');
  }

  return knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
  });
};


module.exports = {
  db,
  dbprimary,
  dbsecondary,
  dbconn
}