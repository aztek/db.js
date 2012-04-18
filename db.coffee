###
db.js v0.1.0
###
class DB
  constructor: (@_storage) ->
    @serializer =
      serialize:   (object) -> JSON.stringify object
      deserialize: (string) -> JSON.parse string

    @storage =
      store: (key, value) => @_storage.setItem(key, @serializer.serialize value)
      retrieve: (key) => @_storage.getItem key
      remove: (key) => @_storage.removeItem key

    @collections =
      key: "_dbjs_collections"
      get: => @serializer.deserialize((@storage.retrieve @collections.key) ? "{}")
      save: (collections) => @storage.store(@collections.key, collections)
      update: (name, cid) =>
        collections = @collections.get()
        collections[name] = cid
        @collections.save collections

  collection: (name) ->
    collections = @collections.get()
    if name of collections
      cid = collections[name]
    else
      cid = @_generateCollectionId()
      @collections.update(name, cid)
    new Collection(this, name, cid)

  getCollections: -> Object.keys @collections.get()

  get: (docId) ->
    @serializer.deserialize(@storage.retrieve docId)

  getAll: (docIds) ->
    @get docId for docId in docIds

#  set: ()

  remove: (docId) ->
    @storage.remove docId

  removeAll: (docIds) ->
    @storage.remove docId for docId in docIds

  _generateIdBlock: ->
    # generate random 4 character hex string
    # http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    block = Math.floor((Math.random() + 1) * 0x10000)
    (block.toString 16).substring 1

  _generateCollectionId: ->
    @_generateIdBlock()

  _generateDocumentId: (cid) ->
    cid + ((@_generateIdBlock() for i in [1..3]).join '')

  _getDocumentsIds: ->
    ids = (@_storage.key keyId for keyId in [0...@_storage.length])
    docId for docId in ids when @_validDocumentId docId

  _validDocumentId: (docId) ->
    (new RegExp "^[0-9a-f]{16}$").test docId

class Collection
  constructor: (@db, @name, @cid) ->

  insert: (document) ->
    docId = @_resolveDocumentId document
    @db.storage.store(docId, document)
    docId

  get: (docId) ->
    @db.get docId

  find: (criteria = {}, subset = {}) ->
    docs = @db.getAll @_getDocumentsIds()
    @_subset(subset, doc) for doc in docs when @_matchCriteria(criteria, doc)

  remove: (criteria = {}) ->
    @db.remove docId for docId in @_getDocumentsIds() when @_matchCriteria(criteria, @db.get docId)

  _resolveDocumentId: (document) ->
    if "_id" of document
      document._id
    else
      @db._generateDocumentId @cid

  @matches =
    criteria: (criteria, doc) ->
      switch typeof criteria
        when "object"
          for field, condition of criteria
            if not @matches.condition(doc, field, condition)
              false
            true
        when "function"
          not not criteria doc # convert to boolean
        else
          true

    condition: (doc, field, condition) ->
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
              false
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

  _subset: (subset, doc) ->
    doc # TODO

  _getDocumentsIds: ->
    ids = @db._getDocumentsIds()
    docId for docId in ids when @_collectionDocument docId

  _collectionDocument: (docId) ->
    docId[0...4] == @cid

if @localStorage
  @db = new DB @localStorage
  try
    @sdb = new DB @sessionStorage
  catch e
    # sessionStorage in not available on local web pages
    @sdb = null
else
  @db = @sdb = null