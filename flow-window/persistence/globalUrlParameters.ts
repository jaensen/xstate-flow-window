import { browser } from '$app/environment';

const parameters: Record<string, string> = {};

export const globalUrlParameters = {
  parseFromUrl: (): void => {
    if (!browser) {
      return;
    }
    const url = new URL(window.location.href);
    const params = url.searchParams;
    for (const [key, value] of params.entries()) {
      parameters[key] = value;
    }
  },
  setParameter: (prefix: string, key: string, value: string): void => {
    parameters[`${prefix}${key}`] = value;
  },
  getParameter: (prefix: string, key: string): string | undefined => parameters[`${prefix}${key}`],
  getAllParameters: (prefix: string): Record<string, string> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = {};
    for (const key in parameters) {
      if (key.startsWith(prefix)) {
        params[key.substring(prefix.length)] = parameters[key];
      }
    }
    return params;
  },
  delete: (prefix: string, key: string): void => {
    if (`${prefix}${key}` in parameters) {
      delete parameters[`${prefix}${key}`];
    }
  },
  toString: (): string => {
    const params = new URLSearchParams();
    for (const key in parameters) {
      const value = parameters[key];
      if (value) {
        params.set(key, value);
      }
    }
    return params.toString();
  }
};
