import React, {useState, useEffect, useRef} from "react";

/*
* step 1. Fetching: get video/audio media from user device
*       1-1. get own media - video/audio
*       1-2. add media track
*
* step 2. Signaling: gather network/media capability info for opponent
*       2-1. secure my ICE candidate via STUN server
*       2-2. exchange each candidate info via signaling server (socket/SIP/...)
*       2-3. add opponent's candidate
*       2-4. A: create and send SDP offer message
*       2-5. B: accept the offer and send back answer message
*       2-6. A & B: set remote description => try peer-connection
*
* step 3. Connecting: peer-connect
*
* step 4. Communication: the communication progresses
*       4-1. send my media data
*       4-2. process opponent's media data
* */

function WebrtcVideo(props) {
    let peerConnection;
    const localStream = useRef(null);   // for my video stream

    useEffect(()=>{
        getPeerConnection()
            .then(() => {
                getMedia().then(()=>console.log(peerConnection));
            });

    },[]);

    const getMedia = async () => {
        const constraints = window.constraints = {
            audio: true,
            video: true
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            localStream.current.srcObject = stream;

        } catch (error) {
            console.warn(error);
        }

    }

    const getPeerConnection = async () => {
        const configuration = {};

        try {
            const pc = await new RTCPeerConnection(configuration);

            peerConnection = pc;

        } catch (error) {
            console.warn(error);
        }

    }

    return (
        <>
            <div>It's video page.</div>
            <div style={{width: '40%'}}>
                <video ref={localStream} autoPlay controls/> 나여
            </div>

        </>
    )

}

export default WebrtcVideo;
