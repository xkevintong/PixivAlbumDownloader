// background.js

// Called when the user clicks on the page action (extension icon).
chrome.pageAction.onClicked.addListener(
  function(tab) {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0]

    // Check if downloading single image/album cover, album, or artist page
    if (activeTab.url.includes("artworks")) {
      chrome.tabs.sendMessage(activeTab.id, {message: "art"})
    }
    else if (activeTab.url.includes("member")) {
      chrome.tabs.sendMessage(activeTab.id, {message: "artist"})
    }
  })
})

// Called when message is sent from content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "download" ) {
        chrome.storage.sync.get(['isSubfolder', 'subfolder'], function(items) {
          var subfolder = items.subfolder

          // Remove subfolder if checkbox is not checked
          if (!items.isSubfolder) {
            subfolder = ""
          }

          // Add backslash for subfolder path if there is one
          else if (subfolder) {
            subfolder = subfolder + "/"
          }

          // Download image
          chrome.downloads.download({
          url: request.url,
          filename: subfolder + request.filename
      })
    })
  }
})

// Sets subfolder to default "Pixiv Album Downloader" on extension installation
chrome.runtime.onInstalled.addListener(
  function() {
    chrome.storage.sync.get('subfolder', function(item) {
      if (item.subfolder === undefined) {
        chrome.storage.sync.set({
          isSubfolder: true,
          subfolder: "Pixiv Art Downloader"
        })
      }
    })
  }
)

// Enables the extension only on pixiv.net album pages by showing page action
chrome.runtime.onInstalled.addListener(
  function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [
          // Match all pages with art
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              schemes: ["http", "https"],
              hostEquals: "www.pixiv.net",
            }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }])
    })
  }
)
