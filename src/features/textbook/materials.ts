export interface MaterialListItem {
  id: string;
  pageCount: number;
  sizeLabel: string;
  title: string;
  uploadedAt: string;
}

export const sampleMaterials: MaterialListItem[] = [
  {
    id: "calculus-applied",
    pageCount: 6,
    sizeLabel: "23.4 MB",
    title: "微分積分学（偏微分から応用）.pdf",
    uploadedAt: "2024/05/12",
  },
  {
    id: "linear-math",
    pageCount: 6,
    sizeLabel: "18.7 MB",
    title: "線形代数学入門 第3版.pdf",
    uploadedAt: "2024/05/10",
  },
  {
    id: "multi-analysis",
    pageCount: 6,
    sizeLabel: "15.2 MB",
    title: "多変量解析の基礎.pdf",
    uploadedAt: "2024/05/08",
  },
];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

export const formatMaterialSize = (bytes: number) => {
  const megabytes = bytes / (1024 * 1024);
  return `${Math.max(megabytes, 0.01).toFixed(1)} MB`;
};

export const createMaterialFromFile = (
  file: File,
  id: string,
  uploadedAt = new Date(),
): MaterialListItem => ({
  id,
  pageCount: 6,
  sizeLabel: formatMaterialSize(file.size),
  title: file.name,
  uploadedAt: formatDate(uploadedAt),
});
