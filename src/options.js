// Disables and clears subfolder text box when subfolder checkbox is not checked
function subfolder_options() {
  var folderCheck = document.getElementById('folderCheck').checked;
  var folderBox = document.getElementById('folderName');
  if (folderCheck) {
    folderBox.disabled = false;
    chrome.storage.sync.get('subfolder', function(item) {
      folderBox.value = item.subfolder;
    });
  }
  else {
    folderBox.disabled = true;
    folderBox.value = "";
  }
}

function send_notice(notice) {
    chrome.notifications.create({
    type: "basic",
    iconUrl: "../icons/megumin-128.png",
    title: "Pixiv Album Downloader",
    message: notice
  });
}

// Saves options to chrome.storage.sync.
function save_options() {
  var folderCheck = document.getElementById('folderCheck').checked;
  var folderName = document.getElementById('folderName').value;

  // Don't save folderName if subfolder is not checked
  if (!folderCheck) {
    chrome.storage.sync.set({
      isSubfolder: folderCheck
    }, send_notice("Images will be downloaded to the Downloads folder."));
  }
  // Check to make sure there is a subfolder name
  else if (!folderName) {
    send_notice("Please enter a subfolder name.");
  }
  // Save checked checkbox and subfolder name
  else {
    chrome.storage.sync.set({
      isSubfolder: folderCheck,
      subfolder: folderName
    }, send_notice("Images will be downloaded to Downloads/" + folderName));    
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