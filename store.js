// Camada de dados: Supabase para compartilhar contagens e recados entre visitantes.
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";

export const ITENS_IDS = ["camisa-curta", "camisa-longa", "gravata", "calca"];
const configurado =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("COLE_AQUI") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("COLE_AQUI");

export async function abrirStore() {
  if (configurado) return storeSupabase();
  console.warn("Supabase ainda não configurado; usando modo local neste navegador.");
  return storeLocal();
}

function storeSupabase() {
  const url = SUPABASE_URL.replace(/\/$/, "");
  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json"
  };
  async function request(path, options = {}) {
    const response = await fetch(url + "/rest/v1/" + path, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error("Supabase " + response.status + ": " + detail);
    }
    if (response.status === 204) return null;
    return response.json();
  }
  const paraData = (v) => v ? new Date(v) : new Date();
  return {
    modo: "supabase",
    onContagens(cb) {
      let ativo = true;
      const atualizar = async () => {
        try {
          const rows = await request("itens?select=id,count");
          if (!ativo) return;
          const counts = {};
          rows.forEach((r) => { counts[r.id] = Math.max(0, Number(r.count) || 0); });
          cb(counts);
        } catch (e) { console.warn("Não foi possível carregar as contagens do Supabase.", e); }
      };
      atualizar();
      const timer = setInterval(atualizar, 5000);
      return () => { ativo = false; clearInterval(timer); };
    },
    async ajustar(id, delta) {
      if (!ITENS_IDS.includes(id) || ![-1, 1].includes(delta)) throw new Error("Item ou alteração inválida.");
      await request("rpc/ajustar_item", {
        method: "POST",
        body: JSON.stringify({ p_item_id: id, p_delta: delta })
      });
    },
    onRecados(cb) {
      let ativo = true;
      const atualizar = async () => {
        try {
          const rows = await request("recados?select=nome,texto,created_at&order=created_at.desc&limit=40");
          if (!ativo) return;
          cb(rows.map((r) => ({ nome: String(r.nome || ""), texto: String(r.texto || ""), quando: paraData(r.created_at) })));
        } catch (e) { console.warn("Não foi possível carregar os recados do Supabase.", e); }
      };
      atualizar();
      const timer = setInterval(atualizar, 10000);
      return () => { ativo = false; clearInterval(timer); };
    },
    async enviarRecado(nome, texto) {
      await request("recados", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ nome: nome.slice(0, 40), texto: texto.slice(0, 280) })
      });
    }
  };
}

// Fallback temporário para teste local até configurar o Supabase.
function storeLocal() {
  const K1 = "cha:teste:contagens", K2 = "cha:teste:recados";
  const ler = (k, pad) => { try { return JSON.parse(localStorage.getItem(k)) || pad; } catch (e) { return pad; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let contagens = ler(K1, {}), recados = ler(K2, []);
  const ouvintes1 = [], ouvintes2 = [];
  const avisar1 = () => ouvintes1.forEach((f) => f({ ...contagens }));
  const avisar2 = () => ouvintes2.forEach((f) => f(recados.map((r) => ({ ...r, quando: new Date(r.quando) }))));
  return {
    modo: "local",
    onContagens(cb) { ouvintes1.push(cb); setTimeout(() => cb({ ...contagens }), 0); return () => ouvintes1.splice(ouvintes1.indexOf(cb), 1); },
    async ajustar(id, delta) { contagens[id] = Math.max(0, (contagens[id] || 0) + delta); gravar(K1, contagens); avisar1(); },
    onRecados(cb) { ouvintes2.push(cb); setTimeout(avisar2, 0); return () => ouvintes2.splice(ouvintes2.indexOf(cb), 1); },
    async enviarRecado(nome, texto) { recados.unshift({ nome, texto, quando: new Date().toISOString() }); recados = recados.slice(0, 40); gravar(K2, recados); avisar2(); }
  };
}
