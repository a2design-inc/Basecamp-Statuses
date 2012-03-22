chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
  var params = request.params, data = new Object, result = new Object();
  var status = 'ok';
  switch (request.action){

    case 'empty_settings':
        status = "fail";
        showNotification('Changes not saved!','You need to enter your BaseCamp data! Click on this notification to do that.', function(){
          chrome.tabs.create({url: "options.html", selected: true});
        });
      break;

    case 'data_cant_save':
        status = "fail";
        showNotification('Changes not saved!','Failed to save your changes. Probable reasons for this lack of internet connection or incorrect Basecamp settings. Click here for change settings.', function(){
          chrome.tabs.create({url: "options.html", selected: true});
        });
      break;

    case 'get_settings':
      data = getSettings();
      break;
  }
  result.status = status;
  result.data = data;
  sendResponse(result);
});


function getSettings(){
  var settings = new Object();
  settings.token    = localStorage.token;
  settings.domain   = localStorage.domain;
  settings.comments = localStorage.comments;
  settings.statuses = localStorage.statuses;
  return settings;
}

function showNotification(title, content, onclick) {
  var n = window.webkitNotifications.createNotification('img/icon48.png', title, content);
  n.addEventListener('click', function(){
    this.cancel();
    onclick();
  });
  n.show();
}
