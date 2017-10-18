(function(){
    'use strict';

    let barHeight = 8;
    let height = window.innerHeight;

    let countdownBar;
    let countdownBarItem;

    if (countdownBar === undefined) {
        countdownBar = document.createElement('div');
        countdownBar.id = "countdown";
        countdownBar.style.width = "100%";
        countdownBar.style.position = 'absolute';
        countdownBar.style.top = (height - barHeight) + "px";
        countdownBar.style.zIndex = 9999;

        countdownBarItem = document.createElement('div');
        countdownBarItem.id = "progressbar";
        countdownBarItem.style.width = "0";
        countdownBarItem.style.borderBottomRightRadius = (barHeight/2) + "px";
        countdownBarItem.style.borderTopRightRadius = (barHeight/2) + "px";
        countdownBarItem.style.height = barHeight + "px";
        countdownBarItem.style.backgroundColor = "rgb(87, 85, 217)";
        countdownBarItem.style.animationName = "countdown";
        countdownBarItem.style.animationDuration =  countdownInterval + "ms";
        countdownBarItem.style.animationTimingFunction =  "linear";

        countdownBar.appendChild(countdownBarItem);
        document.querySelector('body').appendChild(countdownBar);

        setTimeout(() => {
            countdownBar.remove();
        }, countdownInterval);
    }
})();