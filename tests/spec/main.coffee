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
    expect(foundDocs).toContain collection.findOne()

  it "should find documents by functional criteria on documents", ->
    docs = [{_id: "foo"}, {_id: "bar"}, {_id: "baz"}]
    collection = db.collection "find"
    collection.insert doc for doc in docs
    expect(collection.findOne((doc) -> doc._id == "bar")).toEqual {_id: "bar"}

  it "should find documents by exact equality", ->
    foo = {_id: "foo", a: 10, b: "foo", c: true,  d: [5, false, "yui"]}
    bar = {_id: "bar", a: 20, b: "bar", c: false, d: [true, "zxc", 4]}
    qux = {_id: "qux", a: 30, b: "qux", c: true,  d: ["mnb", false, 1]}
    wtf = {_id: "wtf", a: "wtf", b: 80, c: null,  d: []}
    docs = [foo, bar, qux, wtf]
    collection = db.collection "find_exacts"
    collection.insert doc for doc in docs

    expect(collection.find {a: 10}).toEqual [foo]
    expect(collection.findOne {a: 10}).toEqual foo

    expect(collection.find {c: false}).toEqual [bar]
    expect(collection.findOne {c: false}).toEqual bar

    expect(collection.find {b: "qux"}).toEqual [qux]
    expect(collection.findOne {b: "qux"}).toEqual qux

  it "should find documents by functional criteria on attributes", ->
    foo = {_id: "foo", d: [5, false, "yui"]}
    bar = {_id: "bar", d: [true, "zxc", 4]}
    qux = {_id: "qux", d: ["mnb", false, 1]}
    docs = [foo, bar, qux]
    collection = db.collection "find_fun_attrs"
    collection.insert doc for doc in docs
    foundDocs = collection.find {d: (attr) -> false in attr}
    expect(foundDocs).toContain foo
    expect(foundDocs).toContain qux
    expect(collection.findOne {d: (attr) -> "zxc" in attr}).toEqual bar

  it "should find documents by operator conditions on attributes", ->
    foo = {_id: "foo", a: 10, b: "foo", c: true,  d: [5, false, "yui"]}
    bar = {_id: "bar", a: 20, b: "bar", c: false, d: [true, "zxc", -4]}
    qux = {_id: "qux", a: 30, b: "qux", c: true,  d: ["mnb", false, 1]}
    wtf = {_id: "wtf", a: "wtf", b: 80, c: null,  d: [], e: 42}
    docs = [foo, bar, qux, wtf]
    collection = db.collection "find_exacts"
    collection.insert doc for doc in docs

    expect(collection.find {d: false}).toContain doc for doc in [foo, qux]
    expect(collection.find {d: -4}).toEqual [bar]
    expect(collection.find {d: "mnb"}).toEqual [qux]

    expect(collection.find {a: {$neq: 20}}).toContain doc for doc in [foo, qux, wtf]
    expect(collection.find {a: {$gt: 20}}).toContain qux
    expect(collection.find {a: ($lt: 20)}).toContain foo
    expect(collection.find {a: {$gte: 20}}).toContain doc for doc in [bar, qux]
    expect(collection.find {a: {$lte: 20}}).toContain doc for doc in [bar, foo]

    expect(collection.find {e: {$exists: true}}).toEqual [wtf]
    expect(collection.find {c: {$exists: false}}).toEqual []

    expect(collection.find {a: {$in: ["wtf", 20]}}).toContain doc for doc in [wtf, bar]
    expect(collection.find {a: {$nin: ["wtf", 20]}}).toContain doc for doc in [foo, qux]

    expect(collection.find {d: {$size: 3}}).toContain doc for doc in [foo, bar, qux]
    expect(collection.find {d: {$size: 0}}).toEqual [wtf]

    expect(collection.find {d: {$all: ["zxc", -4, true]}}).toEqual [bar]