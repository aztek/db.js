###
db.js v0.1.0
###
class Serializer
    serialize: (object) ->
        JSON.stringify object
    
    deserialize: (string) ->
        JSON.parse string

class DB
    collectionsMetainfoKey = "_dbjs_collections"
    serializer = new Serializer

    constructor: (@storage) ->

    collection: (name) ->
        metainfo = do @_getCollectionsMetainfo
        if name of metainfo
            cid = metainfo[name]
        else
            cid = do @_generateCollectionId
            @_updateCollectionsMetainfo name, cid
        new Collection this, name, cid
    
    collections: ->
        metainfo = do @_getCollectionsMetainfo
        Object.keys metainfo
    
    get: (docId) ->
        serializer.deserialize (@_retrieve docId)

    getAll: (docIds) ->
        @get docId for docId in docIds

    remove: (docId) ->
        @_delete docId
        docId

    removeAll: (docIds) ->
        @_delete docId for docId in docIds
    
    _store: (key, value) ->
        @storage.setItem key, (serializer.serialize value)

    _retrieve: (key) ->
        @storage.getItem key

    _delete: (key) ->
        @storage.removeItem key

    _getCollectionsMetainfo: ->
        metainfo = @_retrieve collectionsMetainfoKey
        if metainfo != "undefined"
            serializer.deserialize metainfo
        else
            {}

    _updateCollectionsMetainfo: (name, cid) ->
        metainfo = do @_getCollectionsMetainfo
        metainfo[name] = cid
        @_store collectionsMetainfoKey, metainfo

    _generateIdBlock: ->
        # generate random 4 character hex string
        # http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        block = Math.floor ((1 + do Math.random) * 0x10000)
        (block.toString 16).substring 1

    _generateCollectionId: ->
        do @_generateIdBlock

    _generateDocumentId: (cid) ->
        cid + ((do @_generateIdBlock for i in [1..3]).join '')

    _getDocumentsIds: ->
        ids = (@storage.key keyId for keyId in [0...@storage.length])
        docId for docId in ids when @_validDocumentId docId
    
    _validDocumentId: (docId) ->
        (new RegExp "^[0-9a-f]{16}$").test docId

class Collection
    constructor: (@db, @name, @cid) ->

    insert: (document) ->
        docId = @db._generateDocumentId @cid
        @db._store docId, document
        docId

    get: (docId) ->
        @db.get docId

    find: (criteria = {}, subset = {}) ->
        docs = @db.getAll (do @_getDocumentsIds)
        @_subset subset, doc for doc in docs when @_matchCriteria criteria, doc

    remove: (criteria = {}) ->
        @db.remove docId for docId in (do @_getDocumentsIds) when @_matchCriteria criteria, (@db.get docId)

    _matchCriteria: (criteria, doc) ->
        switch typeof criteria
            when "object"
                for field, condition of criteria
                    if not @_matchCondition doc, field, condition
                        return false
                return true
            when "function"
                return not not criteria doc # convert to boolean
            else
                return true

    _matchCondition: (doc, field, condition) ->
        value = doc[field]
        switch typeof condition
            when "number", "string", "boolean"
                if value instanceof Array
                    return condition in value
                else
                    return value == condition
            when "object"
                for operator, operand of condition
                    if not @_matchOperator value, operator, operand
                        return false
                return true
            when "function"
                return not not condition value # convert to boolean
            else
                return true

    _matchOperator: (value, operator, operand) ->
        switch operator
            when "$ne"  then value != operand
            when "$gt"  then value >  operand
            when "$gte" then value >= operand
            when "$lt"  then value <  operand
            when "$lte" then value <= operand
            when "$exists" then operand == (value != undefined)
            when "$in"  then value in operand
            when "$nin" then value not in operand
            when "$size" then (value instanceof Array) && (value.length == operand)
            else true

    _subset: (subset, doc) ->
        doc # TODO
    
    _getDocumentsIds: ->
        ids = do @db._getDocumentsIds
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