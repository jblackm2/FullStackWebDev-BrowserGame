'use strict';

var express = require('express');
var sqlite = require('sqlite3');
var passport = require('passport');
var strategy = require('passport-http');

var server = express();
var database = new sqlite.Database('database.sqlite');

/*
server.use(passport.initialize());

passport.use(new strategy.BasicStrategy(
  function(user, pass, done) {
    console.log(user + pass);
    if (user.valueOf() === 'test' &&
      pass.valueOf() === 'logmein')
      return done(null, true);
    else
      return done(null, false);
  }
));*/

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
        ':password': req.query.password
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
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send(err);
  };

  var newUserSuccess = function(){
    res.status(302);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.redirect('/gameStart');
    //res.send('New user: ' + req.query.username + ' created successfuly');
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
        ':password': req.query.password
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
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send(err);
  };

  var loginSuccess = function(rows){

    res.status(302);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.redirect('/gameStart');
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
      SELECT MAX(score) FROM game_stats
        JOIN users ON(game_stats.user_id = users.id)
        WHERE username = :username
        ;`
    ,{ ':username': req.query.username
      }, function(err, rows){
        if(err !== null){
          scoreError(err);
          return;
        }
        /*if (rows.length === 0){
          scoreError('No max score available.');
          return;
        }*/
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
        /*if (rows.length === 0){
          scoreError('No max score available.');
          return;
        }*/
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
