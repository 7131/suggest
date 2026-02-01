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
        this.balls = "&nbsp;";
    } else {
        this.balls = this.numbers.reduce((acc, cur) => acc + cur) / this.length;
    }
}

// Number list prototype
NumberList.prototype = {

    // whether valid siteswap or not
    "isSiteswap": function() {
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
    "createCandidates": function(count, length) {
        // initialize
        const candidates = [];
        const indexes = new Array(length).fill(0);
        let depth = 1;

        // create in order
        while (candidates.length < count && depth <= length) {
            // judgement
            const next = new NumberList(this.numbers.concat(indexes.slice(0, depth)));
            if (next.isSiteswap()) {
                candidates.push(next.toString());
            }

            // next index
            let i = depth - 1;
            indexes[i]++;
            while (35 < indexes[i]) {
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
        return this.numbers.map(elem => elem.toString(36)).join("");
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
        // DOM elements
        this._balls = document.getElementById("balls");
        this._input = document.getElementById("pattern");
        this._suggest = document.getElementById("suggest");

        // events
        this._input.addEventListener("keydown", this._selectPattern.bind(this));
        this._input.addEventListener("input", this._inputPattern.bind(this));
        this._input.addEventListener("blur", this._clearFrame.bind(this));

        // fields
        this._prev = this._input.value;
        this._elements = [];
        this._position = -1;
        this._clearFrame();
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
                    this._selectElement(this._elements[this._position].textContent);
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
        if (this._input.value.trim() == this._prev) {
            return;
        }
        const numbers = this._viewData();
        if (numbers == null) {
            return;
        }

        // create a candidate list
        const candidates = numbers.createCandidates(10, 3);
        if (candidates.length == 0) {
            return;
        }
        this._elements = [];

        // create elements one by one
        this._suggest.classList.remove("hidden");
        for (const candidate of candidates) {
            const element = document.createElement("div");
            element.textContent = candidate;

            // set events for each element
            element.addEventListener("touchstart", this._tapElement.bind(this), { "passive": false });
            element.addEventListener("mousedown", this._tapElement.bind(this));
            element.addEventListener("mouseover", this._pointElement.bind(this));
            this._elements.push(element);
            this._suggest.appendChild(element);
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
    "_selectElement": function(pattern) {
        // set the text box property
        this._input.value = pattern;
        this._input.setSelectionRange(pattern.length, pattern.length);

        // display data
        this._viewData();
    },

    // display data
    "_viewData": function() {
        // clear the list
        this._clearFrame();
        this._prev = this._input.value;
        this._input.classList.remove("error");
        this._input.classList.remove("valid");

        // get the data
        const numbers = new NumberList(this._input.value);
        this._balls.innerHTML = numbers.balls;
        if (numbers.length == 0) {
            return null;
        }
        if (!numbers.isJugglable()) {
            // not jugglable
            this._input.classList.add("error");
            return null;
        }
        if (numbers.isSiteswap()) {
            // valid siteswap
            this._input.classList.add("valid");
        }
        return numbers;
    },

    // clear the list of complementary elements
    "_clearFrame": function(e) {
        // clear the elements
        this._suggest.textContent = "";
        this._suggest.classList.add("hidden");

        // clear the fields
        this._elements = [];
        this._position = -1;
    },

    // pattern selection process by tap
    "_tapElement": function(e) {
        this._selectElement(e.currentTarget.textContent);
        e.preventDefault();
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

}

// start the controller
new Controller();

