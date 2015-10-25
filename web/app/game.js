define(function(require) {
    var fps = 60;
    var websocket = require("app/websocket");
    var keyboard = require("app/keyboard");
    var terminal = require("app/console");

    var term = new terminal.TextConsole(80, 24, "consoleCanvas", "/img/font.png");
    websocket.connect();


    websocket.on('ascii', function(msg) {
        term.print(msg);
        term.presentToScreen();
    });

    keyboard.bindKeyup(function(e) {
        websocket.send('keyup', JSON.stringify({
            "key": e.keyCode
        }));
    });

    keyboard.bindKeydown(function(e) {
        websocket.send('keydown', JSON.stringify({
            "key": e.keyCode
        }));
    });

});
