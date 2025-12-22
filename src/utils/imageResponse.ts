export const parseMarkdownImage = (text: string): string | null => {
  const mdImageRegex = /!\[.*?\]\((.*?)\)/;
  const match = text.match(mdImageRegex);
  if (match && match[1]) return match[1];
  if (text.startsWith('http') || text.startsWith('data:image')) return text;
  return null;
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
  const fromDataArray = data?.data?.[0];
  if (fromDataArray) {
    if (typeof fromDataArray === 'string') return fromDataArray;
    if (fromDataArray.url) return fromDataArray.url;
    if (fromDataArray.b64_json) {
      return `data:image/png;base64,${fromDataArray.b64_json}`;
    }
  }
  return extractImageFromMessage(data?.choices?.[0]?.message);
};
