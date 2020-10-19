window.require = {
    'clipboard':require('electron').clipboard,
    'path':require('path'),
    'fs':require('fs'),
};
window.bufferFrom = Buffer.from;
window.runtime = ()=> process;