const { electron, app } = require('electron');
const axios = require('axios');
const fs = require('fs');
const Path = require('path');
var http = require('http');
var request = require('request');
//const sleep = require('util').promisify(setTimeout);
// Electron-Store for saving preferences
var userAccountId = 0;

//var filePath = app.getPath("userData");
var INDEVELOPMENTMODE = true;
var filePath = 'C:/RNC/';

//TODO
// Save Feed JSON to folder on machine
//  - read top most item and see if it is a day old if so run sync

// Photo Sync (Run every 5 seconds for 50 requests/downloads each)
var z = 0;
var interval = setInterval(function(){ 
    //this code runs every second 
    if (z === 2){
        clearInterval(interval);
        console.log("Stopped photo sync for now..");
    }

    console.log("Syncing..." + z);
    syncUserPhotoLibrary();
    z++;
}, 5000);

async function syncUserPhotoLibrary() {
    console.log("Running Sync...");
    var username = document.getElementById("txtUsername").value;
    var userId = await getUserId(username);
    var userPhotoLibrary = await getUserPublicPhotoLibrary(userId);

    console.log('Username: ' + username);
    
    //console.log('User ID: ' + userId);
    document.getElementById("userId").innerHTML = userId;

    //console.log('User Photo Library Size: ' + userPhotoLibrary.length);
    document.getElementById("totalPhotos").innerHTML = userPhotoLibrary.length;

    //organizePhotosForDownload(userPhotoLibrary);
}

// Get the image data from REC NET
function getImageData(imageName) {
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

// Can this be kept syncronous?
function organizePhotosForDownload(photoJSON) {
    var numOfConcurrency = 50;
    var numOfCollections = photoJSON.length / numOfConcurrency;
    var numOfCollectionsMod = photoJSON.length % numOfConcurrency;
    var collectionOfBuckets = [];

    console.log("Division: " + Math.floor(numOfCollections));
    console.log("Modulus: " + numOfCollectionsMod);

    var i;
    for (i = 0; i < Math.floor(numOfCollections); i++) {
        collectionOfBuckets.push(new Array);
    }
    if (numOfCollectionsMod > 0) {
        collectionOfBuckets.push(new Array);
    }

    // Put each image name into the collection
    var n = 0; // Iterator for collectionOfBuckets
    photoJSON.forEach(element => {
        console.log("ELEMENT: " + element.ImageName);
        console.log("N = " + n);
        collectionOfBuckets[n].push(element.ImageName)
        if (collectionOfBuckets[n].length >= numOfConcurrency) {
            n++;
        }
    });

    console.log(photoJSON[0].ImageName);
    console.log(collectionOfBuckets.length);
    console.log(collectionOfBuckets);

    // Next Step: put each promise into a collection so it can be sent off.
    //https://stackoverflow.com/questions/53948280/how-to-throttle-promise-all-to-5-promises-per-second

    var goOn = true;
    var i = 0;
    do {
        console.log("Error issue: " + collectionOfBuckets[0].length);
        // Iterate through items in the given set
        collectionOfBuckets[i].forEach(element => console.log("WHAT IS THIS?!: " + element.length));

        // time out function
        setTimeout(function () {
            console.log("Time out complete");
            return true;
         }, 5000);

        // increment to next collection
        if (i = (collectionOfBuckets.length - 1)) {
            console.log("We have reached the last collection. i = " + i + " Array Length: " + collectionOfBuckets.length);
            goOn  = false;
        }

        i = i + 1;
    } 
    while (goOn = true);
}

function syncUserPhotos(userId) {
    //if (!bUserDisabledPhotoSync) {
    // look in their file system and see if the folder exists
    axios.get('https://api.rec.net/api/images/v4/player/' + userId + '?skip=0&take=50000')
        .then(function (response) {
            // handle success
            console.log(response);
            console.log(response.data.length);
            document.getElementById("totalPhotos").innerHTML = response.data.length;

            var count = 0;
            response.data.forEach(element => {

                //if (count > 2) {
                    sleep(10000).then(() => {
                        console.log("one second has elapsed");
                        count = 0;
                    });
                //};

                count++;
                console.log(count);

                //console.log(response.data[i].ImageName);
                var imageName = element.ImageName;
                var IMAGE_URL = 'https://img.rec.net/' + imageName;
                console.log(element.ImageName);
                // axios download code here        
                //downloadFile(IMAGE_URL, './images/' + element.imageName + '.png');
                downloadFile({
                    remoteFile: IMAGE_URL,
                    localFile: "F:\\AugmentedRR\\images\\" + element.ImageName + ".jpeg",
                    //onProgress: function (received,total){
                    //    var percentage = (received * 100) / total;
                    //    console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
                    //}
                }).then(function () {
                    console.log("File succesfully downloaded");
                });

                // axios({
                //   method: 'get',
                //   url: IMAGE_URL,
                //   responseType: 'stream'
                // })
                //   .then(function (response) {
                //     response.data.pipe(fs.createWriteStream('./images/ada_lovelace.jpg'))
                //   });

                //downloadFile(IMAGE_URL, '../images/');

                // has some downloading issues...

                //   download.image(options)
                //     .then(({ filename }) => {
                //       console.log('Saved to', filename)  // saved to /path/to/dest/image.jpg
                //     })
                //     .catch((err) => console.error(err))


                //var k = data[i].ImageName
                //download('https://img.rec.net/' + data[i].ImageName, 'image' + i + '.png', function(){})
            });
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .then(function () {
            // always executed
        });
    // if not create the folder and download all images to place inside of the folder

    //else if the folder exists.  For each photo returned by recnet verify it exists in the file system
    // if it does not then download it from the image database and write the file to disc
    // Make a request for a user with a given ID
}

function downloadFile(configuration) {
    return new Promise(function (resolve, reject) {
        // Save variable to know progress
        var received_bytes = 0;
        var total_bytes = 0;

        var req = request({
            method: 'GET',
            uri: configuration.remoteFile
        });

        var out = fs.createWriteStream(configuration.localFile);
        req.pipe(out);

        req.on('response', function (data) {
            // Change the total bytes value to get progress later.
            total_bytes = parseInt(data.headers['content-length']);
        });

        // Get progress if callback exists
        if (configuration.hasOwnProperty("onProgress")) {
            req.on('data', function (chunk) {
                // Update the received bytes
                received_bytes += chunk.length;

                configuration.onProgress(received_bytes, total_bytes);
            });
        } else {
            req.on('data', function (chunk) {
                // Update the received bytes
                received_bytes += chunk.length;
            });
        }

        req.on('end', function () {
            resolve();
        });
    });
}

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
function listFilesInFolder(folderPath) {
    var fileList = [];
    fs.readdirSync(folder).forEach(file => {
        fileList.push(file);
    });
    console.log(fileList);
    return fileList;
}

// Function takes in a RecNet Display name and converts it to a RecNet user ID.
async function getUserId(recNetDisplayName) {
    var url = 'https://accounts.rec.net/account?username=' + recNetDisplayName;

    return new Promise(function (resolve, reject) {

        // https://accounts.rec.net/account?username=rocko
        axios.get(url)
            .then(function (response) {
                // handle success
                console.log('Successfully retrieved USER_ID (' + response.data.accountId + ') for user ' + recNetDisplayName);
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
                    console.log('Successfully retreived photos for USER_ID: '+ userId + ' Count: ' + response.data.length);
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
function getImageData(imageName) {
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





//swap all functions to be generic and re useable

// redo feed API function to be more generic

