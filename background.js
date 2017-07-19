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
    if(chrome.runtime.lastError) {
      console.warn("Runtime error: " + chrome.runtime.lastError.message);
    }
    else {
      if( request.message === "download" ) {
        chrome.downloads.download({
        url: request.url,
        method: "GET",
        headers: [{"name" : "Referer", "value" : "https://www.pixiv.net/member_illust.php?mode=manga&illust_id=63184498"},
                  {"name" : "Connection", "value" : "keep-alive"}]
        //{"name" : "PHPSESSID", "value" : "7885228_6c7d36ad769139caa82917718b4a855c"}
        //{"name" : "Connection", "value" : "keep-alive"}
        //{"name" : "Referer", "value" : "https://www.pixiv.net/member_illust.php?mode=manga&illust_id=63184498"}
        //saveAs: true
        //filename: "/Pixiv Album Downloader"
        });

      console.log("downloaded")
      }
    }
  }
);