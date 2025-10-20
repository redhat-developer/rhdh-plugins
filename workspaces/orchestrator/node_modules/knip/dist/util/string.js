export const truncate = (text, width) => text.length > width ? `${text.slice(0, width - 3)}...` : text;
