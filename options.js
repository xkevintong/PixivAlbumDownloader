// Saves options to chrome.storage.sync.
function save_options() {
  var subfolder = document.getElementById('subfolder').value;
  var zip = document.getElementById('zip').checked;
  chrome.storage.sync.set({
    subfolder: subfolder,
    zip: zip
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 850);
  });
}

// Restores select box and checkbox state using the preferences stored in chrome.storage.
function restore_options() {
  // Use default value subfolder = "Pixiv Album Downloader" and zip = false.
  chrome.storage.sync.get({
    subfolder: "Pixiv Album Downloader",
    zip: false
  }, function(items) {
    document.getElementById('subfolder').value = items.subfolder;
    document.getElementById('zip').checked = items.zip;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);