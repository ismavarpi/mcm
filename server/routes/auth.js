const express = require('express');
const ldap = require('ldapjs');
const router = express.Router();

function ldapAuthenticate(username, password) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({ url: process.env.LDAP_URL });
    const bindDN = process.env.LDAP_BIND_DN;
    const bindPassword = process.env.LDAP_BIND_PASSWORD;
    client.bind(bindDN, bindPassword, err => {
      if (err) {
        client.unbind();
        return reject(err);
      }
      const base = process.env.LDAP_BASE_DN;
      const opts = { filter: `(uid=${username})`, scope: 'sub' };
      client.search(base, opts, (err2, res) => {
        if (err2) {
          client.unbind();
          return reject(err2);
        }
        let userDN;
        res.on('searchEntry', entry => {
          userDN = entry.object.dn;
        });
        res.on('error', err3 => {
          client.unbind();
          reject(err3);
        });
        res.on('end', () => {
          if (!userDN) {
            client.unbind();
            return reject(new Error('User not found'));
          }
          client.bind(userDN, password, err4 => {
            client.unbind();
            if (err4) return reject(err4);
            resolve({ username });
          });
        });
      });
    });
  });
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!process.env.USE_AUTH || process.env.USE_AUTH === 'false') {
    req.session.user = { username };
    return res.json({ username });
  }
  try {
    const user = await ldapAuthenticate(username, password);
    req.session.user = user;
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({});
  });
});

router.get('/status', (req, res) => {
  if (req.session.user) res.json({ user: req.session.user });
  else res.json({ user: null });
});

module.exports = router;
