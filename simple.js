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
        this.balls = "&nbsp;";
    } else {
        this.balls = this.numbers.reduce(this._addNumber, 0) / this.length;
    }
}

// Number list prototype
NumberList.prototype = {

    // siteswap alphabets
    "ALPHABET": "0123456789abcdefghijklmnopqrstuvwxyz",

    // whether valid siteswap or not
    "isSiteswap": function() {
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
    "createCandidates": function(count, length) {
        // initialize
        var candidates = [];
        var indexes = new Array(length);
        for (var i = 0; i < length; i++) {
            indexes[i] = 0;
        }
        var depth = 1;
        var height = this.ALPHABET.length - 1;

        // create in order
        while (candidates.length < count && depth <= length) {
            // judgement
            var pattern = this.numbers.concat(indexes.slice(0, depth));
            var next = new NumberList(pattern);
            if (next.isSiteswap()) {
                candidates.push(next.toString());
            }

            // next index
            var i = depth - 1;
            indexes[i]++;
            while (height < indexes[i]) {
                indexes[i] = 0;
                i--;
                if (i < 0) {
                    // add depth after updating to the first index
                    depth++;
                    break;
                }
                indexes[i]++;
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

        // clear the list
        this._clearFrame();
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
        if (input.value.trim() == this._prev) {
            return;
        }
        var numbers = this._viewData(input);
        if (numbers == null) {
            return;
        }

        // create a candidate list
        var candidates = numbers.createCandidates(10, 3);
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
        document.getElementById("balls").innerHTML = numbers.balls;
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

    // move focus
    "_focusText": function() {
        var input = document.getElementById("pattern");
        input.focus();
    },

}

// start the controller
new Controller();

