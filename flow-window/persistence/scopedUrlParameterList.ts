import { globalUrlParameters } from '$xstate/persistence/globalUrlParameters';

export class ScopedUrlParameterList {
  public prefix: string;
  public position: string;

  constructor(position: string) {
    globalUrlParameters.parseFromUrl();
    this.position = position;
    this.prefix = `${position}.`;
  }

  private stripPrefix(key: string): string {
    return key.replace(`${this.prefix}`, '');
  }

  setGlobalParam(key: string, value: string | undefined): void {
    if (value === undefined) {
      globalUrlParameters.delete('', key);
      return;
    }
    globalUrlParameters.setParameter('', key, value);
  }

  getGlobalParam(key: string): string | undefined {
    return globalUrlParameters.getParameter('', key);
  }

  setParam(key: string, value: string | undefined): void {
    if (value === undefined) {
      globalUrlParameters.delete(this.prefix, key);
      return;
    }
    globalUrlParameters.setParameter(this.prefix, key, value);
  }

  getAllParams(): Record<string, string> {
    const params: Record<string, string> = {};

    const allParameters = globalUrlParameters.getAllParameters(this.prefix);
    for (const key in allParameters) {
      const value = allParameters[key];
      if (value === undefined) {
        continue;
      }
      params[this.stripPrefix(key)] = value;
    }

    return params;
  }

  toString(): string {
    const baseUrl = new URL(window.location.href);
    return `${baseUrl.pathname}?${globalUrlParameters.toString()}`;
  }

  deleteKey(propertiesKey: string): void {
    globalUrlParameters.delete(this.prefix, propertiesKey);
  }

  deleteGlobalKey(windowId: string): void {
    globalUrlParameters.delete('', windowId);
  }
}
