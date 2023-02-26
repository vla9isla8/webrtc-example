import {Fragment, ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import Call from "./Call";
import SignalingChannel from "../socket/SignalingChannel";

const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

function Room() {
    const connection = useMemo(() => new RTCPeerConnection(configuration), []);

    const client = useMemo(() => new SignalingChannel("default"), []);
    const [state, setState] = useState<RTCPeerConnectionState>(connection.connectionState);

    useEffect(() => {
        let inWork = true;
        client.readRoomOffers(async (offer) => {
            if (inWork && offer && offer.sdp && offer.type) {
                try {
                    await connection.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await connection.createAnswer();
                    await connection.setLocalDescription(answer);
                    await client.createRoomAnswer(answer);
                } catch (e) {
                    console.error(e);
                }
            }
        });
        client.getRoomAnswers(async (answer) => {
            if (inWork && answer && answer.sdp && answer.type) {
                await connection.setRemoteDescription(answer);
            }
        });
        return () => {
            inWork = false;
        }
    }, [client, connection]);

    useEffect(() => {
        const listener = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                client.sendIceCandidate(event.candidate);
            }
        };
        connection.addEventListener('icecandidate', listener);
        let inWork = true;
        client.readIceCandidates(async (candidate) => {
            try {
                if (inWork) {
                    await connection.addIceCandidate(candidate);
                }
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        });
        return () => {
            connection.removeEventListener('icecandidate', listener);
            inWork = false;
        }
    }, [connection, client]);

    const makeCall = useCallback(async () => {
        try {
            const descriptionInit = await connection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await connection.setLocalDescription(descriptionInit);
            await client.createRoomOffer(descriptionInit);
        } catch (e) {
            console.error(e);
        }
    }, [client, connection]);


    useEffect(() => {
        const listener = () => {
            setState(connection.connectionState);
        };
        connection.addEventListener("connectionstatechange", listener);
        return () => connection.removeEventListener("connectionstatechange", listener);
    }, [connection])

    let component: ReactNode;
    if (state === "connected") {
        component = <Call connection={connection}/>
    } else if (state === "new") {
        component = <button onClick={makeCall}>Call</button>
    } else {
        component = <Fragment/>
    }
    return <section>
        <h5>{state}</h5>
        {component}
    </section>
}

export default Room;
