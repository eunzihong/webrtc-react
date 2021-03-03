import React, {useState, useEffect, useRef} from "react";

function WebrtcMultiSfuConnection(props) {
    const myName = props.location.state.name;

    let stream;
    let webSocket;
    let senderPeer;
    var receiverPeers = [];
    var acceptorPeers = [];

    const localStream = useRef(null);
    const receiveStream1 = useRef(null);
    const receiveStream2 = useRef(null);
    const acceptStream1 = useRef(null);
    const acceptStream2 = useRef(null);

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
                        data: JSON.stringify(event.candidate),
                        channel: "init"
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
                    data: JSON.stringify(offer),
                    channel: "init"
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

    const getReceiverConnection = async (peerConnection, channel) => {
        try {
            peerConnection.addTransceiver('video');

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    const message = JSON.stringify({
                        type: "new-ice-candidate",
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
                    type: "receiver-offer",
                    data: JSON.stringify(offer),
                    channel: channel
                });

                webSocket.send(message);
                log("receiver offer sent");
            }

            peerConnection.ontrack = (event) => {
                if(!receiveStream1.current.srcObject) {
                    receiveStream1.current.srcObject = event.streams[0];
                } else {
                    receiveStream2.current.srcObject = event.streams[0];
                }
                log("peer connection on track!");
            }


        } catch (error) {
            console.warn(error);
        }
    }

    const getAcceptorConnection = async (peerConnection, channel) => {
        try {
            peerConnection.addTransceiver('video');

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    const message = JSON.stringify({
                        type: "new-ice-candidate",
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
                    type: "acceptor-offer",
                    data: JSON.stringify(offer),
                    channel: channel
                });

                webSocket.send(message);
                log("receiver offer sent");
            }

            peerConnection.ontrack = (event) => {
                if(!acceptStream1.current.srcObject) {
                    acceptStream1.current.srcObject = event.streams[0];
                } else {
                    acceptStream2.current.srcObject = event.streams[0];
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
                    log("new receiver greeting:" + message.channel);
                    var newReceiverPeer = new RTCPeerConnection(configuration);
                    getReceiverConnection(newReceiverPeer, message.channel)
                        .then(() => {
                            receiverPeers.push({id: message.data, receiver: newReceiverPeer, channel: message.channel});
                            log("receiver connection for " + message.data + " is established");
                        });
                    break;

                case "receiver-answer":
                    var receiverId = message.type.split("|")[1];

                    var receiverPeer = receiverPeers.find(elem => elem.id === receiverId).receiver;

                    await receiverPeer.setRemoteDescription(message.data);
                    log("receiver accept answer message");
                    break;

                case "new-acceptor-greeting":
                    log("new acceptor greeting:" + message.channel);
                    var newAcceptorPeer = new RTCPeerConnection(configuration);
                    getAcceptorConnection(newAcceptorPeer, message.channel)
                        .then(() => {
                            acceptorPeers.push({id: message.data, acceptor: newAcceptorPeer, channel: message.channel});
                            log("acceptor connection for " + message.data + " is established");
                        });
                    break;

                case "acceptor-answer":
                    var acceptorId = message.type.split("|")[1];

                    var acceptorPeer = acceptorPeers.find(elem => elem.id === acceptorId).acceptor;

                    await acceptorPeer.setRemoteDescription(message.data);
                    log("receiver accept answer message");
                    break;
            }
        }
    }


    return (
        <>
            <div>Pion SFU page</div>
            <div style={{width: '100%'}}>
                {myName}
                <video id="myVideo" ref={localStream} autoPlay controls style={{width: 200, margin: 10}} />
                receiver1
                < video id="receiveVideo1" ref={receiveStream1} autoPlay controls style={{width: 200, margin: 10}} />
                receiver2
                <video id="receiveVideo2" ref={receiveStream2} autoPlay controls style={{width: 200, margin: 10}} />
                acceptor1
                <video id="acceptVideo1" ref={acceptStream1} autoPlay controls style={{width: 200, margin: 10}} />
                acceptor2
                <video id="acceptVideo2" ref={acceptStream2} autoPlay controls style={{width: 200, margin: 10}} />
            </div>

        </>
    )

}

export default WebrtcMultiSfuConnection;
