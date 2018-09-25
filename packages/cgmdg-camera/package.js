Package.describe({
  name: "cgmdg:camera",
  summary: "Photos with one function call on desktop and mobile.",
  version: "1.4.2"
});

Cordova.depends({
  "cordova-plugin-camera": "2.1.1"
});

Package.onUse(function(api) {
  api.export('CGMeteorCamera');
  api.use(["templating", "session", "ui", "blaze", "reactive-var"]);
  api.versionsFrom("METEOR@1.2");
  api.use("isobuild:cordova@5.2.0");

  api.addFiles('photo.html');
  api.addFiles('photo.js');
  api.addFiles("camera.css", ["web.browser"]);
  api.addFiles('photo-browser.js', ['web.browser']);
  api.addFiles('photo-cordova.js', ['web.cordova']);
});
