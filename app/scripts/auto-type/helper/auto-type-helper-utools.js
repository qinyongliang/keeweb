const AutoTypeHelper = function () {};

AutoTypeHelper.prototype.getActiveWindowInfo = function (callback) {
    const host = window.getHost();
    return callback(null, {
        id: '',
        url: host ?? '',
        title: host ? '' : Window.prototype.activeApp
    });
};

export { AutoTypeHelper };
