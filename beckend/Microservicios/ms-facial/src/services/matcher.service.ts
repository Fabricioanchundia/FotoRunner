// If '@prisma/client' types are not available in the build environment,
// declare the module to avoid TS errors. This is a local fallback and
// should be removed when installing @prisma/client typings properly.
declare module '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { detectarRostros, detectarRostrosBase64, compararVectores, FaceData } from './vision.service';

const prisma = new PrismaClient();

const CONFIDENCE_MINIMO = 0.75;

// Registrar vector facial de un usuario desde su selfie
export const registrarVectorUsuario = async (
  userId: string,
  avatarUrl: string
): Promise<{ success: boolean; mensaje: string }> => {
  try {
    let faces: FaceData[] = [];

    // Si es base64
    if (avatarUrl.startsWith('data:image')) {
      faces = await detectarRostrosBase64(avatarUrl);
    } else {
      faces = await detectarRostros(avatarUrl);
    }

    if (faces.length === 0) {
      return { success: false, mensaje: 'No se detectó ningún rostro en la imagen' };
    }

    const mejorRostro = faces.reduce(
      (prev, curr) => (curr.detectionConfidence > prev.detectionConfidence ? curr : prev),
      faces[0]
    );

    const vectorString = JSON.stringify(mejorRostro.vector);

    await prisma.user.update({
      where: { id: userId },
      data: { face_vector: vectorString }
    });

    return { success: true, mensaje: 'Vector facial registrado correctamente' };
  } catch (error) {
    console.error('Error registrar vector:', error);
    return { success: false, mensaje: `Error: ${error}` };
  }
};

// Compara un rostro detectado contra todos los usuarios con vector
// registrado y crea los FaceMatch que superen el umbral. Extraído de
// procesarFotoEvento para bajar su complejidad cognitiva — el bucle
// externo (por cada rostro) ahora solo llama a esto por cada uno.
async function compararRostroConUsuarios(
  vectorRostro: number[],
  photoId: string,
  usuarios: { id: string; nombre: string; face_vector: string | null }[]
): Promise<number> {
  let matchesEncontrados = 0;

  for (const usuario of usuarios) {
    try {
      const vectorUsuario: number[] = JSON.parse(usuario.face_vector || '[]');
      if (vectorUsuario.length === 0) continue;

      const score = compararVectores(vectorRostro, vectorUsuario);
      if (score < CONFIDENCE_MINIMO) continue;

      const existente = await prisma.faceMatch.findUnique({
        where: {
          photo_id_user_id: {
            photo_id: photoId,
            user_id: usuario.id
          }
        }
      });

      if (!existente) {
        await prisma.faceMatch.create({
          data: {
            photo_id: photoId,
            user_id: usuario.id,
            confidence_score: score
          }
        });
        matchesEncontrados++;
        console.log(`Match: Usuario ${usuario.nombre} en foto ${photoId} (score: ${score.toFixed(3)})`);
      }
    } catch (err) {
      console.error(`Error comparando con usuario ${usuario.id}:`, err);
    }
  }

  return matchesEncontrados;
}

// Procesar foto de evento — buscar matches con usuarios
export const procesarFotoEvento = async (
  photoId: string,
  photoUrl: string
): Promise<{ matches: number; procesado: boolean }> => {
  try {
    // Detectar rostros en la foto
    const faces = await detectarRostros(photoUrl);

    if (faces.length === 0) {
      console.log(`Foto ${photoId}: sin rostros detectados`);
      return { matches: 0, procesado: true };
    }

    console.log(`Foto ${photoId}: ${faces.length} rostros detectados`);

    // Obtener todos los usuarios con vector facial registrado
    const usuarios = await prisma.user.findMany({
      where: { face_vector: { not: null } },
      select: { id: true, nombre: true, face_vector: true }
    });

    if (usuarios.length === 0) {
      return { matches: 0, procesado: true };
    }

    let totalMatches = 0;

    // Comparar cada rostro detectado con cada usuario registrado
    for (const face of faces) {
      if (face.vector.length === 0) continue;
      totalMatches += await compararRostroConUsuarios(face.vector, photoId, usuarios);
    }

    // Marcar foto como procesada
    await prisma.photo.update({
      where: { id: photoId },
      data: { processed_at: new Date() }
    });

    return { matches: totalMatches, procesado: true };
  } catch (error) {
    console.error(`Error procesando foto ${photoId}:`, error);
    return { matches: 0, procesado: false };
  }
};

// Buscar fotos de un usuario en un evento
export const buscarFotosUsuario = async (
  userId: string,
  eventId?: string
): Promise<any[]> => {
  try {
    const where: any = { user_id: userId };

    const matches = await prisma.faceMatch.findMany({
      where,
      include: {
        foto: true
      },
      orderBy: { confidence_score: 'desc' }
    });

    // Filtrar por evento si se especifica
    if (eventId) {
      const fotosFiltradas = matches.filter(m => m.foto.event_id === eventId);
      return fotosFiltradas.map(m => ({
        ...m.foto,
        confidence_score: m.confidence_score
      }));
    }

    return matches.map(m => ({
      ...m.foto,
      confidence_score: m.confidence_score
    }));
  } catch (error) {
    console.error('Error buscar fotos usuario:', error);
    return [];
  }
};

// Procesar todas las fotos sin procesar de un evento
export const procesarFotosEvento = async (eventId: string): Promise<{
  total: number;
  procesadas: number;
  matches: number;
}> => {
  try {
    const fotos = await prisma.photo.findMany({
      where: {
        event_id: eventId,
        processed_at: null
      }
    });

    console.log(`Procesando ${fotos.length} fotos del evento ${eventId}`);

    let procesadas = 0;
    let totalMatches = 0;

    for (const foto of fotos) {
      const resultado = await procesarFotoEvento(foto.id, foto.gcs_original_url);
      if (resultado.procesado) {
        procesadas++;
        totalMatches += resultado.matches;
      }
      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { total: fotos.length, procesadas, matches: totalMatches };
  } catch (error) {
    console.error('Error procesar fotos evento:', error);
    return { total: 0, procesadas: 0, matches: 0 };
  }
};