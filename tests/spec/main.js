(function() {

  describe("db.js", function() {
    beforeEach((function() {
      return localStorage.clear();
    }));
    it("should create collections with valid names", function() {
      expect(function() {
        return db.collection("aA1-?!@#$%^&*().,");
      }).not.toThrow("Invalid collection name aA1-?!@#$%^&*().,");
      return expect(function() {
        return db.collection("foo:bar");
      }).toThrow("Invalid collection name foo:bar");
    });
    it("should insert documents without ids", function() {
      var collection, doc, key;
      doc = {
        a: 42,
        b: "foo"
      };
      collection = db.collection("something");
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
      collection = db.collection("something");
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
      collection = db.collection("something");
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
      collection = db.collection("find_all");
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
    it("should find documents by functional criteria", function() {
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
      collection = db.collection("find");
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
    return it("should find documents by exact equality", function() {
      var bar, collection, doc, docs, foo, qux, wtf, _i, _len;
      foo = {
        _id: '1',
        a: 10,
        b: "foo",
        c: true,
        d: [5, false, "yui"]
      };
      bar = {
        _id: '2',
        a: 20,
        b: "bar",
        c: false,
        d: [true, "zxc", 4]
      };
      qux = {
        _id: '3',
        a: 30,
        b: "qux",
        c: true,
        d: ["mnb", false, 1]
      };
      wtf = {
        _id: '4',
        a: "wtf",
        b: 80,
        c: null,
        d: []
      };
      docs = [foo, bar, qux, wtf];
      collection = db.collection("find_exacts");
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
  });

}).call(this);
