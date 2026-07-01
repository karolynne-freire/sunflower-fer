import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useModel } from "../hooks/useModel";
import { EmocaoCard } from "../components/EmocaoCard";

const IMG_SIZE = 96;

function decodeBase64ToArray(base64: string): Uint8Array {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  const clean = base64.replace(/\s/g, "").replace(/=+$/, "");
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = lookup[clean.charCodeAt(i)];
    const b = lookup[clean.charCodeAt(i + 1)];
    const c = lookup[clean.charCodeAt(i + 2)] ?? 0;
    const d = lookup[clean.charCodeAt(i + 3)] ?? 0;
    bytes[p++] = (a << 2) | (b >> 4);
    if (p < bytes.length) bytes[p++] = ((b & 0xf) << 4) | (c >> 2);
    if (p < bytes.length) bytes[p++] = ((c & 0x3) << 6) | d;
  }
  return bytes;
}

function buildInputTensor(rgbBytes: Uint8Array): Float32Array {
  const expectedLen = IMG_SIZE * IMG_SIZE * 3;
  const input = new Float32Array(expectedLen);
  for (let i = 0; i < expectedLen && i < rgbBytes.length; i++) {
    input[i] = rgbBytes[i] / 127.5 - 1.0;
  }
  return input;
}

export default function Camera() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [nome, setNome] = useState("");
  const [emocaoIdx, setEmocaoIdx] = useState<number | null>(null);
  const [confianca, setConfianca] = useState(0);
  const [rodando, setRodando] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { model, pronto } = useModel();
  const router = useRouter();

  const addLog = (msg: string) => {
    console.log(msg);
    setLog((prev) => [...prev.slice(-8), msg]);
  };

  // 1. Busca o nome armazenado no início
  useEffect(() => {
    AsyncStorage.getItem("nomeCrianca").then((n) => setNome(n ?? ""));
  }, []);

  // 2. Solicita a permissão de forma segura se ainda não tiver sido concedida
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // 3. Controla o intervalo do modelo de IA
  useEffect(() => {
    if (!pronto || !model || !cameraReady) {
      addLog(`Aguardando: modelo=${pronto}, câmera=${cameraReady}`);
      return;
    }
    addLog("✅ Câmera e modelo prontos — iniciando detecção");
    intervalRef.current = setInterval(detectar, 2500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pronto, model, cameraReady]);

  async function detectar() {
    if (!cameraRef.current || rodando || !model || !cameraReady) return;
    setRodando(true);
    try {
      addLog("📸 Capturando foto...");
      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        skipProcessing: true,
        shutterSound: false,
      });

      if (!foto?.uri) {
        addLog("⚠️ Foto sem URI");
        return;
      }
      addLog(`📐 Redimensionando para ${IMG_SIZE}x${IMG_SIZE}...`);

      const redim = await ImageManipulator.manipulateAsync(
        foto.uri,
        [{ resize: { width: IMG_SIZE, height: IMG_SIZE } }],
        {
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
          compress: 0.8,
        },
      );

      if (!redim.base64) {
        addLog("⚠️ base64 vazio");
        return;
      }

      addLog(`🔢 Decodificando ${redim.base64.length} chars base64...`);
      const bytes = decodeBase64ToArray(redim.base64);
      addLog(
        `📊 Bytes decodificados: ${bytes.length} (esperado: ${IMG_SIZE * IMG_SIZE * 3})`,
      );

      if (bytes.length < IMG_SIZE * IMG_SIZE * 3) {
        addLog("⚠️ Buffer insuficiente, pulando frame");
        return;
      }

      const input = buildInputTensor(bytes);
      addLog("🤖 Rodando inferência...");

      const resultado = model.runSync([input]);

      if (!resultado || resultado.length === 0) {
        addLog("⚠️ Resultado vazio do modelo");
        return;
      }

      const probs = Array.from(resultado[0] as Float32Array);
      const idx = probs.indexOf(Math.max(...probs));
      const conf = probs[idx];

      addLog(`✅ Predição: idx=${idx}, conf=${(conf * 100).toFixed(1)}%`);
      setEmocaoIdx(idx);
      setConfianca(conf);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      addLog(`❌ ERRO: ${msg}`);
      setErro(msg);
    } finally {
      setRodando(false);
    }
  }

  // --- TRAVAS DE SEGURANÇA NATIVA ---
  if (!permission) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color="#E6A817" size="large" />
        <Text style={styles.textoSimples}>Verificando permissões...</Text>
      </View>
    );
  }

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>← Sair</Text>
        </TouchableOpacity>
        <Text style={styles.headerNome}>🌻 {nome}</Text>
        {rodando && <ActivityIndicator color="#E6A817" size="small" />}
      </View>

      {/* Câmera */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          onCameraReady={() => {
            addLog("📷 Câmera pronta!");
            setCameraReady(true);
          }}
          onMountError={(e) => {
            addLog(`❌ Erro ao montar câmera: ${e.message}`);
            setErro(`Erro câmera: ${e.message}`);
          }}
        />
        <View style={styles.camOverlay} pointerEvents="none">
          <View style={styles.guiaRosto} />
        </View>
      </View>

      {/* Resultado */}
      <View style={styles.resultado}>
        {erro ? (
          <View style={styles.erroBox}>
            <Text style={styles.erroTitulo}>❌ Erro detectado:</Text>
            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        ) : !pronto ? (
          <View style={styles.centro}>
            <ActivityIndicator color="#E6A817" size="large" />
            <Text style={styles.carregando}>Carregando modelo IA...</Text>
          </View>
        ) : !cameraReady ? (
          <View style={styles.centro}>
            <ActivityIndicator color="#E6A817" size="large" />
            <Text style={styles.carregando}>Iniciando câmera...</Text>
          </View>
        ) : emocaoIdx !== null ? (
          <EmocaoCard indice={emocaoIdx} confianca={confianca} />
        ) : (
          <Text style={styles.aguardando}>Posicione o rosto na câmera 👆</Text>
        )}
      </View>

      {/* Log de debug */}
      <ScrollView style={styles.logBox} contentContainerStyle={{ padding: 8 }}>
        {log.map((l, i) => (
          <Text key={i} style={styles.logTexto}>
            {l}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
    backgroundColor: "#FFFDF0",
  },
  voltar: { fontSize: 16, color: "#E6A817", fontWeight: "600" },
  headerNome: { fontSize: 18, fontWeight: "bold", color: "#333" },
  cameraContainer: { flex: 1, position: "relative" },
  camera: { flex: 1 },
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
    borderColor: "rgba(230,168,23,0.8)",
    borderStyle: "dashed",
  },
  resultado: {
    height: 160,
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFDF0",
  },
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },
  textoSimples: { color: "#888", marginTop: 8 },
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
  botaoTexto: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  carregando: { marginTop: 12, color: "#888", fontSize: 14 },
  aguardando: { textAlign: "center", fontSize: 16, color: "#AAA" },
  erroBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#FFB3B3",
  },
  erroTitulo: { color: "#D00", fontWeight: "bold", marginBottom: 4 },
  erroTexto: { color: "#D00", fontSize: 12 },
  logBox: { maxHeight: 100, backgroundColor: "#1a1a1a" },
  logTexto: { color: "#0f0", fontSize: 10, fontFamily: "monospace" },
});
