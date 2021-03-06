'use strict';

var express = require('express');
var sqlite = require('sqlite3');
var crypto = require('crypto');

var server = express();
var path = require('path');
var database = new sqlite.Database('database.sqlite');

function hashPassword(password) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

database.serialize(function(){
  database.run('PRAGMA foreign_keys = ON;');

  database.run(`
    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS game_stats(
      user_id INTEGER REFERENCES users(id) NOT NULL,
      score INTEGER DEFAULT(0),
      timestamp INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
});

server.use('/', express.static('./'));

server.get('/newUser', function(req, res){
  var prepare = function(){
    if(req.query.username === undefined){
      req.query.username = '';
    }
    createNewUser();
  }

  var createNewUser = function(){
    database.run(`
      INSERT INTO users(username, password)
        VALUES(:username, :password);`
    ,{ ':username': req.query.username,
        ':password': hashPassword(req.query.password)
      }, function(err){
        if(err !== null){
          newUserError(err);
          return;
        }
        createNewUser2();
      });
  };
  var createNewUser2 = function(){
    database.run(`
      INSERT INTO game_stats(user_id)
        VALUES(( SELECT id FROM users WHERE username = :username ));`
        ,{ ':username': req.query.username
          }
    , function(err){
        if(err !== null){
          newUserError(err);
          return;
        }
        newUserSuccess();
      });
  };

  var newUserError = function(err){
    res.status(404);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send(err);
  };

  var newUserSuccess = function(){
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    //Could not get the redirect working correctly
    //res.redirect('/gameStart');
    res.send('New user: ' + req.query.username + ' created successfuly');
  };

  prepare();

});

server.get('/login', function(req, res){
  var prepare = function(){
    if(req.query.username === undefined){
      req.query.username = '';
    }
    if(req.query.password === undefined){
      req.query.password = '';
    }
    loginUser();
  }

  var loginUser = function(){
    database.all(`
      SELECT * FROM users
        WHERE username = :username AND password = :password
        ;`
    ,{ ':username': req.query.username,
        ':password': hashPassword(req.query.password)
      }, function(err, rows){
        if(err !== null){
          loginError(err);
          return;
        }
        if (rows.length === 0){
          loginError('Not a valid login');
          return;
        }
        loginSuccess();
      });
  };

  var loginError = function(err){
    res.status(404);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send(err);
  };

  var loginSuccess = function(rows){
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    //Could not get the rediret working correctly
    //res.redirect('/gameStart');
    res.send('User: ' + req.query.username + ' logged in');
  };

  prepare();

});

//Tried using this method as well
server.get('/goToGame', function(req, res){
  var prepare = function(){
    if(req.query.username === undefined){
      req.query.username = '';
    }
    goToGame();
  }

  var goToGame = function(){
    res.status(200);
    res.set({
      'Content-Type': 'text/html'
    });
    res.sendFile(path.join(__dirname +'/game.html'));
    //res.send('User: ' + req.query.username + ' logged in');
  };
  prepare();

});

server.get('/getMaxScore', function(req, res){
  var prepare = function(){
    if(req.query.username === undefined){
      req.query.username = '';
    }
    getMaxScore();
  }

  var getMaxScore = function(){
    database.all(`
      SELECT MAX(score) AS score FROM game_stats
        JOIN users ON(game_stats.user_id = users.id)
        WHERE username = :username
        ;`
    ,{ ':username': req.query.username
      }, function(err, rows){
        if(err !== null){
          scoreError(err);
          return;
        }
        scoreSuccess(rows);
      });
  };

  var scoreError = function(err){
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send(err);
  };

  var scoreSuccess = function(rows){
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send(rows);
  };

  prepare();

});

server.get('/addScore', function(req, res){
  var prepare = function(){
    if(req.query.username === undefined){
      req.query.username = '';
    }
    if(req.query.score === undefined){
      req.query.score = '';
    }
    addScore();
  }

  var addScore = function(){
    database.run(`
      INSERT INTO game_stats(user_id, score)
        VALUES(( SELECT id FROM users WHERE username = :username ), :score);`
        ,{ ':username': req.query.username,
            ':score': req.query.score
          }, function(err, rows){
        if(err !== null){
          scoreError(err);
          return;
        }
        scoreSuccess(rows);
      });
  };

  var scoreError = function(err){
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send(err);
  };

  var scoreSuccess = function(rows){
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send(JSON.stringify(rows));
  };

  prepare();

});

server.listen(process.env.PORT || 8080);
