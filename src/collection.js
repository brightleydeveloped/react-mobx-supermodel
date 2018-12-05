import {extendObservable, action, observable } from 'mobx';

/**
 *
 * Collection
 * @constructor
 * @param {string} resource - The resource name that you're trying to access
 * @param {Object} Model - the Model this collection holds
 *
 */
class Collection {
    constructor(Model) {
        this.Model = Model;
        this.fromJS = this.fromJS.bind(this);

        extendObservable(this, {
            models: observable.map({}),
            fetch: action(this.fetch.bind(this)),
            setModel: action(this.setModel.bind(this)),
            collectionFromJS: action(this.collectionFromJS.bind(this)),
            loading: false,
            offset: 0,
            limit: 10,
            sort: ``,
            order: ``,
            total: 0,
            hasMore: true
        });
    }

    paginatedParams() {
        return {
            offset: this.offset,
            limit: this.limit,
            sort: this.sort,
            order: this.order
        };
    }

    headers() {
        return {};
    }

    fetch(options = {}) {
        const model = new this.Model();
        const api = model.getAPI();
        let url = model.getURL(options);


        if (this.loading !== null) {
            options.params = Object.assign({}, this.paginatedParams(), options.params || {});

            return this.loading = api.makeRequest({
                method: "get",
                url,
                headers: this.headers(),
                ...options
            })
                .then((response) => {
                    this.loading = false;
                    this.collectionFromJS(response);
                    if (response.data && response.data.results && response.data.results.length) {
                        if (response.data.results.length < this.limit) {
                            this.hasMore = false;
                        }
                    } else {
                        this.hasMore = false;
                    }
                    return this;
                })
                .catch((error) => {
                    console.error("Error while fetching", this.resource, error);
                    this.loading = null;
                    return this;
                })
        } else {
            return this.loading;
        }
    }

    updateOffset() {
        this.offset += this.limit;
    }

    collectionFromJS(response) {
        const data = response.data;

        if (data.results) {

            if (Array.isArray(data.results)) {
                data.results.forEach((result) => {
                    return this.fromJS(result)
                });
            } else if (typeof(data.results) === 'object') {
                Object.values(data.results).forEach((result) => {
                    return this.fromJS(result)
                });
            }

        }

        // loaded data, show data
    }

    fromJS(data) {
        const model = new this.Model();
        model.fromJS(data);
        this.setModel(model);
        return model;
    }

    setModel(model) {
        this.models.set(model.id, model);
    }

    update(value, options = {}) {
        let current_value = this.current_value;
        if (current_value !== value) {
            // changed
            current_value = value;

            return this.fetch(Object.assign({
                params: {
                    q: current_value
                }
            }, options));
        }
    }


    get size() {
        return this.models.size;
    }

    map(fn) {
        const map = [];
        this.models.forEach((m, i) => map.push(fn(m, i)));
        return map;
    }

    first() {
        return this.models.get(this.models.keys().next().value);
    }
}

export default Collection