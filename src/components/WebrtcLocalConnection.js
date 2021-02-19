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
* step 3. Connecting: peer-connect completion
*
* step 4. Communication: the communication progresses
*       4-1. send my media data
*       4-2. process opponent's media data
* */

function WebrtcLocalConnection(props) {
    // let peerConnection;
    let pc1, pc2;
    const localStream = useRef(null);
    const remoteStream = useRef(null);

    useEffect(()=>{
        getPeerConnection().then();

    },[]);

    const getMedia = async (pc) => {
        const constraints = window.constraints = {
            audio: true,
            video: true
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
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
            pc1 = await new RTCPeerConnection(configuration);
            pc2 = await new RTCPeerConnection(configuration);

            await getMedia(pc1).then();

            pc1.onicecandidate = (event) => {
                if (event.candidate) {
                    pc2.addIceCandidate(event.candidate);
                    console.log('**** pc2 got event candidate', event.candidate);
                } else {
                    console.log('let me go home...');
                }
            }

            pc2.onicecandidate = (event) => {
                if (event.candidate) {
                    pc1.addIceCandidate(event.candidate);
                    console.log('**** pc1 got event candidate', event.candidate);
                } else {
                    console.log('i said let me go home... plz');
                }
            }

            pc1.ontrack = (event) => {
                console.warn('**** pc1 on track', event);
            }

            pc2.ontrack = (event) => {
                console.warn('**** pc2 on track', event);
                remoteStream.current.srcObject = event.streams[0]
            }

            console.log('**** pc1 createOffer start');
            const offer = await pc1.createOffer();
            console.log('**** pc1 setLocalDescription start');
            await pc1.setLocalDescription(offer);

            console.log('**** pc2 setRemoteDescription start');
            await pc2.setRemoteDescription(offer);

            console.log('**** pc2 createAnswer start ');
            const answer = await pc2.createAnswer();
            console.log('**** pc2 setLocalDescription start');
            await pc2.setLocalDescription(answer);

            console.log('**** pc1 setRemoteDescription start');
            await pc1.setRemoteDescription(answer);


        } catch (error) {
            console.warn(error);
        }

    }

    return (
        <>
            <div>It's video page.</div>
            <div style={{width: '50%'}}>
                <video ref={remoteStream} autoPlay controls/>
            </div>

        </>
    )

}

export default WebrtcLocalConnection;
