// background.js

// Called when the user clicks on the page action (extension icon).
chrome.pageAction.onClicked.addListener(
  function(tab) {
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
});

// Sets subfolder to default "Pixiv Album Downloader" on extension installation
chrome.runtime.onInstalled.addListener(
  function() {
    chrome.storage.sync.get('subfolder', function(item) {
      if (item.subfolder === undefined) {
        chrome.storage.sync.set({
          subfolder: "Pixiv Album Downloader"
        });
      }
    });
  }
);

// Enables the extension only on pixiv.net pages by showing page action
chrome.runtime.onInstalled.addListener(
  function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {              
              schemes: ["http", "https"],
              hostEquals: "www.pixiv.net",
              queryContains: "manga&"
            },
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
  }
);