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
      high_score INTEGER,
      timestamp INTEGER
    );
  `);
});

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
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send('New user: ' + req.query.username + ' created successfuly');
  };

  prepare();

});

server.get('/login', function(req, res){
  var prepare = function(){
    if(req.query.username === undefined){
      req.query.username = '';
    }
    loginUser();
  }

  var loginNewUser = function(){
    database.run(`
      INSERT INTO users(username, password)
        VALUES(:username, :password);`
    ,{ ':username': req.query.username,
        ':password': req.query.password
      }, function(err){
        if(err !== null){
          loginError(err);
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

  var loginSuccess = function(){
    //TODO: add a redirect to the game page
    res.status(200);
    res.set({
      'Content-Type': 'text/plain'
    });
    res.send('New user: ' + req.query.username + ' created successfuly');
  };

  prepare();

});


server.listen(process.env.PORT || 8080);
