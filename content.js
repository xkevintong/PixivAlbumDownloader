// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" ) {
    	// Get album size and first page with XPath
    	var firstPage = document.evaluate('//*[@id="main"]/section/div[1]/img', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src;
    	var albumSize = document.evaluate('/html/body/nav/div[1]/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;

      // Check album to see if images are jpg or png
      var firstImage = new XMLHttpRequest();
      firstImage.responseType = "document";
      firstImage.open('GET', document.evaluate('//*[@id="main"]/section/div[1]/a', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href, true);
      firstImage.send();

      firstImage.onload = function () {
        // Get image format of the album from first image
        var firstImageURL = this.responseXML.evaluate('/html/body/img', this.responseXML, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src;
        var imageFormat = firstImageURL.substr(firstImageURL.lastIndexOf('.'));

        // Edit first page URL to download url
        var firstPageURL = firstPage.replace("img-master", "img-original").replace("_master1200.jpg", imageFormat);

        // Find album ID
        var albumID = firstPageURL.substr(firstPageURL.lastIndexOf('/') + 1).replace("_p0" + imageFormat, "_p");

        // Download all images with XHR blobs
        var xhr = [];
        for (var page = 0; page < albumSize; page++) {
          (function(page) {
            xhr[page] = new XMLHttpRequest();
            xhr[page].responseType = "blob";

            xhr[page].onload = function () {
              chrome.runtime.sendMessage({
                message: "download",
                url: URL.createObjectURL(xhr[page].response),
                filename: albumID + page + imageFormat
              });
            }

            xhr[page].open('GET', firstPageURL.replace("_p0", "_p" + page), true);
            xhr[page].send();
          })(page);
        }
      }
    }
  }
);