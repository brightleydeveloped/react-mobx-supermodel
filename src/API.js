import request from 'axios';

class API {
    headers() {
        return {

        };
    }

    makeRequest(options = {}) {
        options.headers = Object.assign({}, options.headers || {}, this.headers());

        return request({
            method: options.method || 'get',
            ...options
        }).then(function (response) {
            return response;
        });
    }
}

export default API;