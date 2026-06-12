const memoryStore = require('./memoryStore');

let useMemory = false;

const setUseMemory = (value) => {
  useMemory = value;
};

const getDataAdapter = (model) => {
  if (useMemory) {
    const collectionName = model.collection?.name || model.modelName?.toLowerCase() + 's';
    
    return {
      create: async (data) => {
        return memoryStore.insertOne(collectionName, data);
      },
      find: async (query = {}, options = {}) => {
        let results = memoryStore.find(collectionName, query);
        if (options.sort) {
          const sortKey = Object.keys(options.sort)[0];
          const sortOrder = options.sort[sortKey];
          results.sort((a, b) => {
            if (a[sortKey] < b[sortKey]) return sortOrder === -1 ? 1 : -1;
            if (a[sortKey] > b[sortKey]) return sortOrder === -1 ? -1 : 1;
            return 0;
          });
        }
        if (options.limit) {
          results = results.slice(0, options.limit);
        }
        return results;
      },
      findOne: async (query = {}) => {
        return memoryStore.findOne(collectionName, query);
      },
      findById: async (id) => {
        return memoryStore.findById(collectionName, id);
      },
      findByIdAndUpdate: async (id, update, options = {}) => {
        const result = memoryStore.updateById(collectionName, id, update);
        if (options.new && result) {
          return result;
        }
        return result;
      },
      findByIdAndDelete: async (id) => {
        return memoryStore.deleteById(collectionName, id);
      },
      updateOne: async (query, update) => {
        const result = memoryStore.updateOne(collectionName, query, update);
        return { matchedCount: result ? 1 : 0, modifiedCount: result ? 1 : 0 };
      },
      deleteOne: async (query) => {
        const result = memoryStore.deleteOne(collectionName, query);
        return { deletedCount: result ? 1 : 0 };
      },
      countDocuments: async (query = {}) => {
        return memoryStore.countDocuments(collectionName, query);
      }
    };
  } else {
    return {
      create: (data) => model.create(data),
      find: (query, options) => model.find(query, null, options),
      findOne: (query) => model.findOne(query),
      findById: (id) => model.findById(id),
      findByIdAndUpdate: (id, update, options) => model.findByIdAndUpdate(id, update, options),
      findByIdAndDelete: (id) => model.findByIdAndDelete(id),
      updateOne: (query, update) => model.updateOne(query, update),
      deleteOne: (query) => model.deleteOne(query),
      countDocuments: (query) => model.countDocuments(query)
    };
  }
};

module.exports = {
  setUseMemory,
  getDataAdapter
};