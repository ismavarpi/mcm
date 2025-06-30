const path = require('path');
const dotenv = require('dotenv');
// Load variables for local development. In Docker, the environment is provided
// via the `env_file` option in docker-compose.yml.
dotenv.config({ path: path.join(__dirname, '.env') });
console.log('Environment DB_USER:', process.env.DB_USER);
const { app, db } = require('./app');

db.initDatabase()
  .then(() => {
    app.listen(3001, () => console.log('Server running on port 3001'));
  })
  .catch(err => {
    console.error('Unable to start server:', err);
    process.exit(1);
  });
