import { StorageBase } from 'storage/storage-base';

class StorageUtools extends StorageBase {
    name = 'utools';
    enabled = true;
    system = true;
    cacheName = 'file-attachment';
    init() {
        // upgrade
        for (const item of window.utools.db.allDocs()) {
            if (item._attachments?.file) {
                const file = item._attachments.file;
                const fileName = item._id.split('-').slice(2).join('-');
                const cacheNames = item._id.split('-').slice(0, 2);
                if (cacheNames[1] === 'cache') {
                    cacheNames[1] = 'attachment';
                }
                const cacheName = cacheNames.join('-');
                const data = window.utools.db.getAttachment(item._id, 'file');
                if (data) {
                    const record = window.utools.db.get(cacheName);
                    window.utools.db.putAttachment(
                        cacheName,
                        fileName,
                        record?._rev,
                        Buffer.from(data),
                        file.content_type
                    );
                    window.utools.db.remove(item._id);
                }
            }
        }
    }

    save(id, opts, data, callback) {
        const file = Buffer.from(data);
        const record = window.utools.db.get(this.cacheName);
        window.utools.db.putAttachment(this.cacheName, id, record?._rev, file, 'text/plain');
        return callback && callback();
    }

    load(id, opts, callback) {
        const data = window.utools.db.getAttachment(this.cacheName, id);
        if (data) {
            return callback && callback(null, data.buffer);
        }
        return callback && callback();
    }

    remove(id, opts, callback) {
        const record = window.utools.db.get(this.cacheName);
        window.utools.db.removeAttachment(this.cacheName, id, record?._rev);
        return callback && callback();
    }
}

export { StorageUtools };
