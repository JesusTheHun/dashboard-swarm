/**
 * Externally resolvable promise
 * @returns {Promise}
 */
function defer() {
    let res, rej;

    let promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    promise.resolve = res;
    promise.reject = rej;

    return promise;
}

export default defer;