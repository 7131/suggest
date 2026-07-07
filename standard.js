// Number list class
class NumberList {
    #sum;

    // constructor
    constructor(pattern) {
        // check the arguments
        if (!Array.isArray(pattern)) {
            pattern = pattern.split("").map(elem => parseInt(elem, 36));
        }
        this.numbers = pattern.filter(elem => !isNaN(elem) && 0 <= elem);

        // set properties
        this.length = this.numbers.length;
        this.#sum = this.numbers.reduce((acc, cur) => acc + cur, 0);
    }

    // whether valid siteswap or not
    isSiteswap() {
        // check the number of balls
        if (this.#sum % this.length != 0) {
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
    }

    // whether jugglable or not
    isJugglable() {
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
    }

    // create a candidate list
    createCandidates(deep, balls, height, count, length) {
        const candidates = [];
        const max = (this.length + length) * balls;
        const min = max - length * height;
        if (this.#sum < min || max < this.#sum) {
            // return if the value is already too large or too small
            return candidates;
        }

        // initialize properties
        this.indexes = new Array(length).fill(0);
        this.depth = 1;

        // create up to the specified number
        while (candidates.length < count && this.depth <= length) {
            const addition = this.indexes.slice(0, this.depth);
            const total = this.#sum + addition.reduce((acc, cur) => acc + cur);

            // judgement
            if (total == (this.length + this.depth) * balls) {
                const next = new NumberList(this.numbers.concat(addition));
                if (next.isSiteswap()) {
                    candidates.push(next.toString());
                }
            }

            // next index
            if (deep) {
                this.#setNextByDepth(height);
            } else {
                this.#setNextByBreadth(height);
            }
        }
        return candidates;
    }

    // get instance string
    toString() {
        return this.numbers.map(elem => elem.toString(36)).join("");
    }

    // depth-first search
    #setNextByDepth(height) {
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
    }

    // breadth-first search
    #setNextByBreadth(height) {
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
    }

}

// Controller class
class Controller {
    #input;
    #suggest;
    #balls;
    #height;
    #count;
    #length;
    #depth;
    #facade;
    #prev = "";
    #elements = [];
    #position = -1;

    // constructor
    constructor() {
        window.addEventListener("load", this.#initialize.bind(this));
    }

    // initialize the private fields
    #initialize(e) {
        // DOM elements
        this.#input = document.getElementById("pattern");
        this.#suggest = document.getElementById("suggest");
        this.#balls = document.getElementById("balls");
        this.#height = document.getElementById("height");
        this.#count = document.getElementById("count");
        this.#length = document.getElementById("length");
        this.#depth = document.getElementById("depth");

        // events
        this.#input.addEventListener("keydown", this.#selectPattern.bind(this));
        this.#input.addEventListener("input", this.#inputPattern.bind(this));
        this.#input.addEventListener("blur", this.#clearFrame.bind(this));
        this.#balls.addEventListener("input", this.#changeBalls.bind(this));
        this.#height.addEventListener("input", this.#changeHeight.bind(this));
        this.#count.addEventListener("input", this.#changeCount.bind(this));
        this.#length.addEventListener("input", this.#changeLength.bind(this));
        document.getElementById("start").addEventListener("click", this.#startJuggling.bind(this));
        document.getElementById("stop").addEventListener("click", this.#stopJuggling.bind(this));

        // clear the list
        this.#clearFrame();
        this.#facade = new jmotion.Facade("#board");
    }

    // pattern selection process by keyboard
    #selectPattern(e) {
        if (this.#elements.length == 0) {
            return;
        }

        // process for each key
        switch (e.keyCode) {
            case 38:
                // up
                this.#moveElement(this.#position - 1);
                break;

            case 40:
                // down
                this.#moveElement(this.#position + 1);
                break;

            case 13:
                // Enter
                if (0 <= this.#position && this.#position < this.#elements.length) {
                    this.#selectElement(this.#elements[this.#position].textContent);
                } else {
                    this.#clearFrame();
                }
                break;

            case 27:
                // ESC
                this.#clearFrame();
                break;

            default:
                return;
        }

        // cancel default processing
        e.preventDefault();
    }

    // pattern input process
    #inputPattern(e) {
        // check the input
        const pattern = this.#input.value.trim();
        if (pattern == this.#prev) {
            return;
        }
        const numbers = this.#viewData();
        if (numbers == null) {
            return;
        }

        // create a candidate list
        const balls = this.#getValidInt(this.#balls.value, 1, 35);
        const height = this.#getValidInt(this.#height.value, balls, 35);
        const count = this.#getValidInt(this.#count.value, 5, 100);
        const length = this.#getValidInt(this.#length.value, 1, 5);
        const deep = this.#depth.checked;
        const candidates = numbers.createCandidates(deep, balls, height, count, length);
        if (candidates.length == 0) {
            return;
        }
        this.#elements = [];

        // create elements one by one
        this.#suggest.classList.remove("hidden");
        for (const candidate of candidates) {
            const element = document.createElement("div");
            element.textContent = candidate;

            // set events for each element
            element.addEventListener("touchstart", this.#tapElement.bind(this), { "passive": false });
            element.addEventListener("mousedown", this.#tapElement.bind(this));
            element.addEventListener("mouseover", this.#pointElement.bind(this));
            this.#elements.push(element);
            this.#suggest.appendChild(element);
        }
    }

    // move element
    #moveElement(index) {
        // clear current selection
        if (0 <= this.#position && this.#position < this.#elements.length) {
            this.#elements[this.#position].classList.remove("select");
        }
        if (index < -1) {
            // move to the end
            index = this.#elements.length - 1;
        } else if (this.#elements.length <= index) {
            // don't select
            index = -1;
        }
        this.#position = index;
        if (index < 0) {
            return;
        }

        // select next element
        const element = this.#elements[this.#position];
        element.classList.add("select");
    }

    // select element
    #selectElement(pattern) {
        // set the text box property
        this.#input.value = pattern;
        this.#input.setSelectionRange(pattern.length, pattern.length);

        // display data
        this.#viewData();
    }

    // display data
    #viewData() {
        // clear the list
        this.#clearFrame();
        this.#prev = this.#input.value;
        this.#input.classList.remove("error");
        this.#input.classList.remove("valid");

        // get the data
        const numbers = new NumberList(this.#input.value);
        if (numbers.length == 0) {
            return null;
        }
        if (!numbers.isJugglable()) {
            // not jugglable
            this.#input.classList.add("error");
            return null;
        }
        if (numbers.isSiteswap()) {
            // valid siteswap
            this.#input.classList.add("valid");
        }
        return numbers;
    }

    // clear the list of complementary elements
    #clearFrame(e) {
        // clear the elements
        this.#suggest.textContent = "";
        this.#suggest.classList.add("hidden");

        // clear the fields
        this.#elements = [];
        this.#position = -1;
    }

    // pattern selection process by tap
    #tapElement(e) {
        this.#selectElement(e.currentTarget.textContent);
        e.preventDefault();
    }

    // point the element
    #pointElement(e) {
        // get the position after moving
        const index = this.#elements.indexOf(e.currentTarget);
        if (index == this.#position) {
            return;
        }

        // move element
        this.#moveElement(index);
    }

    // start button process
    #startJuggling(e) {
        const numbers = new NumberList(this.#input.value);
        this.#facade.startJuggling(numbers.toString());
    }

    // stop button process
    #stopJuggling(e) {
        this.#facade.stopJuggling();
    }

    // the number of balls changing process
    #changeBalls(e) {
        // number of balls
        this.#setStatus(e.currentTarget, 1, 35);
        const min = this.#getValidInt(e.currentTarget.value, 1, 35);

        // maximum height
        this.#setStatus(this.#height, min, 35);
    }

    // maximum height changing process
    #changeHeight(e) {
        // number of balls
        const min = this.#getValidInt(this.#balls.value, 1, 35);

        // maximum height
        this.#setStatus(e.currentTarget, min, 35);
    }

    // maximum number of candidates changing process
    #changeCount(e) {
        this.#setStatus(e.currentTarget, 5, 100);
    }

    // maximum complement length changing process
    #changeLength(e) {
        this.#setStatus(e.currentTarget, 1, 5);
    }

    // set the text box status
    #setStatus(element, min, max) {
        const number = parseInt(element.value, 10);
        if (isNaN(number) || number < min || max < number) {
            // invalid
            element.classList.add("error");
        } else {
            // valid
            element.classList.remove("error");
        }
    }

    // get valid integer value
    #getValidInt(text, min, max) {
        const number = parseInt(text, 10);
        if (isNaN(number)) {
            return min;
        } else {
            return Math.max(min, Math.min(number, max));
        }
    }

}

// start the controller
new Controller();

