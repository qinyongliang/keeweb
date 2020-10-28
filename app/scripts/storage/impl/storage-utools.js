import { StorageBase } from 'storage/storage-base';

class StorageUtools extends StorageBase {
    name = 'utools';
    enabled = true;
    system = true;
    cacheName = 'file-cache-';

    save(id, opts, data, callback) {
        const file = window.bufferFrom(data);
        const record = window.utools.db.get(this.cacheName + id);
        const res = record
            ? window.utools.db.putAttachment(
                  this.cacheName + id,
                  'file',
                  record._rev,
                  file,
                  'text/plain'
              )
            : window.utools.db.putAttachment(this.cacheName + id, 'file', file, 'text/plain');
        this.logger.debug('cache saved', id, res);
        return callback && callback();
    }

    load(id, opts, callback) {
        const data = window.utools.db.getAttachment(this.cacheName + id, 'file');
        if (data) {
            return callback && callback(null, data.buffer);
        }
        return callback && callback();
    }

    remove(id, opts, callback) {
        window.utools.db.remove(this.cacheName + id);
        return callback && callback();
    }
}

export { StorageUtools };
