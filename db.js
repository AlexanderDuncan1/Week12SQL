const mysql = require('mysql2/promise');

let connection;

async function initializeConnection() {
  connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'week12challenge'
  });

  return connection;
}

module.exports = {
  query: async (queryString, values) => {
    if (!connection) {
      await initializeConnection();
    }
    return connection.query(queryString, values);
  }
};
