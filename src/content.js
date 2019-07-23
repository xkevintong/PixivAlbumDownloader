// Assume artist uses samge image format for all their art, default to jpg
var img_format = ".jpg";

// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.message) {
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

// Downloads all images and albums from the artist page
function download_artist() {
  // Get snapshot of all image/album links from the page
  var top_level_thumbnail_xpath = '//*[@id="root"]//li[@class="_1Ed7xkM"]'
  var snapshot = document.evaluate(top_level_thumbnail_xpath, document, null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

  for (var i = 0; i < snapshot.snapshotLength; i++) {
    // Check if the current thumbnail is an image or an album
    var check_if_album_thumbnail_xpath = './/span[@class="e7kpnw-0 gleKuB"]'
    var pages = document.evaluate(check_if_album_thumbnail_xpath,
      snapshot.snapshotItem(i), null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    // Album
    if (pages) {
      var album_cover_xpath = './/a[@class="sc-bdVaJa kxJtVr"]'
      var album_cover_url = document.evaluate(album_cover_xpath, snapshot.snapshotItem(i),
        null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href;

      var album_url = album_cover_url.replace("medium", "manga");

      var album = new XMLHttpRequest();
      album.responseType = "document";
      album.open('GET', album_url, true);
      album.send();

      album.onload = function () {
        download_album(this.responseXML);
      }
    }

    // Single image
    else {
      var thumbnail_url_xpath = './/div[@class="rp5asc-12 gDggns"]/img'
      var thumb_url = document.evaluate(thumbnail_url_xpath, snapshot.snapshotItem(i),
        null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src;

      // Construct URL
      var orig_url = thumb_url.replace("c/250x250_80_a2/img-master", "img-original").replace("_square1200.jpg", img_format);

      // Get image id (filename)
      var imageID = orig_url.substring(orig_url.lastIndexOf('/') + 1, orig_url.length - 4) + img_format;

      // Attempt to download image
      download(orig_url, imageID, img_format, false);
    }
  }
}


// Downloads an image or an album
function download_art(doc) {
  // Check if document has album page count variable to determine if page is album cover or single image
  var check_if_album_xpath = '//div[@role="presentation"]//div[@class="sc-LzLvM hUlxx"]'
  var pagesDiv = doc.evaluate(check_if_album_xpath, doc, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  if (pagesDiv) {
    console.log("album")
    var numPages = parseInt(pagesDiv.textContent.split('/')[1])
    var firstImageURL = doc.evaluate('//body//div[@role="presentation"]/a',
    doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href
    var imageFormat = firstImageURL.substr(firstImageURL.lastIndexOf('.'))
    // var albumID = firstImageURL.substr(firstImageURL.lastIndexOf('/') + 1).replace("_p0" + imageFormat, "_p")

    for (var page = 0; page < numPages; page++) {
      imageURL = firstImageURL.replace("_p0", "_p" + page)
      imageID = imageURL.substr(firstImageURL.lastIndexOf('/') + 1)
      download(imageURL, imageID, imageID.slice(-4), false)
    }
  }
  else {
    // No page count element, so get single image and download
    console.log("image")
    download_image(doc);
  }
}

// Guesses image extension and downloads image
function download(url, id, ext, retry) {
  // Send xhr request to download image
  var xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.open('GET', url, true);
  xhr.send();
  
  xhr.onload = function () {
    if (xhr.status === 200) {
      // Assign blob response a URL and send message to background.js to download blob
      chrome.runtime.sendMessage({
        message: "download",
        url: URL.createObjectURL(this.response),
        filename: id
      });
    }

    else if (xhr.status === 404 && retry === false) {
      // Get incorrect format
      var curr_format = url.substring(url.length - 4, url.length);

      // Get correct format
      var correct_format = curr_format === ".jpg" ? ".png" : ".jpg";

      // Set img_format to correct format (for this image)
      // and hope it doesn't flip again
      var img_format = correct_format;

      // Attempt redownload with retry set to true
      url = url.substring(0, url.length - 4) + correct_format;
      id = id.substring(0, id.length - 4) + correct_format;

      download(url, id, correct_format, true);
    }

    // Uh-oh
    else {
      console.log("New extension detected!");
    }
  };
}

// older code
// The 'download_image' function that finds the exact source to download
// This function was probably written before guessing extension was implemented
// Perhaps it should be refactored?
function download_image(doc) {
  // Get source image url and id
  var imageURL = doc.evaluate('//body//div[@role="presentation"]/a',
    doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href
  var imageID = imageURL.substr(imageURL.lastIndexOf('/') + 1);

  var xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.withCredentials = true;
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

function download_album(doc) {
  // Don't need album size anymore
  // Just grab everything from this XPath
  // Doesn't work until album is opened, so still have to guess I think
  imagesXPath = '//div[@role="presentation"]/a[img[@class="sc-1qpw8k9-1 jgWNBV"]]'

  // Get album size with XPath
  albumSizeXPath = '//div[@role="presentation"]//div[@class="sc-1mr081w-0 Mkpad"]'
  var albumSize = doc.evaluate(albumSizeXPath, doc, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent.split('/')[1];

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

// Downloads an expanded album image
function download_album_image() {
  var imageURL = document.evaluate('//body/img', document, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src
  var imageID = imageURL.substr(imageURL.lastIndexOf('/') + 1)

  download(imageURL, imageID, imageID.slice(-4), false)
}