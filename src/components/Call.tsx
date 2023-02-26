import {useEffect, useLayoutEffect, useRef, useState} from "react";
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
            const dataChannel = connection.createDataChannel("text");
            dataChannel.addEventListener("open", () => {
                console.log("Opened!")
                dataChannel.send("Hi!");
                console.log("sent!")
            })
            dataChannel.addEventListener("error", ev => {
                console.log("Error!", ev)
            });
            dataChannel.addEventListener("message", console.log);
            const constraints = {'video': true, 'audio': true};
            navigator.mediaDevices.getUserMedia(constraints).then(stream => {
                stream.getTracks().forEach(track => {
                    connection.addTrack(track, stream);
                });
            });
        }
    }, [state, connection])

    useLayoutEffect(() => {
        const onTrack = (ev: RTCTrackEvent) => {
            const [remoteStream] = ev.streams;
            console.log(remoteStream);
            if (ref.current) {
                ref.current.srcObject = remoteStream;
            }
        };
        connection.addEventListener("track", onTrack)
        return () => connection.removeEventListener("track", onTrack)
    }, [connection]);

    return (
        <div className="video">
            <h5>{state}</h5>
            <video ref={ref} controls/>
        </div>
    );
}

export default Call;
