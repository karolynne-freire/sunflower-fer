import { useEffect, useState } from "react";
import { loadTensorflowModel, TensorflowModel } from "react-native-fast-tflite";

export function useModel() {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        // Corrigido para voltar 1 nível (sair de hooks/ e ir para assets/)
        const modeloCarregado = await loadTensorflowModel(
          require("../assets/modelo_emocoes_quant.tflite"),
        );
        setModel(modeloCarregado);
        setPronto(true);
        console.log("✅ Modelo carregado com sucesso!");
      } catch (e) {
        console.error("❌ Erro ao carregar o arquivo .tflite:", e);
      }
    }
    carregar();
  }, []);

  return { model, pronto };
}
