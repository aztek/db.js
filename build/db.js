
/*
db.js v0.1.0
*/

(function() {
  var Collection, DB,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  DB = function(storage) {
    return function(name) {
      if (name.indexOf(':') >= 0) throw "Invalid collection name " + name;
      return new Collection(name, storage);
    };
  };

  Collection = (function() {
    var _this = this;

    function Collection(name, storage) {
      var serializer;
      serializer = {
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
      Collection.storage = {
        store: function(docID, value) {
          return storage.setItem(name + ":" + docID, serializer.serialize(value));
        },
        retrieve: function(docID) {
          return serializer.deserialize(storage.getItem(name + ":" + docID));
        },
        remove: function(docID) {
          return storage.removeItem(name + ":" + docID);
        },
        exists: function(docID) {
          return storage.getItem(name + ":" + docID) != null;
        },
        keys: function() {
          var docID, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = storage.length; _i < _len; _i++) {
            docID = storage[_i];
            if (name + ":" === docID.slice(0, name.length + 1 || 9e9)) {
              _results.push(docID.slice(name.length + 1));
            }
          }
          return _results;
        }
      };
    }

    Collection.prototype.insert = function(doc) {
      var docID;
      if (doc._id != null) {
        if (!Collection.storage.exists(doc._id)) {
          docID = doc._id;
        } else {
          throw "Duplicate document key " + doc._id;
        }
      } else {
        docID = Collection.generateDocumentId();
      }
      Collection.storage.store(docID, doc);
      return docID;
    };

    Collection.prototype.get = function(docID) {
      var doc;
      doc = Collection.storage.retrieve(docID);
      doc._id = docID;
      return doc;
    };

    Collection.prototype.find = function(criteria, subset) {
      var doc, _i, _len, _ref, _results;
      if (criteria == null) criteria = {};
      if (subset == null) subset = {};
      _ref = this.documents();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        doc = _ref[_i];
        if (Collection.matches.criteria(criteria, doc)) {
          _results.push(Collection.subset(subset, doc));
        }
      }
      return _results;
    };

    Collection.prototype.findOne = function(criteria, subset) {
      var doc, docID, _i, _len, _ref;
      if (criteria == null) criteria = {};
      if (subset == null) subset = {};
      _ref = Collection.storage.keys();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        docID = _ref[_i];
        doc = this.get(docID);
        if (Collection.matches.criteria(criteria, doc)) {
          return Collection.subset(subset, doc);
        }
      }
      return null;
    };

    Collection.prototype.remove = function(criteria) {
      var doc, _i, _len, _ref, _results;
      if (criteria == null) criteria = {};
      _ref = this.documents();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        doc = _ref[_i];
        if (Collection.matches.criteria(criteria, doc)) {
          _results.push(Collection.storage.remove(doc._id));
        }
      }
      return _results;
    };

    Collection.prototype.documents = function() {
      var docID, _i, _len, _ref, _results;
      _ref = Collection.storage.keys();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        docID = _ref[_i];
        _results.push(this.get(docID));
      }
      return _results;
    };

    Collection.matches = {
      criteria: function(criteria, doc) {
        var condition, field;
        switch (typeof criteria) {
          case "object":
            for (field in criteria) {
              condition = criteria[field];
              if (!Collection.matches.condition(doc, field, condition)) {
                return false;
              }
            }
            return true;
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
            if (condition instanceof RegExp) {
              return (typeof value === "string") && (value.search(condition) !== -1);
            }
            for (operator in condition) {
              operand = condition[operator];
              if (!Collection.matches.operator(value, operator, operand)) {
                return false;
              }
            }
            return true;
          case "function":
            return !!condition(value);
          default:
            return true;
        }
      },
      operator: function(value, operator, operand) {
        var elem, _i, _len;
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
          case "$size":
            return (value instanceof Array) && (value.length === operand);
          case "$all":
            if (!(value instanceof Array) || (value.length === 0)) return false;
            for (_i = 0, _len = value.length; _i < _len; _i++) {
              elem = value[_i];
              if (__indexOf.call(operand, elem) < 0) return false;
            }
            return true;
          case "$regex":
            return (typeof value === "string") && (value.search(operand) !== -1);
          default:
            return true;
        }
      }
    };

    Collection.generateBlock = function() {
      return Math.floor((Math.random() + 1) * 0x10000).toString(16).substring(1);
    };

    Collection.generateDocumentId = function() {
      var i;
      return ((function() {
        var _results;
        _results = [];
        for (i = 1; i <= 3; i++) {
          _results.push(Collection.generateBlock());
        }
        return _results;
      })()).join('');
    };

    Collection.subset = function(subset, doc) {
      return doc;
    };

    return Collection;

  }).call(this);

  if (this.localStorage) {
    this.db = DB(this.localStorage);
    try {
      this.sdb = DB(this.sessionStorage);
    } catch (e) {
      console.error("Session storage is either not supported or not available during this session");
      this.sdb = null;
    }
  } else {
    console.error("Local storage is not supported");
    this.db = this.sdb = null;
  }

}).call(this);
