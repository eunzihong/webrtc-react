import React, {useState, useEffect, useRef} from "react";

function WebrtcMultiSfuConnection(props) {
    const myName = props.location.state.name;

    let stream;
    let webSocket;
    let senderPeer;
    var remotePeers = [];

    const localStream = useRef(null);
    const remoteStream1 = useRef(null);
    const remoteStream2 = useRef(null);
    const remoteStream3 = useRef(null);
    const remoteStream4 = useRef(null);
    const remoteStream5 = useRef(null);

    const configuration = {
        iceServers: [{
            urls: "stun:stun.l.google.com:19302"
        }]
    };

    useEffect(()=>{
        getSocketConnection()

    },[]);


    const log = (text) => {
        var time = new Date();
        console.log("[" + time.toLocaleTimeString() + "] " + text);
    }


    const getSendMedia = async () => {
        const constraints = window.constraints = {
            // audio: true,
            video: true
        };
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            await stream.getTracks().forEach(track => senderPeer.addTrack(track, stream));
            localStream.current.srcObject = stream;
            log("Media stream connected");

        } catch (error) {
            console.warn(error);
        }
    }


    const getSenderPeerConnection = async (peerConnection) => {
        try {
            await getSendMedia();

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    const message = JSON.stringify({
                        type: "ice-candidate",
                        data: JSON.stringify(event.candidate),
                        channel: "init-" + myName
                    });
                    webSocket.send(message);
                    log("icecandidate message sent to server ");
                } else {
                    console.log('let me go home...');
                }
            }

            peerConnection.oniceconnectionstatechange = () => {
                const state = peerConnection.iceConnectionState;
                switch (state) {
                    case "failed":
                        peerConnection.restartIce();
                    default:
                        log("init connection is now " + state)
                }
            };

            peerConnection.onnegotiationneeded = async () => {
                let offer;
                offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);

                const message = JSON.stringify({
                    type: "offer",
                    data: JSON.stringify(offer),
                    channel: "init-" + myName
                });
                webSocket.send(message);
                log("sender peer send an init offer");
            }

            peerConnection.ontrack = (event) => {
                log("sender peer connection on track!");
            }

        } catch (error) {
            console.warn(error);
        }

    }

    const getSpreadConnection = async (peerConnection, channel) => {
        try {
            peerConnection.addTransceiver('video');

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    const message = JSON.stringify({
                        type: "ice-candidate",
                        data: JSON.stringify(event.candidate),
                        channel: channel
                    });
                    webSocket.send(message);
                    log("icecandidate message sent to server ");
                } else {
                    console.log('give me coffee with an extra shot...');
                }
            }

            peerConnection.onnegotiationneeded = async () => {
                let offer;
                offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);

                const message = JSON.stringify({
                    type: "offer",
                    data: JSON.stringify(offer),
                    channel: channel
                });
                webSocket.send(message);
                log("receiver offer sent");
            }

            peerConnection.ontrack = (event) => {
                if(!remoteStream1.current.srcObject) {
                    remoteStream1.current.srcObject = event.streams[0];
                } else if (!remoteStream2.current.srcObject){
                    remoteStream2.current.srcObject = event.streams[0];
                } else if (!remoteStream3.current.srcObject){
                    remoteStream3.current.srcObject = event.streams[0];
                } else if (!remoteStream4.current.srcObject){
                    remoteStream4.current.srcObject = event.streams[0];
                } else {
                    remoteStream5.current.srcObject = event.streams[0];
                }
                log("peer connection on track!");
            }

        } catch (error) {
            console.warn(error);
        }
    }

    const getSocketConnection = () => {
        webSocket = new WebSocket('ws://localhost:4000/signal');

        webSocket.onopen = async () => {
            senderPeer = new RTCPeerConnection(configuration);
            getSenderPeerConnection(senderPeer)
                .then(() => {
                    const message = JSON.stringify({
                        type: "greeting",
                        data: myName
                    })
                    webSocket.send(message);
                    log("socket server is on open :)");
                })
        }

        webSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case "new-peer-greeting":
                    log("new peer greeting:" + message.channel);
                    var newPeer = new RTCPeerConnection(configuration);
                    getSpreadConnection(newPeer, message.channel)
                        .then(() => {
                            remotePeers.push({id: message.data, peer: newPeer, channel: message.channel});
                            log("connection for " + message.data + " is established");
                        });
                    break;

                case "answer":
                    if (remotePeers.length === 0) {
                        const answer = message.data;
                        await senderPeer.setRemoteDescription(answer);
                        log("accept answer message");
                    } else {
                        var channelId = message.channel;
                        var connectPeer = remotePeers.find(elem => elem.channel === channelId).peer;
                        await connectPeer.setRemoteDescription(message.data);
                        log("new peer answer message accept");
                    }
                    break;

            }
        }
    }


    return (
        <>
            <div>Pion SFU page</div>
            <div style={{width: '100%'}}>
                <video id="myVideo" ref={localStream} autoPlay controls style={{width: 200, margin: 10}} />{myName}
            </div>
            <div style={{width: '100%'}}>
                <video ref={remoteStream1} autoPlay controls style={{width: 200, margin: 10}} />
                <video ref={remoteStream2} autoPlay controls style={{width: 200, margin: 10}} />
                <video ref={remoteStream3} autoPlay controls style={{width: 200, margin: 10}} />
                <video ref={remoteStream4} autoPlay controls style={{width: 200, margin: 10}} />
                <video ref={remoteStream5} autoPlay controls style={{width: 200, margin: 10}} />
            </div>

        </>
    )

}

export default WebrtcMultiSfuConnection;
