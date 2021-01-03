const { electron, app, ipcRenderer } = require('electron');
const axios = require('axios');
const fs = require('fs');
const Path = require('path');
//var request = require('request');
const { shell } = require('electron');
const { isNullOrUndefined } = require('util');
const open = require('open');
var moment = require('moment');
//const sleep = require('util').promisify(setTimeout);
// Electron-Store for saving preferences
var userAccountId = 0;

//var filePath = app.getPath("userData");
var INDEVELOPMENTMODE = true;
//var filePath = 'C:/RNC/';
//var appDataPath = './appData/';
//var dataCache = 'cache/';

//let photoSync = require('../appdata/photosync/ImageSyncData.json');
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

ipcRenderer.on('update-available', () => {
  console.log('update available');
  ipcRenderer.removeAllListeners('update-available');
  message.innerText = 'A new update is available. Downloading now...';
  notification.classList.remove('hidden');
});

ipcRenderer.on('update-downloaded', () => {
  console.log('update downloaded');
  ipcRenderer.removeAllListeners('update-downloaded');
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

// Listen for messages
ipcRenderer.on('message', function(event, text) {
  var container = document.getElementById('messages');
  var message = document.createElement('div');
  message.innerHTML = text;
  container.appendChild(message);
})

// https://api.rec.net/roomserver/rooms/bulk?Id=12028058
async function getRoomInfo(roomId) {
    var url = 'https://api.rec.net/roomserver/rooms/bulk?Id=' + roomId;

    return new Promise(function (resolve, reject) {
        if (!roomId) {
            resolve('null');
        }

        // https://accounts.rec.net/account?username=rocko
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
    });
}

// https://accounts.rec.net/account/bulk
// Form Data = ID Array
async function getUsernameFromId(listOfUserIds) {
    var apiUrl = 'https://accounts.rec.net/account/bulk';

    return new Promise(function (resolve, reject) {
        var formData = new FormData();

        listOfUserIds.forEach(item => formData.append("id", item));

        console.log('Form Data: ' + formData);
        // https://accounts.rec.net/account?username=rocko
        axios({
            method: 'post',
            url: apiUrl,
            data: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
            .then(function (response) {
                // handle success
                //return response.data.accountId;
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
    console.log("Image Name: " + imageName);
    var IMAGE_URL = 'https://img.rec.net/' + imageName;
    console.log("Image Name: " + IMAGE_URL);

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
    var imageDiv = document.getElementById("grid");
    if (username === "") {
        while (imageDiv.firstChild) {
            imageDiv.removeChild(imageDiv.firstChild);
        }
        return;
    }

    var userId = await getUserId(username);
    var userPhotoLibrary = await getUserPublicPhotoLibrary(userId);

    // Apply Filters
    var filterValues = await swapFilterValuesWithIds();
    var newFilteredUserPhotoLibrary = [];
    console.log(filterValues);

    // for each image
    if (filterValues.length != 0) {
        userPhotoLibrary.forEach(image => {
            // for each filter item (verify image has the corret criteria)
            var imageMustMatchAllFilters = true; // TO DO MAKE THIS TOGGLEABLE ON THE UI
            var imageMatchesAllFilterCriteria = true;

            var imageMatchedAtleastOneCriteria = false;
            filterValues.forEach(filter => {
                var filterParts = filter.split("|");

                switch (filterParts[0]) {
                    case 'A':
                        // Activity
                        // Example Value: A|GoldenTrophy
                        if (image.RoomId == filterParts[1]) {
                            imageMatchedAtleastOneCriteria = true;
                        } else if (imageMustMatchAllFilters) {
                            imageMatchesAllFilterCriteria = false;
                        }
                        break;

                    case '!A':
                        // Not Activity
                        // Example Value: !A|GoldenTrophy
                        if (image.RoomId != filterParts[1]) {
                            imageMatchedAtleastOneCriteria = true;
                        } else if (imageMustMatchAllFilters) {
                            imageMatchesAllFilterCriteria = false;
                        }
                        break;

                    case 'P':
                        // Person
                        // Example Value: P|Boethiah
                        //console.log(image.TaggedPlayerIds.length);
                        if (image.TaggedPlayerIds.length === 0) {
                            imageMatchesAllFilterCriteria = false;
                            break;
                        }

                        var taggedPlayers = [];
                        image.TaggedPlayerIds.forEach(player => { taggedPlayers.push(player) });
                        if ((taggedPlayers.findIndex((player) => player == filterParts[1]) > -1) && imageMatchesAllFilterCriteria) {
                            imageMatchedAtleastOneCriteria = true;
                            //newFilteredUserPhotoLibrary.push(image);
                        } else if (imageMustMatchAllFilters) {
                            imageMatchesAllFilterCriteria = false;
                        }
                        break;

                    case '!P':
                        // Not Person
                        // Example Value: !P|Boethiah
                        if (image.TaggedPlayerIds.length === 0) {
                            imageMatchesAllFilterCriteria = false;
                            break;
                        }

                        var taggedPlayers = [];
                        image.TaggedPlayerIds.forEach(player => { taggedPlayers.push(player) });
                        if (!(taggedPlayers.findIndex((player) => player == filterParts[1]) > -1) && imageMatchesAllFilterCriteria) {
                            imageMatchedAtleastOneCriteria = true;
                            //newFilteredUserPhotoLibrary.push(image);
                        } else if (imageMustMatchAllFilters) {
                            imageMatchesAllFilterCriteria = false;
                        }
                        break;

                    default:
                        //error occured log to console
                        console.log("An error occured parsing filter type: " + filterType);
                }
            });
            if (imageMustMatchAllFilters && imageMatchesAllFilterCriteria) {
                newFilteredUserPhotoLibrary.push(image);
            } else if (!(imageMustMatchAllFilters) && imageMatchedAtleastOneCriteria) {
                newFilteredUserPhotoLibrary.push(image);
            }
        });
    };

    console.log(filterValues.length);
    console.log(newFilteredUserPhotoLibrary.length);

    if (filterValues.length > 0) {
        userPhotoLibrary = newFilteredUserPhotoLibrary;
    }

    const imageResults = document.getElementById('imageResultNumber');
    if (imageResults) {
        if (userPhotoLibrary.length === 0) {
            imageResults.innerText = 'No Images Found!';
        } else {
            imageResults.innerText = 'Image Results: ' + userPhotoLibrary.length;
        }
    }

    var dateOrder = document.getElementById("btnOldestToNewest");
    if (dateOrder.value == "1") { // Oldest to Newest
        userPhotoLibrary = userPhotoLibrary.reverse();
    }

    while(imageDiv.firstChild) { 
        imageDiv.removeChild(imageDiv.firstChild); 
    } 

    // Generate Master Lists
    getMasterLists(userPhotoLibrary);

    // Generate image HTML
    loadImagesIntoPage(userPhotoLibrary);
}

async function getMasterLists(userPhotoLibrary) {
    // Obtain Unique lists
    var activityUniqueIdList = [];
    var playerUniqueIdList = [];
    var eventUniqueIdList = [];
    userPhotoLibrary.forEach(image => {
        //console.log(image);
        // Activity
        if ((!activityUniqueIdList.includes(image.RoomId)) && (image.RoomId)) {
            activityUniqueIdList.push(image.RoomId);
        };

        // Players
        if (image.TaggedPlayerIds.length > 0) {
            var listOfPlayers = image.TaggedPlayerIds;

            listOfPlayers.forEach(player => {
                //console.log(player);
                //activityUniqueIdList.push(image.RoomId);
                if ((!playerUniqueIdList.includes(player)) && (player)) {
                    playerUniqueIdList.push(player);
                };
            });
            //console.log(image.TaggedPlayerIds.length);
            //playerUniqueIdList.push(image.RoomId);
        };

        // Events
        if ((!eventUniqueIdList.includes(image.PlayerEventId)) && (image.PlayerEventId)) {
            eventUniqueIdList.push(image.PlayerEventId);
        };
    });
    //console.log(activityUniqueIdList);
    //console.log(playerUniqueIdList);
    //console.log(eventUniqueIdList);
}

async function loadImagesIntoPage(userPhotoLibrary) {
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
    // Modal Elements
    const LOADING_TEXT = "Loading...";
    var modalDisplayImage = document.getElementById("imageDisplay");
    modalDisplayImage.src = ""; // Clear out image source so the old image is not there still

    var modalImageId = document.getElementById("imageId");
    modalImageId.innerText = LOADING_TEXT;

    // Activity Name
    var modalImageActivityName = document.getElementById("imageActivity");
    modalImageActivityName.innerText = LOADING_TEXT;

    // List of tagged players
    var modalImageTaggedPlayers = document.getElementById("imageTaggedPlayers");
    modalImageTaggedPlayers.innerText = LOADING_TEXT;

    // Event Name
    var modalImageEventName = document.getElementById("imageEvent");
    modalImageEventName.innerText = LOADING_TEXT;

    var modalImageCheerCount = document.getElementById("imageCheerCount");
    imageCheerCount.innerText = LOADING_TEXT;

    var modalImageCommentCount = document.getElementById("imageCommentCount");
    modalImageCommentCount.innerText = LOADING_TEXT;

    var modalImageDate = document.getElementById("imageDate");
    modalImageDate.innerText = LOADING_TEXT;

    var modalImageRnLink = document.getElementById("imageRecNetLink");
    modalImageRnLink.innerText = LOADING_TEXT;
    
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

    // Image Display
    if (modalDisplayImage) {
        var imageUrl = 'https://img.rec.net/' + imageData.ImageName;
        //console.log(imageUrl);
        modalDisplayImage.src = imageUrl;
    }

    // Image ID
    if (modalImageId) {
        var szImageId = imageData.Id;
        modalImageId.innerText = szImageId;
    }

    // Activity Name
    var roomData = await getRoomInfo(imageData.RoomId);
    if (modalImageActivityName) {
        if (roomData.length >= 1) {
            var szActivityName = roomData[0].Name;
            modalImageActivityName.innerText = szActivityName;
        } else if (roomData === 'null') {
            modalImageActivityName.innerText = 'Null';
        } else {
            modalImageActivityName.innerText = "Unavailable, room is not public."
        }
    }

    // Event Name
    if (modalImageEventName) {
        var szEventName = imageData.PlayerEventId;
        if (szEventName === null || szEventName === undefined) {
            szEventName = "No event data.";
        }
        modalImageEventName.innerText = szEventName;
    }

    // Tagged Players
    if (imageData.TaggedPlayerIds.length > 0) {
        var playerInfoJson = await getUsernameFromId(imageData.TaggedPlayerIds);
        console.log(playerInfoJson);
        if (modalImageTaggedPlayers) {
            var szTaggedPlayers = "";
            var i = 0;
            playerInfoJson.forEach(item => {
                if (i === playerInfoJson.length) {
                    szTaggedPlayers = szTaggedPlayers + (item.displayName + " (@" + item.username + ") \r\n");
                } else {
                    szTaggedPlayers = szTaggedPlayers + (item.displayName + " (@" + item.username + "), \r\n");
                }
            });
            modalImageTaggedPlayers.innerText = szTaggedPlayers;
        }
    } else {
        modalImageTaggedPlayers.innerText = "No players were tagged.";
    }

    // Cheer Count
    if (modalImageCheerCount) {
        var szCheerCount = imageData.CheerCount;
        modalImageCheerCount.innerText = szCheerCount;
    }

    // Comment Count
    if (modalImageCommentCount) {
        var szCommentCount = imageData.CommentCount;
        modalImageCommentCount.innerText = szCommentCount;
    }

    // Image Date
    if (modalImageDate) {
        var szDate = imageData.CreatedAt;
        modalImageDate.innerText = moment(szDate).format('MMMM Do YYYY, h:mm a') + ' (' + moment(szDate, "YYYYMMDD").fromNow() + ')';
    }

    // RN Image Link
    if (modalImageRnLink) {
        var szUrl = "https://rec.net/image/" + imageData.Id;
        modalImageRnLink.innerText = szUrl;
        modalImageRnLink.setAttribute("onclick", "openImageInBrowser(" + imageData.Id +"); return false;");
    }
}

function openImageInBrowser(imageId) {
    var szUrl = "https://rec.net/image/" + imageId;
    open(szUrl);
}

function toggleFilterDisplay() {
    var btnToggleFilters = document.getElementById("expandCollapseFiltersButton");
    var filterContainer = document.getElementById("filterCategoryContainer");
    if (btnToggleFilters && filterContainer) {
        if (btnToggleFilters.innerText === "Expand") {
            filterContainer.classList.remove("displayNone");
            btnToggleFilters.innerText = "Collapse";
        } else {
            filterContainer.classList.add("displayNone");
            btnToggleFilters.innerText = "Expand";
        }
    }
}

function toggleActivityFilter() {
    var btnActivity = document.getElementById("activityFilterToggleButton");
    if (btnActivity){
        if (btnActivity.innerText === "Not in:") {
            btnActivity.innerText = "In:";
        } else {
            btnActivity.innerText = "Not in:";
        }
    }
}

function togglePlayerFilter() {
    var btnPlayer = document.getElementById("playerFilterToggleButton");
    if (btnPlayer){
        if (btnPlayer.innerText === "Does not contain:") {
            btnPlayer.innerText = "Contains:";
        } else {
            btnPlayer.innerText = "Does not contain:";
        }
    }
}

function deleteFilterCriteriaItem(criteriaId) {
    removeElement(criteriaId);
    const criteriaDisplay = document.getElementById('currentFilterCriteria');
    var count = criteriaDisplay.childElementCount;
    updateFilterCriteriaDisplay(count);
}

function removeElement(id) {
    var elem = document.getElementById(id);
    return elem.parentNode.removeChild(elem);
}

function addPlayerCriteria() {
    // Button
    const playerButton = document.getElementById('playerFilterToggleButton');
    const criteriaText = playerButton.innerText;
    // Textbox value
    const playerTextbox = document.getElementById('txtFilterUser');
    const criteriaValue = playerTextbox.value;

    const errorBox = document.getElementById('filterErrorText');
    if (criteriaValue.length == 0) {
        if (errorBox) {
            errorBox.classList.remove("displayNone");
            errorBox.innerText = "Error: Player name cannot be blank! Please enter a Player name!";
            return;
        }
    }
    errorBox.classList.add("displayNone");
    addFilterCriteriaItem(criteriaText, criteriaValue, 2);
}

function addActivityCriteria() {
    // Button
    const activityButton = document.getElementById('activityFilterToggleButton');
    const criteriaText = activityButton.innerText;
    // Textbox value
    const activityTextbox = document.getElementById('txtFilterActivityName');
    const criteriaValue = activityTextbox.value;

    const errorBox = document.getElementById('filterErrorText');
    if (criteriaValue.length == 0) {
        if (errorBox) {
            errorBox.classList.remove("displayNone");
            errorBox.innerText = "Error: Room/Activity name cannot be blank! Please enter a room/activity name!";
            return;
        }
    }
    errorBox.classList.add("displayNone");
    addFilterCriteriaItem(criteriaText, criteriaValue, 1);
}

function addFilterCriteriaItem(filterCriteriaText, filterCriteriaValue, filterCriteriaType){
    const criteriaDisplay = document.getElementById('currentFilterCriteria');
    var count = criteriaDisplay.childElementCount;

    if (count === 10) {
        const errorBox = document.getElementById('filterErrorText');
        if (errorBox) {
            errorBox.classList.remove("displayNone");
            errorBox.innerText = "Error: Max criteria limit reached!";
            return;
        }
    }
    var filterString = ''; // Function that returns this

    switch(filterCriteriaType) {
        case 1:
            // Filter by Activity
            // Example Value: A|GoldenTrophy
            if (filterCriteriaText === "In:"){
                filterString = 'A|' + filterCriteriaValue;
            } else if (filterCriteriaText === "Not in:"){
                filterString = '!A|' + filterCriteriaValue;
            }
            break;

        case 2:
            // Filter by Player
            // Example Value: P|Rocko
            if (filterCriteriaText === "Contains:"){
                filterString = 'P|' + filterCriteriaValue;
            } else if (filterCriteriaText === "Does not contain:"){
                filterString = '!P|' + filterCriteriaValue;
            }
            break;

        default:
            //error occured log to console
            console.log("An error occured generating the filter string. FilterCriteriaType: " + filterCriteriaType);
    }

    if (checkForDuplicateFilterValues(filterString)) {
        const errorBox = document.getElementById('filterErrorText');
        errorBox.classList.remove("displayNone");
        errorBox.innerText = "Error: This filter criteria item has already been added to the list.";
        return;
    }

    count = count + 1

    // Creates the filter criteria item container
    const criteriaItem = document.createElement("div");
    criteriaItem.classList.add("criteriaItem");
    criteriaItem.setAttribute('id', 'filterCriteria' + count);
    criteriaItem.setAttribute('filterValue', filterString);

    // Creates the div inside of the criteria item
    const criteriaItemText = document.createElement("div");
    criteriaItemText.classList.add("criteriaItemText");
    criteriaItemText.innerText = filterCriteriaText + ' ' + filterCriteriaValue;
    criteriaItem.appendChild(criteriaItemText);

    // Creates the 'X' on the filter criteria item
    const criteriaRemove = document.createElement("div");
    criteriaRemove.classList.add("criteriaRemove");
    var funcArg = "filterCriteria" + count;
    criteriaRemove.setAttribute('onclick', 'deleteFilterCriteriaItem("' + funcArg + '"); return false;');
    criteriaRemove.innerText = ' X ';
    criteriaItem.appendChild(criteriaRemove);

    // Add the item to the div displaying all current filter criteria
    criteriaDisplay.appendChild(criteriaItem);

    // Update the count below the visual display so users know how much criteria they can enter/
    updateFilterCriteriaDisplay(count);
}

function updateFilterCriteriaDisplay(count) {
    const filterCriteriaCount = document.getElementById('filterCriteriaCount');
    filterCriteriaCount.innerText = 'Filter Criteria Used: ' + count + '/10';
}

function checkForDuplicateFilterValues(valueToAdd) {
    var currentFilterCriteria = getFilterValues();
    return currentFilterCriteria.includes(valueToAdd);
}

function getFilterValues() {
    const criteriaDisplay = document.getElementById('currentFilterCriteria');
    var filterItems = document.getElementsByClassName("criteriaItem");
    var values = [];
    for (i = 0; i < criteriaDisplay.childElementCount; i++) {
        values.push(filterItems[i].getAttribute('filterValue'));
    }
    //console.log(values);
    return values;
}

async function swapFilterValuesWithIds() {
    var userInputValues = getFilterValues();
    var newFilterArray = [];
    //console.log('Old Filter Array: ')
    //console.log(userInputValues);
    //userInputValues.forEach(filter async => {
    for (const filter of userInputValues) {
        var filterParts = filter.split("|");
        var filterType = filterParts[0];
        var filterValue = filterParts[1];

        switch (filterType) {
            case 'A':
                // Activity
                // Example Value: A|GoldenTrophy
                var activityData = await getActivityIdFromName(filterValue);
                newFilterArray.push(filterType + '|' + activityData.RoomId);
                break;
            
            case '!A':
                // !Activity
                // Example Value: !A|GoldenTrophy
                var activityData = await getActivityIdFromName(filterValue);
                newFilterArray.push(filterType + '|' + activityData.RoomId);
                break;

            case 'P':
                // Player
                // Example Value: P|Boethiah
                var playerId = await getUserId(filterValue);
                newFilterArray.push(filterType + '|' + playerId);
                break;

            case '!P':
                // Not Player
                // Example Value: !P|Boethiah
                var playerId = await getUserId(filterValue);
                newFilterArray.push(filterType + '|' + playerId);
                break;

            default:
                //error occured log to console
                console.log("An error occured parsing filter type: " + filterType);
        }
    };
    return newFilterArray;
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

async function getActivityIdFromName(activityName) {
    var url = 'https://api.rec.net/roomserver/rooms?name=' + activityName;

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
    });
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