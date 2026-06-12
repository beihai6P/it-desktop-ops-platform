const memoryStore = require('./memoryStore');

const models = {};

class MockSchema {
  constructor(definition, options = {}) {
    this.definition = definition || {};
    this.options = options;
    this.methods = {};
    this.virtuals = {};
    this.statics = {};
    this.hooks = { pre: {}, post: {} };
  }

  pre(hookName, handler) {
    if (!this.hooks.pre[hookName]) this.hooks.pre[hookName] = [];
    this.hooks.pre[hookName].push(handler);
    return this;
  }

  post(hookName, handler) {
    if (!this.hooks.post[hookName]) this.hooks.post[hookName] = [];
    this.hooks.post[hookName].push(handler);
    return this;
  }

  method(name, fn) { this.methods[name] = fn; return this; }
  static(name, fn) { this.statics[name] = fn; return this; }
  virtual(name, options) { this.virtuals[name] = options; return this; }
}

function createSchema(definition, options) {
  return new MockSchema(definition, options);
}

createSchema.Types = {
  ObjectId: 'ObjectId',
  String: 'String',
  Number: 'Number',
  Date: 'Date',
  Boolean: 'Boolean',
  Array: 'Array',
  Object: 'Object'
};

class QueryBuilder {
  constructor(collectionName, query = {}, projection = null, options = {}, schema = null) {
    this.collectionName = collectionName;
    this.query = query;
    this.projection = projection;
    this.options = options;
    this.populateFields = [];
    this.selectFields = null;
    this.schema = schema;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  populate(field, options = {}) {
    this.populateFields.push({ field, options });
    return this;
  }

  sort(sortOptions) {
    this.options.sort = sortOptions;
    return this;
  }

  skip(skip) {
    this.options.skip = skip;
    return this;
  }

  limit(limit) {
    this.options.limit = limit;
    return this;
  }

  async exec() {
    let results = memoryStore.find(this.collectionName, this.query);
    
    if (this.options.sort) {
      const sortKey = Object.keys(this.options.sort)[0];
      const sortOrder = this.options.sort[sortKey];
      results.sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return sortOrder === -1 ? 1 : -1;
        if (a[sortKey] > b[sortKey]) return sortOrder === -1 ? -1 : 1;
        return 0;
      });
    }
    if (this.options.skip) results = results.slice(this.options.skip);
    if (this.options.limit) results = results.slice(0, this.options.limit);
    
    if (this.schema?.methods) {
      results = results.map(doc => {
        const docWithMethods = { ...doc };
        for (const methodName in this.schema.methods) {
          docWithMethods[methodName] = this.schema.methods[methodName].bind(docWithMethods);
        }
        return docWithMethods;
      });
    }
    
    return results;
  }

  async then(resolve, reject) {
    try {
      let results = memoryStore.find(this.collectionName, this.query);
      
      if (this.options.sort) {
        const sortKey = Object.keys(this.options.sort)[0];
        const sortOrder = this.options.sort[sortKey];
        results.sort((a, b) => {
          if (a[sortKey] < b[sortKey]) return sortOrder === -1 ? 1 : -1;
          if (a[sortKey] > b[sortKey]) return sortOrder === -1 ? -1 : 1;
          return 0;
        });
      }
      if (this.options.skip) results = results.slice(this.options.skip);
      if (this.options.limit) results = results.slice(0, this.options.limit);
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  }
}

class SingleQueryBuilder {
  constructor(collectionName, query = {}, schema = null) {
    this.collectionName = collectionName;
    this.query = query;
    this.selectFields = null;
    this.populateFields = [];
    this.schema = schema;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  populate(field, options = {}) {
    this.populateFields.push({ field, options });
    return this;
  }

  async exec() {
    let result = memoryStore.findOne(this.collectionName, this.query);
    
    if (!result) return null;
    
    const collectionName = this.collectionName;
    
    if (result && this.selectFields) {
      const includeFields = this.selectFields.split(' ');
      const newResult = { _id: result._id };
      for (const field of includeFields) {
        if (field.startsWith('-')) {
          delete newResult[field.slice(1)];
        } else if (field.startsWith('+')) {
          newResult[field.slice(1)] = result[field.slice(1)];
        } else {
          newResult[field] = result[field];
        }
      }
      
      const originalMethods = {};
      for (const key in result) {
        if (typeof result[key] === 'function') {
          originalMethods[key] = result[key];
        }
      }
      
      for (const methodName in originalMethods) {
        newResult[methodName] = originalMethods[methodName].bind(newResult);
      }
      
      newResult.save = async function() {
        const updated = memoryStore.updateById(collectionName, this._id, this);
        Object.assign(this, updated);
        return this;
      };
      
      result = newResult;
    } else if (result && this.schema?.methods) {
      for (const methodName in this.schema.methods) {
        result[methodName] = this.schema.methods[methodName].bind(result);
      }
    }
    
    if (!result.save) {
      result.save = async function() {
        const updated = memoryStore.updateById(collectionName, this._id, this);
        Object.assign(this, updated);
        return this;
      };
    }
    
    return result;
  }

  async then(resolve, reject) {
    try {
      let result = memoryStore.findOne(this.collectionName, this.query);
      
      if (!result) {
        resolve(null);
        return;
      }
      
      const collectionName = this.collectionName;
      
      if (result && this.selectFields) {
        const includeFields = this.selectFields.split(' ');
        const newResult = { _id: result._id };
        for (const field of includeFields) {
          if (field.startsWith('-')) {
            delete newResult[field.slice(1)];
          } else if (field.startsWith('+')) {
            newResult[field.slice(1)] = result[field.slice(1)];
          } else {
            newResult[field] = result[field];
          }
        }
        
        const originalMethods = {};
        for (const key in result) {
          if (typeof result[key] === 'function') {
            originalMethods[key] = result[key];
          }
        }
        
        for (const methodName in originalMethods) {
          newResult[methodName] = originalMethods[methodName].bind(newResult);
        }
        
        newResult.save = async function() {
          const updated = memoryStore.updateById(collectionName, this._id, this);
          Object.assign(this, updated);
          return this;
        };
        
        result = newResult;
      } else if (result && this.schema?.methods) {
        for (const methodName in this.schema.methods) {
          result[methodName] = this.schema.methods[methodName].bind(result);
        }
      }
      
      if (!result.save) {
        result.save = async function() {
          const updated = memoryStore.updateById(collectionName, this._id, this);
          Object.assign(this, updated);
          return this;
        };
      }
      
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
}

const mongoose = {
  Schema: createSchema,
  
  model: function(name, schema) {
    if (!models[name]) {
      const collectionName = name.toLowerCase() + 's';
      
      const modelClass = {
        collectionName,
        schema,
        
        async create(data) {
          let doc = {
            ...data,
            _id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            isModified: function(field) {
              return true;
            }
          };
          
          for (const methodName in schema.methods) {
            doc[methodName] = schema.methods[methodName].bind(doc);
          }
          
          if (schema.hooks?.pre?.save) {
            for (const hook of schema.hooks.pre.save) {
              await hook.call(doc, () => {});
            }
          }
          
          memoryStore.insertOne(collectionName, doc);
          
          if (schema.hooks?.post?.save) {
            for (const hook of schema.hooks.post.save) {
              await hook.call(doc);
            }
          }
          
          return doc;
        },
        
        find(query = {}, projection = null, options = {}) {
          return new QueryBuilder(collectionName, query, projection, options, schema);
        },
        
        findOne(query = {}) {
          return new SingleQueryBuilder(collectionName, query, schema);
        },
        
        findById(id) {
          return new SingleQueryBuilder(collectionName, { _id: id }, schema);
        },
        
        async findByIdAndUpdate(id, update, options = {}) {
          const result = memoryStore.updateById(collectionName, id, update);
          if (options.new && result) {
            return result;
          }
          return result;
        },
        
        async findByIdAndDelete(id) {
          return memoryStore.deleteById(collectionName, id);
        },
        
        async updateOne(query, update) {
          const result = memoryStore.updateOne(collectionName, query, update);
          return { matchedCount: result ? 1 : 0, modifiedCount: result ? 1 : 0 };
        },
        
        async deleteOne(query) {
          const result = memoryStore.deleteOne(collectionName, query);
          return { deletedCount: result ? 1 : 0 };
        },
        
        async countDocuments(query = {}) {
          return memoryStore.countDocuments(collectionName, query);
        },
        
        async aggregate(pipeline) {
          let results = memoryStore.find(collectionName, {});
          
          for (const stage of pipeline) {
            if (stage.$group) {
              const groupBy = stage.$group._id;
              const accumulators = {};
              for (const key in stage.$group) {
                if (key !== '_id') {
                  accumulators[key] = stage.$group[key];
                }
              }
              
              const grouped = {};
              for (const doc of results) {
                let groupKey = 'default';
                if (typeof groupBy === 'object' && groupBy.$dateToString) {
                  groupKey = doc.createdAt?.toISOString().split('T')[0] || 'default';
                } else if (doc[groupBy]) {
                  groupKey = doc[groupBy];
                }
                
                if (!grouped[groupKey]) {
                  grouped[groupKey] = { _id: groupKey, count: 0 };
                }
                grouped[groupKey].count++;
              }
              
              results = Object.values(grouped);
              
              if (accumulators.avg) {
                const avg = results.reduce((sum, item) => sum + item.count, 0) / results.length;
                results = [{ _id: null, avg: avg || 0 }];
              }
            }
          }
          
          return results;
        }
      };
      
      models[name] = modelClass;
    }
    return models[name];
  },
  
  connect: async function() { 
      console.log('Mock mongoose connected'); 
      return { connection: { host: 'memory' } };
    },
  disconnect: async function() { console.log('Mock mongoose disconnected'); },
  connection: { host: 'memory' },
  Types: { ObjectId: { isValid: () => true } },
  SchemaTypes: {}
};

module.exports = mongoose;