const canUseStorage = () =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const safeStorageGet = (key: string, context = 'cache') => {
  if (!canUseStorage()) return null;
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Failed to read ${context}:`, err);
    return null;
  }
};

export const safeStorageSet = (key: string, value: string, context = 'cache') => {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`Failed to write ${context}:`, err);
  }
};

export const safeStorageRemove = (key: string, context = 'cache') => {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Failed to clear ${context}:`, err);
  }
};
