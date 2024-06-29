import _ from "lodash"

/**
 * @template T
 */
export default class State {
    /**
     * 
     * @param {T} init 
     */
    constructor(init) {
        /**
         * @type {T}
         */
        this.value = init
        /**
         * @type {((value: T | PromiseLike<T>) => void)[]}
         */
        this.resolves = []
    }

    lock() {
        this.lockState = true
    }

    unlock() {
        this.lockState = false
        this.resolves.shift()?.(this.value)
    }

    /**
     * 
     * @returns {Promise<T>}
     */
    async getValue() {
        if (this.lockState) {
            const { promise, resolve } = Promise.withResolvers()
            this.resolves.push(resolve)
            return promise
        }
        return this.value
    }

    /**
     * @param {Promise<T> | T} value 
     */
    async setValue(value) {
        this.lock()
        this.value = await value
        this.unlock()
    }
}

const Events = {
    UNLOCK: "unlocked"
}