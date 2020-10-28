import { Launcher } from 'comp/launcher';
import { IoFileCache } from 'storage/io-file-cache';
import { IoBrowserCache } from 'storage/io-browser-cache';
import { IoUtoolsCache } from 'storage/io-utools-cache';

const IoCache = window.utools ? IoUtoolsCache : Launcher ? IoFileCache : IoBrowserCache;

export { IoCache };
