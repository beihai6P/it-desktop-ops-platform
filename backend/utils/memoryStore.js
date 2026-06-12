let store = {};
let idCounter = 1;

const generateId = () => {
  return `mem_${Date.now()}_${idCounter++}`;
};

const createCollection = (name) => {
  if (!store[name]) {
    store[name] = [];
  }
};

const insertOne = (collectionName, document) => {
  createCollection(collectionName);
  const doc = {
    ...document,
    _id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  store[collectionName].push(doc);
  return doc;
};

const find = (collectionName, query = {}) => {
  createCollection(collectionName);
  return store[collectionName].filter(doc => {
    for (const key in query) {
      if (doc[key] !== query[key]) return false;
    }
    return true;
  });
};

const findOne = (collectionName, query = {}) => {
  createCollection(collectionName);
  return store[collectionName].find(doc => {
    for (const key in query) {
      if (doc[key] !== query[key]) return false;
    }
    return true;
  });
};

const findById = (collectionName, id) => {
  createCollection(collectionName);
  return store[collectionName].find(doc => doc._id === id);
};

const updateOne = (collectionName, query, update) => {
  createCollection(collectionName);
  const index = store[collectionName].findIndex(doc => {
    for (const key in query) {
      if (doc[key] !== query[key]) return false;
    }
    return true;
  });
  if (index !== -1) {
    store[collectionName][index] = {
      ...store[collectionName][index],
      ...update,
      updatedAt: new Date()
    };
    return store[collectionName][index];
  }
  return null;
};

const updateById = (collectionName, id, update) => {
  createCollection(collectionName);
  const index = store[collectionName].findIndex(doc => doc._id === id);
  if (index !== -1) {
    store[collectionName][index] = {
      ...store[collectionName][index],
      ...update,
      updatedAt: new Date()
    };
    return store[collectionName][index];
  }
  return null;
};

const deleteOne = (collectionName, query) => {
  createCollection(collectionName);
  const index = store[collectionName].findIndex(doc => {
    for (const key in query) {
      if (doc[key] !== query[key]) return false;
    }
    return true;
  });
  if (index !== -1) {
    return store[collectionName].splice(index, 1)[0];
  }
  return null;
};

const deleteById = (collectionName, id) => {
  createCollection(collectionName);
  const index = store[collectionName].findIndex(doc => doc._id === id);
  if (index !== -1) {
    return store[collectionName].splice(index, 1)[0];
  }
  return null;
};

const countDocuments = (collectionName, query = {}) => {
  createCollection(collectionName);
  return store[collectionName].filter(doc => {
    for (const key in query) {
      if (doc[key] !== query[key]) return false;
    }
    return true;
  }).length;
};

const dropCollection = (collectionName) => {
  store[collectionName] = [];
};

const clearAll = () => {
  store = {};
};

module.exports = {
  createCollection,
  insertOne,
  find,
  findOne,
  findById,
  updateOne,
  updateById,
  deleteOne,
  deleteById,
  countDocuments,
  dropCollection,
  clearAll,
  getStore: () => store
};