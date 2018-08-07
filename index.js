'use strict';

const axios = require('axios');
//import axios from 'axios';

const items_mapper = type => {
    return ({name, uuid, id}) => {
        if( !uuid ) uuid=id;
        return {name, uuid, type};
    }
};

class DSpaceElement {
    constructor(dspace_base, rest_path, type='root', uuid=null) {
        this.dspace_base = dspace_base;
        this.rest_path = rest_path;
        this.rest_base = dspace_base+rest_path;
        this.uuid = uuid;
        this.type = type;
        this.name = null;
        this.communities = [];
        this.collections = [];
        this.metadata = [];
        this.bitstreams = [];
        this.ancestors = [];
        this.rawdata = null;
        this.items = [];
        this.links_map = {};
    }

    getLinkedItem(type, id) {
        return this.links_map[''+type+'_'+id];
    };

    _readAncestors(data) {
        this.rawdata = data;
        let ancestors = [];
        if(data && data.parentCommunityList)
            ancestors = ancestors.concat( data.parentCommunityList.map( items_mapper('communities') ) );
//            data.parentCommunityList.map( items_mapper('communities') ).forEach(({name, uuid, type}) => { ancestors.push({name, uuid, type}) });
        if(data && data.parentCollectionList)
            ancestors = ancestors.concat( data.parentCollectionList.map( items_mapper('collections') ) );
//            data.parentCollectionList.map( items_mapper('collections') ).forEach(({name, uuid, type}) => { ancestors.push({name, uuid, type}) });
        this.ancestors = ancestors;
    }
    _buildLinksMap() {
        this.links_map = this.ancestors.concat(this.communities, this.collections, this.items).reduce((obj, item) => {
            obj[''+item.type+'_'+item.uuid] = item
            return obj
        }, {});
        //console.log(this.links_map);
    }
}

class Root extends DSpaceElement {
    async load() {
        const url = this.rest_base + "/communities/top-communities";
        let response = await axios.get(url);
        this.communities = response.data.map( items_mapper('communities') );
    }
}
class Community extends DSpaceElement {
    async load() {
        const url = this.rest_base + `/communities/${this.uuid}?expand=all`;
        let response = await axios.get(url);
        if(response.data.communities)
            this.communities = response.data.communities.map( items_mapper('communities') );
        if(response.data.collections)
            this.collections = response.data.collections.map( items_mapper('collections') );
        this.name = response.data.name;
        this._readAncestors(response.data);
        this._buildLinksMap();
    }
}
class Collection extends DSpaceElement {
    async load() {
        const url = this.rest_base + `/collections/${this.uuid}?expand=all`;
        let response = await axios.get(url);
        if(response.data.collections)
            this.collections = response.data.collections.map( items_mapper('collections') );
        if(response.data.items)
            this.items = response.data.items.map( items_mapper('items') );
        this.name = response.data.name;
        this._readAncestors(response.data);
        this._buildLinksMap();
    }
}
class Item extends DSpaceElement {
    async load() {
        let url = this.rest_base + `/items/${this.uuid}?expand=all`;
        let dspace_base = this.dspace_base;
        let response = await axios.get(url);
        if(response.data.metadata)
            this.metadata = response.data.metadata.map(c => c);
        if(response.data.bitstreams)
//            this.bitstreams = response.data.bitstreams.map(c => { c.retrieveUrl = dspace_base+c.retrieveLink; return c});
            this.bitstreams = response.data.bitstreams.map(c => { c.retrieveUrl = dspace_base+c.link+"/retrieve"; return c; });
        this.name = response.data.name;
        this._readAncestors(response.data);
        this._buildLinksMap();
    }
}

class DSpace {
    static connect(dspace_base, rest_path) {
        return new DSpace(dspace_base, rest_path);
    }
    constructor(dspace_base, rest_path) {
        if( !dspace_base || !rest_path ) throw "DSpace: Base URL and REST API path missing";
        this.dspace_base = dspace_base;
        this.rest_path = rest_path;
        this.rest_base = dspace_base+rest_path;
    }
    async getItem(type='root', uuid=null) {
        let rez;
        let dspace_base = this.dspace_base;
        let rest_path = this.rest_path;
        switch(type) {
            case 'root':
                rez = new Root(dspace_base, rest_path, type, uuid);
                break;
            case 'communities':
                rez = new Community(dspace_base, rest_path, type, uuid);
                break;
            case 'collections':
                rez = new Collection(dspace_base, rest_path, type, uuid);
                break;
            case 'items':
                rez = new Item(dspace_base, rest_path, type, uuid);
                break;
            default: throw(`DSpace: Wrong Element Type ${type}`);
        }
        await rez.load();
        return rez;
    }
    getLinkedPreview( item, type, uuid ) {
            const idx = ''+type+'_'+uuid;
            return item && item.links_map ?
                item.links_map[idx] :
                null;
    };
}

module.exports = DSpace;
//module.exports.default = DSpace;

//export default DSpace;
