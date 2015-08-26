function showNotification(title, body, icon, data) {
  var notificationOptions = {
    body: body,
    icon: icon ? icon : 'images/touch/chrome-touch-icon-192x192.png',
    tag: 'simple-push-demo-notification',
    data: data
  };
  if (self.registration.showNotification) {
    self.registration.showNotification(title, notificationOptions);
    return;
  } else {
    new Notification(title, notificationOptions);
  }
}



setInterval(function(){
    var title = 'What\'s the weather like in London?';
    var message = 'sunny';
    var icon = 'https://dummyimage.com/128x128/000/fff';
    showNotification(title, message, icon, {});
}, 10000);
