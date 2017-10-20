class ExtendableProxy {
    constructor(handler) {
        return new Proxy(this, handler);
    }
}

export default ExtendableProxy;