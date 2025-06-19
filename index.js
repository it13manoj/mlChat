const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const db = require('./DB/db')
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// Active socket map
const activeSockets = {};

// Register or Login
app.post('/api/login', (req, res) => {
  const { username, email, contact } = req.body;
  db.get(`SELECT * FROM users WHERE contact = ?`, [contact], (err, user) => {
    if (user) {
      db.run(`UPDATE users SET is_active = 1 WHERE contact = ?`, [contact]);
      res.json(user);
    } else {
      db.run(`INSERT INTO users (username, contact,email, is_active) VALUES (?,?,? , 1)`, [username,contact,email], function () {
        res.json({ id: this.lastID, username });
      });
    }
  });
});

// Get active users
app.get('/api/active-users/:id', (req, res) => {
  db.all(`SELECT username,contact,email FROM users WHERE is_active = 1 and id != ${req.params.id}`, (err, users) => {
    res.json(users);
  });
});

app.post('/api/delete', (req, res) => {
  db.all(`DELETE  FROM users WHERE is_active = 1`, (err, users) => {
    res.json(users);
  });
});

// Logout
app.post('/api/logout', (req, res) => {
  const { contact } = req.body;
  db.run(`UPDATE users SET is_active = 0 WHERE contact = ?`, [contact], () => {
    res.json({ message: 'User logged out' });
  });
});




// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

 socket.on('userConnected', (username) => {
    activeSockets[username] = socket.id;

    // Optionally broadcast updated user list
    io.emit('activeUsers', Object.keys(activeSockets));
  });


  socket.on('sendMessage', ({ from, to, text }) => {
  const toSocketId = activeSockets[to];
  console.log(`Sending message from ${from} to ${to} (socket: ${toSocketId})`);

  if (toSocketId) {
    io.to(toSocketId).emit('receiveMessage', { text, sender: from });
  } else {
    console.log(`User ${to} not connected`);
  }
});

  socket.on('disconnect', () => {
     const user = Object.keys(activeSockets).find(
      key => activeSockets[key] === socket.id
    );
    if (user) {
      delete activeSockets[user];
      io.emit('activeUsers', Object.keys(activeSockets));
    }
    if (user) {
      db.run(`UPDATE users SET is_active = 0 WHERE contact = ?`, [user]);
      delete activeSockets[user];
      console.log(`${user} disconnected`);
    }
  });
});

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
