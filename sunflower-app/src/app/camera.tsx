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
import * as tf from "@tensorflow/tfjs";
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

  async function detectar() {
    if (!cameraRef.current || rodando || !model) return;
    setRodando(true);

    try {
      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });

      if (!foto) return;

      const redim = await ImageManipulator.manipulateAsync(
        foto.uri,
        [{ resize: { width: IMG_SIZE, height: IMG_SIZE } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );

      if (!redim.base64) return;

      const bytes = Uint8Array.from(atob(redim.base64), (c) => c.charCodeAt(0));
      const tensor = tf.tidy(() => {
        const raw = tf.tensor(bytes, [IMG_SIZE, IMG_SIZE, 4], "int32");
        const rgb = raw.slice([0, 0, 0], [IMG_SIZE, IMG_SIZE, 3]);
        return rgb.toFloat().div(127.5).sub(1).expandDims(0);
      });

      const saida = model.predict(tensor) as tf.Tensor;
      const probs = await saida.data();

      const idx = probs.indexOf(Math.max(...Array.from(probs)));
      setEmocaoIdx(idx);
      setConfianca(probs[idx]);

      tensor.dispose();
      saida.dispose();
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

      <CameraView ref={cameraRef} style={styles.camera} facing="front">
        <View style={styles.guiaRosto} />
      </CameraView>

      <View style={styles.resultado}>
        {!pronto ? (
          <View style={styles.centro}>
            <ActivityIndicator color="#E6A817" size="large" />
            <Text style={styles.carregando}>Carregando modelo...</Text>
          </View>
        ) : emocaoIdx !== null ? (
          <EmocaoCard indice={emocaoIdx} confianca={confianca} />
        ) : (
          <Text style={styles.aguardando}>Posicione o rosto na câmera 👆</Text>
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
    justifyContent: "space-between",
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
  camera: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "center",
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
