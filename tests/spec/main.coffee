describe "db.js", ->
  beforeEach (-> localStorage.clear())

  it "should create collections with valid names", ->
    expect(-> db.collection "aA1-?!@#$%^&*().,").not.toThrow "Invalid collection name aA1-?!@#$%^&*().,"
    expect(-> db.collection "foo:bar").toThrow "Invalid collection name foo:bar" # : char is illegal

  it "should insert documents without ids", ->
    doc =
      a: 42
      b: "foo"
    collection = db.collection "something"
    key = collection.insert doc
    doc._id = key
    expect(collection.get key).toEqual doc

  it "should insert documents with set ids", ->
    doc =
      _id: "10"
      a: 42
      b: "foo"
    collection = db.collection "something"
    key = collection.insert doc
    expect(key).toEqual "10"
    expect(collection.get key).toEqual doc

  it "should throw exception on document keys duplicate", ->
    doc =
      _id: "10"
      a: 10
      b: "foo"
    collection = db.collection "something"
    collection.insert doc
    expect(-> collection.insert doc).toThrow "Duplicate document key 10"

  it "should find all inserted documents", ->
    docs = [{_id: "foo"}, {_id: "bar"}, {_id: "baz"}]
    collection = db.collection "find_all"
    collection.insert doc for doc in docs
    foundDocs = collection.find()
    expect(foundDocs).toContain doc for doc in docs