window.require = {
    'clipboard': require('electron').clipboard,
    'path': require('path'),
    'fs': require('fs'),
    'http': require('http')
};
window.bufferFrom = Buffer.from;
window.runtime = () => process;
