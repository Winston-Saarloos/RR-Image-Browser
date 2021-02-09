const { electron, app, ipcRenderer } = require('electron');
const axios = require('axios');
const fs = require('fs');
const { shell } = require('electron');
const open = require('open');
const moment = require('moment');
const anime = require('animejs');

var bCurrentlyRunning = false;

function updateProgressBar(progressNumber, loadingMessage) {
    var loadingText = document.getElementById('progressBarText');
    loadingText.innerText = loadingMessage;

    if (progressNumber != null) {
        var loadingBar = document.getElementById('loadingBar');
        loadingBar.value = progressNumber;
    }
}

// Get photo data, calculate year options
async function loadYearsToPage() {
    try {
        var usernameTextBox = document.getElementById("txtUsername");

        // User must enter their '@' RR name
        if (usernameTextBox.value === "") {
            return;
        }

        if (!bCurrentlyRunning) {
            bCurrentlyRunning = true;

            var btnLoad = document.getElementById("btnLoad");
            btnLoad.classList.add("is-loading");

            // Clear out old years
            const yearSelectionBox = document.getElementById('yearSelectionContainer');
            while (yearSelectionBox.firstChild) {
                yearSelectionBox.removeChild(yearSelectionBox.firstChild);
            }

            var userId = await getUserId(usernameTextBox.value);
            var userPhotoLibrary = await getUserPhotos(userId, false);
            var userPhotoFeed = await getUserPhotos(userId, true);

            // Disable the controls
            document.getElementById("txtUsername").disabled = true;
            document.getElementById("btnLoad").disabled = true;
            console.log(userId);

            // Creates a list of years for the user to choose from
            var yearCollection = [];
            userPhotoFeed.forEach((image) => {
                var date = moment(image.CreatedAt).format("YYYY-MM-DD");
                var year = moment(date).format("YYYY");
                if (yearCollection.length == 0) {
                    yearCollection.push(year);
                } else if (!yearCollection.includes(year)) {
                    yearCollection.push(year);
                }
            });

            userPhotoLibrary.forEach((image) => {
                var date = moment(image.CreatedAt).format("YYYY-MM-DD");
                var year = moment(date).format("YYYY");
                if (yearCollection.length == 0) {
                    yearCollection.push(year);
                } else if (!yearCollection.includes(year)) {
                    yearCollection.push(year);
                }
            });

            yearCollection.reverse();

            yearCollection.forEach((year) => {
                if (yearSelectionBox) {
                    const yearContainer = document.createElement("div");
                    yearContainer.classList.add("yearBtn");
                    yearSelectionBox.appendChild(yearContainer);

                    const yearButton = document.createElement("button");
                    yearButton.innerText = year;
                    yearButton.classList.add("yearBtnText");
                    yearButton.classList.add("yearBtnText:hover");
                    yearButton.setAttribute('onclick', 'yearClick(' + year + ', ' + userId + '); return false;');
                    yearButton.setAttribute('id', 'btn' + year);
                    yearContainer.appendChild(yearButton);
                }
            });

            let yearButtonAnimation = anime({
                targets: '.yearBtn',
                opacity: 1,
                duration: 4000,
                easing: 'linear',
                delay: anime.stagger(100)
            });
            yearButtonAnimation;

            // Re-enable the controls
            document.getElementById("txtUsername").disabled = false;
            document.getElementById("btnLoad").disabled = false;
            btnLoad.classList.remove("is-loading");
            bCurrentlyRunning = false;
        }
    }
    catch (err) {
        // Re-enable the controls
        document.getElementById("txtUsername").disabled = false;
        document.getElementById("btnLoad").disabled = false;
        btnLoad.classList.remove("is-loading");
        bCurrentlyRunning = false;

        // Add some error text on page TODO
    }
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
                //console.log(response.data);
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

// Function that fires after a year has been clicked by a user
function yearClick(year, userId) {
    const yearButton = document.getElementById('btn' + year);
    yearButton.classList.remove('yearBtnText');
    yearButton.classList.add('selectedYear');

    let removeElements = anime({
        targets: '.yearSelection',
        opacity: 0,
        duration: 500,
        easing: 'linear',
        delay: anime.stagger(100)
    });

    let removeElements2 = anime({
        targets: '.usernameInput',
        opacity: 0,
        duration: 1000,
        easing: 'linear',
        complete: function (anim) {
            if (anim.completed) {
                let showProgressBar = anime({
                    targets: '.progressBar',
                    opacity: 1,
                    duration: 1000,
                    easing: 'linear',
                    complete: function (anim) {
                        if (anim.completed) {
                            analyzePhotos(year, userId);
                            updateProgressBar(null, "Analyzing user photos...");
                        }
                    }            
                });

                const userInput = document.getElementById('userInput');
                userInput.style.display = 'none'

                const progressBar = document.getElementById('progressBar');
                progressBar.style.display = null;

                showProgressBar;
            }
        }
    });
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
async function analyzePhotos(year, userId) {
    var startTime = moment();
    console.log('Start time: ' + startTime.format("DD/MM/YYYY HH:mm:ss"));
    console.log('Analyzing Photos...');
    var userPhotoLibrary = await getUserPhotos(userId, false);
    updateProgressBar(10, 'Loaded user library photos..');
    var userPhotoFeed = await getUserPhotos(userId, true);
    updateProgressBar(20, 'Loaded user feed..');
    var statsFileData = {};
    //statsFileData = JSON.parse(statsFileData);
    //console.log(statsFileData);

    // Set Year
    statsFileData.BasicStats = {};
    statsFileData.BasicStats.userId = userId;
    statsFileData.BasicStats.year = year;

    // Set Total Photos shared
    var sharedPhotosFromYear = {};
    userPhotoLibrary.forEach((image) => {
        var photoDate = moment(image.CreatedAt).format("YYYY-MM-DD");
        var photoYear = moment(photoDate).format("YYYY");
        if (year == photoYear) {
            var count = Object.keys(sharedPhotosFromYear).length;
            sharedPhotosFromYear[count] = image;
        }
    });
    var totalSharedImageCount = Object.keys(sharedPhotosFromYear).length + 1;
    statsFileData.BasicStats.totalPhotosShared = totalSharedImageCount;

    console.log(sharedPhotosFromYear);

    console.log('Total Shared Photos By User:');
    console.log(Object.keys(sharedPhotosFromYear).length);

    // Update Progress Bar
    updateProgressBar(30, 'Counting moments with friends..');

    // Set Total Photos Tagged In
    var taggedPhotosFromYear = {};
    userPhotoFeed.forEach((image) => {
        var photoDate = moment(image.CreatedAt).format("YYYY-MM-DD");
        var photoYear = moment(photoDate).format("YYYY");
        if (year == photoYear) {
            var count = Object.keys(taggedPhotosFromYear).length;
            taggedPhotosFromYear[count] = image;
        }
    });
    var totalTaggedImageCount = Object.keys(taggedPhotosFromYear).length + 1;
    statsFileData.BasicStats.totalPhotosTaggedIn = totalTaggedImageCount;

    console.log('Total photos in users feed:');
    console.log(Object.keys(taggedPhotosFromYear).length);

    updateProgressBar(40, 'Slaying a few goblins on the side... ');

    // Number of Unique Locations
    // Number of Unique Tagged Players
    // Number of Unique Events
    var activityUniqueIdList = [];
    var playerUniqueIdList = [];
    var eventUniqueIdList = [];
    var totalComments = 0;
    var totalCheers = 0;
    for (var i = 0, len = Object.keys(sharedPhotosFromYear).length; i < len; i++) {
        var image = sharedPhotosFromYear[i];

        // Activity
        if ((!activityUniqueIdList.includes(image.RoomId)) && (image.RoomId)) {
            activityUniqueIdList.push(image.RoomId);
        };
        // Players
        if (image.TaggedPlayerIds.length > 0) {
            var listOfPlayers = image.TaggedPlayerIds;
            listOfPlayers.forEach(player => {
                if ((!playerUniqueIdList.includes(player)) && (player)) {
                    playerUniqueIdList.push(player);
                };
            });
        };

        // Events
        if ((!eventUniqueIdList.includes(image.PlayerEventId)) && (image.PlayerEventId)) {
            eventUniqueIdList.push(image.PlayerEventId);
        };

        // Add to grand totals
        totalCheers += image.CheerCount;
        totalComments += image.CommentCount;
    }

    statsFileData.BasicStats.numUniqueLocations = activityUniqueIdList.length;
    statsFileData.BasicStats.numUniquePlayers = playerUniqueIdList.length;
    statsFileData.BasicStats.numUniqueEvents = eventUniqueIdList.length;
    statsFileData.BasicStats.totalCheers = totalCheers;
    statsFileData.BasicStats.totalComments = totalComments;

    // Example: activity: "activityID",
    var activityPhotoCounts = {};
    for (var i = 0, len = Object.keys(sharedPhotosFromYear).length; i < len; i++) {
        var image = sharedPhotosFromYear[i];
        console.log(activityPhotoCounts);
        var count = Object.keys(taggedPhotosFromYear).length;

        if (activityPhotoCounts = {}) {
            activityPhotoCounts[0].RoomId = image.RoomId;

        } else {
            if (!(image.RoomId in activityPhotoCounts.RoomId)) {
                activityPhotoCounts.RoomId = image.RoomId;
                //activityPhotoCounts[image.RoomId].count = 1;
            }
        }
    };

    console.log(activityPhotoCounts);

    console.log('# of Unique Activities:');
    console.log(activityUniqueIdList.length);

    console.log('# of Unique Players:');
    console.log(playerUniqueIdList.length);

    console.log('# of unique events:');
    console.log(eventUniqueIdList.length);

    console.log('Total # of cheers:');
    console.log(totalCheers);

    console.log('Total # of comments:');
    console.log(totalComments);

    console.log('File Data: ');
    console.log(statsFileData);

    // Gather Activity Stats
    

    console.log('Done..');
    writeStatsToFile(statsFileData);
    updateProgressBar(100, 'Done..');

    var endTime = moment();
    console.log('End time: ' + endTime.format("DD/MM/YYYY HH:mm:ss"));
    console.log('Difference: ' + moment.utc(moment(endTime,"DD/MM/YYYY HH:mm:ss").diff(moment(startTime,"DD/MM/YYYY HH:mm:ss"))).format("HH:mm:ss") + ' seconds.');
}

// writes stats data to file
// this should be overwriting any existing data
function writeStatsToFile (jsonData) {
    let data = JSON.stringify(jsonData);
    fs.writeFileSync('./imageReview/stats.json', data);
}