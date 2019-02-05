function serverClose(server) {
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
}

module.exports = serverClose;