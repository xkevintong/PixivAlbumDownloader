// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" ) {
    	// Get album size and first page with XPath
    	var firstPage = document.evaluate('//*[@id="main"]/section/div[1]/img', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src;
    	var albumSize = document.evaluate('/html/body/nav/div[1]/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;

      // Edit first page URL to download url
      var firstPageURL = firstPage.replace("img-master", "img-original").replace("_master1200.jpg", ".png");

      // Find album ID
      var albumID = firstPageURL.substr(firstPageURL.lastIndexOf('/') + 1).replace("_p0", "_p");

      var xhr = [];
      for (var page = 0; page < albumSize; page++) {
        (function(page) {
          xhr[page] = new XMLHttpRequest();
          xhr[page].responseType = "blob";

          xhr[page].addEventListener('load', () => {
            chrome.runtime.sendMessage({
              message: "download",
              url: URL.createObjectURL(xhr[page].response),
              filename: albumID.replace("_p", "_p" + page)
            });
          });

          xhr[page].open('GET', firstPageURL.replace("_p0", "_p" + page), true);
          xhr[page].send();
        })(page);
      } 
    }
  }
);