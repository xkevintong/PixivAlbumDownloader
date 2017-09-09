// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.message) {
      case "album":      
        download_album();
        break;

      case "artist":
        download_artist();
        break;

      case "image":
        download_image();
        break;

      default:
    }
  }
);

function download_album() {
  // Get album size and first page with XPath
  var firstPage = document.evaluate('//*[@id="main"]/section/div[1]/img',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src;
  var albumSize = document.evaluate('/html/body/nav/div[1]/span[2]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;

  // Check first image in album to see if it is in jpg or png format, and assume entire album is as well
  var firstImage = new XMLHttpRequest();
  firstImage.responseType = "document";
  firstImage.open('GET', document.evaluate('//*[@id="main"]/section/div[1]/a',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href, true);
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
    for (var page = 0; page < albumSize; page++) {
      (function(page) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.open('GET', firstPageURL.replace("_p0", "_p" + page), true);
        xhr.send();

        // Assign blob response a URL and send message to background.js to download blob
        xhr.onload = function () {
          chrome.runtime.sendMessage({
            message: "download",
            url: URL.createObjectURL(this.response),
            filename: albumID + page + imageFormat
          });
        };
      }(page));
    }
  };
}

function download_image() {
  // Get source image url and id
  var imageURL = document.evaluate('//*[@id="wrapper"]/div[2]/div/img',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.getAttribute('data-src');
  var imageID = imageURL.substr(imageURL.lastIndexOf('/'));

  var xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.open('GET', imageURL, true);
  xhr.send();

  // Assign blob response a URL and send message to background.js to download blob
  xhr.onload = function () {
    chrome.runtime.sendMessage({
      message: "download",
      url: URL.createObjectURL(this.response),
      filename: imageID
    });
  };
}

function download_artist() {
  // Get snapshot of image/album links from the page
  var snapshot = document.evaluate('//*[@id="wrapper"]/div[1]/div[1]/div/div[4]/ul/li/a[h1]',
    document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

  for (var i = 0; i < snapshot.snapshotLength; i++) {
    console.log(snapshot.snapshotItem(i).href);
  }
}