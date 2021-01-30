const { electron, app, ipcRenderer } = require('electron');
const axios = require('axios');
const fs = require('fs');
const { shell } = require('electron');
const open = require('open');
const moment = require('moment');

// Get photo data, calculate year options
async function loadYearsToPage() {
    var username = document.getElementById("txtUsername").value;
    var userId = await getUserId(username);
    var userPhotoLibrary = await getUserPhotos(userId, false);
    var userPhotoFeed = await getUserPhotos(userId, true);

    console.log(userId);
    //console.log(userPhotoLibrary);
    //console.log("=========================================");
    //console.log(userPhotoFeed);


    // Creates a list of years for the user to choose from
    var yearCollection = [];
    userPhotoFeed.forEach((image) => {
        var date = moment(image.CreatedAt).format("MM/DD/YYYY");
        var year = moment(date).format("YYYY");
        if (yearCollection.length == 0) {
            yearCollection.push(year);
        } else if (!yearCollection.includes(year)) {
            yearCollection.push(year);
        }
    });

    userPhotoLibrary.forEach((image) => {
        var date = moment(image.CreatedAt).format("MM/DD/YYYY");
        var year = moment(date).format("YYYY");
        if (yearCollection.length == 0) {
            yearCollection.push(year);
        } else if (!yearCollection.includes(year)) {
            yearCollection.push(year);
        }
    });

    console.log(yearCollection);
}

// Function takes a userID and returns back a user's entire public photo library
async function getUserPhotos(userId, photoFeed) {
    var urlUserPhotos = 'https://api.rec.net/api/images/v4/player/' + userId + '?skip=0&take=100000';
    var urlUserFeed = 'https://api.rec.net/api/images/v3/feed/player/' + userId + '?skip=0&take=100000';
    var url = urlUserPhotos;

    if (photoFeed) {
        url = urlUserFeed
    }

    return new Promise(function (resolve, reject) {

        axios.get(url)
            .then(function (response) {
                // handle success
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

// Function takes in a RecNet Display name and converts it to a RecNet user ID.
async function getUserId(recNetDisplayName) {
    var url = 'https://accounts.rec.net/account?username=' + recNetDisplayName;

    return new Promise(function (resolve, reject) {

        // https://accounts.rec.net/account?username=rocko
        axios.get(url)
            .then(function (response) {
                // handle success
                //console.log('Obtained User ID!');
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

// Function will analyze photos and write data back to the user's disc
async function analyzePhotos() {
    var username = document.getElementById("txtUsername").value;
    var userId = await getUserId(username);
    var userPhotoLibrary = await getUserPhotos(userId, false);
    var userPhotoFeed = await getUserPhotos(userId, true);

    console.log(userId);

    // Grabs only photos specific to the selected year
    var newPhotoFeed = [];
    userPhotoFeed.forEach((image) => {
        if (moment(image.CreatedAt).isSame('2021-01-01', 'year')) {
            newPhotoFeed.push(image);
        } 
    });

    var newPhotoLibrary = [];
    userPhotoLibrary.forEach((image) => {
        if (moment(image.CreatedAt).isSame('2021-01-01', 'year')) {
            newPhotoLibrary.push(image);
        } 
    });

    var totalPhotosShared = newPhotoLibrary.length;
    var totalPhotosTaggedIn = newPhotoFeed.length;
    console.log("Photo Feed: ")
    console.log(newPhotoFeed.length);

    console.log("Photo Library: ")
    console.log(newPhotoLibrary.length);
}
