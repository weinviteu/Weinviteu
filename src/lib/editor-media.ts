export async function readMediaFile(file: File, kind: 'image' | 'audio'): Promise<string> {
  const limit = kind === 'image' ? 5 : 10;
  if (!file.size || file.size > limit * 1024 * 1024 || !(kind === 'image' ? /^image\/(png|jpeg|webp|gif)$/ : /^audio\/[\w.+-]+$/).test(file.type)) {
    throw new Error(`Choose ${kind === 'image' ? 'a PNG, JPEG, WebP or GIF' : 'an audio file'} under ${limit} MB.`);
  }
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read this file. Please retry.'));
    reader.readAsDataURL(file);
  });
  await new Promise<void>((resolve, reject) => {
    const media = kind === 'image' ? new Image() : new Audio();
    const cleanup = () => { clearTimeout(timer); media.onload = null; media.onerror = null; if (media instanceof HTMLAudioElement) { media.onloadedmetadata = null; media.removeAttribute('src'); media.load(); } };
    const success = () => { cleanup(); resolve(); };
    const failure = () => { cleanup(); reject(new Error(`This ${kind === 'image' ? 'image' : 'audio file'} could not be decoded. Try ${kind === 'image' ? 'a different JPEG or PNG' : 'an MP3 or WAV file'}.`)); };
    const timer = setTimeout(failure, 15000);
    media.onerror = failure;
    if (media instanceof HTMLImageElement) media.onload = success;
    else { media.preload = 'metadata'; media.onloadedmetadata = success; }
    media.src = data;
  });
  return data;
}
