type Room = {
    offer: {
        username: string,
        offer: RTCSessionDescriptionInit
    } | undefined
}
export default Room;
