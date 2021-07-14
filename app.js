'use strict';

const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');

require('dotenv').config({path: __dirname + '/.env'});

const port = process.env.PORT;

app.use(cors());
app.use(express.json());

const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DB,
  insecureAuth: 'true',
  connectTimeout: 30000,
  acquireTimeout: 30000
})

conn.connect((err) => {
  if (err) {
    console.log('Cannot connect to the database', err);
    return;
  }
  console.log('Connection established');
})

app.get('/', (req, res) => {
  res.send('hi');
})

app.get('/posts', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      conn.query('SELECT * FROM posts;', (err, rows) => {
        if (err) return reject(err);
        res.json({ posts: rows });
      })
    })
  }
  catch(error) {
    console.log(error);
    res.sendStatus(500);
    return null;
  }
})

app.post('/posts', async (req, res) => {
  try {
    const newPostDate = new Date().getTime();
    await new Promise((resolve, reject) => {
      conn.query(`INSERT INTO posts (title, url, timestamp, creator_id) VALUES (?, ?, ?, ?);`, [req.body.title, req.body.url, newPostDate, req.headers.id], (err, rows) => {
        if (err) return reject(err);
        conn.query(`SELECT * FROM posts ORDER BY id DESC LIMIT 1;`, (err, rows) => {
          if (err) return reject(err);
          res.json(rows[0]);
        })
      });
    })
  }
  catch(error) {
    console.log(error);
    res.sendStatus(500)
const port = process.env.PORT;;
    return null;
  }
})

const scoreUp = (id) => {
  conn.query(`UPDATE posts SET score=score+1 WHERE id = ?;`,[id], (err, rows) => {
    if (err) {
      console.log(`Cannot retrieve data: ${err.toString()}`);
      return null;
    }
  });
}

const scoreDown = (id) => {
  conn.query(`UPDATE posts SET score=score-1 WHERE id = ?;`,[id], (err, rows) => {
    if (err) {
      console.log(`Cannot retrieve data: ${err.toString()}`);
      return null;
    }
  });
}

const getVoted = (user_id, post_id) => {
  try {
    return new Promise(resolve => {
      conn.query(`SELECT vote FROM votes WHERE user_id = ? AND post_id = ?`, [user_id, post_id], (err, rows) => {
        if (err) return err;
        resolve(rows);
      })
    })
  }
  catch (error) {
    console.log(error);
    return null;
  }
}

app.put('/posts/:id/upvote', async (req, res) => {
  getVoted(req.headers.id, req.params.id)
  .then((data) => {
    try {
      if (data[0] === undefined) {
        conn.query(`INSERT INTO votes (post_id, user_id, vote) VALUES (?, ?, ?);`,[req.params.id, req.headers.id, 1], (err, rows) => {
          if (err) return err;
        });
        scoreUp(req.params.id);
      } else {
        const row = data[0];
        if (row.vote === 1) {
          conn.query(`UPDATE votes SET vote=0 WHERE post_id = ? AND user_id = ?;`,[req.params.id, req.headers.id], (err, rows) => {
            if (err) return err;
          });
          scoreDown(req.params.id);
        } else if (row.vote === -1) {
          conn.query(`UPDATE votes SET vote=1 WHERE post_id = ? AND user_id = ?;`,[req.params.id, req.headers.id], (err, rows) => {
            if (err) return err;
          });
          for (let i = 0; i < 2; i++) {
            scoreUp(req.params.id);
          }
        } else if (row.vote === 0) {
          conn.query(`UPDATE votes SET vote=1 WHERE post_id = ? AND user_id = ?;`,[req.params.id, req.headers.id], (err, rows) => {
            if (err) return err;
          });
          scoreUp(req.params.id);
        }
      }
    }
    catch (error) {
      console.log(error);
      return null;
    }
  })
  .then(() => {
    conn.query(`SELECT * FROM posts WHERE id = ?;`,[req.params.id] , (err, rows) => {
      if (err) return err;
      res.json(rows[0]);
    });
  })
})

app.put('/posts/:id/downvote', async (req, res) => {
  getVoted(req.headers.id, req.params.id)
  .then((data) => {
    try {
      if (data[0] === undefined) {
        conn.query(`INSERT INTO votes (post_id, user_id, vote) VALUES (?, ?, ?);`,[req.params.id, req.headers.id, 1], (err, rows) => {
          if (err) return err;
        });
        scoreDown(req.params.id);
      } else {
        const row = data[0];
        if (row.vote === 0) {
          conn.query(`UPDATE votes SET vote=-1 WHERE post_id = ? AND user_id = ?;`,[req.params.id, req.headers.id], (err, rows) => {
            if (err) return err;
          });
          scoreDown(req.params.id);
        } else if (row.vote === 1) {
          conn.query(`UPDATE votes SET vote=-1 WHERE post_id = ? AND user_id = ?;`,[req.params.id, req.headers.id], (err, rows) => {
            if (err) return err;
          });
          for (let i = 0; i < 2; i++) {
            scoreDown(req.params.id);
          }
        } else if (row.vote === -1) {
          conn.query(`UPDATE votes SET vote=0 WHERE post_id = ? AND user_id = ?;`,[req.params.id, req.headers.id], (err, rows) => {
            if (err) return err;
          });
          scoreUp(req.params.id);
        }
      }
    }
    catch (error) {
      console.log(error);
      return null;
    }
  })
  .then(() => {
    conn.query(`SELECT * FROM posts WHERE id = ?;`,[req.params.id] , (err, rows) => {
      if (err) return err;
      res.json(rows[0]);
    });
  })
})

app.delete('/posts/:id', (req, res) => {
  const id = req.headers.id;
  conn.query(`SELECT * FROM posts WHERE id = ?;`,[req.params.id] , (err, rows) => {
    if (err) {
      console.log(`Cannot retrieve data: ${err.toString()}`);
      res.sendStatus(500);
      return null;
    }
    if (rows[0].creator_id === id) {
      conn.query(`DELETE FROM posts WHERE id = ?;`, [req.params.id], (err, rows) => {
        if (err) {
          console.log(`Cannot retrieve data: ${err.toString()}`);
          res.sendStatus(500);
          return null;
        }
      })
      res.send(rows[0]);
    } else {
      res.send('Access denied!');
    }
  });
})

app.put('/posts/:id', (req, res) => {
  const id = req.headers.id;
  conn.query(`SELECT title, url, creator_id FROM posts WHERE id = ?;`, [req.params.id], (err, rows) => {
    if (err) {
      console.log(`Cannot retrieve data: ${err.toString()}`);
      res.sendStatus(500);
      return null;
    } 
    if (rows[0].creator_id === id) {
      if (req.body.title !== '' && rows[0].title && req.body.title !== rows[0].title) {
        conn.query(`UPDATE posts SET title=? WHERE id = ?;`, [req.body.title, req.params.id], (err, rows) => {
          if (err) {
            console.log(`Cannot retrieve data: ${err.toString()}`);
            res.sendStatus(500);
            return null;
          }
        })
      }
      if (req.body.url !== '' && rows[0] && req.body.url !== rows[0].url) {
        conn.query(`UPDATE posts SET url=? WHERE id = ?;`, [req.body.url, req.params.id], (err, rows) => {
          if (err) {
            console.log(`Cannot retrieve data: ${err.toString()}`);
            res.sendStatus(500);
            return null;
          }
        })
      }
      conn.query(`SELECT * FROM posts WHERE id = ?;`,[req.params.id], (err, rows) => {
        if (err) {
          console.log(`Cannot retrieve data: ${err.toString()}`);
          res.sendStatus(500);
          return null;
        }
        res.json({ "response": rows[0] });
      })
    } else {
      res.send('Access denied!');
    }
  })
})

app.post('/users', (req, res) => {
  const newUserName = req.body.username;
  const newUserPassword = req.body.password;
  conn.query(`SELECT username FROM users;`, (err, rows) => {
    if (err) {
      console.log(`Cannot retrieve data: ${err.toString()}`);
      res.sendStatus(500);
      return null;
    }
    let userExists = false;
    rows.forEach(row => {
      if (row.username === newUserName) {
        userExists = true;
      }
    })
    if (!userExists) {
      conn.query(`INSERT INTO users (username, password) VALUES (?, ?);`, [newUserName, newUserPassword], (err, rows) => {
        if (err) {
          console.log(`Cannot retrieve data: ${err.toString()}`);
          res.sendStatus(500);
          return null;
        }
      })
      conn.query(`SELECT id, username FROM users ORDER BY id DESC LIMIT 1;`, (err, rows) => {
        if (err) {
          console.log(`Cannot retrieve data: ${err.toString()}`);
          res.sendStatus(500);
          return null;
        }
        res.json({ "userdata": rows[0] });
      })
    }
    if (userExists) {
      res.send('User exists.');
    }
  })
})

app.get('/users', (req, res) => {
  const query = 'SELECT post_id, vote FROM votes WHERE user_id = ?';
  conn.query(query, [req.headers.id], (err, rows) => {
    if (err) {
      console.log(`Cannot retrieve data: ${err.toString()}`);
      res.sendStatus(500);
      return null;
    }
    res.json({ 'votes': rows })
  })
})

app.put('/users', (req, res) => {
  const loginName = req.body.username;
  const loginPassword = req.body.password;
  conn.query(`SELECT id, username, password FROM users WHERE username = ?;`, [loginName], (err, rows) => {
    if (err) {
      console.log(`Cannot retrieve data: ${err.toString()}`);
      res.sendStatus(500);
      return null;
    }
    if (rows[0].username === loginName && rows[0].password === loginPassword) {
      res.json(`{"id": ${rows[0].id}, "username": "${rows[0].username}"}`);
    } else {
      res.json({'message': 'no user found or wrong login'})
    }
  })
})

app.listen(port, () => {console.log(`PORT: ${port}`)});
