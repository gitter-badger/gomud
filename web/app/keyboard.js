define(['exports'], function (exports) {
    var keyStates = {};
    var keyUpBinds = [];
    var keyDownBinds = [];

    function onKeyboard(e) {
        if(e.type == "keydown") {
            if(!keyStates[e.keyCode]) {
                keyStates[e.keyCode] = true;
                for(var i = 0; i < keyDownBinds.length; i++){
                    keyDownBinds[i](e);
                }
            }
        }
        if(e.type == "keyup") {
            if(keyStates[e.keyCode]){
                keyStates[e.keyCode] = false;
                for(var i = 0; i < keyUpBinds.length; i++){
                    keyUpBinds[i](e);
                }
            }
        }
    }

    window.onkeydown = function(e){
        //e.preventDefault();
        onKeyboard(e);
    };

    window.onkeyup = function(e){
        //e.preventDefault();
        onKeyboard(e);
    };

    exports.keyDown = function(key) {
        if (keyStates[key]){
            return true;
        } else {
            return false;
        }
    };

    exports.releaseKey = function(key) {
        keyStates[key]=false;
    }

    exports.bindKeydown = function(func) {
        keyDownBinds.push(func);
    }

    exports.bindKeyup = function(func) {
        keyUpBinds.push(func);
    }
});