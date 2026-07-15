"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../../../components/menu";
import Header from "../../../../components/header";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import { API_URL } from "@/lib/api";

import pageStyles from "../dashboard/gestao.module.css";
import styles from "./colaboradores.module.css";

/**
 * ATENÇÃO — assunção de contrato de API:
 * Confirmado no Swagger (https://pulsoetico.onrender.com/swagger-ui/index.html#/):
 *   GET    /api/empresas/{empresaId}/setores               -> lista setores
 *   POST   /api/empresas/{empresaId}/setores                -> cria setor
 *   PUT    /api/empresas/{empresaId}/setores/{setorId}      -> edita setor
 *   DELETE /api/empresas/{empresaId}/setores/{setorId}      -> remove setor
 * Corpo do PUT/POST: { "nome": string, "quantidadeColaboradores": number }
 *
 * O PATCH para salvar o setor de um membro usa o endpoint confirmado
 * no swagger:
 *   PATCH /api/empresas/{empresaId}/membros/{membroId}/setor
 *   body: { "setorId": number }
 *
 * DEBUG (temporário): `criarSetor` agora loga no console o status HTTP e o
 * corpo bruto da resposta de erro, para você identificar exatamente o que o
 * backend está reclamando na mensagem "Ocorreu um erro inesperado". Depois
 * de descobrir a causa real, pode remover os console.log marcados com
 * "DEBUG SETOR".
 */

const LIMITE_COLABORADORES_VISIVEIS = 10;

interface Membro {
  id: number;
  funcionarioId: number;
  nome: string;
  email: string;
  cargoId: number;
  cargoNome: string;
  setorId: number;
  setorNome: string;
  proprietario: boolean;
  entrouEm: string;
}

interface Setor {
  id: number;
  empresaId: number;
  nome: string;
  quantidadeColaboradores: number;
  criadoEm: string;
}

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
  const { tema, toggleTema } = useTheme();
  const { token, carregando: carregandoAuth } = useAuth();
  const params = useParams();
  const router = useRouter();
  const empresaId = params?.id;

  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [setores, setSetores] = useState<Setor[]>([]);
  const [carregandoSetores, setCarregandoSetores] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modo, setModo] = useState<"editar" | "visualizar">("visualizar");
  const [selectedMembro, setSelectedMembro] = useState<Membro | null>(null);

  const [cargo, setCargo] = useState("");
  const [setorId, setSetorId] = useState<string>("");

  const [salvandoMembro, setSalvandoMembro] = useState(false);
  const [erroMembro, setErroMembro] = useState<string | null>(null);

  const [isModalSetorOpen, setIsModalSetorOpen] = useState(false);
  const [novoSetorNome, setNovoSetorNome] = useState("");
  const [novoSetorQtd, setNovoSetorQtd] = useState("");
  const [criandoSetor, setCriandoSetor] = useState(false);
  const [erroSetor, setErroSetor] = useState<string | null>(null);

  // --- Edição de setor ---
  const [isModalEditarSetorOpen, setIsModalEditarSetorOpen] = useState(false);
  const [setorEmEdicao, setSetorEmEdicao] = useState<Setor | null>(null);
  const [editSetorNome, setEditSetorNome] = useState("");
  const [editSetorQtd, setEditSetorQtd] = useState("");
  const [salvandoEdicaoSetor, setSalvandoEdicaoSetor] = useState(false);
  const [erroEdicaoSetor, setErroEdicaoSetor] = useState<string | null>(null);

  // --- Exclusão de setor ---
  const [excluindoSetorId, setExcluindoSetorId] = useState<number | null>(null);

  useEffect(() => {
    if (carregandoAuth) return;
    if (!empresaId) return;

    async function buscarMembros() {
      try {
        setCarregando(true);
        setErro(null);

        const res = await fetch(`${API_URL}/api/empresas/${empresaId}/membros`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setErro("Sua sessão expirou ou você não tem permissão para ver estes colaboradores.");
          } else {
            setErro("Não foi possível carregar os colaboradores.");
          }
          return;
        }

        const data: Membro[] = await res.json();
        setMembros(data);
      } catch (e) {
        console.error("DEBUG — erro de rede/CORS:", e);
        setErro("Não foi possível conectar ao servidor.");
      } finally {
        setCarregando(false);
      }
    }

    buscarMembros();
    buscarSetores();
  }, [empresaId, token, carregandoAuth]);

  async function buscarSetores() {
    try {
      setCarregandoSetores(true);
      const res = await fetch(`${API_URL}/api/empresas/${empresaId}/setores`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) return;
      const data: Setor[] = await res.json();
      setSetores(data);
    } catch (e) {
      console.error("DEBUG — erro ao buscar setores:", e);
    } finally {
      setCarregandoSetores(false);
    }
  }

  const membrosVisiveis = membros.slice(0, LIMITE_COLABORADORES_VISIVEIS);
  const temMaisColaboradores = membros.length > LIMITE_COLABORADORES_VISIVEIS;

  const irParaTodosColaboradores = () => {
    router.push(`/empresas/${empresaId}/colaboradores/todos`);
  };

  const abrirModalEditar = (membro: Membro) => {
    setModo("editar");
    setSelectedMembro(membro);
    setCargo(membro.cargoNome);
    setSetorId(String(membro.setorId ?? ""));
    setErroMembro(null);
    setIsModalOpen(true);
  };

  const abrirModalVisualizar = (membro: Membro) => {
    setModo("visualizar");
    setSelectedMembro(membro);
    setCargo(membro.cargoNome);
    setSetorId(String(membro.setorId ?? ""));
    setErroMembro(null);
    setIsModalOpen(true);
  };

  const salvarMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMembro) return;

    if (!setorId) {
      setErroMembro("Selecione um setor.");
      return;
    }

    setSalvandoMembro(true);
    setErroMembro(null);

    try {
      const res = await fetch(
        `${API_URL}/api/empresas/${empresaId}/membros/${selectedMembro.id}/setor`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ setorId: Number(setorId) }),
        }
      );

      if (!res.ok) {
        let mensagem = "Não foi possível atualizar o setor deste colaborador.";
        try {
          const corpo = await res.text();
          const json = JSON.parse(corpo);
          mensagem = json?.mensagem || json?.message || json?.title || json?.erro || mensagem;
        } catch {
          /* corpo não é JSON, mantém mensagem padrão */
        }
        setErroMembro(mensagem);
        return;
      }

      const setorEscolhido = setores.find((s) => String(s.id) === setorId);
      setMembros(
        membros.map((m) =>
          m.id === selectedMembro.id
            ? {
                ...m,
                setorId: setorEscolhido ? setorEscolhido.id : m.setorId,
                setorNome: setorEscolhido ? setorEscolhido.nome : m.setorNome,
              }
            : m
        )
      );
      setIsModalOpen(false);
    } catch (e) {
      console.error("DEBUG — erro de rede/CORS ao atualizar setor do membro:", e);
      setErroMembro("Não foi possível conectar ao servidor.");
    } finally {
      setSalvandoMembro(false);
    }
  };

  const excluirMembro = (id: number) => {
    if (confirm("Tem certeza que deseja remover este colaborador?")) {
      // TODO: chamar DELETE `${API_URL}/api/empresas/${empresaId}/membros/{id}`
      setMembros(membros.filter((m) => m.id !== id));
    }
  };

  const criarSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoSetorNome.trim()) {
      setErroSetor("Informe o nome do setor.");
      return;
    }

    setCriandoSetor(true);
    setErroSetor(null);

    const payload = {
      nome: novoSetorNome,
      quantidadeColaboradores: novoSetorQtd ? Number(novoSetorQtd) : 0,
    };

    // DEBUG SETOR — remova depois de identificar a causa real do erro
    console.log("DEBUG SETOR — enviando payload:", payload);
    console.log("DEBUG SETOR — URL:", `${API_URL}/api/empresas/${empresaId}/setores`);
    console.log("DEBUG SETOR — token presente?", Boolean(token));

    try {
      const res = await fetch(`${API_URL}/api/empresas/${empresaId}/setores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // DEBUG SETOR — sempre lê o corpo bruto antes de decidir o que fazer
      const corpo = await res.text();
      console.log("DEBUG SETOR — status HTTP:", res.status);
      console.log("DEBUG SETOR — corpo da resposta:", corpo);

      if (!res.ok) {
        let mensagem = "Não foi possível criar o setor agora. Tente novamente.";
        try {
          const json = JSON.parse(corpo);
          // cobre variações comuns de nome de campo de erro vindas do backend
          mensagem = json?.mensagem || json?.message || json?.title || json?.erro || mensagem;
          // se vier lista de erros de validação (padrão ASP.NET), mostra o primeiro
          if (json?.errors && typeof json.errors === "object") {
            const primeiraChave = Object.keys(json.errors)[0];
            const primeiroErro = primeiraChave && json.errors[primeiraChave]?.[0];
            if (primeiroErro) mensagem = primeiroErro;
          }
        } catch {
          /* corpo não é JSON, mantém mensagem padrão */
        }
        setErroSetor(mensagem);
        return;
      }

      const novoSetor: Setor = corpo ? JSON.parse(corpo) : payload;
      setSetores((prev) => [...prev, novoSetor]);
      setNovoSetorNome("");
      setNovoSetorQtd("");
      setIsModalSetorOpen(false);
    } catch (e) {
      console.error("DEBUG SETOR — erro de rede/CORS:", e);
      setErroSetor("Não foi possível conectar ao servidor.");
    } finally {
      setCriandoSetor(false);
    }
  };

  const abrirModalEditarSetor = (setor: Setor) => {
    setSetorEmEdicao(setor);
    setEditSetorNome(setor.nome);
    setEditSetorQtd(String(setor.quantidadeColaboradores ?? 0));
    setErroEdicaoSetor(null);
    setIsModalEditarSetorOpen(true);
  };

  const editarSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorEmEdicao) return;

    if (!editSetorNome.trim()) {
      setErroEdicaoSetor("Informe o nome do setor.");
      return;
    }

    setSalvandoEdicaoSetor(true);
    setErroEdicaoSetor(null);

    const payload = {
      nome: editSetorNome,
      quantidadeColaboradores: editSetorQtd ? Number(editSetorQtd) : 0,
    };

    try {
      const res = await fetch(
        `${API_URL}/api/empresas/${empresaId}/setores/${setorEmEdicao.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const corpo = await res.text();

      if (!res.ok) {
        let mensagem = "Não foi possível atualizar o setor agora. Tente novamente.";
        try {
          const json = JSON.parse(corpo);
          mensagem = json?.mensagem || json?.message || json?.title || json?.erro || mensagem;
          if (json?.errors && typeof json.errors === "object") {
            const primeiraChave = Object.keys(json.errors)[0];
            const primeiroErro = primeiraChave && json.errors[primeiraChave]?.[0];
            if (primeiroErro) mensagem = primeiroErro;
          }
        } catch {
          /* corpo não é JSON, mantém mensagem padrão */
        }
        setErroEdicaoSetor(mensagem);
        return;
      }

      const setorAtualizado: Setor = corpo
        ? JSON.parse(corpo)
        : { ...setorEmEdicao, ...payload };

      setSetores((prev) =>
        prev.map((s) => (s.id === setorEmEdicao.id ? setorAtualizado : s))
      );

      // mantém coerência com nomes de setor já exibidos nos membros
      setMembros((prev) =>
        prev.map((m) =>
          m.setorId === setorEmEdicao.id
            ? { ...m, setorNome: setorAtualizado.nome }
            : m
        )
      );

      setIsModalEditarSetorOpen(false);
    } catch (e) {
      console.error("DEBUG — erro de rede/CORS ao editar setor:", e);
      setErroEdicaoSetor("Não foi possível conectar ao servidor.");
    } finally {
      setSalvandoEdicaoSetor(false);
    }
  };

  const excluirSetor = async (setor: Setor) => {
    const emUso = membros.some((m) => m.setorId === setor.id);
    if (emUso) {
      alert(
        `Não é possível remover o setor "${setor.nome}" porque há colaboradores vinculados a ele. Mova-os para outro setor antes de excluir.`
      );
      return;
    }

    if (!confirm(`Tem certeza que deseja remover o setor "${setor.nome}"?`)) {
      return;
    }

    setExcluindoSetorId(setor.id);

    try {
      const res = await fetch(
        `${API_URL}/api/empresas/${empresaId}/setores/${setor.id}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) {
        let mensagem = "Não foi possível remover o setor agora. Tente novamente.";
        try {
          const corpo = await res.text();
          const json = JSON.parse(corpo);
          mensagem = json?.mensagem || json?.message || json?.title || json?.erro || mensagem;
        } catch {
          /* corpo não é JSON, mantém mensagem padrão */
        }
        alert(mensagem);
        return;
      }

      setSetores((prev) => prev.filter((s) => s.id !== setor.id));
    } catch (e) {
      console.error("DEBUG — erro de rede/CORS ao excluir setor:", e);
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setExcluindoSetorId(null);
    }
  };

  return (
    <div className={pageStyles.page} data-theme={tema}>
      <Sidebar />

      <main className={pageStyles.main}>
        <Header tema={tema} toggleTema={toggleTema} denunciasAbertas={2} />

        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Gestão de Colaboradores</h2>
            <p className={styles.sectionSubtitle}>Visualize e gerencie os membros da empresa.</p>
          </div>
        </div>

        {carregando && <p>Carregando colaboradores...</p>}
        {erro && <p style={{ color: "var(--state-critical)" }}>{erro}</p>}

        {!carregando && !erro && (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome / Cargo</th>
                  <th>Setor</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {membrosVisiveis.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatarMini}>{m.nome.substring(0, 2).toUpperCase()}</div>
                        <div>
                          <div className={styles.empName}>{m.nome}</div>
                          <div className={styles.empRole}>{m.cargoNome}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.txtSetor}>{m.setorNome}</span></td>
                    <td>
                      <span className={`${styles.badge} ${m.proprietario ? styles.badgeGood : styles.badgeWatch}`}>
                        {m.proprietario ? "Proprietário" : "Membro"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className={styles.actionsGroup}>
                        <button className={styles.actionBtn} onClick={() => abrirModalVisualizar(m)} title="Visualizar" aria-label="Visualizar">
                          <EyeIcon />
                        </button>
                        <button className={styles.actionBtn} onClick={() => abrirModalEditar(m)} title="Editar" aria-label="Editar">
                          <EditIcon />
                        </button>
                        {!m.proprietario && (
                          <button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={() => excluirMembro(m.id)} title="Remover" aria-label="Remover">
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.tableFooterActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setIsModalSetorOpen(true)}
          >
            + Criar Setor
          </button>

          {temMaisColaboradores && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={irParaTodosColaboradores}
            >
              Ver todos ({membros.length})
            </button>
          )}
        </div>

        {/* Lista de setores criados, com edição e exclusão */}
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Setores da Empresa</h2>
            <p className={styles.sectionSubtitle}>Visualize e edite os setores cadastrados.</p>
          </div>
        </div>

        {carregandoSetores && <p>Carregando setores...</p>}

        {!carregandoSetores && setores.length === 0 && (
          <p className={styles.sectionSubtitle}>Nenhum setor cadastrado ainda.</p>
        )}

        {!carregandoSetores && setores.length > 0 && (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome do Setor</th>
                  <th>Qtd. Colaboradores</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {setores.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nome}</td>
                    <td>{s.quantidadeColaboradores}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className={styles.actionsGroup}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => abrirModalEditarSetor(s)}
                          title="Editar setor"
                          aria-label="Editar setor"
                        >
                          <EditIcon />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.btnDanger}`}
                          onClick={() => excluirSetor(s)}
                          title="Remover setor"
                          aria-label="Remover setor"
                          disabled={excluindoSetorId === s.id}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && selectedMembro && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>{modo === "editar" ? "Editar Colaborador" : "Detalhes do Colaborador"}</h3>
                <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
              </div>

              <form onSubmit={salvarMembro} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Nome Completo</label>
                  <input type="text" value={selectedMembro.nome} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" value={selectedMembro.email} disabled />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Cargo</label>
                    <input type="text" value={cargo} disabled />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Setor</label>
                    <select
                      value={setorId}
                      onChange={(e) => setSetorId(e.target.value)}
                      disabled={modo === "visualizar" || carregandoSetores || salvandoMembro}
                    >
                      <option value="">Selecione um setor</option>
                      {setores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {erroMembro && <p className="msgErro">{erroMembro}</p>}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setIsModalOpen(false)}
                    disabled={salvandoMembro}
                  >
                    {modo === "visualizar" ? "Fechar" : "Cancelar"}
                  </button>
                  {modo === "editar" && (
                    <button type="submit" className={styles.primaryButton} disabled={salvandoMembro}>
                      {salvandoMembro ? "Salvando..." : "Salvar Alterações"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {isModalSetorOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Criar Setor</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => {
                    setIsModalSetorOpen(false);
                    setErroSetor(null);
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={criarSetor} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Nome do Setor</label>
                  <input
                    type="text"
                    placeholder="Ex: Financeiro, Comercial, TI..."
                    value={novoSetorNome}
                    onChange={(e) => setNovoSetorNome(e.target.value)}
                    disabled={criandoSetor}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Quantidade de Colaboradores (estimada)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 5"
                    value={novoSetorQtd}
                    onChange={(e) => setNovoSetorQtd(e.target.value)}
                    disabled={criandoSetor}
                  />
                </div>

                {erroSetor && <p className="msgErro">{erroSetor}</p>}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setIsModalSetorOpen(false);
                      setErroSetor(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.primaryButton} disabled={criandoSetor}>
                    {criandoSetor ? "Criando..." : "Criar Setor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isModalEditarSetorOpen && setorEmEdicao && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Editar Setor</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => {
                    setIsModalEditarSetorOpen(false);
                    setErroEdicaoSetor(null);
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={editarSetor} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Nome do Setor</label>
                  <input
                    type="text"
                    placeholder="Ex: Financeiro, Comercial, TI..."
                    value={editSetorNome}
                    onChange={(e) => setEditSetorNome(e.target.value)}
                    disabled={salvandoEdicaoSetor}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Quantidade de Colaboradores (estimada)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 5"
                    value={editSetorQtd}
                    onChange={(e) => setEditSetorQtd(e.target.value)}
                    disabled={salvandoEdicaoSetor}
                  />
                </div>

                {erroEdicaoSetor && <p className="msgErro">{erroEdicaoSetor}</p>}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setIsModalEditarSetorOpen(false);
                      setErroEdicaoSetor(null);
                    }}
                    disabled={salvandoEdicaoSetor}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.primaryButton} disabled={salvandoEdicaoSetor}>
                    {salvandoEdicaoSetor ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}