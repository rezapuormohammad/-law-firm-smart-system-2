export const backupToCloudDelta = async () => {};
export const syncFullStateToCloud = async (userId: string, data: any) => {
  localStorage.setItem(`virtual_cloud_backup_${userId}`, JSON.stringify(data));
};
export const restoreFromCloud = async (userId: string) => {
  const data = localStorage.getItem(`virtual_cloud_backup_${userId}`);
  if (data) return JSON.parse(data);
  return null;
};
