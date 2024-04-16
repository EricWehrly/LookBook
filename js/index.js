

const carList = document.getElementById("carList");

function addFile(name, type, data) {

    const listItem = document.createElement('li');
    listItem.innerText = name;
    carList.appendChild(listItem);
}

function addImage(name, file) {

    const listItem = document.createElement('li');
    // listItem.innerText = name;
    carList.appendChild(listItem);
    const image = document.createElement('img');
    listItem.appendChild(image);
    
    const url = URL.createObjectURL(file);
    image.src = url;
}

  async function readContents(carName, fileHandle) {
    const file = await fileHandle.getFile();
    const contents = await file.text();
    const lines = contents.split('\n');
    if(lines.length > 0) {
      for(var lineNumber in lines) {
        var line = lines[lineNumber];
        if(line.indexOf("allowedPlaces") == 0) {
          var allowed = line.split("=")[1];
          // console.log(`${carName} allowed in ${allowed}`);
          
          var allowedItems = allowed.split(",");
          
          fileHandles[carName] = {
            "handle": fileHandle,
            "contents": contents,
            "currentAllowedLine": line,
            "allowedOrders": getAllowedOrders(allowedItems)
          };
          
          return allowedItems;
        }
      }
    }
  }
  
  async function allowedChecked(event) {
    // console.log(event);
    var checkbox = event.srcElement;
    var id = checkbox.id;
    var checked = checkbox.checked;
    // console.log(`Checkbox ${id} checked: ${checked}`);
    
    var carName = id.split('_')[0];
    var fileHandle = fileHandles[carName];
    // console.log(fileHandle);
    
    // var newAllowed = fileHandle["allowedOrders"];
    // var newContents = fileHandle["contents"].replace(
    var newContents = getNewContents(carName, fileHandle);
    fileHandle.contents = newContents;
    await writeFile(fileHandle.handle, newContents);
  }
  
  async function listFiles() {
      const dirHandle = await window.showDirectoryPicker();
      for await (const entry of dirHandle.values()) {
        // console.log(entry.name);
        if(entry.kind == "file") {
            await handleFile(dirHandle, entry);
        }
        else if(entry.kind == "directory") {
            await handleDirectory(dirHandle, entry);
        }
      }
    
    // console.log(fileHandles);
  }

  async function handleDirectory(dirHandle, entry) {
          var configCount = 0;
          var subDir = await dirHandle.getDirectoryHandle(entry.name);
          for await (const subEntry of subDir.values()) {
            if(subEntry.name.indexOf("config") == 0) await addCar(entry.name, subDir, subEntry);
          }
    
  }

  const ignored_types = [
    'text/calendar',
    'text/csv'
  ];

  async function handleFile(dirHandle, entry) {
    const fileHandle = await dirHandle.getFileHandle(entry.name);
    const file = await fileHandle.getFile();

    if(shouldIgnoreFile(file.type)) {
        return;
    }

    if(file.type.indexOf('image') > -1) {
        addImage(entry.name, file);
    } else {
        addFile(entry.name);
    }
    // console.log(file.type);
    // console.log(file);
  }

  function shouldIgnoreFile(fileType) {

    return fileType == null
        || fileType == ''
        || ignored_types.includes(fileType)
        || fileType.indexOf('application') > -1
  }