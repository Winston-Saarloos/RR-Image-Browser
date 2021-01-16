const { electron, app, ipcRenderer } = require('electron');
const axios = require('axios');
const fs = require('fs');
const { shell } = require('electron');
const open = require('open');
var moment = require('moment');
// Electron-Store for saving preferences

// Auto Update Related Function
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

// Takes in a room id and returns out data for that room
// https://api.rec.net/roomserver/rooms/bulk?Id=12028058
async function getRoomInfo(roomId) {
    var url = 'https://api.rec.net/roomserver/rooms/bulk?Id=' + roomId;

    return new Promise(function (resolve, reject) {
        if (!roomId) {
            resolve('null');
        }

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

// Pass in an array of user IDs and receive back out user information
// https://accounts.rec.net/account/bulk
// Form Data = ID Array
async function getUsernameFromId(listOfUserIds) {
    var apiUrl = 'https://accounts.rec.net/account/bulk';

    return new Promise(function (resolve, reject) {
        var formData = new FormData();
        listOfUserIds.forEach(item => formData.append("id", item));

        axios({
            method: 'post',
            url: apiUrl,
            data: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
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

// Toggles text/value of button for toggling between displaying user feed vs user photo library
function toggleButtonFeedLibrary() {
    var button = document.getElementById("btnFeedLibrary");

    if (button) {
        if (button.value === "1") {
            button.value = "0";
            button.innerText = "User Photo Feed";
        } else {
            button.value = "1";
            button.innerText = "User Photo Library";
        }
    }
}

// Toggles text/value on form button for displaying newest to oldest or vice versa
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

// Function takes a userID and returns back a user's entire public photo library
async function getUserPublicPhotoLibrary(userId) {
    var urlUserPhotos = 'https://api.rec.net/api/images/v4/player/' + userId + '?skip=0&take=100000';
    var urlUserFeed = 'https://api.rec.net/api/images/v3/feed/player/' + userId + '?skip=0&take=100000';
    var url = '';
    var button = document.getElementById("btnFeedLibrary");

    if (button.value == 1) {
        url = urlUserPhotos;
    } else {
        url = urlUserFeed;
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

// function takes in a imageName and returns the associated image
// returns image data (separate function for downloading)
async function getImageData(imageName) {
    var IMAGE_URL = 'https://img.rec.net/' + imageName;

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

// Function processes filters and creates the UserPhotoLibrary object that will be displayed on the page
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

// Function that gets every User, Activity, and Event where a photo was taken.
async function getMasterLists(userPhotoLibrary) {
    // Obtain Unique lists
    var activityUniqueIdList = [];
    var playerUniqueIdList = [];
    var eventUniqueIdList = [];
    userPhotoLibrary.forEach(image => {
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
    });
    //console.log(activityUniqueIdList);
    //console.log(playerUniqueIdList);
    //console.log(eventUniqueIdList);
}

// Displays the iamges on the page in the div.  Uses lazy loading to only display images visible in the viewport
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

        if (userPhotoLibrary[i].CheerCount >= 1) {
            var divCheerContainer = document.createElement("div");
            divCheerContainer.classList.add("imageCheerContainer");
            divGridItem.appendChild(divCheerContainer);

            var cheerIcon = document.createElement("img");
            cheerIcon.classList.add("imageCheerIcon");
            cheerIcon.setAttribute('src', './images/cheer.png');

            // add image to container
            divCheerContainer.appendChild(cheerIcon);

            var cheerCount = document.createElement("div");
            cheerCount.classList.add("imageCheerText");
            cheerCount.innerText = userPhotoLibrary[i].CheerCount;

            // add div to container
            divCheerContainer.appendChild(cheerCount);
        }

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

// Clears out the image src when the modal is opened and closed
function clearImageSource() { // TODO figure out how to keep the image size so it doesnt jump up when the image loads in
    var modalDisplayImage = document.getElementById("imageDisplay");
    if (modalDisplayImage) {
        modalDisplayImage.src = "";
    }
}

// Loads data into the image modal when a user clicks on an image
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
                if (i == playerInfoJson.length - 1) {
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

// Opens a recnet link in a user's default browser
function openImageInBrowser(imageId) {
    var szUrl = "https://rec.net/image/" + imageId;
    open(szUrl);
}

// Toggles filter display button text when expanding and collapsing the filter panel
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

// Toggles text on Activity Filter button
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

// Toggles text on Player filter button
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

// Deletes a criteria item
function deleteFilterCriteriaItem(criteriaId) {
    removeElement(criteriaId);
    const criteriaDisplay = document.getElementById('currentFilterCriteria');
    var count = criteriaDisplay.childElementCount;
    updateFilterCriteriaDisplay(count);
}

// Removes element from parent element based on ID
function removeElement(id) {
    var elem = document.getElementById(id);
    return elem.parentNode.removeChild(elem);
}

// Adds player criteria based on value in textbox and button value
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

// Adds activity criteria based on value in textbox an dbutton value
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

// Adds filter criteria item to visual filter criteria display on page
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

// Updates the count for total filter criteria used
function updateFilterCriteriaDisplay(count) {
    const filterCriteriaCount = document.getElementById('filterCriteriaCount');
    filterCriteriaCount.innerText = 'Filter Criteria Used: ' + count + '/10';
}

// Checks for duplicate filter criteria and blocks if it is
function checkForDuplicateFilterValues(valueToAdd) {
    var currentFilterCriteria = getFilterValues();
    return currentFilterCriteria.includes(valueToAdd);
}

// Gets the filter values from the filter visual display
function getFilterValues() {
    const criteriaDisplay = document.getElementById('currentFilterCriteria');
    var filterItems = document.getElementsByClassName("criteriaItem");
    var values = [];
    for (i = 0; i < criteriaDisplay.childElementCount; i++) {
        values.push(filterItems[i].getAttribute('filterValue'));
    }
    return values;
}

// Swaps the filter values entered by the user with actual room and player IDs
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

// Gets activity/room ID from room name
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