import {useEffect, useRef} from "react";

function Call({connection}: { connection: RTCPeerConnection }) {
    const ref = useRef<HTMLVideoElement>(null);
    const {iceGatheringState, connectionState, iceConnectionState} = connection;
    console.log({
        iceGatheringState,
        connectionState,
        iceConnectionState
    })
    useEffect(() => {
        connection.addEventListener("icegatheringstatechange", () => {
            const {iceGatheringState} = connection;
            console.log({
                iceGatheringState
            })
        });
        connection.addEventListener("iceconnectionstatechange", () => {
            const {iceConnectionState} = connection;
            console.log({
                iceConnectionState
            })
        });
        connection.addEventListener("connectionstatechange", async () => {
            const {connectionState} = connection;
            console.log({
                connectionState
            })
            if (connection.connectionState === 'connected') {
                const constraints = {'video': true, 'audio': true};
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                stream.getTracks().forEach(track => {
                    connection.addTrack(track, stream);
                });
            }
        });
    }, [connection])

    useEffect(() => {
        const videoElement = ref.current;
        if (videoElement) {
            const onTrack = (ev: RTCTrackEvent) => {
                videoElement.srcObject = ev.streams[0];
            };
            connection.addEventListener("track", onTrack)
            return () => connection.removeEventListener("track", onTrack)
        }
    }, [connection]);

    return <video ref={ref} autoPlay/>
}

export default Call;
