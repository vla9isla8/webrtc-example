import {useCallback, useEffect, useMemo, useState} from "react";
import Call from "./Call";
import SignalingChannel from "../socket/SignalingChannel";

const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

function Room() {
    const [connection, setConnection] = useState<RTCPeerConnection | null>(null);

    const client = useMemo(() => new SignalingChannel("default"), []);

    const stopCall = useCallback(() => {
        if (connection) {
            connection.close();
            setConnection(null);
        }
    }, [connection]);

    useEffect(() => {
        client.readRoomOffers(async (offer) => {
            console.log("OFFER", offer);
            if (offer && offer.sdp && offer.type) {
                if (!connection) {
                    const peerConnection = new RTCPeerConnection(configuration);
                    try {
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                        setConnection(peerConnection);
                        const answer = await peerConnection.createAnswer();
                        await client.createRoomAnswer(answer);
                        await peerConnection.setLocalDescription(answer);
                    } catch (e) {
                        console.error(e);
                        stopCall();
                    }
                }
            }
        });
    }, [client, connection, stopCall]);

    const makeCall = useCallback(async () => {
        if (!connection) {
            const peerConnection = new RTCPeerConnection(configuration);
            const listener = (event: RTCPeerConnectionIceEvent) => {
                if (event.candidate) {
                    client.sendIceCandidate(event.candidate);
                }
            };
            peerConnection.addEventListener('icecandidate', listener);
            setConnection(peerConnection);
            try {
                const descriptionInit = await peerConnection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                    iceRestart: true
                });
                await client.getRoomAnswers(async (answer) => {
                    console.log("ANSWER", answer);
                    if (answer && answer.sdp && answer.type) {
                        const description = new RTCSessionDescription(answer);
                        await peerConnection.setRemoteDescription(description);
                    }
                });
                await client.createRoomOffer(descriptionInit);
                await peerConnection.setLocalDescription(descriptionInit);
            } catch (e) {
                console.error(e);
                stopCall()
            }
        }
    }, [client, connection, stopCall]);

    useEffect(() => {
        client.readIceCandidates(async (candidate) => {
            try {
                if (connection?.remoteDescription) {
                    await connection.addIceCandidate(candidate);
                }
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        });
    }, [connection, client]);

    if (connection) {
        return <Call connection={connection}/>
    }
    return <button onClick={makeCall}>Call</button>
}

export default Room;
