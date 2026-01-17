export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("File read error"));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}
