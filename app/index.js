const serverClose = require('./utilities/processEvents');
// const express = require('express'); 
const Koa = require('koa');
const KoaRouter = require('koa-router');
const json = require('koa-json');
const path = require('path');
const render = require('koa-ejs');

// Api
const app = new Koa();
const router = new KoaRouter();

// Middleware.
app.use(json());
render(app, {
  root: path.join(__dirname, 'views'),
  layout: 'layout',
  viewExt: 'html',
  cache: false,
  debug: false
});


router.get('/', async ctx => {
  await ctx.render('index');// = 'Hello Docker World'
});

router.get('/health', ctx => {
  // do app logic here to determine if app is truly healthy
  // you should return 200 if healthy, and anything else will fail
  // if you want, you should be able to restrict this to localhost (include ipv4 and ipv6)
  ctx.body = 'I am happy and healthy';
});
router.get('/documents', async (ctx, next) => {
  if (db) {
    ctx.body = await getDocumentsPromise('documents');
    // Insert new doc.
    // db.collection('documents').insertOne({
    //   name: 'test'
    // });
  }
  else {
    ctx.response.status = 500;
    ctx.response.body = { message: 'Waiting for connection to database' };
  }
});

async function getDocumentsPromise(collection) {
  return new Promise((resolve, reject) => {
    db.collection(collection).find({}).toArray(function(err, result) {
      if (err) {
        reject(new Error(err));
      }
      else {
        resolve(result);
      }
    });
  });
}

app.use(router.routes()).use(router.allowedMethods());

const MongoClient = require('mongodb').MongoClient;

const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_HOSTNAME, MONGO_PORT, MONGO_DATABASE_NAME } = process.env;

// Connection URL for mongo.
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

const PORT = process.env.PORT || 8080;
var server = app.listen(PORT, () => {
  console.log(`Webserver is ready and listening on port ${PORT}`);
});

serverClose(server);