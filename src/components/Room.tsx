import {useCallback, useEffect, useState} from "react";
import Client from "../db/Client";
import Call from "./Call";

const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

function Room({client}: { client: Client }) {
    const [connection, setConnection] = useState<RTCPeerConnection | null>(null);

    const stopCall = useCallback(() => {
        if (connection) {
            connection.close();
            setConnection(null);
        }
    }, [connection]);

    useEffect(() => {
        const roomOffersClose = client.getRoomOffers(async (offer) => {
            console.log("OFFER", offer);
            if (offer && offer.sdp && offer.type) {
                const peerConnection = new RTCPeerConnection(configuration);
                setConnection(peerConnection);
                try {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    client.createRoomAnswer(answer);
                } catch (e) {
                    console.error(e);
                    stopCall();
                }
            }
        });
        return () => {
            roomOffersClose();
        }

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
                const roomAnswersClose = client.getRoomAnswers(async (answer) => {
                    console.log("ANSWER", answer);
                    if (answer && answer.sdp && answer.type) {
                        const description = new RTCSessionDescription(answer);
                        await peerConnection.setRemoteDescription(description);
                        roomAnswersClose();
                    }
                });
                const descriptionInit = await peerConnection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await peerConnection.setLocalDescription(descriptionInit);
                client.createRoomOffer(descriptionInit);
            } catch (e) {
                console.error(e);
                stopCall()
            }
        }
    }, [client, connection, stopCall]);

    useEffect(() => {
        const readIceCandidatesClose = client.readIceCandidates(async (candidate) => {
            try {
                console.log("candidate", candidate);
                if (connection) {
                    await connection.addIceCandidate(candidate);
                    readIceCandidatesClose();
                }
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        });
        return () => {
            readIceCandidatesClose();
        }
    }, [connection, client]);

    useEffect(() => {
        return () => {
            client.deleteMyOffer();
        }
    }, [client])
    if (connection) {
        return <Call connection={connection}/>
    }
    return <button onClick={makeCall}>Call</button>
}

export default Room;
