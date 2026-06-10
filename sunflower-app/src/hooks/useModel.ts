import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { TFLiteModel, loadTFLiteModel } from "@tensorflow/tfjs-tflite";
import { Asset } from "expo-asset";

export function useModel() {
  const [model, setModel] = useState<TFLiteModel | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        await tf.ready();

        const asset = Asset.fromModule(
          require("../assets/modelo_emocoes_quant.tflite"),
        );
        await asset.downloadAsync();

        const tflite = await loadTFLiteModel(asset.localUri!);
        setModel(tflite);
        setPronto(true);
        console.log("✅ Modelo TFLite carregado!");
      } catch (e) {
        console.error("❌ Erro ao carregar modelo:", e);
      }
    }
    carregar();
  }, []);

  return { model, pronto };
}
