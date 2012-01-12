describe("db.js", function () {
	localStorage.clear();
	
	it("should create collections", function () {
		var collection = "some_collection";
		db.collection(collection);
		expect(db.collections()).toContain(collection);
	});
	
	it("should insert documents", function () {
		var doc = {a: 10, b: "foo", c: {d: false, e: [null, {}]}};
		var collection = db.collection("something");
		var key = collection.insert(doc);
		expect(collection.get(key)).toEqual(doc);
	});
});