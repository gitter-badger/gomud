define(['exports'], function (exports) {
	var colourTable = ['#000000', '#AA0000', '#00AA00', '#AA5500',
                       '#0000AA', '#AA00AA', '#00AAAA', '#AAAAAA',
                       '#555555', '#FF5555', '#55FF55', '#FFFF55', 
                       '#5555FF', '#FF55FF', '#55FFFF', '#FFFFFF'];

    exports.TextConsole = function(charsWide, charsHigh, canvasName, font) {
		var that = this;

		this.canvas = document.getElementById(canvasName);
		if (!this.canvas) {
			console.log("Failed to find canvas: " + canvasName);
			return;
		}

		this.context2d = this.canvas.getContext("2d");

		if (!this.context2d) {
			console.log("Couldn't get 2d context on canvas");
			return;
		}

		// Setup canvas size and buffers   
		this.initDone = false; 
		this.charsWide = charsWide;
		this.charsHigh = charsHigh;
		this.fontHeight = 14;
		this.fontWidth = 8;
		this.canvas.width = charsWide * this.fontWidth;
		this.canvas.height = charsHigh * this.fontHeight;
		this.caretRow = 0;
		this.caretColumn = 0;
		this.charBuffer = new Uint8Array(this.charsWide * this.charsHigh);
		this.colourBuffer = new Uint8Array(this.charsWide * this.charsHigh);
		this.charBackBuffer = new Uint8Array(this.charsWide * this.charsHigh);
		this.colourBackBuffer = new Uint8Array(this.charsWide * this.charsHigh);
		this.reset();

    	var sourceFont = new Image();
    	sourceFont.onload = function(){
			// Create foreground font colours
			that.colouredFonts = new Array(16);
			for (i = 0; i < 16; i++) {
				that.colouredFonts[i] = document.createElement('canvas');
				that.colouredFonts[i].width = sourceFont.width;
				that.colouredFonts[i].height = sourceFont.height;
				var bufferContext = that.colouredFonts[i].getContext('2d');
				bufferContext.fillStyle = colourTable[i];
				bufferContext.fillRect(0, 0, sourceFont.width, sourceFont.height);
				bufferContext.globalCompositeOperation = "destination-in";
				bufferContext.drawImage(sourceFont, 0, 0);
			}
			that.initDone = true;
		}
		sourceFont.src = font;
	}

	exports.TextConsole.prototype.reset = function() {
	    this.fgColour = 7;
	    this.bgColour = 0;
	    this.bold = false;
	    this.escaped = 0;
	    this.escapeBuffer = "";
	}

	exports.TextConsole.prototype.clear = function() {
	    this.caretRow = 0;
	    this.caretColumn = 0;
	    this.charBuffer = new Uint8Array(this.charsWide * this.charsHigh);
	    this.colourBuffer = new Uint8Array(this.charsWide * this.charsHigh);
	    this.charBackBuffer = new Uint8Array(this.charsWide * this.charsHigh);
	    this.colourBackBuffer = new Uint8Array(this.charsWide * this.charsHigh);
	    //this.context2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
	    this.reset();
	}

	exports.TextConsole.prototype.presentToScreen = function() {
		if (!this.initDone) return;
	    var readPos = 0;
	    var sy = 0;
	    for (y = 0; y < this.charsHigh; y++) {
	        var sx = 0;
	        for (x = 0; x < this.charsWide; x++) {
	            var charId = this.charBuffer[readPos];
	            var colourId = this.colourBuffer[readPos];

	            //readPos++;
	            if (this.charBuffer[readPos] != this.charBackBuffer[readPos] || 
	                this.colourBuffer[readPos] != this.colourBackBuffer[readPos]) {

	                var cx = (charId & 0x0f) * this.fontWidth;
	                var cy = (charId >> 4) * this.fontHeight;
	                this.context2d.fillStyle = colourTable[colourId >> 4];
	                this.context2d.fillRect(sx, sy, this.fontWidth, this.fontHeight);
	                this.context2d.drawImage(this.colouredFonts[colourId & 15], cx, cy, this.fontWidth, this.fontHeight, sx, sy, this.fontWidth, this.fontHeight);
	            }
	            readPos++;
	            sx += this.fontWidth;
	        }
	        sy += this.fontHeight;
	    }
	    this.charBackBuffer.set(this.charBuffer);
	    this.colourBackBuffer.set(this.colourBuffer);
	}

	exports.TextConsole.prototype.scroll = function() {
	    this.charBuffer.set(this.charBuffer.subarray(this.charsWide));
	    this.charBuffer.set(new Uint8Array(this.charsWide),(this.charsWide*this.charsHigh)-this.charsWide);

	    this.colourBuffer.set(this.colourBuffer.subarray(this.charsWide));
	    this.colourBuffer.set(new Uint8Array(this.charsWide),(this.charsWide*this.charsHigh)-this.charsWide);

	}

	exports.TextConsole.prototype.newLine = function() {
	    this.caretColumn = 0;
	    this.caretRow++;
	    if (this.caretRow >= this.charsHigh) {
	        this.caretRow = this.charsHigh-1;
	        this.scroll();
	    }
	}

	exports.TextConsole.prototype.move = function(x,y) {
	    if (x >= 0 && x < this.charsWide && y >= 0 && y < this.charsHigh) {
	        this.caretColumn = x;
	        this.caretRow = y;
	    }
	}

	exports.TextConsole.prototype.print = function(text) {
		// Convert some UTF-8 characters to ASCII.
		conversionTable = {
			"ä" : 132,
			"å" : 134,
			"Ä" : 142,
			"Å" : 143,
			"ö" : 148,
			"Ö" : 153
		};
		charMap = [];
		for (i = 0; i < text.length; i++) {
			if (text.charAt(i) in conversionTable) {
				charMap.push(conversionTable[text.charAt(i)]);
			} else {
				charMap.push(text.charCodeAt(i));
			}
		}

	    var xStart = this.caretRow;
	    var writePos = this.caretColumn + this.caretRow * this.charsWide;
	    for (i = 0; i < text.length; i++) {
	        var charCode = charMap[i];
	        // First character after escape must be "["
	        if (this.escaped == 1 && charCode == 91) {
	            this.escaped = 2;
	        } else if (this.escaped == 2) {
	            if ((charCode >= 48 && charCode <= 57) || charCode == 59) {
	                // Add numbers and semicolons to escape buffer
	                this.escapeBuffer += String.fromCharCode(charCode);
	            }
	            // Select Graphic Rendition, character 'm'.
	            else if (charCode == 109) {
	                var a = this.escapeBuffer.split(';');
	                var element = null;
	                for (var n = 0; n < a.length; n++) {
	                    element = a[n];
	                    if (element[0] == "0") {
	                        this.reset();
	                    } else if (element[0] == "1") {
	                        this.bold = true;
	                        if (this.fgColour >> 3 != 1) {
	                            this.fgColour += 8;
	                        }
	                    } else if (element[0] == "2") {
	                        this.bold = false;
	                        if (this.fgColour >> 3 != 0) {
	                            this.fgColour -= 8;
	                        }
	                    } else if (element[0] == "3") {
	                        this.fgColour = parseInt(element[1]);
	                        if (this.bold) {
	                            this.fgColour += 8;
	                        }
	                    } else if (element[0] == "4") {
	                        this.bgColour = parseInt(element[1]);
	                        if (this.bold) {
	                            this.bgColour += 16;
	                        }
	                    } else if (element[0] == "8") {
	                        this.fgColour = parseInt(element[1]) + (1 << 3);
	                    } else if (element[0] == "9") {
	                        this.bgColour = parseInt(element[1]) + (1 << 3);
	                    }
	                }
	                this.escaped = 0;
	            } 

	            // Move cursor, character 'H' or 'f'.
	            else if (charCode == 72 || charCode == 102) {
	                var a = this.escapeBuffer.split(';');
	                if (a.length == 2) {
	                	var x = parseInt(a[0]);
	                	var y = parseInt(a[1]);
	                	if (x >= 0 && x < this.charsWide && y >= 0 && y < this.charsHigh) {
	                		this.caretColumn = x;
	                		this.caretRow = y;
	                	}
	                }
	                this.escaped = 0;
	            } 

	            else if (charCode == 65) {
	                // Move cursor up
	                var move = parseInt(this.escapeBuffer);
	                if (this.escapeBuffer == "" && this.caretRow > 0) {
	                    this.caretRow--;
	                } else if (move > 0) {
	                    this.caretRow -= move;
	                    if (this.caretRow < 0) {
	                        this.caretRow = 0;
	                    }
	                }
	                this.escaped = 0;
	            } 

	            else if (charCode == 66) {
	                // Move cursor Down
	                var move = parseInt(this.escapeBuffer);
	                if (this.escapeBuffer == "" && this.caretRow < this.charsHigh-1) {
	                    this.caretRow++;
	                } else if (move > 0) {
	                    this.caretRow += move;
	                    if (this.caretRow > this.charsHigh-1) {
	                        this.caretRow = this.charsHigh-1;
	                    }
	                }
	                this.escaped = 0;
	            } 

	            else if (charCode == 67) {
	                // Move cursor Right
	                var move = parseInt(this.escapeBuffer);
	                if (this.escapeBuffer == "" && this.caretColumn < this.charsWide-1) {
	                    this.caretColumn++;
	                } else if (move > 0) {
	                    this.caretColumn += move;
	                    if (this.caretColumn > this.charsWide-1) {
	                        this.caretColumn = this.charsWide-1;
	                    }
	                }
	                this.escaped = 0;
	            }

	            else if (charCode == 68) {
	                // Move cursor Left
	                var move = parseInt(this.escapeBuffer);
	                if (this.escapeBuffer == "" && this.caretColumn > 0) {
	                    this.caretColumn--;
	                } else if (move > 0) {
	                    this.caretColumn -= move;
	                    if (this.caretColumn < 0) {
	                        this.caretColumn = 0;
	                    }
	                }
	                this.escaped = 0;
	            } 

	            else if (charCode == 115) {
	                // save cursor position
	                this.caretColumnSaved = this.caretColumn;
	                this.caretRowSaved = this.caretRow;
	                this.escaped = 0;
	            }
	            
	            else if (charCode == 117) {
	                // load cursor position
	                this.caretColumn = this.caretColumnSaved;
	                this.caretRow = this.caretRowSaved;
	                this.escaped = 0;
	            }

	            else if (charCode == 74) {
	                this.clear();
	                this.escaped = 0;
	            }

	            else {
	                // If all else fails, bail out.
	                this.escaped = 0;
	            }
	        } else if (charCode < 32) {
	            if (charCode == 13) { // carriage return
	                this.newLine();
	            } else if (charCode == 27) { // escape
	                this.escaped = 1;
	                this.escapeBuffer = "";
	            } else if (charCode == 8) { // backspace
	            	this.caretColumn--;
	            	if (this.caretColumn < 0 && this.caretRow > 0) {
	            		this.caretColumn = this.charsWide-1;
	            		this.caretRow--;
	            	}
	            	this.charBuffer[this.caretColumn + this.caretRow * this.charsWide] = 32;
	            } 
	        } else {
	            var colour = this.fgColour + (this.bgColour << 4);

	            this.charBuffer[this.caretColumn + this.caretRow * this.charsWide] = charCode;
	            this.colourBuffer[this.caretColumn + this.caretRow * this.charsWide] = colour;
	            this.caretColumn++;
	            if (this.caretRow >= this.charsHigh) {
	                this.newLine();
	            }
	        }

	    }

	}

});