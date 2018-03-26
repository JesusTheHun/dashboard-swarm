export class ExtendableProxy {
    constructor(handler) {
        return new Proxy(this, handler);
    }
}