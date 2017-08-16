// Disables subfolder text box when subfolder checkbox is not checked
function subfolder_options() {
  var folderCheck = document.getElementById('folderCheck').checked;
  var folderBox = document.getElementById('folderName');
  if (folderCheck) {
    folderBox.disabled = false;
  }
  else {
    folderBox.disabled = true;
  }
}

// Update status to let user know options were saved.
function save_confirm() {
  var status = document.getElementById('status');
  status.textContent = 'Options saved.';
  setTimeout(function() {
    status.textContent = '';
  }, 800);
}

// Saves options to chrome.storage.sync.
function save_options() {
  var folderCheck = document.getElementById('folderCheck').checked;
  var folderName = document.getElementById('folderName').value;
  // Save checked checkbox and subfolder name
  if (folderCheck) {
    chrome.storage.sync.set({
      isSubfolder: folderCheck,
      subfolder: folderName
    }, save_confirm);
  }
  // Don't save folderName if subfolder is not checked
  else {
    chrome.storage.sync.set({
      isSubfolder: folderCheck
    }, save_confirm);
  }
}

// Restores options state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get(['isSubfolder', 'subfolder'], function(items) {
    document.getElementById('folderCheck').checked = items.isSubfolder;
    document.getElementById('folderName').value = items.subfolder;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('folderCheck').addEventListener('click', subfolder_options);
document.getElementById('save').addEventListener('click', save_options);