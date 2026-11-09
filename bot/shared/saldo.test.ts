import { test } from "node:test";
import assert from "node:assert/strict";
import { agotoBusquedas, agotoNeuronas, hastaElDiaSiguiente } from "./saldo.ts";

test("reconoce el error de Workers AI cuando se acaban las neuronas del día", () => {
  assert.equal(
    agotoNeuronas(
      new Error(
        "3036: You have used up your daily free allocation of 10,000 neurons. Please upgrade to Cloudflare's Workers Paid plan if you would like to continue usage.",
      ),
    ),
    true,
  );
  assert.equal(agotoNeuronas(new Error("AiError: 3036")), true);
  assert.equal(agotoNeuronas(new Error("You have used up your daily free allocation of 10,000 neurons.")), true);
  assert.equal(agotoNeuronas(new Error("3040: Capacity temporarily exceeded, please try again.")), false);
  assert.equal(agotoNeuronas("3036"), false);
});

test("reconoce cuando Tavily dice que se acabó el plan", () => {
  assert.deepEqual([429, 432, 433, 500].map(agotoBusquedas), [false, true, true, false]);
});

test("sin saldo se espera hasta las 00:00 UTC, cuando Workers AI renueva las neuronas", () => {
  assert.equal(hastaElDiaSiguiente(Date.parse("2026-10-11T23:00:00Z")), 60 * 60 * 1000);
  assert.equal(hastaElDiaSiguiente(Date.parse("2026-12-31T23:59:59Z")), 1000);
  assert.equal(hastaElDiaSiguiente(Date.parse("2026-10-11T00:00:00Z")), 24 * 60 * 60 * 1000);
});
