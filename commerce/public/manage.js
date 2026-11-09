const editor = document.querySelector('.editor');
const input = editor?.querySelector('[name="photo"]');
const submit = editor?.querySelector('button[type="submit"]');

input?.addEventListener('change', () => input.setCustomValidity(''));
editor?.addEventListener('submit', async event => {
  const file = input.files[0];
  if (!file || file.size <= 1_000_000) return;
  event.preventDefault();
  submit.disabled = true;
  try {
    const image = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();

    const photo = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78));
    if (!photo || photo.size > 1_000_000) throw new Error('Resize failed');
    if (input.files[0] !== file) return;
    const selection = new DataTransfer();
    selection.items.add(new File([photo], 'listing.jpg', { type: 'image/jpeg' }));
    input.files = selection.files;
    submit.disabled = false;
    editor.requestSubmit(submit);
  } catch {
    if (input.files[0] !== file) return;
    input.setCustomValidity('This photo could not be resized. Choose a smaller JPEG, PNG, or WebP.');
    input.reportValidity();
  } finally {
    submit.disabled = false;
  }
});
