import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import './ReconhecimentoFacial.css';
import { loadModels, getFaceDescriptor } from '../utils/faceApi';

const ReconhecimentoFacial = ({ onDescriptor, onComplete, startCamera = false }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [status, setStatus] = useState('Aguardando permissão...');
    const [blinkDetected, setBlinkDetected] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    useEffect(() => {
        const initModels = async () => {
            try {
                await loadModels();
                setModelsLoaded(true);
                if (!startCamera) setStatus('Modelos prontos. Clique para iniciar.');
            } catch (error) {
                setStatus('Erro ao carregar modelos de IA.');
                console.error(error);
            }
        };
        initModels();
    }, []);

    useEffect(() => {
        const setupCamera = async () => {
            if (!startCamera || !modelsLoaded) return;

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setStatus('A câmera não é suportada neste navegador.');
                return;
            }

            setStatus('Acessando câmera...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    },
                    audio: false
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    try {
                        await videoRef.current.play();
                        // Se play() resolveu, o onPlay deve disparar, 
                        // mas vamos chamar handleVideoPlay manualmente como garantia após um tempo
                        setTimeout(() => {
                            if (videoRef.current && !videoRef.current.paused && status === 'Acessando câmera...') {
                                console.log("Forçando início da detecção (onPlay não disparou)");
                                handleVideoPlay();
                            }
                        }, 1000);
                    } catch (playError) {
                        console.error("Erro ao iniciar reprodução do vídeo: ", playError);
                    }
                }
            } catch (err) {
                if (err.name === 'NotAllowedError') {
                    setStatus('Permissão da câmera negada. Por favor, autorize no navegador.');
                } else {
                    setStatus(`Erro ao acessar a câmera: ${err.message}`);
                }
                console.error("Erro ao acessar a câmera: ", err);
            }
        };

        setupCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera, modelsLoaded]);

    const handleVideoPlay = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;

        // Aguarda metadados estarem prontos para ter largura/altura
        if (video.videoWidth === 0) {
            video.addEventListener('loadedmetadata', handleVideoPlay, { once: true });
            return;
        }

        setStatus('Iniciando detector facial...');

        const detectFaces = async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
                return;
            }

            const canvas = canvasRef.current;
            if (!canvas) return;

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            try {
                // Opções otimizadas para detecção rápida
                const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

                const detection = await faceapi.detectSingleFace(video, options);

                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);

                if (detection) {
                    const resizedDetection = faceapi.resizeResults(detection, displaySize);

                    // Feedback visual leve (caixa de detecção)
                    faceapi.draw.drawDetections(canvas, resizedDetection);

                    if (!blinkDetected) {
                        setStatus('Rosto detectado! Capturando...');
                        setBlinkDetected(true); // Reusando o estado p/ indicar sucesso na detecção

                        // Pequeno delay para garantir que o rosto está bem posicionado antes de extrair o descritor
                        setTimeout(async () => {
                            try {
                                const descriptor = await getFaceDescriptor(video);
                                if (descriptor) {
                                    onDescriptor(descriptor);
                                    setStatus('Rosto capturado com sucesso!');
                                    if (onComplete) onComplete();
                                } else {
                                    setStatus('Falha na captura. Tente novamente.');
                                    setBlinkDetected(false);
                                }
                            } catch (descError) {
                                console.error("Erro ao gerar descritor: ", descError);
                                setStatus('Erro no processamento da imagem.');
                                setBlinkDetected(false);
                            }
                        }, 800);
                    }
                } else {
                    setStatus('Posicione seu rosto dentro do quadro.');
                }
            } catch (detectError) {
                console.error("Erro na detecção facial: ", detectError);
                setStatus(`Erro de Detecção: ${detectError.message.substring(0, 30)}...`);
            }

            if (!blinkDetected) {
                requestAnimationFrame(detectFaces);
            }
        };

        // Pequeno delay para garantir estabilidade da face-api
        setTimeout(() => detectFaces(), 500);
    };


    return (
        <div className="reconhecimento-facial-container">
            <div className="video-wrapper">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    onPlay={handleVideoPlay}
                    playsInline
                    className={blinkDetected ? 'blink-active' : ''}
                />
                <canvas ref={canvasRef} className="overlay" />
                <div className={`face-overlay ${blinkDetected ? 'success' : ''}`}>
                    <div className="corner top-left"></div>
                    <div className="corner top-right"></div>
                    <div className="corner bottom-left"></div>
                    <div className="corner bottom-right"></div>
                </div>
            </div>
            <div className={`status-badge ${blinkDetected ? 'success' : ''}`}>
                <p className="status-text">{status}</p>
            </div>
        </div>
    );
};

export default ReconhecimentoFacial;
