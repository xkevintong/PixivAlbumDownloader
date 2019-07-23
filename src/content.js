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

  var firstImageURL = doc.evaluate('//body//div[@role="presentation"]/a',
  doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href
  var imageFormat = firstImageURL.substr(firstImageURL.lastIndexOf('.'))

  if (pagesDiv) {
    var numPages = parseInt(pagesDiv.textContent.split('/')[1])
    for (var page = 0; page < numPages; page++) {
      imageURL = firstImageURL.replace("_p0", "_p" + page)
      imageID = imageURL.substr(firstImageURL.lastIndexOf('/') + 1)
      download(imageURL, imageID, imageID.slice(-4), false)
    }
  }
  else {
    // No page count element, so get single image and download
    imageID = firstImageURL.substr(firstImageURL.lastIndexOf('/') + 1)
    download(firstImageURL, imageID, imageID.slice(-4), false)
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
