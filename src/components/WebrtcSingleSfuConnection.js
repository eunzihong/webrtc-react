import React, {useState, useEffect, useRef} from "react";

function WebrtcSingleSfuConnection(props) {
    let stream;
    let peerConnection;
    let webSocket;

    const localStream = useRef(null);
    const remoteStream = useRef(null);


    useEffect(()=>{
        getPeerConnection().then();

    },[]);


    const log = (text) => {
        var time = new Date();
        console.log("[" + time.toLocaleTimeString() + "] " + text);
    }


    const getMedia = async () => {
        const constraints = window.constraints = {
            audio: true,
            video: true
        };

        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            await stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            localStream.current.srcObject = stream;
            log("Media stream connected");

        } catch (error) {
            console.warn(error);
        }

    }


    const getPeerConnection = async () => {
        const configuration = {
            iceServers: [{
                urls: "stun:stun.l.google.com:19302"
            }]
        };

        try {
            peerConnection = new RTCPeerConnection(configuration);
            await getSocketConnection();
            await getMedia();

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
                if (peerConnection.iceConnectionState === "failed") {
                    peerConnection.restartIce();
                }
            };

            peerConnection.onnegotiationneeded = async () => {
                let offer;

                offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);

                const message = JSON.stringify({
                    type: "offer",
                    data: JSON.stringify(offer)
                });

                webSocket.send(message);

            }

            peerConnection.ontrack = (event) => {
                if(!remoteStream.current.srcObject){
                    remoteStream.current.srcObject = event.streams[0];
                }
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
            log("socket server is on open :)");
        }

        webSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data)

            switch (message.type) {
                case "greeting":
                    break;

                case "new-ice-candidate":
                    try {
                        const candidate = message.data;

                        await peerConnection.addIceCandidate(candidate);
                        log("new ice candidate added");
                    } catch(err) {
                        console.warn(err);
                    }
                    break;

                case "answer":
                    const answer = message.data;
                    await peerConnection.setRemoteDescription(answer);
                    log("accept answer message");
                    break;
            }
        }
    }


    return (
        <>
            <div>Pion SFU page</div>
            <div style={{width: '100%'}}>
                <video id="myVideo" ref={localStream} autoPlay style={{width: 200, margin: 10}} />
                <video id="remoteVideo" ref={remoteStream} autoPlay style={{width: 200, margin: 10}} />
            </div>

        </>
    )

}

export default WebrtcSingleSfuConnection;
