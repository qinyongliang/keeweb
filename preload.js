window.require = {
    'electron':require('electron'),
    'path':require('path'),
    'fs':require('fs'),
}
window.bufferFrom = Buffer.from
window.runtime = ()=> process