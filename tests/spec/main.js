(function() {
  var __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  describe("db.js", function() {
    beforeEach((function() {
      return localStorage.clear();
    }));
    it("should create collections with valid names", function() {
      expect(function() {
        return db("aA1-?!@#$%^&*().,");
      }).not.toThrow("Invalid collection name aA1-?!@#$%^&*().,");
      return expect(function() {
        return db("foo:bar");
      }).toThrow("Invalid collection name foo:bar");
    });
    it("should insert documents without ids", function() {
      var collection, doc, key;
      doc = {
        a: 42,
        b: "foo"
      };
      collection = db("something");
      key = collection.insert(doc);
      doc._id = key;
      return expect(collection.get(key)).toEqual(doc);
    });
    it("should insert documents with set ids", function() {
      var collection, doc, key;
      doc = {
        _id: "10",
        a: 42,
        b: "foo"
      };
      collection = db("something");
      key = collection.insert(doc);
      expect(key).toEqual("10");
      return expect(collection.get(key)).toEqual(doc);
    });
    it("should throw exception on document keys duplicate", function() {
      var collection, doc;
      doc = {
        _id: "10",
        a: 10,
        b: "foo"
      };
      collection = db("something");
      collection.insert(doc);
      return expect(function() {
        return collection.insert(doc);
      }).toThrow("Duplicate document key 10");
    });
    it("should find all inserted documents", function() {
      var collection, doc, docs, foundDocs, _i, _j, _len, _len2;
      docs = [
        {
          _id: "foo"
        }, {
          _id: "bar"
        }, {
          _id: "baz"
        }
      ];
      collection = db("find_all");
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        collection.insert(doc);
      }
      foundDocs = collection.find();
      for (_j = 0, _len2 = docs.length; _j < _len2; _j++) {
        doc = docs[_j];
        expect(foundDocs).toContain(doc);
      }
      return expect(foundDocs).toContain(collection.findOne());
    });
    it("should find documents by functional criteria on documents", function() {
      var collection, doc, docs, _i, _len;
      docs = [
        {
          _id: "foo"
        }, {
          _id: "bar"
        }, {
          _id: "baz"
        }
      ];
      collection = db("find");
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        collection.insert(doc);
      }
      return expect(collection.findOne(function(doc) {
        return doc._id === "bar";
      })).toEqual({
        _id: "bar"
      });
    });
    it("should find documents by exact equality", function() {
      var bar, collection, doc, docs, foo, qux, wtf, _i, _len;
      foo = {
        _id: "foo",
        a: 10,
        b: "foo",
        c: true,
        d: [5, false, "yui"]
      };
      bar = {
        _id: "bar",
        a: 20,
        b: "bar",
        c: false,
        d: [true, "zxc", 4]
      };
      qux = {
        _id: "qux",
        a: 30,
        b: "qux",
        c: true,
        d: ["mnb", false, 1]
      };
      wtf = {
        _id: "wtf",
        a: "wtf",
        b: 80,
        c: null,
        d: []
      };
      docs = [foo, bar, qux, wtf];
      collection = db("find_exacts");
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        collection.insert(doc);
      }
      expect(collection.find({
        a: 10
      })).toEqual([foo]);
      expect(collection.findOne({
        a: 10
      })).toEqual(foo);
      expect(collection.find({
        c: false
      })).toEqual([bar]);
      expect(collection.findOne({
        c: false
      })).toEqual(bar);
      expect(collection.find({
        b: "qux"
      })).toEqual([qux]);
      return expect(collection.findOne({
        b: "qux"
      })).toEqual(qux);
    });
    it("should find documents by functional criteria on attributes", function() {
      var bar, collection, doc, docs, foo, foundDocs, qux, _i, _len;
      foo = {
        _id: "foo",
        d: [5, false, "yui"]
      };
      bar = {
        _id: "bar",
        d: [true, "zxc", 4]
      };
      qux = {
        _id: "qux",
        d: ["mnb", false, 1]
      };
      docs = [foo, bar, qux];
      collection = db("find_fun_attrs");
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        collection.insert(doc);
      }
      foundDocs = collection.find({
        d: function(attr) {
          return __indexOf.call(attr, false) >= 0;
        }
      });
      expect(foundDocs).toContain(foo);
      expect(foundDocs).toContain(qux);
      return expect(collection.findOne({
        d: function(attr) {
          return __indexOf.call(attr, "zxc") >= 0;
        }
      })).toEqual(bar);
    });
    return it("should find documents by operator conditions on attributes", function() {
      var bar, collection, doc, docs, foo, qux, wtf, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      foo = {
        _id: "foo",
        a: 10,
        b: "foo",
        c: true,
        d: [5, false, "yui"]
      };
      bar = {
        _id: "bar",
        a: 20,
        b: "bar",
        c: false,
        d: [true, "zxc", -4]
      };
      qux = {
        _id: "qux",
        a: 30,
        b: "qux",
        c: true,
        d: ["mnb", false, 1]
      };
      wtf = {
        _id: "wtf",
        a: "wtf",
        b: 80,
        c: null,
        d: [],
        e: 42
      };
      docs = [foo, bar, qux, wtf];
      collection = db("find_exacts");
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        collection.insert(doc);
      }
      _ref = [foo, qux];
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        doc = _ref[_j];
        expect(collection.find({
          d: false
        })).toContain(doc);
      }
      expect(collection.find({
        d: -4
      })).toEqual([bar]);
      expect(collection.find({
        d: "mnb"
      })).toEqual([qux]);
      _ref2 = [foo, qux, wtf];
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        doc = _ref2[_k];
        expect(collection.find({
          a: {
            $neq: 20
          }
        })).toContain(doc);
      }
      expect(collection.find({
        a: {
          $gt: 20
        }
      })).toContain(qux);
      expect(collection.find({
        a: {
          $lt: 20
        }
      })).toContain(foo);
      _ref3 = [bar, qux];
      for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
        doc = _ref3[_l];
        expect(collection.find({
          a: {
            $gte: 20
          }
        })).toContain(doc);
      }
      _ref4 = [bar, foo];
      for (_m = 0, _len5 = _ref4.length; _m < _len5; _m++) {
        doc = _ref4[_m];
        expect(collection.find({
          a: {
            $lte: 20
          }
        })).toContain(doc);
      }
      expect(collection.find({
        e: {
          $exists: true
        }
      })).toEqual([wtf]);
      expect(collection.find({
        c: {
          $exists: false
        }
      })).toEqual([]);
      _ref5 = [wtf, bar];
      for (_n = 0, _len6 = _ref5.length; _n < _len6; _n++) {
        doc = _ref5[_n];
        expect(collection.find({
          a: {
            $in: ["wtf", 20]
          }
        })).toContain(doc);
      }
      _ref6 = [foo, qux];
      for (_o = 0, _len7 = _ref6.length; _o < _len7; _o++) {
        doc = _ref6[_o];
        expect(collection.find({
          a: {
            $nin: ["wtf", 20]
          }
        })).toContain(doc);
      }
      _ref7 = [foo, bar, qux];
      for (_p = 0, _len8 = _ref7.length; _p < _len8; _p++) {
        doc = _ref7[_p];
        expect(collection.find({
          d: {
            $size: 3
          }
        })).toContain(doc);
      }
      expect(collection.find({
        d: {
          $size: 0
        }
      })).toEqual([wtf]);
      return expect(collection.find({
        d: {
          $all: ["zxc", -4, true]
        }
      })).toEqual([bar]);
    });
  });

}).call(this);
