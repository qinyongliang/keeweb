const AutoTypeHelper = function () {};

AutoTypeHelper.prototype.getActiveWindowInfo = function (callback) {
    const url = window.utools.getCurrentBrowserUrl();
    return callback({
        id: '',
        url,
        title: ''
    });
};

export { AutoTypeHelper };
