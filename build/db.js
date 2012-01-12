
/*
db.js v0.1.0
*/

(function() {
  var Collection, DB, Serializer,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Serializer = (function() {

    function Serializer() {}

    Serializer.prototype.serialize = function(object) {
      return JSON.stringify(object);
    };

    Serializer.prototype.deserialize = function(string) {
      return JSON.parse(string);
    };

    return Serializer;

  })();

  DB = (function() {
    var collectionsMetainfoKey, serializer;

    collectionsMetainfoKey = "_dbjs_collections";

    serializer = new Serializer;

    function DB(storage) {
      this.storage = storage;
    }

    DB.prototype.collection = function(name) {
      var cid, metainfo;
      metainfo = this._getCollectionsMetainfo();
      if (name in metainfo) {
        cid = metainfo[name];
      } else {
        cid = this._generateCollectionId();
        this._updateCollectionsMetainfo(name, cid);
      }
      return new Collection(this, name, cid);
    };

    DB.prototype.collections = function() {
      var metainfo;
      metainfo = this._getCollectionsMetainfo();
      return Object.keys(metainfo);
    };

    DB.prototype.get = function(docId) {
      return serializer.deserialize(this._retrieve(docId));
    };

    DB.prototype.getAll = function(docIds) {
      var docId, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = docIds.length; _i < _len; _i++) {
        docId = docIds[_i];
        _results.push(this.get(docId));
      }
      return _results;
    };

    DB.prototype.remove = function(docId) {
      this._delete(docId);
      return docId;
    };

    DB.prototype.removeAll = function(docIds) {
      var docId, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = docIds.length; _i < _len; _i++) {
        docId = docIds[_i];
        _results.push(this._delete(docId));
      }
      return _results;
    };

    DB.prototype._store = function(key, value) {
      return this.storage.setItem(key, serializer.serialize(value));
    };

    DB.prototype._retrieve = function(key) {
      return this.storage.getItem(key);
    };

    DB.prototype._delete = function(key) {
      return this.storage.removeItem(key);
    };

    DB.prototype._getCollectionsMetainfo = function() {
      var metainfo, _ref;
      metainfo = (_ref = this._retrieve(collectionsMetainfoKey)) != null ? _ref : "{}";
      return serializer.deserialize(metainfo);
    };

    DB.prototype._updateCollectionsMetainfo = function(name, cid) {
      var metainfo;
      metainfo = this._getCollectionsMetainfo();
      metainfo[name] = cid;
      return this._store(collectionsMetainfoKey, metainfo);
    };

    DB.prototype._generateIdBlock = function() {
      var block;
      block = Math.floor((1 + Math.random()) * 0x10000);
      return (block.toString(16)).substring(1);
    };

    DB.prototype._generateCollectionId = function() {
      return this._generateIdBlock();
    };

    DB.prototype._generateDocumentId = function(cid) {
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
        for (keyId = 0, _ref = this.storage.length; 0 <= _ref ? keyId < _ref : keyId > _ref; 0 <= _ref ? keyId++ : keyId--) {
          _results.push(this.storage.key(keyId));
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
      docId = this.db._generateDocumentId(this.cid);
      this.db._store(docId, document);
      return docId;
    };

    Collection.prototype.get = function(docId) {
      return this.db.get(docId);
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
        if (this._matchCriteria(criteria, this.db.get(docId))) {
          _results.push(this.db.remove(docId));
        }
      }
      return _results;
    };

    Collection.prototype._matchCriteria = function(criteria, doc) {
      var condition, field;
      switch (typeof criteria) {
        case "object":
          for (field in criteria) {
            condition = criteria[field];
            if (!this._matchCondition(doc, field, condition)) return false;
          }
          return true;
        case "function":
          return !!criteria(doc);
        default:
          return true;
      }
    };

    Collection.prototype._matchCondition = function(doc, field, condition) {
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
            if (!this._matchOperator(value, operator, operand)) return false;
          }
          return true;
        case "function":
          return !!condition(value);
        default:
          return true;
      }
    };

    Collection.prototype._matchOperator = function(value, operator, operand) {
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
        default:
          return true;
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
