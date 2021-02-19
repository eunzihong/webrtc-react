import React, {useState, useEffect, useRef} from "react";

/*
* 1. Client socket (web socket) implementation
*
* (2. Server socket implementation)
*
* 3. peerConnection signaling via socket communication
*
*/

function WebrtcRemoteConnection(props) {
    const myName = props.location.state.name;

    let stream;
    let peerConnection;
    let webSocket;

    const localStream = useRef(null);
    const remoteStream = useRef(null);

    const [targetName, setTargetName] = useState("");
    const [userList, setUserList] = useState("");


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
            peerConnection = await new RTCPeerConnection(configuration);
            await getSocketConnection();
            await getMedia();

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    const message = JSON.stringify({
                        type: "new-ice-candidate",
                        name: myName,
                        target: targetName,
                        candidate: event.candidate
                    });

                    webSocket.send(message);
                    log("icecandidate message sent to server");

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
                    name: myName,
                    target: targetName,
                    type: "video-offer",
                    sdp: offer
                });

                webSocket.send(message);
                log("offer message sent to server");

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
        webSocket = new WebSocket('ws://localhost:8080');

        webSocket.onopen = async () => {
            const message = JSON.stringify({
                type: "greeting",
                name: myName
            })
            webSocket.send(message);
            log("say hello to signaling server :)");

        }

        webSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case "greeting":
                    break;

                case "user-list":
                    setUserList(message.users.join(", "));
                    break;

                case "new-ice-candidate":
                    try {
                        await peerConnection.addIceCandidate(message.candidate);
                        log("new ice candidate added");
                    } catch(err) {
                        console.warn(err);
                    }
                    break;

                case "video-offer":
                    await peerConnection.setRemoteDescription(message.sdp);

                    let answer;
                    answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);

                    const msg = JSON.stringify({
                        name: myName,
                        target: targetName,
                        type: "video-answer",
                        sdp: peerConnection.localDescription
                    });
                    webSocket.send(msg);
                    log("accept offer message and reply answer");

                    break;

                case "video-answer":
                    await peerConnection.setRemoteDescription(message.sdp);
                    log("accept answer message");
                    break;
            }
        }
    }


    return (
        <>
            <div>It's video page.</div>

            <div style={{flexDirection: 'row'}}>
                my name: {myName}
            </div>

            <div style={{flexDirection: 'row'}}>
                {"opponent's name: "}
                <input value={targetName} onChange={(event) => setTargetName(event.target.value)}/>
            </div>

            <div>active user list: {userList}</div>

            <div style={{width: '100%'}}>
                <video ref={localStream} autoPlay controls style={{width: 200, margin: 10}} />
                <video ref={remoteStream} autoPlay controls style={{width: 200, margin: 10}} />
            </div>

        </>
    )

}

export default WebrtcRemoteConnection;
