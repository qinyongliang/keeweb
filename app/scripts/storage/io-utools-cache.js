const IoUtoolsCache = function (config) {
    this.basePath = null;
    this.cacheName = 'file-' + config.cacheName;
    this.logger = config.logger;
};

Object.assign(IoUtoolsCache.prototype, {
    save(id, data, callback) {
        const file = Buffer.from(data);
        const record = window.utools.db.get(this.cacheName);
        const res = window.utools.db.putAttachment(
            this.cacheName,
            id,
            record?._rev,
            file,
            'text/plain'
        );
        this.logger.debug('cache saved', id, res);
        return callback && callback();
    },

    load(id, callback) {
        const data = window.utools.db.getAttachment(this.cacheName, id);
        if (data) {
            return callback && callback(null, data.buffer);
        }
        return callback && callback();
    },

    remove(id, callback) {
        const record = window.utools.db.get(this.cacheName);
        window.utools.db.removeAttachment(this.cacheName, id, record?._rev);
        return callback && callback();
    }
});

export { IoUtoolsCache };
