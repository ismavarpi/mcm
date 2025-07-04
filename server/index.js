const path = require('path');
const dotenv = require('dotenv');
// Load variables for local development. Docker inyectará las variables de
// entorno directamente, por lo que el archivo puede no existir.
dotenv.config({ path: path.join(__dirname, '..', '.env') });
console.log('Starting server with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
});
const { app, db } = require('./app');

console.log('Initializing database...');

db.initDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    const port = parseInt(process.env.FRONT_PORT || process.env.PORT || '3001', 10);
    const server = app.listen(port, () => console.log(`Server running on port ${port}`));
    server.on('error', err => console.error('Server error:', err));
  })
  .catch(err => {
    console.error('Unable to start server:', err);
    process.exit(1);
  });
