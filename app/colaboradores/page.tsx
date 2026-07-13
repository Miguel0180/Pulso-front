"use client";

import { useState } from "react";
import Sidebar from "../components/menu";
import Header from "../components/header";
// 👇 Importamos o hook global do tema
import { useTheme } from "../context/ThemeContext"; 

import pageStyles from "../dashboard/gestao.module.css"; 
import styles from "./colaboradores.module.css";

interface Colaborador {
  id: number;
  nome: string;
  cargo: string;
  setor: string;
  status: "good" | "watch" | "critical";
}

const colaboradoresIniciais: Colaborador[] = [
  { id: 1, nome: "Ana Silva", cargo: "Analista de Compliance", setor: "Jurídico", status: "good" },
  { id: 2, nome: "Bruno Costa", cargo: "Desenvolvedor Full Stack", setor: "Tecnologia", status: "watch" },
  { id: 3, nome: "Carla Souza", cargo: "Diretora de Operações", setor: "Operações", status: "critical" },
];

/* Componentes de Ícones Otimizados (SVG) */
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  );
}

export default function ColaboradoresPage() {
  // 👇 REMOVIDO o useState antigo e o toggleTema local. Agora usamos o Contexto:
  const { tema, toggleTema } = useTheme();
  
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(colaboradoresIniciais);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modo, setModo] = useState<"cadastrar" | "editar" | "visualizar">("cadastrar");
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);

  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("");
  const [status, setStatus] = useState<"good" | "watch" | "critical">("good");

  const abrirModalCadastro = () => {
    setModo("cadastrar");
    setSelectedColaborador(null);
    setNome("");
    setCargo("");
    setSetor("");
    setStatus("good");
    setIsModalOpen(true);
  };

  const abrirModalEditar = (colaborador: Colaborador) => {
    setModo("editar");
    setSelectedColaborador(colaborador);
    setNome(colaborador.nome);
    setCargo(colaborador.cargo);
    setSetor(colaborador.setor);
    setStatus(colaborador.status);
    setIsModalOpen(true);
  };

  const abrirModalVisualizar = (colaborador: Colaborador) => {
    setModo("visualizar");
    setSelectedColaborador(colaborador);
    setNome(colaborador.nome);
    setCargo(colaborador.cargo);
    setSetor(colaborador.setor);
    setStatus(colaborador.status);
    setIsModalOpen(true);
  };

  const salvarColaborador = (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === "cadastrar") {
      const novo: Colaborador = {
        id: Date.now(),
        nome,
        cargo,
        setor,
        status,
      };
      setColaboradores([...colaboradores, novo]);
    } else if (modo === "editar" && selectedColaborador) {
      setColaboradores(
        colaboradores.map((c) =>
          c.id === selectedColaborador.id ? { ...c, nome, cargo, setor, status } : c
        )
      );
    }
    setIsModalOpen(false);
  };

  const excluirColaborador = (id: number) => {
    if (confirm("Tem certeza que deseja remover este colaborador?")) {
      setColaboradores(colaboradores.filter((c) => c.id !== id));
    }
  };

  return (
    // Como o ThemeProvider já injeta o data-theme na div externa, 
    // você pode até manter o data-theme={tema} aqui se seus módulos CSS dependerem estritamente dele nesta tag.
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />

      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} denunciasAbertas={2} />

        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Gestão de Colaboradores</h2>
            <p className={styles.sectionSubtitle}>Adicione, modifique ou analise os perfis internos.</p>
          </div>
          <button className={styles.primaryButton} onClick={abrirModalCadastro}>
            + Cadastrar Colaborador
          </button>
        </div>

        {/* ... Resto da sua tabela e modal (inalterados) ... */}
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome / Cargo</th>
                <th>Setor</th>
                <th>Índice de Risco</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatarMini}>
                        {c.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.empName}>{c.nome}</div>
                        <div className={styles.empRole}>{c.cargo}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={styles.txtSetor}>{c.setor}</span></td>
                  <td>
                    <span className={`${styles.badge} ${
                      c.status === "good" ? styles.badgeGood : c.status === "watch" ? styles.badgeWatch : styles.badgeCritical
                    }`}>
                      {c.status === "good" ? "Estável" : c.status === "watch" ? "Atenção" : "Crítico"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className={styles.actionsGroup}>
                      <button className={styles.actionBtn} onClick={() => abrirModalVisualizar(c)} title="Visualizar" aria-label="Visualizar">
                        <EyeIcon />
                      </button>
                      <button className={styles.actionBtn} onClick={() => abrirModalEditar(c)} title="Editar" aria-label="Editar">
                        <EditIcon />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={() => excluirColaborador(c.id)} title="Excluir" aria-label="Excluir">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>
                  {modo === "cadastrar" && "Cadastrar Colaborador"}
                  {modo === "editar" && "Editar Colaborador"}
                  {modo === "visualizar" && "Detalhes do Colaborador"}
                </h3>
                <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
              </div>

              <form onSubmit={salvarColaborador} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Nome Completo</label>
                  <input 
                    type="text" 
                    value={nome} 
                    onChange={(e) => setNome(e.target.value)} 
                    required 
                    disabled={modo === "visualizar"}
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Cargo</label>
                    <input 
                      type="text" 
                      value={cargo} 
                      onChange={(e) => setCargo(e.target.value)} 
                      required 
                      disabled={modo === "visualizar"}
                      placeholder="Ex: Analista Pleno"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Setor</label>
                    <input 
                      type="text" 
                      value={setor} 
                      onChange={(e) => setSetor(e.target.value)} 
                      required 
                      disabled={modo === "visualizar"}
                      placeholder="Ex: Financeiro"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Status de Risco Ético</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as any)} 
                    disabled={modo === "visualizar"}
                  >
                    <option value="good">Estável (Verde)</option>
                    <option value="watch">Atenção (Âmbar)</option>
                    <option value="critical">Crítico (Terracota)</option>
                  </select>
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setIsModalOpen(false)}>
                    {modo === "visualizar" ? "Fechar" : "Cancelar"}
                  </button>
                  {modo !== "visualizar" && (
                    <button type="submit" className={styles.primaryButton}>
                      {modo === "cadastrar" ? "Cadastrar" : "Salvar Alterações"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}