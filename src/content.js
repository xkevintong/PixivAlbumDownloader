// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.message) {
      case "album":      
        download_album(document);
        break;

      case "artist":
        download_artist();
        break;

      case "art":
        download_art(document);
        break;

      default:
    }
  }
);

function download_art(doc) {
  // Check if document has album page count variable to determine if page is album cover or single image
  var numPages = doc.evaluate('//*[@id="wrapper"]/div[1]/div[1]/div/div[5]/a[1]/div/div/span', 
          doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (numPages) {
    // Construct url for album, get document for album and pass to download_album
    var albumURL = doc.evaluate('//*[@id="wrapper"]/div[1]/div[1]/div/div[5]/a[1]', 
      doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href;
    var album = new XMLHttpRequest();
    album.responseType = "document";
    album.open('GET', albumURL, true);
    album.send();

    album.onload = function () {
      download_album(this.responseXML);
    };
  }
  else {
    // No page count, call download_image
    download_image(doc);
  }
}

function download_album(doc) {
  // Get album size with XPath
  var albumSize = doc.evaluate('/html/body/nav/div[1]/span[2]',
    doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;

  // Check first image in album to see if it is in jpg or png format, and assume entire album is as well
  var firstImage = new XMLHttpRequest();
  firstImage.responseType = "document";
  firstImage.open('GET', doc.evaluate('//*[@id="main"]/section/div[1]/a',
    doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href, true);
  firstImage.send();

  firstImage.onload = function () {
    // Get image format of the album from first image
    var firstImageURL = this.responseXML.evaluate('/html/body/img', 
      this.responseXML, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src;
    var imageFormat = firstImageURL.substr(firstImageURL.lastIndexOf('.'));

    // Find album ID
    var albumID = firstImageURL.substr(firstImageURL.lastIndexOf('/') + 1).replace("_p0" + imageFormat, "_p");

    // Download all images with XHR blobs
    for (var page = 0; page < albumSize; page++) {
      (function(page) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.open('GET', firstImageURL.replace("_p0", "_p" + page), true);
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

function download_image(doc) {
  // Get source image url and id
  var imageURL = doc.evaluate('//*[@id="wrapper"]/div[2]/div/img',
    doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.getAttribute('data-src');
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
    var url = snapshot.snapshotItem(i).href;
    var illust = new XMLHttpRequest();
    illust.responseType = "document";
    illust.open('GET', url, true);
    illust.send();

    illust.onload = function () {
      download_art(this.responseXML);
    };
  }
}