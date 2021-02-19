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

    let polite = false;
    let makingOffer;
    let ignoreOffer;

    const localStream = useRef(null);
    const remoteStream = useRef(null);

    // const [myName, setMyName] = useState("");
    const [targetName, setTargetName] = useState("");
    // const targetName = myName==='eunz'?'geumz':'eunz';
    const [userList, setUserList] = useState("");
    const [sendOffer, setSendOffer] = useState(false);

    useEffect(()=>{
        // getSocketConnection();
        getPeerConnection().then();

    },[]);


    const getMedia = async () => {
        const constraints = window.constraints = {
            audio: true,
            video: true
        };

        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            await stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            localStream.current.srcObject = stream;

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
                    console.log('**** peerConnection on icecandidate');
                    const message = JSON.stringify({
                        type: "new-ice-candidate",
                        name: myName,
                        target: targetName,
                        candidate: event.candidate
                    });

                    webSocket.send(message);

                } else {
                    console.log('let me go home...');
                }
            }

            peerConnection.oniceconnectionstatechange = () => {
                if (peerConnection.iceConnectionState === "failed") {
                    peerConnection.restartIce();
                }
            };

            peerConnection.onnegotiationneeded = async (event) => {
                console.log('**** peerConnection on negotiation ');
                console.log('**** peerConnection createOffer start');

                let offer;
                makingOffer = true;

                offer = await peerConnection.createOffer();
                console.log('**** peerConnection setLocalDescription start');
                await peerConnection.setLocalDescription(offer);

                const message = JSON.stringify({
                    name: myName,
                    target: targetName,
                    type: "video-offer",
                    sdp: offer
                });

                webSocket.send(message);

            }

            peerConnection.ontrack = (event) => {
                console.warn('**** peerConnection on track ', event);
                remoteStream.current.srcObject = event.streams[0];
            }

            peerConnection.onremovetrack = (event) => {
                if (remoteStream.current.srcObject.getTracks().length === 0) {
                    /*
                    * close the session
                    * */
                    console.log('**** session closed');
                }
            }

        } catch (error) {
            console.warn(error);
        }

    }


    const getSocketConnection = () => {
        webSocket = new WebSocket('ws://localhost:8080');

        webSocket.onopen = async () => {
            console.log('**** socket connected');
            const message = JSON.stringify({
                type: "greeting",
                name: myName
            })
            webSocket.send(message);

        }

        webSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case "greeting":
                    console.log('greeting');
                    break;

                case "new-ice-candidate":
                    console.log('**** socket sent ice', message.candidate);
                    try {
                        await peerConnection.addIceCandidate(message.candidate);
                    } catch(err) {
                        if (!ignoreOffer) {
                            throw err;
                        }
                    }
                    break;

                case "video-offer":
                    console.warn('**** socket sent offer');
                    const description = message.sdp;

                    const offerCollision = (description.type === "offer") &&
                        (makingOffer || peerConnection.signalingState !== "stable");

                    ignoreOffer = !polite && offerCollision;
                    if (myName==='geumz') {
                        return;
                    }

                    await peerConnection.setRemoteDescription(description);

                    if (description.type === "offer") {
                        // let answer;
                        // answer = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription();
                        const message = JSON.stringify({
                            name: myName,
                            target: targetName,
                            type: "video-answer",
                            sdp: peerConnection.localDescription
                        });
                        webSocket.send(message);
                    }
                    break;

                case "video-answer":
                    await peerConnection.setRemoteDescription(message.sdp);
                    console.warn('**** socket sent answer ');
                    break;
            }
        }
    }


    return (
        <>
            <div>It's video page.</div>

            <div style={{flexDirection: 'row'}}>
                my name {myName}
            </div>

            <div style={{flexDirection: 'row'}}>
                {"opponent's name"}
                <input value={targetName} onChange={(event) => setTargetName(event.target.value)}/>
            </div>

            {/*<div>active user list: {userList}</div>*/}

            <div style={{width: '30%'}}>
                <video ref={localStream} autoPlay controls />{myName}
                <video ref={remoteStream} autoPlay controls />{targetName}
            </div>

        </>
    )

}

export default WebrtcRemoteConnection;
