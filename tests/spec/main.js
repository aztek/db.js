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
        a: "10",
        b: "foo",
        c: {
          d: false,
          e: [null, {}]
        }
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
        a: 10,
        b: "foo",
        c: {
          d: false,
          e: [null, {}]
        }
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
        b: "foo",
        c: {
          d: false,
          e: [null, {}]
        }
      };
      collection = db.collection("something");
      collection.insert(doc);
      return expect(function() {
        return collection.insert(doc);
      }).toThrow("Duplicate document key 10");
    });
    return it("should find all inserted documents", function() {
      var collection, doc, docs, foundDocs, _i, _j, _len, _len2, _results;
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
      _results = [];
      for (_j = 0, _len2 = docs.length; _j < _len2; _j++) {
        doc = docs[_j];
        _results.push(expect(foundDocs).toContain(doc));
      }
      return _results;
    });
  });

}).call(this);
