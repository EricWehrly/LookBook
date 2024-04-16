// https://stackoverflow.com/a/77132443/5450892
import { showDirectoryPicker } from 'https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js';
const showPicker = async () => {
    try {
        const handle = await showDirectoryPicker();
        console.log(handle);
    } catch (e) {
        console.log(e);
    }
};
window.showPicker = showPicker;
if(!window.showDirectoryPicker) window.showDirectoryPicker = showDirectoryPicker;
