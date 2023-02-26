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
        if (!connection) {
            const roomOffersClose = client.getRoomOffers(async (offer) => {
                console.log("OFFER", offer);
                if (offer && offer.sdp && offer.type) {
                    roomOffersClose();
                    const peerConnection = new RTCPeerConnection(configuration);
                    try {
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                        if (peerConnection.connectionState === "failed") {
                            peerConnection.close();
                            return;
                        }
                        setConnection(peerConnection);
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
        }

    }, [client, connection, stopCall]);

    const makeCall = useCallback(async () => {
        if (!connection) {
            const peerConnection = new RTCPeerConnection(configuration);
            try {
                setConnection(peerConnection);
                const descriptionInit = await peerConnection.createOffer({
                    iceRestart: true,
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                const roomAnswersClose = client.getRoomAnswers(async (answer) => {
                    console.log("ANSWER", answer);
                    if (answer && answer.sdp && answer.type) {
                        roomAnswersClose();
                        const description = new RTCSessionDescription(answer);
                        await peerConnection.setLocalDescription(descriptionInit);
                        await peerConnection.setRemoteDescription(description);
                    }
                });
                client.createRoomOffer(descriptionInit);
            } catch (e) {
                console.error(e);
                stopCall()
            }
        }
    }, [client, connection, stopCall]);

    useEffect(() => {
        if (connection) {
            const listener = (event: RTCPeerConnectionIceEvent) => {
                if (event.candidate) {
                    client.sendIceCandidate(event.candidate);
                }
            };
            connection.addEventListener('icecandidate', listener);
            const readIceCandidatesClose = client.readIceCandidates(async (candidate) => {
                try {
                    console.log("candidate", candidate);
                    await connection.addIceCandidate(candidate);
                    readIceCandidatesClose();
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            });
            return () => {
                readIceCandidatesClose();
                connection.removeEventListener('icecandidate', listener);
            }
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
