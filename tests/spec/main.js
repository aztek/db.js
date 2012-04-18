describe("db.js", function () {
    beforeEach(function () {
        localStorage.clear();
    });

    it("should create collections", function () {
        var collections = ["foo", "bar", "baz"];
        for (var i = 0; i < collections.length; i++) {
            db.collection(collections[i]);
        }
        for (var j = 0; j < collections.length; j++) {
            expect(db.getCollections()).toContain(collections[j]);
        }
    });

    it("should insert documents without ids", function () {
        var doc = {a: 10, b: "foo", c: {d: false, e: [null, {}]}};
        var collection = db.collection("something");
        var key = collection.insert(doc);
        expect(db.get(key)).toEqual(doc);
    });

    it("should insert documents with correctly set ids", function () {
        var doc = {_id: 10, a: 10, b: "foo", c: {d: false, e: [null, {}]}};
        var collection = db.collection("something");
        var key = collection.insert(doc);
        expect(key).toEqual(10);
        expect(db.get(key)).toEqual(doc);
    });
});