// Saves options to chrome.storage.sync.
function save_options() {
  var subfolder = document.getElementById('subfolder').value;
  chrome.storage.sync.set({
    subfolder: subfolder
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 850);
  });
}

// Restores options state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get('subfolder', function(items) {
    document.getElementById('subfolder').value = items.subfolder;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);