require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.post("/api/create_preference", async (req, res) => {
  try {
    if (!ACCESS_TOKEN || ACCESS_TOKEN.includes("COLE_AQUI")) {
      return res.status(500).json({ error: "Configure MP_ACCESS_TOKEN no ambiente do Render" });
    }

    const { items, externalReference } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido." });
    }

    const preference = {
      items: items.map(item => ({
        title: String(item.title || "Item R.A.S.A."),
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        currency_id: item.currency_id || "BRL"
      })),
      external_reference: externalReference || `RASA-${Date.now()}`
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago error:", data);
      return res.status(response.status).json({
        error: data.message || data.error || "Erro ao criar preferência.",
        details: data
      });
    }

    return res.json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point
    });
  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({ error: "Erro interno ao criar checkout." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Checkout server rodando em http://localhost:${PORT}`);
});
