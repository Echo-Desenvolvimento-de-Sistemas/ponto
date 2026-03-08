import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

let modelsLoaded = false;

export const loadModels = async () => {
    if (modelsLoaded) return;
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        modelsLoaded = true;
        console.log('Modelos de face-api carregados com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar os modelos de face-api:', error);
        throw new Error('Não foi possível carregar os modelos de reconhecimento facial.');
    }
};

export const getFaceDescriptor = async (input) => {
    if (!modelsLoaded) {
        throw new Error('Modelos não carregados. Chame loadModels() primeiro.');
    }

    const detection = await faceapi.detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        console.warn('Nenhum rosto detectado para gerar o descritor.');
        return null;
    }

    return Array.from(detection.descriptor);
};
