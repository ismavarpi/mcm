const path = require('path');
const dotenv = require('dotenv');
// Load environment variables from the root .env file. Docker Compose also uses
// this file via the `env_file` option so all values are defined only once.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
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
