const API = {
    csrfToken: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
    basePath: document.querySelector('meta[name="base-path"]')?.getAttribute('content') || '',

    async request(endpoint, method = 'GET', data = null) {
        // Prepend base path to endpoint if it doesn't already have it
        let url = endpoint;
        if (this.basePath && !url.startsWith(this.basePath)) {
            url = this.basePath + endpoint;
        }

        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken
        };

        const config = {
            method,
            headers,
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get("content-type");

            if (response.status === 401) {
                // Redirect to login if unauthorized
                window.location.hash = '#/login';
                return null;
            }

            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, 'GET');
    },

    post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    }
};
export default API;
