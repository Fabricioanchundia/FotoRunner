import vision from '@google-cloud/vision';
import path from 'node:path';

// Configurar credenciales
const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = credentialsPath;

const client = new vision.ImageAnnotatorClient();

export interface FaceData {
  detectionConfidence: number;
  landmarks: { type: string; x: number; y: number; z: number }[];
  boundingBox: { x: number; y: number; width: number; height: number };
  vector: number[];
}

// Detectar rostros en una imagen
export const detectarRostros = async (imageUrl: string): Promise<FaceData[]> => {
  try {
    const [result] = await client.faceDetection(imageUrl);
    const faces = result.faceAnnotations || [];

    if (faces.length === 0) return [];

    return faces.map((face) => {
      const landmarks = (face.landmarks || []).map((lm: any) => ({
        type: lm.type || '',
        x: lm.position?.x || 0,
        y: lm.position?.y || 0,
        z: lm.position?.z || 0
      }));

      // Generar vector normalizado desde landmarks
      const vector = generarVector(landmarks);

      const vertices = face.boundingPoly?.vertices || [];
      const x = vertices[0]?.x || 0;
      const y = vertices[0]?.y || 0;
      const width = (vertices[2]?.x || 0) - x;
      const height = (vertices[2]?.y || 0) - y;

      return {
        detectionConfidence: face.detectionConfidence || 0,
        landmarks,
        boundingBox: { x, y, width, height },
        vector
      };
    });
  } catch (error) {
    console.error('Error Vision API:', error);
    throw new Error(`Error al detectar rostros: ${error}`);
  }
};

// Detectar desde base64
export const detectarRostrosBase64 = async (base64: string): Promise<FaceData[]> => {
  try {
    // Limpiar prefijo si viene con data:image/...
    const imageData = base64.replace(/^data:image\/\w+;base64,/, '');

    const [result] = await client.faceDetection({
      image: { content: imageData }
    });

    const faces = result.faceAnnotations || [];
    if (faces.length === 0) return [];

    return faces.map((face) => {
      const landmarks = (face.landmarks || []).map((lm: any) => ({
        type: lm.type || '',
        x: lm.position?.x || 0,
        y: lm.position?.y || 0,
        z: lm.position?.z || 0
      }));

      const vector = generarVector(landmarks);

      const vertices = face.boundingPoly?.vertices || [];
      const x = vertices[0]?.x || 0;
      const y = vertices[0]?.y || 0;
      const width = (vertices[2]?.x || 0) - x;
      const height = (vertices[2]?.y || 0) - y;

      return {
        detectionConfidence: face.detectionConfidence || 0,
        landmarks,
        boundingBox: { x, y, width, height },
        vector
      };
    });
  } catch (error) {
    console.error('Error Vision API base64:', error);
    throw new Error(`Error al detectar rostros: ${error}`);
  }
};

// Generar vector numérico desde landmarks
const generarVector = (landmarks: { type: string; x: number; y: number; z: number }[]): number[] => {
  if (landmarks.length === 0) return [];

  // Normalizar coordenadas
  const xs = landmarks.map(l => l.x);
  const ys = landmarks.map(l => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangoX = maxX - minX || 1;
  const rangoY = maxY - minY || 1;

  const vector: number[] = [];
  for (const lm of landmarks) {
    vector.push((lm.x - minX) / rangoX, (lm.y - minY) / rangoY);
  }

  return vector;
};

// Comparar dos vectores — retorna score 0-1
export const compararVectores = (v1: number[], v2: number[]): number => {
  if (v1.length === 0 || v2.length === 0) return 0;

  const len = Math.min(v1.length, v2.length);
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += v1[i] * v2[i];
    mag1 += v1[i] * v1[i];
    mag2 += v2[i] * v2[i];
  }

  const magnitud = Math.sqrt(mag1) * Math.sqrt(mag2);
  if (magnitud === 0) return 0;

  return dotProduct / magnitud;
};