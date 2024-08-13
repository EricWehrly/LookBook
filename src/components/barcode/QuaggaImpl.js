import './scanner.css';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';
import Scanner from './scanner';
import Result from './product';

// (for now, this is a straight rip from )
// https://github.com/ericblade/quagga2-react-example

const QuaggaImpl = () => {
    const [scanning, setScanning] = useState(false); // toggleable state for "should render scanner"
    const [cameras, setCameras] = useState([]); // array of available cameras, as returned by Quagga.CameraAccess.enumerateVideoDevices()
    const [cameraId, setCameraId] = useState(null); // id of the active camera device
    const [cameraError, setCameraError] = useState(null); // error message from failing to access the camera
    const [results, setResults] = useState([]); // list of scanned results
    const [torchOn, setTorch] = useState(false); // toggleable state for "should torch be on"
    const scannerRef = useRef(null); // reference to the scanner element in the DOM

    // at start, we need to get a list of the available cameras.  We can do that with Quagga.CameraAccess.enumerateVideoDevices.
    // HOWEVER, Android will not allow enumeration to occur unless the user has granted camera permissions to the app/page.
    // AS WELL, Android will not ask for permission until you actually try to USE the camera, just enumerating the devices is not enough to trigger the permission prompt.
    // THEREFORE, if we're going to be running in Android, we need to first call Quagga.CameraAccess.request() to trigger the permission prompt.
    // AND THEN, we need to call Quagga.CameraAccess.release() to release the camera so that it can be used by the scanner.
    // AND FINALLY, we can call Quagga.CameraAccess.enumerateVideoDevices() to get the list of cameras.

    // Normally, I would place this in an application level "initialization" event, but for this demo, I'm just going to put it in a useEffect() hook in the App component.

    useEffect(() => {
        const enableCamera = async () => {
            await Quagga.CameraAccess.request(null, {});
        };
        const disableCamera = async () => {
            await Quagga.CameraAccess.release();
        };
        const enumerateCameras = async () => {
            const cameras = await Quagga.CameraAccess.enumerateVideoDevices();
            console.log('Cameras Detected: ', cameras);
            return cameras;
        };
        enableCamera()
        .then(disableCamera)
        .then(enumerateCameras)
        .then((cameras) => setCameras(cameras))
        .then(() => Quagga.CameraAccess.disableTorch()) // disable torch at start, in case it was enabled before and we hot-reloaded
        .catch((err) => setCameraError(err));

        // add a previously resolved value so that we can test
        // without needing to fuss with lining up the camera (every time...)
        setResults([{ code: '0030878461993', format: 'ean_13' }]);

        return () => disableCamera();
    }, []);

    // provide a function to toggle the torch/flashlight
    const onTorchClick = useCallback(() => {
        const torch = !torchOn;
        setTorch(torch);
        try {
            if (torch) {
                Quagga.CameraAccess.enableTorch();
            } else {
                Quagga.CameraAccess.disableTorch();
            }
        } catch (err) {
            console.error(err);
        }
    }, [torchOn, setTorch]);

    const handleDetected = (result) => {
        const isDuplicate = results.some(existingResult => existingResult.code === result.code);
        if (!isDuplicate) {
            setResults([...results, result]);
        }
    };

    return (
        <div>
            {cameraError ? <p>ERROR INITIALIZING CAMERA ${JSON.stringify(cameraError)} -- DO YOU HAVE PERMISSION?</p> : null}
            {cameras.length === 0 ? <p>Enumerating Cameras, browser may be prompting for permissions beforehand</p> :
                <form>
                    <select onChange={(event) => setCameraId(event.target.value)}>
                        {cameras.map((camera) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                                {camera.label || camera.deviceId}
                            </option>
                        ))}
                    </select>
                </form>
            }
            <button onClick={onTorchClick}>{torchOn ? 'Disable Torch' : 'Enable Torch'}</button>
            <button onClick={() => setScanning(!scanning) }>{scanning ? 'Stop' : 'Start'}</button>
            <h3>Results:</h3>
            <ul className="results">
                {results.length === 0 ? <span>None so far...</span> : null}
                {results.map((result) => (<li key={result.code}><Result result={result} /></li>))}
            </ul>
            
            <div ref={scannerRef} className="scannerRef">
                {/* <video style={{ width: window.innerWidth, height: 480, border: '3px solid orange' }}/> */}
                <canvas className="drawingBuffer" style={{
                    // left: '0px',
                    // height: '100%',
                    // width: '100%',
                    border: '3px solid green',
                }} width="640" height="480" />
                {scanning ? <Scanner scannerRef={scannerRef} cameraId={cameraId} onDetected={handleDetected} /> : null}
            </div>
        </div>
    );
};

export default QuaggaImpl;
