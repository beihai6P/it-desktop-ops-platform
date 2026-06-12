const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(path) {
  if (path === 'mongoose') {
    return require('./utils/mockMongoose');
  }
  return originalRequire.call(this, path);
};

require('./server.js');