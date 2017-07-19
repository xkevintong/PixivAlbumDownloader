// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" ) {
    	// Get album size and first page
    	firstPage = document.evaluate('//*[@id="main"]/section/div[1]/img', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src;
    	albumSize = document.evaluate('/html/body/nav/div[1]/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;

      // Edit first page URL to download url
      firstPageDL = firstPage.replace("img-master", "img-original").replace("_master1200.jpg", ".png")

      console.log(firstPage);
      console.log(firstPageDL);
      //console.log(albumSize);

      // Send album info to download
      chrome.runtime.sendMessage({"message": "download", "url": firstPageDL, "pages": albumSize});
    }
  }
);