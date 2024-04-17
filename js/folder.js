import { getOriginPrivateDirectory, showSaveFilePicker } from 'https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js'
window.showSaveFilePicker = showSaveFilePicker;

const Folders = {

    mainDirHandle: null,

    async getStartingDirectoryHandle() {

        Folders.mainDirHandle = await getOriginPrivateDirectory();
        console.log(Folders.mainDirHandle);
        writeMessage(Folders.mainDirHandle);
    }
};

(() => {
    const ponyLoad = document.getElementById('ponyLoad');
    ponyLoad.onclick = Folders.getStartingDirectoryHandle;
})();

export default Folders;
