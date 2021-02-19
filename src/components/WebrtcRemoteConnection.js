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
    let stream;
    let peerConnection;
    let webSocket;
    let makingOffer;

    const localStream = useRef(null);
    const remoteStream = useRef(null);

    const [myName, setMyName] = useState("");
    const [targetName, setTargetName] = useState("");
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
            await getSocketConnection();

            peerConnection = await new RTCPeerConnection(configuration);
            await getMedia();

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('**** peerConnection on icecandidate ');
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

            peerConnection.onnegotiationneeded = async (event) => {
                console.log('**** peerConnection on negotiation');
                console.log('**** peerConnection createOffer start');

                let offer;

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
            console.log('socket message: ', event.data);
            const message = JSON.parse(event.data);
            switch (message.type) {
                case "greeting":
                    console.log('greeting');
                    break;

                case "user-list":
                    console.log('socket users: ',message.users);
                    setUserList(message.users.join(", "));
                    break;

                case "new-ice-candidate":
                    console.warn('**** socket sent ice ');
                    await peerConnection.addIceCandidate(message.candidate);
                    break;

                case "video-offer":
                    console.warn('**** socket sent offer');
                    await peerConnection.setRemoteDescription(message.sdp);
                    break;

                case "video-answer":
                    console.warn('**** socket sent answer');
                    await peerConnection.setRemoteDescription(message.sdp);
                    break;
            }
        }
    }


    return (
        <>
            <div>It's video page.</div>

            <div style={{flexDirection: 'row'}}>
                {"my name"}
                <input value={myName} onChange={(event) => setMyName(event.target.value)}/>
                <button onClick={() => getMedia()}>display</button>
                <button onClick={() => getSocketConnection()}>socket open</button>

            </div>

            <div style={{flexDirection: 'row'}}>
                {"opponent's name"}
                <input value={targetName} onChange={(event) => setTargetName(event.target.value)}/>
                <button onClick={() => getPeerConnection()}>call</button>
            </div>

            <div>active user list: {userList}</div>

            <div style={{width: '30%'}}>
                <video ref={localStream} autoPlay controls />{myName}
                <video ref={remoteStream} autoPlay controls />{targetName}
            </div>

        </>
    )

}

export default WebrtcRemoteConnection;
