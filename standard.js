// Number list class
const NumberList = function(pattern) {
    // check the arguments
    if (!Array.isArray(pattern)) {
        pattern = pattern.split("").map(elem => parseInt(elem, 36));
    }
    this.numbers = pattern.filter(elem => !isNaN(elem) && 0 <= elem);

    // set properties
    this.length = this.numbers.length;
    if (this.length == 0) {
        this._sum = 0;
    } else {
        this._sum = this.numbers.reduce((acc, cur) => acc + cur);
    }
}

// Number list prototype
NumberList.prototype = {

    // whether valid siteswap or not
    "isSiteswap": function() {
        // check the number of balls
        if (this._sum % this.length != 0) {
            return false;
        }

        // check the numbers one by one
        const drops = new Array(this.length).fill(false);
        for (let i = 0; i < this.length; i++) {
            const index = (this.numbers[i] + i) % this.length;
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
        const drops = [];
        for (let i = 0; i < this.length; i++) {
            if (0 < this.numbers[i]) {
                // judge only when throwing the ball
                const index = this.numbers[i] + i;
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
        const candidates = [];
        const max = (this.length + length) * balls;
        const min = max - length * height;
        if (this._sum < min || max < this._sum) {
            // return if the value is already too large or too small
            return candidates;
        }

        // initialize properties
        this.indexes = new Array(length).fill(0);
        this.depth = 1;

        // create up to the specified number
        while (candidates.length < count && this.depth <= length) {
            const addition = this.indexes.slice(0, this.depth);
            const total = this._sum + addition.reduce((acc, cur) => acc + cur);

            // judgement
            if (total == (this.length + this.depth) * balls) {
                const next = new NumberList(this.numbers.concat(addition));
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
        return this.numbers.reduce((acc, cur) => acc + cur.toString(36), "");
    },

    // depth-first search
    "_setNextByDepth": function(height) {
        // when the maximum depth is not reached
        if (this.depth < this.indexes.length) {
            this.depth++;
            return;
        }

        // when the maximum depth is reached
        let i = this.depth - 1;
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
        let i = this.depth - 1;
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
const Controller = function() {
    window.addEventListener("load", this._initialize.bind(this));
}

// Controller prototype
Controller.prototype = {

    // initialize the private fields
    "_initialize": function(e) {
        // events
        const input = document.getElementById("pattern");
        input.addEventListener("keydown", this._selectPattern.bind(this));
        input.addEventListener("input", this._inputPattern.bind(this));
        input.addEventListener("blur", this._clearFrame.bind(this));
        document.getElementById("start").addEventListener("click", this._startJuggle.bind(this));
        document.getElementById("stop").addEventListener("click", this._stopJuggle.bind(this));
        document.getElementById("balls").addEventListener("input", this._changeBalls.bind(this));
        document.getElementById("height").addEventListener("input", this._changeHeight.bind(this));
        document.getElementById("count").addEventListener("input", this._changeCount.bind(this));
        document.getElementById("length").addEventListener("input", this._changeLength.bind(this));

        // clear the list
        this._prev = "";
        this._elements = [];
        this._position = -1;
        this._clearFrame();
        this._facade = new jmotion.Facade("#board");
    },

    // pattern selection process by keyboard
    "_selectPattern": function(e) {
        if (this._elements.length == 0) {
            return;
        }

        // process for each key
        switch (e.keyCode) {
            case 38:
                // up
                this._moveElement(this._position - 1);
                break;

            case 40:
                // down
                this._moveElement(this._position + 1);
                break;

            case 13:
                // Enter
                if (0 <= this._position && this._position < this._elements.length) {
                    this._selectElement(e.currentTarget, this._elements[this._position].innerHTML);
                } else {
                    this._clearFrame();
                }
                break;

            case 27:
                // ESC
                this._clearFrame();
                break;

            default:
                return;
        }

        // cancel default processing
        e.preventDefault();
    },

    // pattern input process
    "_inputPattern": function(e) {
        // check the input
        const input = e.currentTarget;
        const pattern = input.value.trim();
        if (pattern == this._prev) {
            return;
        }
        const numbers = this._viewData(input);
        if (numbers == null) {
            return;
        }

        // create a candidate list
        const balls = this._getValidInt(document.getElementById("balls").value, 1, 35);
        const height = this._getValidInt(document.getElementById("height").value, balls, 35);
        const count = this._getValidInt(document.getElementById("count").value, 5, 100);
        const length = this._getValidInt(document.getElementById("length").value, 1, 5);
        const deep = document.getElementById("depth").checked;
        const candidates = numbers.createCandidates(deep, balls, height, count, length);
        if (candidates.length == 0) {
            return;
        }
        this._elements = [];

        // create elements one by one
        const suggest = document.getElementById("suggest");
        suggest.style.display = "";
        for (const candidate of candidates) {
            const element = document.createElement("div");
            element.innerHTML = candidate;

            // set events for each element
            element.addEventListener("touchstart", this._tapElement.bind(this));
            element.addEventListener("mousedown", this._tapElement.bind(this));
            element.addEventListener("mouseover", this._pointElement.bind(this));
            this._elements.push(element);
            suggest.appendChild(element);
        }
    },

    // move element
    "_moveElement": function(index) {
        // clear current selection
        if (0 <= this._position && this._position < this._elements.length) {
            this._elements[this._position].classList.remove("select");
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
        const element = this._elements[this._position];
        element.classList.add("select");
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
        input.classList.remove("error");
        input.classList.remove("valid");

        // get the data
        const numbers = new NumberList(input.value);
        if (numbers.length == 0) {
            return null;
        }
        if (!numbers.isJugglable()) {
            // not jugglable
            input.classList.add("error");
            return null;
        }
        if (numbers.isSiteswap()) {
            // valid siteswap
            input.classList.add("valid");
        }
        return numbers;
    },

    // clear the list of complementary elements
    "_clearFrame": function(e) {
        // clear the elements
        const suggest = document.getElementById("suggest");
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
        const index = this._elements.indexOf(e.currentTarget);
        if (index == this._position) {
            return;
        }

        // move element
        this._moveElement(index);
    },

    // start button process
    "_startJuggle": function(e) {
        const input = document.getElementById("pattern");
        const numbers = new NumberList(input.value);
        this._facade.startJuggling(numbers.toString());
    },

    // stop button process
    "_stopJuggle": function(e) {
        this._facade.stopJuggling();
    },

    // the number of balls changing process
    "_changeBalls": function(e) {
        // number of balls
        this._setStatus(e.currentTarget, 1, 35);
        const min = this._getValidInt(e.currentTarget.value, 1, 35);

        // maximum height
        this._setStatus(document.getElementById("height"), min, 35);
    },

    // maximum height changing process
    "_changeHeight": function(e) {
        // number of balls
        const balls = document.getElementById("balls");
        const min = this._getValidInt(balls.value, 1, 35);

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
        const number = parseInt(input.value, 10);
        if (isNaN(number) || number < min || max < number) {
            // invalid
            input.classList.add("error");
        } else {
            // valid
            input.classList.remove("error");
        }
    },

    // get valid integer value
    "_getValidInt": function(text, min, max) {
        const number = parseInt(text, 10);
        if (isNaN(number)) {
            return min;
        } else {
            return Math.max(min, Math.min(number, max));
        }
    },

    // move focus
    "_focusText": function() {
        document.getElementById("pattern").focus();
    },

}

// start the controller
new Controller();

