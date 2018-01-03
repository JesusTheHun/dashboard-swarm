class ContentScript {
    rearmCountdown(countdownInterval) {
        let barHeight = 8;
        let height = window.innerHeight;

        let countdownBarItem;

        this.clearCountdown();

        this.countdownBar = document.createElement('div');
        this.countdownBar.style.width = "100%";
        this.countdownBar.style.position = 'absolute';
        this.countdownBar.style.top = (height - barHeight + this.getScroll().top) + "px";
        this.countdownBar.style.zIndex = 9999;

        countdownBarItem = document.createElement('div');
        countdownBarItem.style.width = "0";
        countdownBarItem.style.borderBottomRightRadius = (barHeight/2) + "px";
        countdownBarItem.style.borderTopRightRadius = (barHeight/2) + "px";
        countdownBarItem.style.height = barHeight + "px";
        countdownBarItem.style.backgroundColor = "rgb(87, 85, 217)";
        countdownBarItem.style.animationName = "countdown";
        countdownBarItem.style.animationDuration =  countdownInterval + "ms";
        countdownBarItem.style.animationTimingFunction =  "linear";

        this.countdownBar.appendChild(countdownBarItem);
        document.querySelector('body').appendChild(this.countdownBar);
    }

    clearCountdown() {
        if (this.countdownBar !== undefined) {
            let barItem = this.countdownBar.querySelector('div');
            console.log(barItem);
            this.countdownBar.removeChild(barItem);
            this.countdownBar.remove();
            this.countdownBar = undefined;
        }
    }


    getScroll() {
        let doc = document.documentElement;
        return {
            top: (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0),
            left: (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0)
        }
    }
    scroll(direction) {
        let scroll = Object.assign({}, this.getScroll());

        switch(direction) {
            case 'bottom':
                scroll.top += 25;
            break;

            case 'top':
                scroll.top -= 25;
            break;

            case 'left':
                scroll.left -= 25;
            break;

            case 'right':
                scroll.left += 25;
            break;
        }

        window.scrollTo(scroll.left, scroll.top);

        return this.getScroll();
    }

    scrollTo(scroll, response) {
        window.scrollTo(scroll.left, scroll.top);

        response(this.getScroll());
    }

    hello() { alert("Hello :D"); return "foo";};
}

export default ContentScript;

let contentScript = new ContentScript();

chrome.runtime.onMessage.addListener((request, sender, response) => {
    let targetFunction = contentScript[request.action];

    if (typeof targetFunction === 'function') {
        let givenArgsLength = request.args.length;
        if (givenArgsLength < targetFunction.length) {
            request.args.push(response);
        }

        let result = targetFunction.apply(contentScript, request.args);

        if (givenArgsLength === targetFunction.length) {
            response(result);
        } else {
            return true;
        }
    }
});

console.log("contentScript loaded");