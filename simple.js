// Number list class
class NumberList {

    // constructor
    constructor(pattern) {
        // check the arguments
        if (Array.isArray(pattern)) {
            pattern = pattern.map(elem => parseInt(elem, 10));
        } else {
            pattern = pattern.split("").map(elem => parseInt(elem, 36));
        }
        this.numbers = pattern.filter(elem => !isNaN(elem) && 0 <= elem);

        // set properties
        this.length = this.numbers.length;
        if (this.length == 0) {
            this.balls = "";
        } else {
            this.balls = this.numbers.reduce((acc, cur) => acc + cur) / this.length;
        }
    }

    // whether valid siteswap or not
    isSiteswap() {
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
    createCandidates(count, length) {
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
    }

    // get instance string
    toString() {
        return this.numbers.map(elem => elem.toString(36)).join("");
    }

}

// Controller class
class Controller {
    #balls;
    #input;
    #suggest;
    #prev;
    #elements = [];
    #position = -1;

    // constructor
    constructor() {
        window.addEventListener("load", this.#initialize.bind(this));
    }

    // initialize the private fields
    #initialize(e) {
        // DOM elements
        this.#balls = document.getElementById("balls");
        this.#input = document.getElementById("pattern");
        this.#suggest = document.getElementById("suggest");

        // events
        this.#input.addEventListener("keydown", this.#selectPattern.bind(this));
        this.#input.addEventListener("input", this.#inputPattern.bind(this));
        this.#input.addEventListener("blur", this.#clearFrame.bind(this));

        // fields
        this.#prev = this.#input.value;
        this.#clearFrame();
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
        if (this.#input.value.trim() == this.#prev) {
            return;
        }
        const numbers = this.#viewData();
        if (numbers == null) {
            return;
        }

        // create a candidate list
        const candidates = numbers.createCandidates(10, 3);
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
        this.#balls.textContent = numbers.balls;
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

}

// start the controller
new Controller();

