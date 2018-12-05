import {extendObservable, action, toJS, computed} from 'mobx';
import API from './API';
import fromJS from './utils/from-js';
import uuid from 'uuid';

class Model {
    options() { return { baseUrl: '', basePath: '', resource: '' } };

    fields() { return {} };

    // override resource to reference a non-unique resource
    resource() { console.warn("Using unique resource id. You should override resource() on this model."); return uuid.v4(); }

    key() {
        return this.resource() + this.id;
    }

    headers() {
        return {};
    }

    constructor(_options = {}) {
        this._options = Object.assign({}, this.options(), _options);
        this._fields = Object.assign({}, this.fields(), _options.fields || {});

        extendObservable(this, Object.assign({}, {
            id: '',
            error: '',
            load: action(this.loadItem.bind(this)),
            fetch: action(this.fetchItem.bind(this)),
            save: action(this.saveItem.bind(this))
        }, this._fields));
    }

    getAPI() {
        return new API();
    }

    getURL(options = { path: '' }) {
        let path = '';

        if(options.path) {
            path = options.path;
        } if (this.id) {
            path = this._options.basePath + '/' + this.resource() + '/' + this.id;
        } else {
            path = this._options.basePath + '/' + this.resource();
        }

        return this._options.baseUrl + '/' + path;
    }

    loadItem() {
        return this.fetchItem();
    }

    fetchItem(options = {}) {
        const api = new API();

        if (!this.loading) {
            return this.loading = api.makeRequest({
                method: "get",
                url: this.getURL(options),
                headers: this.headers(),
                ...options
            })
                .then((response) => {
                    this.loading = false;
                    this.fromJS(this.getDataFromResponse(response));
                    return this;
                });
        } else {
            return this.loading;
        }
    }

    getDataFromResponse(response) {
        let data = response.data;
        if (data) {
            if (data.result) {
                data = data.result;
            } else if (data.results && data.results[0]) {
                data = data.results[0];
            }
        }
        return data;
    }

    saveItem(options = {}) {
        let api = new API();
        let method = "post";

        return api.makeRequest({
            url: this.getURL(options),
            method: this.id ? 'put': 'post',
            headers: this.headers(),
            data: options.data || toJS(this),
            ...options
        })
            .then((response) => {
                this.fromJS(this.getDataFromResponse(response));
                return this;
            })
    }

    fromJS(data) {
        return fromJS.call(this, data);
    }
}

export default Model;