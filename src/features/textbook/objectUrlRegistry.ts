interface ObjectUrlApi {
  createObjectURL(value: Blob | MediaSource): string;
  revokeObjectURL(url: string): void;
}

export interface ObjectUrlRegistry {
  create(key: string, value: Blob | MediaSource): string;
  release(key: string): void;
  releaseAll(): void;
}

export const createObjectUrlRegistry = (urlApi: ObjectUrlApi = URL): ObjectUrlRegistry => {
  const urls = new Map<string, string>();
  const release = (key: string) => {
    const url = urls.get(key);
    if (!url) return;
    urls.delete(key);
    urlApi.revokeObjectURL(url);
  };

  return {
    create: (key, value) => {
      release(key);
      const url = urlApi.createObjectURL(value);
      urls.set(key, url);
      return url;
    },
    release,
    releaseAll: () => {
      [...urls.keys()].forEach(release);
    },
  };
};

export const materialObjectUrls = createObjectUrlRegistry();
