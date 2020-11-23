const { electron } = require('electron');
const axios = require('axios');
const fs = require('fs');
const Path = require('path');
var http = require('http');
var request = require('request');

var userAccountId = 0;

// Importing the net Module from electron remote 
//const net = electron.remote.net; 

// var get = document.getElementById('get'); 
// get.addEventListener('click', () => { 
//     const request = net.request({ 
//         method: 'GET', 
//         protocol: 'http:', 
//         hostname: 'httpbin.org', 
//         path: '/get', 
//         redirect: 'follow'
//     }); 
//     request.on('response', (response) => { 
//         console.log(`STATUS: ${response.statusCode}`); 
//         console.log(`HEADERS: ${JSON.stringify(response.headers)}`); 

//         response.on('data', (chunk) => { 
//             console.log(`BODY: ${chunk}`) 
//         }); 
//     }); 
//     request.on('finish', () => { 
//         console.log('Request is Finished') 
//     }); 
//     request.on('abort', () => { 
//         console.log('Request is Aborted') 
//     }); 
//     request.on('error', (error) => { 
//         console.log(`ERROR: ${JSON.stringify(error)}`) 
//     }); 
//     request.on('close', (error) => { 
//         console.log('Last Transaction has occured') 
//     }); 
//     request.setHeader('Content-Type', 'application/json'); 
//     request.end(); 
// }); 

// takes in a '@' name and returns account information
function getUserId() {
    var username = document.getElementById("txtUsername").value;
    console.log(username);

    var url = 'https://accounts.rec.net/account?username=' + username;
    console.log('URL: ' + url);
    // https://accounts.rec.net/account?username=rocko
    axios.get(url)
        .then(function (response) {
            // handle success
            userAccountId = response.data.accountId;
            console.log(response);
            document.getElementById("userId").innerHTML = userAccountId;
            syncUserPhotos(userAccountId);
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .then(function () {
            // always executed
        });
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

function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
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