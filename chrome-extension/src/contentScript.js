class ContentScript {
    rearmCountdown(countdownInterval) {
        let barHeight = 8;
        let height = window.innerHeight;

        let countdownBarItem;

        if (this.countdownBar === undefined) {
            this.countdownBar = document.createElement('div');
            this.countdownBar.style.width = "100%";
            this.countdownBar.style.position = 'absolute';
            this.countdownBar.style.top = (height - barHeight) + "px";
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

            setTimeout(() => {
                this.clearCountdown();
            }, countdownInterval);
        }
    }

    clearCountdown() {
        this.countdownBar.remove();
        this.countdownBar = undefined;
    }

    scroll(scroll) {
        window.scrollTo(scroll.top, scroll.left);
    }

    hello() { alert("Hello :D"); return "foo";};
}

let contentScript = new ContentScript();

chrome.runtime.onMessage.addListener((request, sender, response) => {
    if (typeof contentScript[request.action] === 'function') {
        let result = contentScript[request.action].apply(contentScript, request.args);
        response(result);
        return true;
    }
});

export default ContentScript;