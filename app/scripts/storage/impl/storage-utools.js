import { StorageBase } from 'storage/storage-base';

class StorageUtools extends StorageBase {
    name = 'utools';
    enabled = true;
    system = true;
    cacheName = 'file-attachment';
    init() {}

    save(id, opts, data, callback) {
        const file = Buffer.from(data);
        window.utools.db.remove(id);
        window.utools.db.postAttachment(id, file, 'text/plain');
        return callback && callback();
    }

    load(id, opts, callback) {
        const data = window.utools.db.getAttachment(id);
        if (data) {
            return callback && callback(null, data.buffer);
        }
        return callback && callback();
    }

    remove(id, opts, callback) {
        window.utools.db.remove(id);
        return callback && callback();
    }
}

export { StorageUtools };
