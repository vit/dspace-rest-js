# dspace-rest-js

Simple DSpace REST API client for node, only reading supported

## Installation

```shell
  npm install @billypilgrim/dspace-rest-js --save
```

## Usage example (with express and jade)

### index.js (express router)

```js
var dspace = require('@billypilgrim/dspace-rest-js');
var conn = dspace.connect("https://dspace.example.com", "/rest")

router.get('/', function(req, res, next) {
    conn.getItem().then( item => res.render('index', { item }) );
});

router.get('/:type/:id', function(req, res, next) {
    conn.getItem(req.params.type, req.params.id).then( item => {
        let title = item.name;
        res.render('index', { item, title })
    } );
});
```

### index.jade (jade template)

```js
  if item.uuid
    a(href="/") Root
    | >
    each ancestor in item.ancestors
      - let path = "/" + ancestor.type + "/" + ancestor.uuid
      a(href=path)= ancestor.name
      | >

  h1= item.name || "Electronic Library"
  if item.communities && item.communities.length > 0
    h2 Communities
    ul
    each val in item.communities
      li
        a(href="/communities/"+val.uuid)= val.name

  if item.collections && item.collections.length > 0
    h2 Collections
    ul
    each val in item.collections
      li
        a(href="/collections/"+val.uuid)= val.name

  if item.items && item.items.length > 0
    h2 Items
    ul
    each val in item.items
      li
        a(href="/items/"+val.uuid)= val.name

  if item.metadata && item.metadata.length > 0
    h2 Metadata
    table
      thead
        th Key
        th Value
        th Language
      tbody
        each val in item.metadata
          tr
            td= val.key
            td= val.value
            td= val.language

  if item.bitstreams && item.bitstreams.length > 0
    h2 Bitstreams
    ul
    each val in item.bitstreams
      li
        =val.bundleName + ": "
        a(href=val.retrieveUrl)= val.name
        = " " + val.sizeBytes
        |&nbsp;Bytes

  if item.rawdata
    h2 Raw data
    p= JSON.stringify(item.rawdata)
```
