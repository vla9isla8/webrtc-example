import {useEffect, useRef, useState} from "react";
import "./styles.css";

function Call({connection}: { connection: RTCPeerConnection }) {
    const ref = useRef<HTMLVideoElement>(null);

    const [state, setState] = useState<RTCPeerConnectionState>(connection.connectionState);

    useEffect(() => {
        const listener = () => {
            setState(connection.connectionState);
        };
        connection.addEventListener("connectionstatechange", listener);
        return () => connection.removeEventListener("connectionstatechange", listener);
    }, [connection])

    useEffect(() => {
        if (state === 'connected') {
            const constraints = {'video': true, 'audio': true};
            navigator.mediaDevices.getUserMedia(constraints).then(stream => {
                stream.getTracks().forEach(track => {
                    connection.addTrack(track, stream);
                });
            });
        }
    }, [state, connection])

    useEffect(() => {
        const videoElement = ref.current;
        if (videoElement) {
            const onTrack = (ev: RTCTrackEvent) => {
                for (let stream of ev.streams) {
                    console.log(stream, stream.active);
                    if (stream.active) {
                        videoElement.srcObject = stream;
                        return;
                    }
                }
            };
            connection.addEventListener("track", onTrack)
            return () => connection.removeEventListener("track", onTrack)
        }
    }, [connection]);

    return (
        <p>
            <h5>{state}</h5>
            <video className="video" ref={ref} autoPlay controls/>
        </p>
    );
}

export default Call;
