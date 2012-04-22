
/*
db.js v0.1.0
*/

(function() {
  var Collection, DB,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  DB = (function() {

    function DB(storage) {
      this.collection = function(name) {
        if (name.indexOf(":") >= 0) throw "Invalid collection name " + name;
        return new Collection(name, storage);
      };
    }

    return DB;

  })();

  Collection = (function() {

    function Collection(name, storage) {
      var _this = this;
      this.name = name;
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
          return storage.setItem(key, _this.serializer.serialize(value));
        },
        retrieve: function(key) {
          return _this.serializer.deserialize(storage.getItem(key));
        },
        remove: function(key) {
          return storage.removeItem(key);
        },
        exists: function(key) {
          return storage.getItem(key) != null;
        }
      };
    }

    Collection.prototype.insert = function(document) {
      var docId;
      if (typeof document._id !== "undefined") {
        if (!this.storage.exists(this.name + ":" + document._id)) {
          docId = document._id;
        } else {
          throw "Duplicate document key " + document._id;
        }
      } else {
        docId = this._generateDocumentId();
      }
      this.storage.store(this.name + ":" + docId, document);
      return docId;
    };

    Collection.prototype.get = function(docId) {
      var doc;
      doc = this.storage.retrieve(this.name + ":" + docId);
      doc._id = docId;
      return doc;
    };

    Collection.prototype.find = function(criteria, subset) {
      var docId, docs, fullId, _i, _j, _len, _len2, _ref, _results;
      if (criteria == null) criteria = {};
      if (subset == null) subset = {};
      _ref = this._getDocumentsIds();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fullId = _ref[_i];
        docs = this.get(fullId);
      }
      _results = [];
      for (_j = 0, _len2 = docs.length; _j < _len2; _j++) {
        docId = docs[_j];
        if (this.matches.criteria(criteria, doc)) {
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
        if (this.matches.criteria(criteria, this.storage.retrieve(docId))) {
          _results.push(this.storage.remove(this.name + ":" + docId));
        }
      }
      return _results;
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

    Collection.prototype._generateBlock = function() {
      return Math.floor((Math.random() + 1) * 0x10000).toString(16).substring(1);
    };

    Collection.prototype._generateDocumentId = function() {
      var i;
      return ((function() {
        var _results;
        _results = [];
        for (i = 1; i <= 3; i++) {
          _results.push(this._generateBlock());
        }
        return _results;
      }).call(this)).join('');
    };

    Collection.prototype._subset = function(subset, doc) {
      return doc;
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
