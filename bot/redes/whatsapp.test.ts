import { test } from "node:test";
import assert from "node:assert/strict";
import { firmaValida, mencionesDeWebhook } from "./whatsapp.ts";

const webhook = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "102290129340398",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "56912345678", phone_number_id: "106540352242922" },
            contacts: [{ profile: { name: "Ana" }, wa_id: "56987654321" }],
            messages: [
              {
                from: "56987654321",
                id: "wamid.HBgLNTY5ODc2NTQzMjEVAgASGBQzQTdGRjQ5",
                timestamp: "1760990000",
                type: "text",
                text: { body: "Reenviado: el sueldo mínimo en Chile sube a 600 mil pesos en enero" },
              },
              { from: "56987654321", id: "wamid.audio", timestamp: "1760990001", type: "audio", audio: { id: "1" } },
            ],
          },
        },
      ],
    },
  ],
};

test("cada mensaje de texto del webhook es una mención; el resto se ignora", () => {
  assert.deepEqual(mencionesDeWebhook(webhook), [
    {
      razon: "mention",
      uri: "whatsapp:106540352242922:56987654321:wamid.HBgLNTY5ODc2NTQzMjEVAgASGBQzQTdGRjQ5",
      cid: "",
      autorDid: "whatsapp:56987654321",
      texto: "Reenviado: el sueldo mínimo en Chile sube a 600 mil pesos en enero",
    },
  ]);
});

test("un aviso de entrega (sin mensajes) o un cuerpo que no es webhook no trae menciones", () => {
  const estado = { entry: [{ changes: [{ value: { metadata: { phone_number_id: "1" }, statuses: [{}] } }] }] };
  assert.deepEqual(mencionesDeWebhook(estado), []);
  assert.deepEqual(mencionesDeWebhook({ hola: "mundo" }), []);
});

test("la firma de Meta se acepta solo si es el HMAC del cuerpo con el secreto", async () => {
  const firma = "sha256=c08122dffceb49d941efaa39bd6dd6be92b790e4c622a270e09140339aeb44e5";
  assert.equal(await firmaValida('{"entry":[]}', firma, "secreto-de-prueba"), true);
  assert.equal(await firmaValida('{"entry":[1]}', firma, "secreto-de-prueba"), false);
  assert.equal(await firmaValida('{"entry":[]}', firma, "otro-secreto"), false);
  assert.equal(await firmaValida('{"entry":[]}', "", "secreto-de-prueba"), false);
});
