import PieSocket from "piesocket-js/src/PieSocket";

class SignalingChannel {
    #socket;

    /**
     * @type {Promise<{listen: <V>(event: string, callback: (v: V) => void) => void, publish: <V>(event: string, v: V) => void}>}
     */
    #channel;
    /**
     * @type {string}
     */
    roomId;

    /**
     *
     * @param roomId {string}
     */
    constructor(roomId) {
        this.roomId = roomId
        this.#socket = new PieSocket({
            clusterId: 's8504.fra1',
            apiKey: 'fV7pkaHcjHxw3O5bpD95IiMGJbh705x70orboWRt',
            secret: 'pg7CrfBUUHW6bfqPtWQoGu5od2AAHjz6'
        });
        this.#channel = this.#socket.subscribe(roomId);
    }

    destroy() {
        this.#socket.unsubscribe(this.roomId);
    }

    /**
     *
     * @param callBack {(description: RTCSessionDescriptionInit) => void}
     */
    async readRoomOffers(callBack) {
        const channel = await this.#channel;
        channel.listen("offer", callBack);
    }

    /**
     *
     * @param callBack {(description: RTCSessionDescriptionInit) => void}
     */
    async getRoomAnswers(callBack) {
        const channel = await this.#channel;
        channel.listen("answer", callBack);
    }

    /**
     *
     * @param offer {RTCSessionDescriptionInit}
     */
    async createRoomOffer(offer) {
        const channel = await this.#channel;
        channel.publish("offer", offer);
    }

    /**
     *
     * @param answer {RTCSessionDescriptionInit}
     */
    async createRoomAnswer(answer) {
        const channel = await this.#channel;
        channel.publish("answer", answer);
    }

    /**
     *
     * @param candidate {RTCIceCandidateInit}
     * @return {Promise<void>}
     */
    async sendIceCandidate(candidate) {
        const channel = await this.#channel;
        channel.publish("ice-candidate", candidate);
    }

    /**
     *
     * @param callBack {(candidate: RTCIceCandidateInit) => void}
     * @return {Promise<(function(): void)|*>}
     */
    async readIceCandidates(callBack) {
        const channel = await this.#channel;
        channel.listen("ice-candidate", callBack);
    }
}

export default SignalingChannel;
