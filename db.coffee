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
        (@get docId for docId in docIds)
    
    _store: (key, value) ->
        @storage.setItem key, (serializer.serialize value)

    _retrieve: (key) ->
        @storage.getItem key

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
    
    _getDocumentsIds: (cid) ->
        keys = (@storage.key keyId for keyId in [0...@storage.length])
        (docId for docId in keys when @_collectionDocument cid, docId)
    
    _collectionDocument: (cid, docId) ->
        (@_correctDocumentId docId) and docId[0...4] == cid
    
    _correctDocumentId: (docId) ->
        (new RegExp "^[0-9a-f]{16}$").test docId

class Collection
    constructor: (@db, @name, @cid) ->

    insert: (document) ->
        docId = @db._generateDocumentId @cid
        @db._store docId, document
        docId

    get: (docId) ->
        @db.get docId

    find: ->
        @db.getAll (@db._getDocumentsIds @cid)

if @localStorage
    @db = new DB @localStorage
    try
        @sdb = new DB @sessionStorage
    catch e
        # sessionStorage in not available on local web pages
        @sdb = null
else
    @db = @sdb = null
