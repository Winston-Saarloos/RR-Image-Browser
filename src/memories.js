const { electron, app, ipcRenderer } = require('electron');
const axios = require('axios');
const fs = require('fs');
const { shell } = require('electron');
const open = require('open');
const moment = require('moment');
const anime = require('animejs');

var bCurrentlyRunning = false;

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
    console.log(year);
    console.log(userId);
}
