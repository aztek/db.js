
/*
db.js v0.1.0
*/

(function() {
  var Collection, DB,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  DB = (function() {

    function DB(_storage) {
      var _this = this;
      this._storage = _storage;
      this.serializer = {
        serialize: function(object) {
          return JSON.stringify(object);
        },
        deserialize: function(string) {
          if (string != null) {
            return JSON.parse(string);
          } else {
            return null;
          }
        }
      };
      this.storage = {
        store: function(key, value) {
          return _this._storage.setItem(key, _this.serializer.serialize(value));
        },
        retrieve: function(key) {
          return _this.serializer.deserialize(_this._storage.getItem(key));
        },
        remove: function(key) {
          return _this._storage.removeItem(key);
        }
      };
      this.collections = {
        key: "_dbjs_collections",
        get: function() {
          var _ref;
          return (_ref = _this.storage.retrieve(_this.collections.key)) != null ? _ref : {};
        },
        save: function(collections) {
          return _this.storage.store(_this.collections.key, collections);
        },
        update: function(name, cid) {
          var collections;
          collections = _this.collections.get();
          collections[name] = cid;
          return _this.collections.save(collections);
        }
      };
    }

    DB.prototype.collection = function(name) {
      var cid, collections;
      collections = this.collections.get();
      if (name in collections) {
        cid = collections[name];
      } else {
        cid = this._generateCollectionId();
        this.collections.update(name, cid);
      }
      return new Collection(this, name, cid);
    };

    DB.prototype.getCollections = function() {
      return Object.keys(this.collections.get());
    };

    DB.prototype.get = function(fullId) {
      return this.storage.retrieve(fullId);
    };

    DB.prototype.getAll = function(fullIds) {
      var fullId, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = fullIds.length; _i < _len; _i++) {
        fullId = fullIds[_i];
        _results.push(this.get(fullId));
      }
      return _results;
    };

    DB.prototype.remove = function(fullId) {
      return this.storage.remove(fullId);
    };

    DB.prototype.removeAll = function(fullIds) {
      var fullId, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = fullIds.length; _i < _len; _i++) {
        fullId = fullIds[_i];
        _results.push(this.remove(fullId));
      }
      return _results;
    };

    DB.prototype._generateIdBlock = function() {
      return Math.floor((Math.random() + 1) * 0x10000).toString(16).substring(1);
    };

    DB.prototype._generateCollectionId = function() {
      return this._generateIdBlock();
    };

    DB.prototype._generateFullId = function(cid) {
      var i;
      return cid + (((function() {
        var _results;
        _results = [];
        for (i = 1; i <= 3; i++) {
          _results.push(this._generateIdBlock());
        }
        return _results;
      }).call(this)).join(''));
    };

    DB.prototype._getDocumentsIds = function() {
      var docId, ids, keyId, _i, _len, _results;
      ids = (function() {
        var _ref, _results;
        _results = [];
        for (keyId = 0, _ref = this._storage.length; 0 <= _ref ? keyId < _ref : keyId > _ref; 0 <= _ref ? keyId++ : keyId--) {
          _results.push(this._storage.key(keyId));
        }
        return _results;
      }).call(this);
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        docId = ids[_i];
        if (this._validDocumentId(docId)) _results.push(docId);
      }
      return _results;
    };

    DB.prototype._validDocumentId = function(docId) {
      return (new RegExp("^[0-9a-f]{16}$")).test(docId);
    };

    return DB;

  })();

  Collection = (function() {

    function Collection(db, name, cid) {
      this.db = db;
      this.name = name;
      this.cid = cid;
    }

    Collection.prototype.insert = function(document) {
      var docId;
      docId = this._resolveDocumentId(document);
      this.db.storage.store(docId, document);
      return docId;
    };

    Collection.prototype.get = function(docId) {
      return this.db.get(this.cid + docId);
    };

    Collection.prototype.find = function(criteria, subset) {
      var doc, docs, _i, _len, _results;
      if (criteria == null) criteria = {};
      if (subset == null) subset = {};
      docs = this.db.getAll(this._getDocumentsIds());
      _results = [];
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        if (this._matchCriteria(criteria, doc)) {
          _results.push(this._subset(subset, doc));
        }
      }
      return _results;
    };

    Collection.prototype.remove = function(criteria) {
      var docId, _i, _len, _ref, _results;
      if (criteria == null) criteria = {};
      _ref = this._getDocumentsIds();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        docId = _ref[_i];
        if (this.matches.criteria(criteria, this.db.get(docId))) {
          _results.push(this.db.remove(docId));
        }
      }
      return _results;
    };

    Collection.prototype._resolveDocumentId = function(document) {
      if ("_id" in document) {
        return document._id;
      } else {
        return this.db._generateFullId(this.cid);
      }
    };

    Collection.matches = {
      criteria: function(criteria, doc) {
        var condition, field, _results;
        switch (typeof criteria) {
          case "object":
            _results = [];
            for (field in criteria) {
              condition = criteria[field];
              if (!this.matches.condition(doc, field, condition)) false;
              _results.push(true);
            }
            return _results;
            break;
          case "function":
            return !!criteria(doc);
          default:
            return true;
        }
      },
      condition: function(doc, field, condition) {
        var operand, operator, value;
        value = doc[field];
        switch (typeof condition) {
          case "number":
          case "string":
          case "boolean":
            if (value instanceof Array) {
              return __indexOf.call(value, condition) >= 0;
            } else {
              return value === condition;
            }
            break;
          case "object":
            for (operator in condition) {
              operand = condition[operator];
              if (!this.matches.operator(value, operator, operand)) false;
            }
            return true;
          case "function":
            return !!condition(value);
          default:
            return true;
        }
      },
      operator: function(value, operator, operand) {
        var elem;
        switch (operator) {
          case "$ne":
            return value !== operand;
          case "$gt":
            return value > operand;
          case "$gte":
            return value >= operand;
          case "$lt":
            return value < operand;
          case "$lte":
            return value <= operand;
          case "$exists":
            return operand === (value !== void 0);
          case "$in":
            return __indexOf.call(operand, value) >= 0;
          case "$nin":
            return __indexOf.call(operand, value) < 0;
          case "$all":
            return (value instanceof Array) && (((function() {
              var _i, _len, _results;
              if (__indexOf.call(operand, elem) < 0) {
                _results = [];
                for (_i = 0, _len = value.length; _i < _len; _i++) {
                  elem = value[_i];
                  _results.push(elem);
                }
                return _results;
              }
            })()).length === 0);
          case "$size":
            return (value instanceof Array) && (value.length === operand);
          default:
            return true;
        }
      }
    };

    Collection.prototype._subset = function(subset, doc) {
      return doc;
    };

    Collection.prototype._getDocumentsIds = function() {
      var docId, ids, _i, _len, _results;
      ids = this.db._getDocumentsIds();
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        docId = ids[_i];
        if (this._collectionDocument(docId)) _results.push(docId);
      }
      return _results;
    };

    Collection.prototype._collectionDocument = function(docId) {
      return docId.slice(0, 4) === this.cid;
    };

    return Collection;

  })();

  if (this.localStorage) {
    this.db = new DB(this.localStorage);
    try {
      this.sdb = new DB(this.sessionStorage);
    } catch (e) {
      this.sdb = null;
    }
  } else {
    this.db = this.sdb = null;
  }

}).call(this);
