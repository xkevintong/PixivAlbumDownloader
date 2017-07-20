// background.js

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    console.log("sending request");
    chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    console.log("sent request");
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    //console.log(request.url)
    if( request.message === "download" ) {
      chrome.downloads.download({
      url: request.url
      //saveAs: true
      //filename: "/Pixiv Album Downloader"
      });

    console.log("downloaded")
    }
  }
);