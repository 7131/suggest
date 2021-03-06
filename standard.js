// Number list class
var NumberList = function(pattern) {
    // check the arguments
    if (Array.isArray(pattern)) {
        this.numbers = pattern;
    } else {
        // convert string to number
        var numbers = [];
        var lower = pattern.toLowerCase();
        for (var i = 0; i < lower.length; i++) {
            var number = this.ALPHABET.indexOf(lower[i]);
            if (0 <= number) {
                numbers.push(number);
            }
        }
        this.numbers = numbers;
    }

    // set properties
    this.length = this.numbers.length;
    if (this.length == 0) {
        return;
    }
    this._sum = this.numbers.reduce(this._addNumber, 0);
}

// Number list prototype
NumberList.prototype = {

    // siteswap alphabets
    "ALPHABET": "0123456789abcdefghijklmnopqrstuvwxyz",

    // whether valid siteswap or not
    "isSiteswap": function() {
        // check the number of balls
        if (this._sum % this.length != 0) {
            return false;
        }

        // check the numbers one by one
        var drops = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
            var index = (this.numbers[i] + i) % this.length;
            if (drops[index]) {
                return false;
            }
            drops[index] = true;
        }
        return true;
    },

    // whether jugglable or not
    "isJugglable": function() {
        // are all the dropping points apart?
        var drops = {};
        for (var i = 0; i < this.length; i++) {
            if (this.numbers[i] != 0) {
                // judge only when throwing the ball
                var index = this.numbers[i] + i;
                if (index < this.length && this.numbers[index] == 0) {
                    return false;
                }
                if (drops[index]) {
                    return false;
                }
                drops[index] = true;
            }
        }
        return true;
    },

    // create a candidate list
    "createCandidates": function(deep, balls, height, count, length) {
        var candidates = [];
        var max = (this.length + length) * balls;
        var min = max - length * height;
        if (this._sum < min || max < this._sum) {
            // return if the value is already too large or too small
            return candidates;
        }

        // initialize properties
        this.indexes = new Array(length);
        for (var i = 0; i < length; i++) {
            this.indexes[i] = 0;
        }
        this.depth = 1;

        // create up to the specified number
        while (candidates.length < count && this.depth <= length) {
            var addition = this.indexes.slice(0, this.depth);
            var total = addition.reduce(this._addNumber, this._sum);

            // judgement
            if (total == (this.length + this.depth) * balls) {
                var next = new NumberList(this.numbers.concat(addition));
                if (next.isSiteswap()) {
                    candidates.push(next.toString());
                }
            }

            // next index
            if (deep) {
                this._setNextByDepth(height);
            } else {
                this._setNextByBreadth(height);
            }
        }
        return candidates;
    },

    // get instance string
    "toString": function() {
        return this.numbers.reduce(this._joinChar.bind(this), "");
    },

    // add number
    "_addNumber": function(prev, curr) {
        return prev + curr;
    },

    // concatenation of character
    "_joinChar": function(prev, curr) {
        return prev + this.ALPHABET[curr];
    },

    // depth-first search
    "_setNextByDepth": function(height) {
        // when the maximum depth is not reached
        if (this.depth < this.indexes.length) {
            this.depth++;
            return;
        }

        // when the maximum depth is reached
        var i = this.depth - 1;
        this.indexes[i]++;
        while (height < this.indexes[i]) {
            this.indexes[i] = 0;
            i--;
            if (i < 0) {
                // return after updating to the first index
                this.depth++;
                return;
            }
            this.indexes[i]++;
        }
        this.depth = i + 1;
    },

    // breadth-first search
    "_setNextByBreadth": function(height) {
        // update index from current depth
        var i = this.depth - 1;
        this.indexes[i]++;
        while (height < this.indexes[i]) {
            this.indexes[i] = 0;
            i--;
            if (i < 0) {
                // add depth after updating to the first index
                this.depth++;
                return;
            }
            this.indexes[i]++;
        }
    },

}

// Controller class
var Controller = function() {
    // fields
    this._prev = "";
    this._elements = [];
    this._position = -1;

    // events
    window.addEventListener("load", this._initialize.bind(this), false);
}

// Controller prototype
Controller.prototype = {

    // initialize the private fields
    "_initialize": function() {
        var input = document.getElementById("pattern");
        this._prev = input.value;

        // events
        input.addEventListener("keydown", this._selectPattern.bind(this), false);
        input.addEventListener("input", this._inputPattern.bind(this), false);
        input.addEventListener("blur", this._clearFrame.bind(this), false);
        document.getElementById("start").addEventListener("click", this._startJuggle.bind(this), false);
        document.getElementById("stop").addEventListener("click", this._stopJuggle.bind(this), false);
        document.getElementById("balls").addEventListener("input", this._changeBalls.bind(this), false);
        document.getElementById("height").addEventListener("input", this._changeHeight.bind(this), false);
        document.getElementById("count").addEventListener("input", this._changeCount.bind(this), false);
        document.getElementById("length").addEventListener("input", this._changeLength.bind(this), false);

        // clear the list
        this._clearFrame();

        // JuggleMaster
        var board = document.getElementById("board");
        board.width = board.clientWidth;
        board.height = board.width;
        this._jmj = new Jmj({ "canvas": board });
    },

    // pattern selection process by keyboard
    "_selectPattern": function(e) {
        if (this._elements.length == 0) {
            return;
        }

        // process for each key
        if (e.keyCode == 38) {
            // up
            this._moveElement(this._position - 1);
        } else if (e.keyCode == 40) {
            // down
            this._moveElement(this._position + 1);
        } else if (e.keyCode == 13) {
            // Enter
            if (0 <= this._position && this._position < this._elements.length) {
                this._selectElement(e.currentTarget, this._elements[this._position].innerHTML);
            } else {
                this._clearFrame();
            }
        } else if (e.keyCode == 27) {
            // ESC
            this._clearFrame();
        } else {
            return;
        }

        // cancel default processing
        e.preventDefault();
    },

    // pattern input process
    "_inputPattern": function(e) {
        // check the input
        var input = e.currentTarget;
        var pattern = input.value.trim();
        if (pattern == this._prev) {
            return;
        }
        var numbers = this._viewData(input);
        if (numbers == null) {
            return;
        }

        // create a candidate list
        var balls = this._getValidInt(document.getElementById("balls").value, 1, 35);
        var height = this._getValidInt(document.getElementById("height").value, balls, 35);
        var count = this._getValidInt(document.getElementById("count").value, 5, 100);
        var length = this._getValidInt(document.getElementById("length").value, 1, 5);
        var deep = document.getElementById("depth").checked;
        var candidates = numbers.createCandidates(deep, balls, height, count, length);
        if (candidates.length == 0) {
            return;
        }
        this._elements = new Array(candidates.length);

        // create elements one by one
        var suggest = document.getElementById("suggest");
        suggest.style.display = "";
        for (var i = 0; i < candidates.length; i++) {
            var element = document.createElement("div");
            element.innerHTML = candidates[i];

            // set events for each element
            element.addEventListener("touchstart", this._tapElement.bind(this), false);
            element.addEventListener("mousedown", this._tapElement.bind(this), false);
            element.addEventListener("mouseover", this._pointElement.bind(this), false);
            this._elements[i] = element;
            suggest.appendChild(element);
        }
    },

    // move element
    "_moveElement": function(index) {
        // clear current selection
        if (0 <= this._position && this._position < this._elements.length) {
            this._elements[this._position].className = "";
        }
        if (index < -1) {
            // move to the end
            index = this._elements.length - 1;
        } else if (this._elements.length <= index) {
            // don't select
            index = -1;
        }
        this._position = index;
        if (index < 0) {
            return;
        }

        // select next element
        var element = this._elements[this._position];
        element.className = "select";
    },

    // select element
    "_selectElement": function(input, pattern) {
        // set the text box property
        input.value = pattern;
        input.setSelectionRange(pattern.length, pattern.length);

        // display data
        this._viewData(input);
    },

    // display data
    "_viewData": function(input) {
        // clear the list
        this._clearFrame();
        this._prev = input.value;
        input.className = "";

        // get the data
        var numbers = new NumberList(input.value);
        if (numbers.length == 0) {
            return null;
        }
        if (!numbers.isJugglable()) {
            // not jugglable
            input.className = "error";
            return null;
        }
        if (numbers.isSiteswap()) {
            // valid siteswap
            input.className = "valid";
        }
        return numbers;
    },

    // clear the list of complementary elements
    "_clearFrame": function() {
        // clear the elements
        var suggest = document.getElementById("suggest");
        suggest.innerHTML = "";
        suggest.style.display = "none";

        // clear the fields
        this._elements = [];
        this._position = -1;
    },

    // pattern selection process by tap
    "_tapElement": function(e) {
        this._selectElement(document.getElementById("pattern"), e.currentTarget.innerHTML);
        setTimeout(this._focusText, 100);
    },

    // point the element
    "_pointElement": function(e) {
        // get the position after moving
        var index = this._elements.indexOf(e.currentTarget);
        if (index == this._position) {
            return;
        }

        // move element
        this._moveElement(index);
    },

    // start button process
    "_startJuggle": function(e) {
        // check the arguments
        var input = document.getElementById("pattern");
        var numbers = new NumberList(input.value);
        if (!numbers.isSiteswap()) {
            return;
        }

        // start
        this._jmj.startJuggling({ "siteswap": numbers.toString(), "showSiteswap": false });
    },

    // stop button process
    "_stopJuggle": function(e) {
        this._jmj.stopJuggling();

        // clear canvas
        var board = document.getElementById("board");
        var context = board.getContext("2d");
        context.clearRect(0, 0, board.width, board.height);
    },

    // the number of balls changing process
    "_changeBalls": function(e) {
        // number of balls
        this._setStatus(e.currentTarget, 1, 35);
        var min = this._getValidInt(e.currentTarget.value, 1, 35);

        // maximum height
        this._setStatus(document.getElementById("height"), min, 35);
    },

    // maximum height changing process
    "_changeHeight": function(e) {
        // number of balls
        var balls = document.getElementById("balls");
        var min = this._getValidInt(balls.value, 1, 35);

        // maximum height
        this._setStatus(e.currentTarget, min, 35);
    },

    // maximum number of candidates changing process
    "_changeCount": function(e) {
        this._setStatus(e.currentTarget, 5, 100);
    },

    // maximum complement length changing process
    "_changeLength": function(e) {
        this._setStatus(e.currentTarget, 1, 5);
    },

    // set the text box status
    "_setStatus": function(input, min, max) {
        var number = parseInt(input.value, 10);
        if (isNaN(number) || number < min || max < number) {
            // invalid
            input.className = "error";
        } else {
            // valid
            input.className = "";
        }
    },

    // get valid integer value
    "_getValidInt": function(text, min, max) {
        var number = parseInt(text, 10);
        if (isNaN(number)) {
            return min;
        } else {
            return Math.max(min, Math.min(number, max));
        }
    },

    // move focus
    "_focusText": function() {
        var input = document.getElementById("pattern");
        input.focus();
    },

}

// start the controller
new Controller();

