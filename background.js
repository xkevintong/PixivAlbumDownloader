// background.js

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {message: "clicked_browser_action"});
  });
});

// Called when message is sent from content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "download" ) {
        chrome.storage.sync.get('subfolder', function(item) {
          // Add backslash for subfolder path if there is one
          if (item.subfolder != "") {
            item.subfolder = item.subfolder + "/";
          }

          // Download image
          chrome.downloads.download({
          url: request.url,
          filename: item.subfolder + request.filename
        });
      });
    }
  }
);