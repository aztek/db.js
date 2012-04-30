###
db.js v0.1.0
###
class DB
  constructor: (storage) ->
    @collection = (name) ->
      if name.indexOf(':') >= 0
        throw "Invalid collection name #{name}"
      new Collection(name, storage)

class Collection
  constructor: (name, storage) ->
    serializer =
      serialize:   (object) -> JSON.stringify object
      deserialize: (string) -> if string? then JSON.parse string else null

    Collection.storage =
      store: (docID, value) -> storage.setItem(name + ":" + docID, serializer.serialize value)
      retrieve: (docID) -> serializer.deserialize storage.getItem(name + ":" + docID)
      remove: (docID) -> storage.removeItem(name + ":" + docID)
      exists: (docID) -> storage.getItem(name + ":" + docID)?
      keys: -> docID[name.length + 1..] for docID in storage when name + ":" == docID[..name.length]

  insert: (doc) ->
    if doc._id?
      if not Collection.storage.exists doc._id
        docID = doc._id
      else
        throw "Duplicate document key #{doc._id}"
    else
      docID = Collection.generateDocumentId()
    Collection.storage.store(docID, doc)
    docID

  get: (docID) ->
    doc = Collection.storage.retrieve(docID)
    doc._id = docID # make sure _id attribute is set
    doc

  find: (criteria = {}, subset = {}) ->
    Collection.subset(subset, doc) for doc in @documents() when Collection.matches.criteria(criteria, doc)

  findOne: (criteria = {}, subset = {}) ->
    for docID in Collection.storage.keys()
      doc = @get docID
      if Collection.matches.criteria(criteria, doc)
        return Collection.subset(subset, doc)
    null

  remove: (criteria = {}) ->
    Collection.storage.remove doc._id for doc in @documents() when Collection.matches.criteria(criteria, doc)

  documents: -> @get docID for docID in Collection.storage.keys()

  @matches =
    criteria: (criteria, doc) =>
      switch typeof criteria
        when "object"
          for field, condition of criteria
            if not @matches.condition(doc, field, condition)
              return false
          true
        when "function"
          not not criteria doc # convert to boolean
        else
          true

    condition: (doc, field, condition) =>
      value = doc[field]
      switch typeof condition
        when "number", "string", "boolean"
          if value instanceof Array
            condition in value
          else
            value == condition
        when "object"
          for operator, operand of condition
            if not @matches.operator(value, operator, operand)
              return false
          true
        when "function"
          not not condition value # convert to boolean
        else
          true

    operator: (value, operator, operand) ->
      switch operator
        when "$ne"  then value != operand
        when "$gt"  then value > operand
        when "$gte" then value >= operand
        when "$lt"  then value < operand
        when "$lte" then value <= operand
        when "$exists" then operand == (value != undefined)
        when "$in"  then value in operand
        when "$nin" then value not in operand
        when "$all" then (value instanceof Array) && ((elem for elem in value if elem not in operand).length == 0)
        when "$size" then (value instanceof Array) && (value.length == operand)
        else true

  # generate random 4 character hex string
  # http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
  @generateBlock = -> Math.floor((Math.random() + 1) * 0x10000).toString(16).substring(1)

  @generateDocumentId = -> (Collection.generateBlock() for i in [1..3]).join ''

  @subset = (subset, doc) ->
    doc # TODO

if @localStorage
  @db = new DB @localStorage
  try
    @sdb = new DB @sessionStorage
  catch e
    # sessionStorage in not available on local web pages
    @sdb = null
else
  @db = @sdb = null