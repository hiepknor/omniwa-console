export function createCommandKeyStore(randomUUID: () => string = () => crypto.randomUUID()) {
  let current: { signature: string; key: string } | undefined;
  return {
    for: (signature: string) => {
      if (!current || current.signature !== signature) current = { signature, key: randomUUID() };
      return current.key;
    },
    clear: () => { current = undefined; },
  };
}

export type CommandKeyStore = ReturnType<typeof createCommandKeyStore>;
