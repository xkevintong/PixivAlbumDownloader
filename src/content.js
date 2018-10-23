// Assume artist uses samge image format for all their art, default to jpg
var img_format = ".jpg";

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
  var pagesDiv = doc.evaluate('//*[@role="presentation"]//div[@class="css-135s1op e1vrdfyz0"]',
    doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (pagesDiv) {
    // Construct url for album, get document for album and pass to download_album 
    var albumURL = doc.evaluate('//div[@role="presentation"]//div[@role="presentation"]/a', 
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
  var albumSize = doc.evaluate('//div[@class="page"]//span[@class="total"]',
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

// The 'download_image' function that finds the exact source to download
function download_image(doc) {
  // Get source image url and id
  var imageURL = doc.evaluate('//body//div[@role="presentation"]/a',
    doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href
  var imageID = imageURL.substr(imageURL.lastIndexOf('/') + 1);

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


// Another 'download_image' function that guesses extension
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


function download_artist() {
  // Get snapshot of image/album links from the page
  var snapshot = document.evaluate('//*[@id="root"]//div[@class="css-1enaay6 e1qvz48i6"]',
    document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

  for (var i = 0; i < snapshot.snapshotLength; i++) {
    var thumb_url_temp = snapshot.snapshotItem(i).style.backgroundImage;
    thumb_url = thumb_url_temp.substring(5, thumb_url_temp.length - 2)

    // Check for corresponding page
    var pages = document.evaluate('//*[@id="root"]//ul[@class="xq6AsQu KvF6Ntf"]/li[' + (i+1) + ']//span[@class="css-14gt3bc ewmz940"]',
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    // Album
    if (pages) {
      var album_cover_url = document.evaluate('//*[@id="root"]//ul[@class="xq6AsQu KvF6Ntf"]/li[' + (i+1) + ']/div/a[1]',
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href;

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
      // Construct URL
      var orig_url = thumb_url.replace("c/250x250_80_a2/img-master", "img-original").replace("_square1200.jpg", img_format);

      // Get image id (filename)
      var imageID = orig_url.substring(orig_url.lastIndexOf('/') + 1, orig_url.length - 4) + img_format;

      // Attempt to download image
      download(orig_url, imageID, img_format, false);
    }
  }
}