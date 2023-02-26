import type {GunUser, ISEAPair} from "gun";

const gunInstance = Gun();
gunInstance.opt({
    localStorage: true,
    peers: [
        'https://gun-manhattan.herokuapp.com/gun'
    ]
});

class Client {
    public getRoomOffers(callBack: (offer: RTCSessionDescriptionInit) => void) {
        const username = gunInstance.user().is?.alias;
        if (!username || typeof username === "object") {
            throw new Error("Unauthenticated")
        }
        const iGunChain = gunInstance
            .get("room")
            .on(data => {
                if (data.type === "offer" && data.username !== username) {
                    callBack({
                        sdp: data.sdp,
                        type: data.type,
                    })
                }
            });
        return () => iGunChain.off();
    }

    public getRoomAnswers(callBack: (answer: RTCSessionDescriptionInit) => void) {
        const username = gunInstance.user().is?.alias;
        if (!username || typeof username === "object") {
            throw new Error("Unauthenticated")
        }
        const iGunChain = gunInstance.get("room").on(data => {
            if (data.type === "answer" && data.username !== username) {
                callBack({
                    sdp: data.sdp,
                    type: data.type,
                })
            }
        });
        return () => iGunChain.off();
    }

    public createRoomOffer(offer: RTCSessionDescriptionInit) {
        const username = gunInstance.user().is?.alias;
        if (!username || typeof username === "object") {
            throw new Error("Unauthenticated")
        }
        gunInstance
            .get("room")
            .put({
                username,
                sdp: offer.sdp,
                type: offer.type,
            });
    }

    public createRoomAnswer(answer: RTCSessionDescriptionInit) {
        const username = gunInstance.user().is?.alias;
        if (!username || typeof username === "object") {
            throw new Error("Unauthenticated")
        }
        gunInstance
            .get("room")
            .put({
                username,
                sdp: answer.sdp,
                type: answer.type,
            });
    }

    public deleteMyOffer() {
        gunInstance.get("room").set({});
    }

    public async signUp(username: string, password: string) {
        await new Promise<string>((resolve, reject) => {
            gunInstance.user().create(username, password, ack => {
                if ("err" in ack) {
                    reject(ack.err);
                } else {
                    gunInstance.user().recall({sessionStorage: true});
                    resolve(ack.pub);
                }
            });
        });
    }

    public async signIn(username: string, password: string) {
        await new Promise<GunUser>((resolve, reject) => {
            gunInstance.user().auth(username, password, ack => {
                if ("err" in ack) {
                    reject(ack.err);
                } else {
                    gunInstance.user().recall({sessionStorage: true});
                    resolve(ack.put);
                }
            })
        });
    }

    public getUser() {
        const pair = sessionStorage.getItem("pair");
        const userData: ISEAPair | null = pair && JSON.parse(pair);
        return new Promise<string | ISEAPair | undefined>((resolve, reject) => {
            if (userData) {
                gunInstance.user().auth(userData, ack => {
                    if ("err" in ack) {
                        reject(ack.err);
                    } else {
                        resolve(gunInstance.user().is?.alias);
                    }
                })
            } else {
                resolve(undefined);
            }
        });
    }

    public sendIceCandidate(candidate: RTCIceCandidateInit | null) {
        if (candidate) {
            const username = gunInstance.user().is?.alias;
            if (!username || typeof username === "object") {
                throw new Error("Unauthenticated")
            }
            gunInstance.get("ice-candidate").put({
                username,
                candidate: candidate.candidate,
                usernameFragment: candidate.usernameFragment,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex
            });
        }
    }

    public readIceCandidates(callBack: (candidate: RTCIceCandidateInit) => void) {
        const username = gunInstance.user().is?.alias;
        if (!username || typeof username === "object") {
            throw new Error("Unauthenticated")
        }
        const iGunChain = gunInstance.get("ice-candidate").on(data => {
            const {
                username,
                candidate,
                usernameFragment,
                sdpMid,
                sdpMLineIndex
            } = data as RTCIceCandidateInit & { username: string }
            if (data.username !== username) {
                callBack({
                    candidate, usernameFragment, sdpMid, sdpMLineIndex
                });
            }
        });
        return () => iGunChain.off();
    }

}

export default Client;
