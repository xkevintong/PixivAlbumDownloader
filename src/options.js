// Saves options to chrome.storage.sync.
function save_options() {
  var folderCheck = document.getElementById('folderCheck').checked;
  var folderName = document.getElementById('folderName').value;
  chrome.storage.sync.set({
    isSubfolder: folderCheck,
    subfolder: folderName
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 800);
  });
}

// Restores options state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get(['isSubfolder', 'subfolder'], function(items) {
    document.getElementById('folderCheck').checked = items.isSubfolder;
    document.getElementById('folderName').value = items.subfolder;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);