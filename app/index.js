// simple node web server that displays hello world
// optimized for Docker image

const express = require('express');
// this example uses express web framework so we know what longer build times
// do and how Dockerfile layer ordering matters. If you mess up Dockerfile ordering
// you'll see long build times on every code change + build. If done correctly,
// code changes should be only a few seconds to build locally due to build cache.

const morgan = require('morgan');
// morgan provides easy logging for express, and by default it logs to stdout
// which is a best practice in Docker. Friends don't let friends code their apps to
// do app logging to files in containers.

const MongoClient = require('mongodb').MongoClient;
// this example includes a connection to MongoDB

const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_HOSTNAME, MONGO_PORT, MONGO_DATABASE_NAME } = process.env;

// Connection URL
const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}`;

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

app.use(morgan('common'));

app.get('/', function(req, res) {
  res.send('Hello Docker World\n');
});

app.get('/healthz', function(req, res) {
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


// quit on ctrl-c when running docker in terminal
process.on('SIGINT', function onSigint() {
  console.info('Got SIGINT (aka ctrl-c in docker). Graceful shutdown ', new Date().toISOString());
  shutdown();
});

// quit properly on docker stop
process.on('SIGTERM', function onSigterm() {
  console.info('Got SIGTERM (docker container stop). Graceful shutdown ', new Date().toISOString());
  shutdown();
});

let sockets = {},
  nextSocketId = 0;
server.on('connection', function(socket) {
  const socketId = nextSocketId++;
  sockets[socketId] = socket;

  socket.once('close', function() {
    delete sockets[socketId];
  });
});

// shut down server
function shutdown() {
  waitForSocketsToClose(10);

  server.close(function onServerClosed(err) {
    if (err) {
      console.error(err);
      process.exitCode = 1;
    }
    process.exit();
  });
}

function waitForSocketsToClose(counter) {
  if (counter > 0) {
    console.log(`Waiting ${counter} more ${counter === 1 ? 'seconds' : 'second'} for all connections to close...`);
    return setTimeout(waitForSocketsToClose, 1000, counter - 1);
  }

  console.log('Forcing all connections to close now');
  for (var socketId in sockets) {
    sockets[socketId].destroy();
  }
}

module.exports = app;
