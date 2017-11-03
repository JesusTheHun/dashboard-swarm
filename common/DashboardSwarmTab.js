import ExtendableProxy from "./ExtendableProxy";

class DashboardSwarmTab extends ExtendableProxy{
    constructor(tabData) {
        super({
            get: (target, access) => {
                console.log("access " + access);
                // Access direct true property
                if (target[access] !== undefined && typeof target[access] !== 'function') {
                    return target[access];
                }

                // Access an existing function
                let getter = Object.getPrototypeOf(target)[access];

                if (typeof getter === 'function') {
                    return (...args) => {
                        return getter.apply(target, args);
                    }
                }

                // Access a virtual getter
                let propCasedName = access.slice(3);
                let propName = propCasedName.charAt(0).toLowerCase() + propCasedName.slice(1);
                return (...args) => target[propName];
            }
        });

        for(let i in tabData) {
            if (tabData.hasOwnProperty(i)) {
                this[i] = tabData[i];
            }
        }
    }

    getZoom() {
        return this.zoom || 1;
    }

    getScroll() {
        return Object.assign({top: 0, left: 0}, this.scroll);
    }
}

export default DashboardSwarmTab;