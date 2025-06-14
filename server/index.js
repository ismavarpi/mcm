require('dotenv').config();
const { app, db } = require('./app');

db.initDatabase()
  .then(() => {
    app.listen(3001, () => console.log('Server running on port 3001'));
  })
  .catch(err => {
    console.error('Unable to start server:', err);
    process.exit(1);
  });
