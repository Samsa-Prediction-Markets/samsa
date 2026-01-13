const fs = require('fs').promises;

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw || '[]');
}

async function writeJson(filePath, data) {
  const serialized = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, serialized, 'utf-8');
}

async function addTransaction(filePath, tx) {
  let list = [];
  try {
    list = await readJson(filePath);
  } catch (e) {
    list = [];
  }
  list.push(tx);
  await writeJson(filePath, list);
  return tx;
}

async function findTransactionByExternalId(filePath, externalId) {
  let list = [];
  try {
    list = await readJson(filePath);
  } catch (e) {
    list = [];
  }
  return list.find((t) => t.external_id === externalId) || null;
}

async function updateTransaction(filePath, id, patch) {
  let list = [];
  try {
    list = await readJson(filePath);
  } catch (e) {
    list = [];
  }
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated = { ...list[idx], ...patch };
  list[idx] = updated;
  await writeJson(filePath, list);
  return updated;
}

module.exports = { readJson, writeJson, addTransaction, findTransactionByExternalId, updateTransaction };
