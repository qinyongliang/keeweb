const IoUtoolsCache = function (config) {
    this.basePath = null;
    this.cacheName = 'file-' + config.cacheName + '-';
    this.logger = config.logger;
};

Object.assign(IoUtoolsCache.prototype, {
    save(id, data, callback) {
        const file = window.bufferFrom(data);
        const record = window.utools.db.get(this.cacheName + id);
        const res = window.utools.db.putAttachment(
            this.cacheName + id,
            'file',
            record?._rev,
            file,
            'text/plain'
        );
        this.logger.debug('cache saved', id, res);
        return callback && callback();
    },

    load(id, callback) {
        const data = window.utools.db.getAttachment(this.cacheName + id, 'file');
        if (data) {
            return callback && callback(null, data.buffer);
        }
        return callback && callback();
    },

    remove(id, callback) {
        window.utools.db.remove(this.cacheName + id);
        return callback && callback();
    }
});

export { IoUtoolsCache };
