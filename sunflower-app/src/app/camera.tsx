import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useModel } from "../hooks/useModel";
import { EmocaoCard } from "../components/EmocaoCard";

const IMG_SIZE = 96;

export default function Camera() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [nome, setNome] = useState("");
  const [emocaoIdx, setEmocaoIdx] = useState<number | null>(null);
  const [confianca, setConfianca] = useState(0);
  const [rodando, setRodando] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { model, pronto } = useModel();
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem("nomeCrianca").then((n) => setNome(n || ""));
    requestPermission();
  }, []);

  useEffect(() => {
    if (!pronto || !model) return;
    intervalRef.current = setInterval(detectar, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pronto, model]);

  function decodeBase64ToArray(base64String: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }
    
    let bufferLength = base64String.length * 0.75;
    if (base64String[base64String.length - 1] === '=') {
      bufferLength--;
      if (base64String[base64String.length - 2] === '=') bufferLength--;
    }
    
    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    for (let i = 0; i < base64String.length; i += 4) {
      const base641 = lookup[base64String.charCodeAt(i)];
      const base642 = lookup[base64String.charCodeAt(i + 1)];
      const base643 = lookup[base64String.charCodeAt(i + 2)];
      const base644 = lookup[base64String.charCodeAt(i + 3)];
      
      bytes[p++] = (base641 << 2) | (base642 >> 4);
      if (p < bufferLength) bytes[p++] = ((base642 & 15) << 4) | (base643 >> 2);
      if (p < bufferLength) bytes[p++] = ((base643 & 3) << 6) | (base644 & 63);
    }
    return bytes;
  }

  async function detectar() {
    if (!cameraRef.current || rodando || !model) return;
    setRodando(true);

    try {
      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });

      if (!foto || !foto.uri) return;

      const redim = await ImageManipulator.manipulateAsync(
        foto.uri,
        [{ resize: { width: IMG_SIZE, height: IMG_SIZE } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!redim.base64) return;

      const bytes = decodeBase64ToArray(redim.base64.replace(/\s/g, ''));
      const input = new Float32Array(IMG_SIZE * IMG_SIZE * 3);
      let j = 0;
      
      for (let i = 0; i < bytes.length; i += 4) {
        if (j >= input.length) break;
        input[j++] = (bytes[i]     / 127.5) - 1; // R
        input[j++] = (bytes[i + 1] / 127.5) - 1; // G
        input[j++] = (bytes[i + 2] / 127.5) - 1; // B
      }

      const resultado = await model.runInference([input]);
      
      if (resultado && resultado.length > 0) {
        const probs = resultado[0] as Float32Array;
        const arrayProbs = Array.from(probs);
        const idx = arrayProbs.indexOf(Math.max(...arrayProbs));
        
        setEmocaoIdx(idx);
        setConfianca(probs[idx]);
      }

    } catch (e) {
      console.error("Erro na detecção:", e);
    } finally {
      setRodando(false);
    }
  }

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.centro}>
        <Text style={styles.textoPermissao}>
          Precisamos da câmera para funcionar.
        </Text>
        <TouchableOpacity style={styles.botao} onPress={requestPermission}>
          <Text style={styles.botaoTexto}>Permitir câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>← Sair</Text>
        </TouchableOpacity>
        <Text style={styles.headerNome}>🌻 {nome}</Text>
        {rodando && <ActivityIndicator color="#E6A817" size="small" />}
      </View>

      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" />
        <View style={styles.camOverlay} pointerEvents="none">
          <View style={styles.guiaRosto} />
        </View>
      </View>

      <View style={styles.resultado}>
        {!pronto ? (
          <View style={styles.centro}>
            <ActivityIndicator color="#E6A817" size="large" />
            <Text style={styles.carregando}>Carregando modelo...</Text>
          </View>
        ) : emocaoIdx !== null ? (
          <EmocaoCard indice={emocaoIdx} confianca={confianca} />
        ) : (
          <Text style={styles.aguardando}>
            Posicione o rosto na câmera 👆
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDF0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justify: "space-between",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
    backgroundColor: "#FFFDF0",
  },
  voltar: {
    fontSize: 16,
    color: "#E6A817",
    fontWeight: "600",
  },
  headerNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  camOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  guiaRosto: {
    width: 220,
    height: 280,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: "rgba(230, 168, 23, 0.8)",
    borderStyle: "dashed",
  },
  resultado: {
    height: 200,
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#FFFDF0",
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justify: "center",
  },
  textoPermissao: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 32,
  },
  botao: {
    backgroundColor: "#E6A817",
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  botaoTexto: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  carregando: {
    marginTop: 12,
    color: "#888",
    fontSize: 14,
  },
  aguardando: {
    textAlign: "center",
    fontSize: 16,
    color: "#AAA",
  },
});