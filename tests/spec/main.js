describe("db.js", function () {
    beforeEach(function () {
        localStorage.clear();
    });

    it("should create collections with valid names", function () {
        expect(function() { db.collection("aA1-?!@#$%^&*().,;") }).not.toThrow("Invalid collection name aA1-?!@#$%^&*().,;");
        expect(function() { db.collection("foo:bar") }).toThrow("Invalid collection name foo:bar"); // : char is illegal
    });

    it("should insert documents without ids", function () {
        var doc = {a: 10, b: "foo", c: {d: false, e: [null, {}]}};
        var collection = db.collection("something");
        var key = collection.insert(doc);
        doc._id = key;
        expect(collection.get(key)).toEqual(doc);
    });

    it("should insert documents with set ids", function () {
        var doc = {_id: 10, a: 10, b: "foo", c: {d: false, e: [null, {}]}};
        var collection = db.collection("something");
        var key = collection.insert(doc);
        expect(key).toEqual(10);
        expect(collection.get(key)).toEqual(doc);
    });

    it("should throw exception on document keys duplicate", function () {
        var doc = {_id: 10, a: 10, b: "foo", c: {d: false, e: [null, {}]}};
        var collection = db.collection("something");
        collection.insert(doc);
        expect(function() { collection.insert(doc) }).toThrow("Duplicate document key 10");
    });
});