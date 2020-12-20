const { electron, app, ipcRenderer } = require('electron');
const axios = require('axios');
const fs = require('fs');
const Path = require('path');
var http = require('http');
//var request = require('request');
const { shell } = require('electron');
//const sleep = require('util').promisify(setTimeout);
// Electron-Store for saving preferences
var userAccountId = 0;

//var filePath = app.getPath("userData");
var INDEVELOPMENTMODE = true;
var filePath = 'C:/RNC/';
var appDataPath = './appData/';
var dataCache = 'cache/';

let photoSync = require('../appdata/photosync/ImageSyncData.json');
var inProgress = false;
var USER_ID = 0;
var PAGE_NUM = 0;

const version = document.getElementById('versionNumber');    
ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (event, arg) => {
  ipcRenderer.removeAllListeners('app_version');
  version.innerText = 'V' + arg.version;
});

const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

ipcRenderer.on('update_available', () => {
  ipcRenderer.removeAllListeners('update_available');
  message.innerText = 'A new update is available. Downloading now...';
  notification.classList.remove('hidden');
});

ipcRenderer.on('update_downloaded', () => {
  ipcRenderer.removeAllListeners('update_downloaded');
  message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
  restartButton.classList.remove('hidden');
  notification.classList.remove('hidden');
});

function closeNotification() {
    notification.classList.add('hidden');
}

function restartApp() {
    ipcRenderer.send('restart_app');
}

// Photo Sync (Run every 5 seconds for 50 requests/downloads each)
// var z = 0;
// function startSyncTick(){
//     var interval = setInterval(async function(){ 
//         //this code runs every second 
//         console.log('Interval set..');
//         if (!inProgress){
//             clearInterval(interval);
//             console.log("Stopped photo sync for now..");
//         } else {
//             console.log("Syncing... " + z);
    
//             // Read File Sync Data to variables
//             if (USER_ID < 0) 
//             {
//                 console.log("Error occurred in sync process: User ID cannot be 0.");
//                 inProgress = false;
//                 return;
//             };
    
//             var photoSyncJson = photoSync;
//             var index = photoSyncJson.ImageSyncData.findIndex(x => x.userId === USER_ID);
//             if (index === -1){
//                 console.log('Error occured in sync process: Invalid Index.');
//                 inProgress = false;
//                 return;
//             }
            
//             //get variable values
//             var page = photoSyncJson.ImageSyncData[index].page;
//             var imageNameArray = [];
//             console.log('Page Number: ' + page);
    
//             // for each to process in batches of images
//             // getAnArray of image names to send out async
//             // imageNumStart = page * 1;
//             var rawUserImageData = fs.readFileSync('./appdata/cache/' + USER_ID + '/publicImageLibrary.json');
//             var ImageJson = JSON.parse(rawUserImageData);
//             //console.log("Image JSON: ");
//             //console.log(ImageJson);
    
//             var i;
//             for (i = PAGE_NUM; i < ImageJson.length; i++) {
//                 if (i >= ImageJson.length) {
//                     console.log(ImageJson.length);
//                     console.log('Index did not exist in image JSON.. Exiting.. ' + i);
//                     break;
//                 }
//                 var imageName = ImageJson[i].ImageName;
//                 var imageExists = await checkIfImageExists(imageName, USER_ID);

//                 if (imageExists) {
//                     console.log('Image already exists on disk: ' + imageName);
//                     continue;
//                 }
//                 console.log("Image did not exist.. Adding image to array.. " + i);
    
//                 imageNameArray.push(imageName);
    
//                 if (imageNameArray.length === 50){
//                     console.log("Image array contains 50 images.");
//                     break;
//                 }
//             }
    
//             if (imageNameArray.length < 50){
//                 inProgress = false;
//                 PAGE_NUM = 0;
//                 // add 50 to page (rename page to LastItemIndex)
    
//                 // realistically write out some data to that file as well..
//             }    
//             // Add 50 to page (LastItemIndex)
        
    
//             // Download Images from RecNet and write to disk.
//             //var ImageData = getImageData(imageNameArray[element]);
    
//             // For each item in the array call an async function to download and write file to disk
//             imageNameArray.forEach(image => downloadImageAndWriteFile(image, USER_ID)); // <== Put that fancy async business here
    
//             PAGE_NUM = PAGE_NUM + 50;

//             // write back out at some point to the last sync file
//             //syncUserPhotoLibrary();
//             z++;
//         }
//     }, 5000);    
// }

// function downloadImageAndWriteFile(imageName, userId) { 
//     console.log('Attempting to download and store.. ' + imageName);

//     var IMAGE_URL = 'https://img.rec.net/' + imageName;
//     var szPath = appDataPath + dataCache + userId + '/Images/' + imageName;

//     //console.log(IMAGE_URL);
//     var imageNameNoExt = imageName;
//     if (imageNameNoExt.includes(".jpg")){
//         imageNameNoExt = imageNameNoExt.replace('.jpg','');
//     }

//     //console.log('Image Name no Extention: ' + imageNameNoExt);
//     //console.log(appDataPath + dataCache + userId + '/Images/' + imageNameNoExt + ".jpeg");

//     downloadFile({
//         remoteFile: IMAGE_URL,
//         localFile: appDataPath + dataCache + userId + '/Images/' + imageNameNoExt + ".jpeg",
//         //onProgress: function (received,total){
//         //    var percentage = (received * 100) / total;
//         //    console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
//         //}
//     }).then(function () {
//         console.log("File succesfully downloaded");
//     });
// }

// Order...
// Get look at photo name in array..
// Look in the folder for that photo name
//      if it exists.. skip that photo
// ELSE
//      Call the API to get the photo
//            Write the photo to disk


// async function checkIfImageExists(imageName, userId) {
//     // Add actual IMAGE folder to this path

//     var imageNameNoExt = imageName;
//     if (imageNameNoExt.includes(".jpg")){
//         imageNameNoExt = imageNameNoExt.replace('.jpg','');
//     }

//     var imageNameCorrected = imageNameNoExt + '.jpeg';

//     var szPath = appDataPath + dataCache + userId + '/Images/' + imageNameCorrected;

//     //console.log('PATH: ' + szPath);

//     if (!fs.existsSync(appDataPath + dataCache + userId + '/Images/')) {
//         console.log("Creating image folder for user: " + userId + ".");
//         fs.mkdirSync(appDataPath + dataCache + userId + '/Images/');
//     }

//     try {
//         if (fs.existsSync(szPath)) {
//             //file exists
//             console.log('Image Exists.. Skipping it..');
//             return true;
//         } else {
//             console.log('Image does not exist..');
//             return false;
//         }
//     } catch (err) {
//         console.error(err)
//     }
// }

function readPhotoSyncJson(startSync, userId) {
    console.log("ReadPhotoSyncJson Fired!");
    var photoSyncJson = photoSync;
    var index = photoSyncJson.ImageSyncData.findIndex(x => x.userId === userId);

    //console.log(index);

    if (startSync) {
        inProgress = true;
        USER_ID = userId;
        if (index === -1) {
            console.log("Adding new user to array...");
            photoSyncJson['ImageSyncData'].push({"lastSync":new Date(), "page":0, "syncCurrentlyInprogress": true, "userId": userId});
        } else {
            console.log("Editing existing user in array...");
            photoSyncJson.ImageSyncData[index].lastSync = new Date();
            photoSyncJson.ImageSyncData[index].page = 0;
            photoSyncJson.ImageSyncData[index].syncCurrentlyInprogress = true;
            photoSyncJson.ImageSyncData[index].userId = userId;
        }
        let fileData = JSON.stringify(photoSyncJson);

        console.log(fileData);

        var filePath = './appdata/photosync/ImageSyncData.json';

        fs.writeFileSync(filePath, fileData);
        console.log('Updated file values.');

        // Trigger the interval function to run and process photos
        startSyncTick();
    }
}

// async function syncUserPhotoLibrary() {
//     console.log("Running Sync...");
//     var username = document.getElementById("txtUsername").value;
//     var userId = await getUserId(username);
//     var userPhotoLibrary = await getUserPublicPhotoLibrary(userId);

//     writeJsonFileToFolder(appDataPath + dataCache, userPhotoLibrary,'publicImageLibrary.json', userId);

//     console.log('Username: ' + username);
    
//     //console.log('User ID: ' + userId);
//     document.getElementById("userId").innerHTML = userId;

//     //console.log('User Photo Library Size: ' + userPhotoLibrary.length);
//     document.getElementById("totalPhotos").innerHTML = userPhotoLibrary.length;

//     //organizePhotosForDownload(userPhotoLibrary);
//     readPhotoSyncJson(true, await userId);
// }

// Get the image data from REC NET
// async function getImageData(imageName) {
//     var IMAGE_URL = 'https://img.rec.net/' + imageName;

//     console.log(IMAGE_URL);

//     // 'https://api.rec.net/api/images/v4/player/PLAYER_ID?skip=0&take=50000'
//     axios.get(IMAGE_URL)
//         .then(function (response) {
//             // handle success
//             console.log('Successfully retreived image from image database.');
//             return response.data;
//         })
//         .catch(function (error) {
//             // handle error
//             console.log(error);
//         })
//         .then(function () {
//             // always executed
//         });
// }

// Can this be kept syncronous?
// function organizePhotosForDownload(photoJSON) {
//     var numOfConcurrency = 50;
//     var numOfCollections = photoJSON.length / numOfConcurrency;
//     var numOfCollectionsMod = photoJSON.length % numOfConcurrency;
//     var collectionOfBuckets = [];

//     console.log("Division: " + Math.floor(numOfCollections));
//     console.log("Modulus: " + numOfCollectionsMod);

//     var i;
//     for (i = 0; i < Math.floor(numOfCollections); i++) {
//         collectionOfBuckets.push(new Array);
//     }
//     if (numOfCollectionsMod > 0) {
//         collectionOfBuckets.push(new Array);
//     }

//     // Put each image name into the collection
//     var n = 0; // Iterator for collectionOfBuckets
//     photoJSON.forEach(element => {
//         console.log("ELEMENT: " + element.ImageName);
//         console.log("N = " + n);
//         collectionOfBuckets[n].push(element.ImageName)
//         if (collectionOfBuckets[n].length >= numOfConcurrency) {
//             n++;
//         }
//     });

//     console.log(photoJSON[0].ImageName);
//     console.log(collectionOfBuckets.length);
//     console.log(collectionOfBuckets);

//     // Next Step: put each promise into a collection so it can be sent off.
//     //https://stackoverflow.com/questions/53948280/how-to-throttle-promise-all-to-5-promises-per-second

//     var goOn = true;
//     var i = 0;
//     do {
//         console.log("Error issue: " + collectionOfBuckets[0].length);
//         // Iterate through items in the given set
//         collectionOfBuckets[i].forEach(element => console.log("WHAT IS THIS?!: " + element.length));

//         // time out function
//         setTimeout(function () {
//             console.log("Time out complete");
//             return true;
//          }, 5000);

//         // increment to next collection
//         if (i = (collectionOfBuckets.length - 1)) {
//             console.log("We have reached the last collection. i = " + i + " Array Length: " + collectionOfBuckets.length);
//             goOn  = false;
//         }

//         i = i + 1;
//     } 
//     while (goOn = true);
// }

// function syncUserPhotos(userId) {
//     //if (!bUserDisabledPhotoSync) {
//     // look in their file system and see if the folder exists
//     axios.get('https://api.rec.net/api/images/v4/player/' + userId + '?skip=0&take=50000')
//         .then(function (response) {
//             // handle success
//             console.log(response);
//             console.log(response.data.length);
//             document.getElementById("totalPhotos").innerHTML = response.data.length;

//             var count = 0;
//             response.data.forEach(element => {

//                 //if (count > 2) {
//                     sleep(10000).then(() => {
//                         console.log("one second has elapsed");
//                         count = 0;
//                     });
//                 //};

//                 count++;
//                 console.log(count);

//                 //console.log(response.data[i].ImageName);
//                 var imageName = element.ImageName;
//                 var IMAGE_URL = 'https://img.rec.net/' + imageName;
//                 console.log(element.ImageName);
//                 // axios download code here        
//                 //downloadFile(IMAGE_URL, './images/' + element.imageName + '.png');
//                 downloadFile({
//                     remoteFile: IMAGE_URL,
//                     localFile: "F:\\AugmentedRR\\images\\" + element.ImageName + ".jpeg",
//                     //onProgress: function (received,total){
//                     //    var percentage = (received * 100) / total;
//                     //    console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
//                     //}
//                 }).then(function () {
//                     console.log("File succesfully downloaded");
//                 });

//                 // axios({
//                 //   method: 'get',
//                 //   url: IMAGE_URL,
//                 //   responseType: 'stream'
//                 // })
//                 //   .then(function (response) {
//                 //     response.data.pipe(fs.createWriteStream('./images/ada_lovelace.jpg'))
//                 //   });

//                 //downloadFile(IMAGE_URL, '../images/');

//                 // has some downloading issues...

//                 //   download.image(options)
//                 //     .then(({ filename }) => {
//                 //       console.log('Saved to', filename)  // saved to /path/to/dest/image.jpg
//                 //     })
//                 //     .catch((err) => console.error(err))


//                 //var k = data[i].ImageName
//                 //download('https://img.rec.net/' + data[i].ImageName, 'image' + i + '.png', function(){})
//             });
//         })
//         .catch(function (error) {
//             // handle error
//             console.log(error);
//         })
//         .then(function () {
//             // always executed
//         });
//     // if not create the folder and download all images to place inside of the folder

//     //else if the folder exists.  For each photo returned by recnet verify it exists in the file system
//     // if it does not then download it from the image database and write the file to disc
//     // Make a request for a user with a given ID
// }

// function downloadFile(configuration) {
//     return new Promise(function (resolve, reject) {
//         // Save variable to know progress
//         var received_bytes = 0;
//         var total_bytes = 0;

//         var req = request({
//             method: 'GET',
//             uri: configuration.remoteFile
//         });

//         var out = fs.createWriteStream(configuration.localFile);
//         req.pipe(out);

//         req.on('response', function (data) {
//             // Change the total bytes value to get progress later.
//             total_bytes = parseInt(data.headers['content-length']);
//         });

//         // Get progress if callback exists
//         if (configuration.hasOwnProperty("onProgress")) {
//             req.on('data', function (chunk) {
//                 // Update the received bytes
//                 received_bytes += chunk.length;

//                 configuration.onProgress(received_bytes, total_bytes);
//             });
//         } else {
//             req.on('data', function (chunk) {
//                 // Update the received bytes
//                 received_bytes += chunk.length;
//             });
//         }

//         req.on('end', function () {
//             resolve();
//         });
//     });
// }

// #######################################################################################
//                            NEW GENERIC REUSABLE FUNCTIONS
// #######################################################################################
// 
// **************
// I think I need some awaits to get these to function correctly...
// **************


// Generic function for returning a list of files in a directory
// folderPath = './images'
// Returns: array of string
// function listFilesInFolder(folderPath) {
//     var fileList = [];
//     fs.readdirSync(folder).forEach(file => {
//         fileList.push(file);
//     });
//     console.log(fileList);
//     return fileList;
// }

// Function takes in a RecNet Display name and converts it to a RecNet user ID.
async function getUserId(recNetDisplayName) {
    var url = 'https://accounts.rec.net/account?username=' + recNetDisplayName;

    return new Promise(function (resolve, reject) {

        // https://accounts.rec.net/account?username=rocko
        axios.get(url)
            .then(function (response) {
                // handle success
                //console.log('Successfully retrieved USER_ID (' + response.data.accountId + ') for user ' + recNetDisplayName);
                //return response.data.accountId;
                resolve(response.data.accountId);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
                reject(error);
            })
            .then(function () {
                // always executed
            });
    });
}

// Function takes a userID and returns back a user's entire public photo library
async function getUserPublicPhotoLibrary(userId) {
    var url = 'https://api.rec.net/api/images/v4/player/' + userId + '?skip=0&take=50000'

        return new Promise(function (resolve, reject) {

            // https://accounts.rec.net/account?username=rocko
            axios.get(url)
                .then(function (response) {
                    // handle success
                    //console.log('Successfully retreived photos for USER_ID: '+ userId + ' Count: ' + response.data.length);
                    //return response.data.accountId;
                    resolve(response.data);
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                    reject(error);
                })
                .then(function () {
                    // always executed
                });
        })
}

// function takes in a imageName and returns the image associated
// returns image data (separate function for downloading)
async function getImageData(imageName) {
    var IMAGE_URL = 'https://img.rec.net/' + imageName;

    // 'https://api.rec.net/api/images/v4/player/PLAYER_ID?skip=0&take=50000'
    axios.get(IMAGE_URL)
        .then(function (response) {
            // handle success
            console.log('Successfully retreived image from image database.');
            return response.data;
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .then(function () {
            // always executed
        });
}


// Writes JSON data to a specific users folder based on the user's RR ID.
function writeJsonFileToFolder(path, fileData, fileName, userId) {
    let data = JSON.stringify(fileData);
    var filePath = path + userId;
    if (!fs.existsSync(filePath)) {
        console.log("Creating cache folder for user: " + userId + ".");
        fs.mkdirSync(filePath);
    }
    fs.writeFileSync(filePath + '/' + fileName, data);
    // Update last sync time
}

//swap all functions to be generic and re useable

// redo feed API function to be more generic

//======================================================================
// Image Download above
//======================================================================
// New sorting code for rendering images on the page

// async function syncUserPhotoLibrary() {
//     console.log("Running Sync...");
//     var username = document.getElementById("txtUsername").value;
//     var userId = await getUserId(username);
//     var userPhotoLibrary = await getUserPublicPhotoLibrary(userId);

//     writeJsonFileToFolder(appDataPath + dataCache, userPhotoLibrary,'publicImageLibrary.json', userId);

//     console.log('Username: ' + username);
    
//     //console.log('User ID: ' + userId);
//     document.getElementById("userId").innerHTML = userId;

//     //console.log('User Photo Library Size: ' + userPhotoLibrary.length);
//     document.getElementById("totalPhotos").innerHTML = userPhotoLibrary.length;

//     //organizePhotosForDownload(userPhotoLibrary);
//     readPhotoSyncJson(true, await userId);
// }

function toggleButtonOldestNewest() {
    var button = document.getElementById("btnOldestToNewest");
    
    if (button) {
        if (button.value === "1") {
            button.value = "0";
            button.innerText = "Newest to Oldest";
        } else {
            button.value = "1";
            button.innerText = "Oldest to Newest";
        }
    }
}

async function loadImagesOntoPage() {
    var username = document.getElementById("txtUsername").value;
    var userId = await getUserId(username);
    var userPhotoLibrary = await getUserPublicPhotoLibrary(userId);
    //document.getElementById("userId").innerHTML = userId;
    //document.getElementById("totalPhotos").innerHTML = userPhotoLibrary.length;
    var dateOrder = document.getElementById("btnOldestToNewest");
    //console.log("normal");
    //console.log(userPhotoLibrary);
    //console.log(dateOrder.value);
    if (dateOrder.value == "1") { // Oldest to Newest
        userPhotoLibrary = userPhotoLibrary.reverse();
        //console.log("Reversed");
        //console.log(userPhotoLibrary);
    }

    var imageDiv = document.getElementById("grid");
    while(imageDiv.firstChild) { 
        imageDiv.removeChild(imageDiv.firstChild); 
    } 

    // Generate image HTML
    loadImagesIntoPage(userPhotoLibrary);
}

function loadImagesIntoPage(userPhotoLibrary) {
    var imageDiv = document.getElementById("grid");
    while (imageDiv.firstChild) {
        imageDiv.removeChild(imageDiv.firstChild);
    }

    // Generate image HTML
    var i = 0;
    for (i = 0; i < userPhotoLibrary.length; i++) {
        var img = document.createElement("img");
        var imageUrl = 'https://img.rec.net/' + userPhotoLibrary[i].ImageName + '?width=500';
        img.setAttribute('data-src', imageUrl);
        img.classList.add("grid-image");
        //img.src = "";

        var divGridItem = document.createElement("div");
        divGridItem.classList.add("grid-item");
        divGridItem.setAttribute('type', 'button');
        divGridItem.setAttribute('data-toggle', 'modal');
        divGridItem.setAttribute('data-target', '#imageDetailModal');
        divGridItem.setAttribute('onclick', 'loadDataImageDetailModal(' + userPhotoLibrary[i].Id + '); return false;');
        divGridItem.appendChild(img);

        var pImageLink = document.createElement("p");
        pImageLink.classList.add("imageLink");
        pImageLink.innerText = "https://rec.net/image/" + userPhotoLibrary[i].Id;
        divGridItem.appendChild(pImageLink);

        var src = document.getElementById("grid");
        src.appendChild(divGridItem); // append Div
    }

    const targets = document.querySelectorAll('img');

    const lazyLoad = target => {
        let observer = {
            threshold: 1
        }
        const io = new IntersectionObserver((entries, observer) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');

                    if (img.hasAttribute('data-src')){
                        img.setAttribute('src', src);
                    }
                    observer.disconnect();
                }
            });
        });
        io.observe(target);
    };
    targets.forEach(lazyLoad);
};


function openRecNetExternalLink(url){
    shell.openExternal(url);
}

function clearImageSource() { // TODO figure out how to keep the image size so it doesnt jump up when the image loads in
    var modalDisplayImage = document.getElementById("imageDisplay");
    if (modalDisplayImage) {
        modalDisplayImage.src = "";
    }
}


async function loadDataImageDetailModal(imageId) {
    var username = document.getElementById("txtUsername").value; // This could be re written to not pull data if it is already available
    var userId = await getUserId(username);
    var userPhotoLibrary = await getUserPublicPhotoLibrary(userId);
    var imageData = {};
    var i = 0;
    for (i = 0; i < userPhotoLibrary.length; i++) {
        if (userPhotoLibrary[i].Id === imageId) {
            imageData = userPhotoLibrary[i];
            break;
        }
    };

    // Modal Elements
    var modalDisplayImage = document.getElementById("imageDisplay");

    if (modalDisplayImage) {
        var imageUrl = 'https://img.rec.net/' + imageData.ImageName;
        console.log(imageUrl);
        modalDisplayImage.src = imageUrl;
    }

    var modalImageId = document.getElementById("imageId");
    if (modalImageId) {
        modalImageId.innerText = imageId;
    }
}


// Function for each filter that takes in a JSON object and returns out a JSON sorted object

// Room Info
// https://api.rec.net/roomserver/rooms/bulk?Id=9515154

// Image Comments
//https://api.rec.net//api/images/v1/44549961/comments

// Sorts

// Sort Images by Date
//  sortByDate = 1
//  sortByPlayerNumber = 2
//  sortByCommentAmount = 3
//  sortByCheerAmount = 4
// function sortPhotosBy (photoLibaray, sortType, mostNewestFirst) {

// }

// Searches