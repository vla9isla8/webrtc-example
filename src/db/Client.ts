import type {GunUser, ISEAPair} from "gun";


class Client {
    private static gunInstance = Gun({
        peers: ['https://gun-manhattan.herokuapp.com/gun'],
        localStorage: true
    });

    public async signUp(username: string, password: string) {
        await new Promise<string>((resolve, reject) => {
            Client.gunInstance.user().create(username, password, ack => {
                if ("err" in ack) {
                    reject(ack.err);
                } else {
                    Client.gunInstance.user().recall({sessionStorage: true});
                    resolve(ack.pub);
                }
            });
        });
    }

    public async signIn(username: string, password: string) {
        await new Promise<GunUser>((resolve, reject) => {
            Client.gunInstance.user().auth(username, password, ack => {
                if ("err" in ack) {
                    reject(ack.err);
                } else {
                    Client.gunInstance.user().recall({sessionStorage: true});
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
                Client.gunInstance.user().auth(userData, ack => {
                    if ("err" in ack) {
                        reject(ack.err);
                    } else {
                        resolve(Client.gunInstance.user().is?.alias);
                    }
                })
            } else {
                resolve(undefined);
            }
        });
    }

}

export default Client;
