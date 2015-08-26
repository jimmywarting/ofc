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


var reqConfig = (function(){var a=new FormData;a.append("format","svg");a.append("file",function(){for(var a=atob("d09GMgABAAAAAADMAAoAAAAAAhAAAACGAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAABlYALAokNgE4AiQDBgsGAAQgBSAHEBtpAciuCuymx+8MIwgrn4ywhx+96xA9vxab93cFRbvtOLiUDLFbknSbZ+uLTgMAitbLf+DIejCuq1Y3OJNMg0QTzGmByQcabCCbMeB0CWienwKS4HKRXLKEl+3EtoUPHmwBGLAxWLgBNkhNvQEQ4v8wfH864VuCn39x1XTHzNs4LO2HoGEg"),e=[],b=0;b<a.length;b+=512){for(var c=a.slice(b,b+512),f=Array(c.length),d=0;d<c.length;d++)f[d]=c.charCodeAt(d);c=new Uint8Array(f);
e.push(c)}return new Blob(e)}());return{method:"POST",headers:{"X-Mashape-Key":"dFYPWXxpp3mshKD6Kimb4pVfvYLvp1YWcWfjsnErOY3HN8zs4a"},body:a}})();

function checkStatus(response) {
	if (response.status === 200 && response.headers.get("content-type") === 'application/octet-stream') {
		return response
	} else {
		var error = new Error(response.statusText)
		error.response = response
		throw error
	}
}


	
setInterval(function(){
    
  fetch('https://ofc.p.mashape.com/directConvert/', reqConfig)
	  .then(checkStatus)
	  .then(function(response){
	    var title = 'Font converter success';
      var message = '';
      var icon = 'https://dummyimage.com/128x128/000/fff';
      
	    showNotification(title, message, icon, {});
	  })
	  .catch(function(error) {
		  var title = 'Font converter failed';
      var message = 'for some reason';
      var icon = 'https://dummyimage.com/128x128/000/fff';
      showNotification(title, message, icon, {});
	  });
}, 60000*10);
