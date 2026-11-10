import { useState, useRef } from "react";
import { Download, Upload, Trash2, Cloud, ShieldCheck } from "lucide-react";
import type { Data, SaveData } from "../lib/types";
import { fresh } from "../lib/data";
import { validate, legacyData, downloadBackup } from "../lib/storage";
import { Modal, NumberField } from "./UI";
export function Settings({
  data,
  onSave,
  onClose,
}: {
  data: Data;
  onSave: SaveData;
  onClose: () => void;
}) {
  const [error, setError] = useState(""),
    [minimum, setMinimum] = useState(data.settings.recoveryMinimum);
  const ref = useRef<HTMLInputElement>(null);
  async function importData(next: Data) {
    if (
      confirm(
        "Importar estas notas para a conta conectada? Isso substituirá todas as notas, metas e extras atuais desta conta. Exporte um backup antes se quiser preservá-los.",
      )
    ) {
      if (await onSave(next, "Backup importado para sua conta.")) {
        setError("");
        setMinimum(next.settings.recoveryMinimum);
      } else
        setError(
          "A importação não foi confirmada. Confira o aviso de conexão e tente novamente.",
        );
    }
  }
  return (
    <Modal title="Configurações e backup" onClose={onClose}>
      <div className="notice">
        <Cloud size={20} />
        <span>
          As alterações são salvas na sua conta. Em outro dispositivo, entre com
          o mesmo e-mail. Você também pode exportar uma cópia das notas.
        </span>
      </div>
      <div className="settings-row">
        <div>
          <h3>Ano letivo</h3>
          <p>NotaRadar 2.0 · Deep Violet Edition</p>
        </div>
        <span className="pill">2026</span>
      </div>
      <h3 className="section-label">Seus dados</h3>
      <div className="backup-actions">
        <button className="secondary" onClick={() => downloadBackup(data)}>
          <Download size={17} /> Exportar backup
        </button>
        <button className="secondary" onClick={() => ref.current?.click()}>
          <Upload size={17} /> Importar backup
        </button>
      </div>
      <input
        hidden
        type="file"
        ref={ref}
        accept=".json,application/json"
        onChange={async (e) => {
          const input = e.currentTarget,
            f = input.files?.[0];
          if (!f) return;
          try {
            if (f.size > 1_000_000)
              throw new Error("O backup deve ter até 1 MB.");
            await importData(validate(JSON.parse(await f.text())));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Arquivo inválido.");
          }
          input.value = "";
        }}
      />
      <button
        className="text-button"
        onClick={async () => {
          try {
            const legacy = legacyData();
            if (!legacy) {
              setError(
                "Não há dados da versão antiga neste endereço e navegador. Use o backup JSON exportado no site anterior.",
              );
              return;
            }
            await importData(legacy);
          } catch {
            setError(
              "Os dados antigos não puderam ser lidos. Use um backup JSON válido.",
            );
          }
        }}
      >
        Importar dados locais da versão anterior
      </button>
      <p className="small muted">
        A importação é manual. Nenhuma nota local é vinculada automaticamente a
        uma conta.
      </p>
      {error && (
        <p role="alert" className="red small">
          {error}
        </p>
      )}
      <details>
        <summary>Regra de recuperação</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSave(
              {
                ...data,
                settings: { ...data.settings, recoveryMinimum: minimum },
              },
              "Regra de recuperação atualizada.",
            );
          }}
        >
          <p className="small muted">
            Padrão: 6,0. Altere apenas se a escola confirmar outro critério.
          </p>
          <NumberField
            label="Nota mínima de recuperação"
            value={minimum}
            required
            onChange={(v) => setMinimum(v ?? 0)}
          />
          <button className="secondary">Salvar regra</button>
        </form>
      </details>
      <div className="notice small">
        <ShieldCheck size={20} />
        <span>
          As notas importadas são enviadas ao Supabase e ficam vinculadas à sua
          conta. Simulações continuam separadas dos dados reais.
        </span>
      </div>
      <div className="danger-zone">
        <div>
          <h3>Limpar dados acadêmicos</h3>
          <p>
            Remove as notas, extras, metas e recuperações de 2026 desta conta.
            Seu login é mantido.
          </p>
        </div>
        <button
          className="secondary danger"
          onClick={async () => {
            if (
              confirm(
                "Apagar todos os dados acadêmicos de 2026 desta conta? Sem backup, não será possível desfazer.",
              )
            ) {
              if (await onSave(fresh(), "Dados acadêmicos apagados."))
                onClose();
            }
          }}
        >
          <Trash2 size={16} /> Limpar
        </button>
      </div>
    </Modal>
  );
}
