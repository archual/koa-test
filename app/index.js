const serverClose = require('./utilities/processEvents');
const express = require('express'); 
// const Koa = require('koa');
const test = 1;
const MongoClient = require('mongodb').MongoClient;

const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_HOSTNAME, MONGO_PORT, MONGO_DATABASE_NAME } = process.env;

// Connection URL for mongo.
const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}`;
console.log(url);

// Create a new MongoClient
const client = new MongoClient(url);

let db;
// Use connect method to connect to the Server
setTimeout(() => {
  client.connect(function(err) {
    if (err) {
      return console.error(err);
    }
    console.log('Connected successfully to database');
    db = client.db(MONGO_DATABASE_NAME);
  });
}, 2000);

// Api
const app = express();

app.get('/', function(req, res) {
  res.send('Hello Docker World\n');
});

app.get('/health', function(req, res) {
  // do app logic here to determine if app is truly healthy
  // you should return 200 if healthy, and anything else will fail
  // if you want, you should be able to restrict this to localhost (include ipv4 and ipv6)
  res.send('I am happy and healthy\n');
});

app.get('/documents', function(req, res, next) {
  // might have not been connected just yet
  if (db) {
    db.collection('documents').find({}).toArray(function(err, docs) {
      if (err) {
        console.error(err);
        next(new Error('Error while talking to database'));
      } else {
        res.json(docs);
      }
    });
  } else {
    next(new Error('Waiting for connection to database'));
  }
});

const PORT = process.env.PORT || 8080;
var server = app.listen(PORT, function() {
  console.log(`Webserver is ready and listening on port ${PORT}`);
});

serverClose(server);

module.exports = app;
