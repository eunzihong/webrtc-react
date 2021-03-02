import React, {useState, useEffect, useRef} from "react";

function WebrtcMultiSfuConnection(props) {
    const myName = props.location.state.name;

    let stream;
    let webSocket;
    let senderPeer;
    var receiverPeers = [];

    const localStream = useRef(null);
    const remoteStream = useRef(null);

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
                        type: "new-ice-candidate",
                        data: JSON.stringify(event.candidate)
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
                    type: "init-offer",
                    data: JSON.stringify(offer)
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

    const getReceiverConnection = async (peerConnection) => {
        try {
            peerConnection.addTransceiver('video');

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    const message = JSON.stringify({
                        type: "new-ice-candidate",
                        data: JSON.stringify(event.candidate)
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
                    type: "receiver-offer",
                    data: JSON.stringify(offer)
                });

                webSocket.send(message);
                log("receiver offer sent");
            }

            peerConnection.ontrack = (event) => {
                remoteStream.current.srcObject = event.streams[0];
                log("peer connection on track!");
            }

            peerConnection.onremovetrack = () => {
                if (remoteStream.current.srcObject.getTracks().length === 0) {
                    log("session closed");
                }
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
            const msgType = message.type.split("|")[0];

            switch (msgType) {
                case "init-answer":
                    const answer = message.data;
                    await senderPeer.setRemoteDescription(answer);
                    log("accept answer message");
                    break;

                case "new-ice-candidate":
                    try {
                        const candidate = message.data;
                        await senderPeer.addIceCandidate(candidate);
                        log("new ice candidate added");
                    } catch(err) {
                        console.warn(err);
                    }
                    break;

                case "new-receiver-greeting":
                    log("new receiver connection for " + message.data + " is required");
                    var newReceiverPeer = new RTCPeerConnection(configuration);
                    getReceiverConnection(newReceiverPeer)
                        .then(() => {
                            receiverPeers.push({id: message.data, receiver: newReceiverPeer})
                            log("receiver connection for " + message.data + " is established");
                        });
                    break;

                case "receiver-answer":
                    const id = message.type.split("|")[1];

                    var receiverPeer = receiverPeers.find(elem => elem.id === id).receiver;

                    await receiverPeer.setRemoteDescription(message.data);
                    log("receiver accept answer message");
                    break;
            }
        }
    }


    return (
        <>
            <div>Pion SFU page</div>
            <div style={{width: '100%'}}>
                <video id="myVideo" ref={localStream} autoPlay controls style={{width: 200, margin: 10}} />
                <video id="remoteVideo" ref={remoteStream} autoPlay controls style={{width: 200, margin: 10}} />
            </div>

        </>
    )

}

export default WebrtcMultiSfuConnection;
