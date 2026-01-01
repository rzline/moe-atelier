const normalizeImageUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^data:image\//i.test(trimmed)) return trimmed;
  const imagePrefixMatch = trimmed.match(
    /^(?:[a-z0-9.+-]+:)?(image\/[a-z0-9.+-]+;base64,)/i
  );
  if (imagePrefixMatch) {
    return `data:${imagePrefixMatch[1]}${trimmed.slice(imagePrefixMatch[0].length)}`;
  }
  const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
  if (base64Pattern.test(trimmed)) {
    return `data:image/png;base64,${trimmed}`;
  }
  return null;
};

export const parseMarkdownImage = (text: string): string | null => {
  const mdImageRegex = /!\[.*?\]\((.*?)\)/;
  const match = text.match(mdImageRegex);
  if (match && match[1]) return match[1];
  return normalizeImageUrl(text);
};

const extractImageFromMessage = (message: any): string | null => {
  if (!message) return null;
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part?.type === 'image_url') {
        const url = part?.image_url?.url || part?.image_url;
        if (url) return url;
      }
      if (part?.type === 'text' && typeof part.text === 'string') {
        const imageUrl = parseMarkdownImage(part.text);
        if (imageUrl) return imageUrl;
      }
    }
  }
  if (typeof message.content === 'string') {
    const imageUrl = parseMarkdownImage(message.content);
    if (imageUrl) return imageUrl;
  }
  if (typeof message.reasoning_content === 'string') {
    const imageUrl = parseMarkdownImage(message.reasoning_content);
    if (imageUrl) return imageUrl;
  }
  return null;
};

export const resolveImageFromResponse = (data: any): string | null => {
  const resultUrl = data?.resultUrl ?? data?.result_url;
  if (typeof resultUrl === 'string') {
    const normalized = normalizeImageUrl(resultUrl);
    return normalized || resultUrl;
  }
  const fromDataArray = data?.data?.[0];
  if (fromDataArray) {
    if (typeof fromDataArray === 'string') {
      const normalized = normalizeImageUrl(fromDataArray);
      return normalized || fromDataArray;
    }
    if (fromDataArray.url) {
      const normalized = normalizeImageUrl(fromDataArray.url);
      return normalized || fromDataArray.url;
    }
    if (fromDataArray.b64_json) {
      return `data:image/png;base64,${fromDataArray.b64_json}`;
    }
  }
  return extractImageFromMessage(data?.choices?.[0]?.message);
};
