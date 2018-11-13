import {extendObservable, action, toJS, computed} from 'mobx';
import API from './API';
import fromJS from './utils/from-js';

class Model {
    options() { return { baseUrl: '', basePath: '', resource: '' } };

    fields() { return {} };

    constructor(_options = {}) {
        this._options = Object.assign({}, this.options(), _options);
        this._fields = Object.assign({}, this.fields(), _options.fields || {});

        extendObservable(this, Object.assign({}, {
            id: '',
            load: action(this.loadItem.bind(this)),
            fetch: action(this.fetchItem.bind(this)),
            save: action(this.saveItem.bind(this))
        }, this._fields));
    }

    getAPI() {
        return new API();
    }

    getURL(options = { id: '', path: '' }) {
        let path = '';
        if(options.path) {
            if(options.path[0] !== '/') {
                path = this._options.basePath + '/' + options.path;
            } else {
                path = options.path;
            }
        } else if (options.id) {
            path = this._options.basePath + '/' + this._options.resource + '/' + options.id;
        } else {
            path = this._options.basePath + '/' + this._options.resource;
        }

        return this._options.baseUrl + '/' + path;
    }

    loadItem() {
        return this.fetchItem();
    }

    fetchItem(options = {}) {
        const api = new API();

        if (!this.loading) {
            debugger
            return this.loading = api.makeRequest({
                method: "get",
                url: this.getURL({ id: this.id, path: options.path }),
                ...options
            })
                .then((response) => {
                    this.loading = false;
                    let data = this.getDataFromResponse(response);
                    if(data) {
                        this.fromJS(data);
                    }
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
            url: this.getURL({ id: this.id, path: options.path }),
            method: this.id ? 'put': 'post',
            data: options.data || toJS(this),
            ...options
        })
            .then((response) => {
                if(response.data.success) {
                    if (response.data) {
                        this.fromJS(this.getDataFromResponse(response));
                    }
                } else {
                    this.error = response.data.message;
                }
                return this;
            })
    }

    fromJS(data) {
        return fromJS.call(this, data);
    }
}

export default Model;