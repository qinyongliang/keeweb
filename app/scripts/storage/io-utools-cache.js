const IoUtoolsCache = function (config) {
    this.basePath = null;
    this.cacheName = 'file-' + config.cacheName;
    this.logger = config.logger;
};

Object.assign(IoUtoolsCache.prototype, {
    save(id, data, callback) {
        const file = Buffer.from(data);
        window.utools.db.remove(id);
        const res = window.utools.db.postAttachment(id, file, 'text/plain');
        this.logger.debug('cache saved', id, res);
        return callback && callback();
    },

    load(id, callback) {
        const data = window.utools.db.getAttachment(id);
        if (data) {
            return callback && callback(null, data.buffer);
        }
        return callback && callback();
    },

    remove(id, callback) {
        window.utools.db.remove(id);
        return callback && callback();
    }
});

export { IoUtoolsCache };
