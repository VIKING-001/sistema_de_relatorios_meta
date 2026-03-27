/**
 * Parser de números em formato brasileiro
 * Reconhece formatos como:
 * - 1.000 (mil)
 * - 1.000.800 (um milhão e oitocentos mil)
 * - 1.000.800,50 (um milhão e oitocentos mil e cinquenta centavos)
 * - 85.380 (oitenta e cinco mil trezentos e oitenta)
 * - 80.000.384 (oitenta milhões trezentos e oitenta e quatro)
 */

export function parseBrazilianNumber(input: string | number): number {
  // Se já é um número, retorna como está
  if (typeof input === "number") {
    return input;
  }

  // Se for string vazia ou inválida
  if (!input || typeof input !== "string") {
    return 0;
  }

  // Remove espaços em branco
  let normalized = input.trim();

  // Detecta o padrão: se tem vírgula, ela é decimal
  // Se tem pontos, eles são separadores de milhares
  // Exemplo: 1.000.800,50 → 1000800.50

  // Verifica se há vírgula (decimal)
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (!hasComma && !hasDot) {
    // Apenas números, retorna como está
    return parseFloat(normalized) || 0;
  }

  if (hasComma && !hasDot) {
    // Apenas vírgula: 1000,50 → 1000.50
    return parseFloat(normalized.replace(",", ".")) || 0;
  }

  if (hasDot && !hasComma) {
    // Apenas pontos: pode ser 1.000 ou 1.000.800
    // Se o último ponto está a 3 posições do final, é separador de milhares
    const lastDotIndex = normalized.lastIndexOf(".");
    const afterLastDot = normalized.substring(lastDotIndex + 1);

    if (afterLastDot.length === 3 && /^\d{3}$/.test(afterLastDot)) {
      // É separador de milhares: 1.000 ou 1.000.800
      return parseFloat(normalized.replace(/\./g, "")) || 0;
    } else {
      // Último ponto é decimal: 1000.5
      return parseFloat(normalized) || 0;
    }
  }

  if (hasDot && hasComma) {
    // Ambos: 1.000.800,50
    // Pontos são separadores de milhares, vírgula é decimal
    const withoutThousandsSeparators = normalized.replace(/\./g, "");
    return parseFloat(withoutThousandsSeparators.replace(",", ".")) || 0;
  }

  return 0;
}

/**
 * Formata um número para o padrão brasileiro
 * 1000800.5 → 1.000.800,50
 */
export function formatBrazilianNumber(
  value: number,
  decimalPlaces: number = 2
): string {
  if (!value && value !== 0) {
    return "0";
  }

  const fixed = parseFloat(value.toString()).toFixed(decimalPlaces);
  const [integerPart, decimalPart] = fixed.split(".");

  // Formata parte inteira com separadores de milhares
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Retorna com vírgula como separador decimal
  if (decimalPlaces > 0 && decimalPart) {
    return `${formattedInteger},${decimalPart}`;
  }

  return formattedInteger;
}

/**
 * Valida se uma string é um número válido em formato brasileiro
 */
export function isValidBrazilianNumber(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  // Remove espaços
  const normalized = input.trim();

  // Verifica se contém apenas dígitos, pontos e vírgulas
  if (!/^[\d.,]+$/.test(normalized)) {
    return false;
  }

  // Tenta fazer o parse
  const parsed = parseBrazilianNumber(normalized);
  return !isNaN(parsed) && isFinite(parsed);
}

/**
 * Máscara para input de números brasileiros
 * Formata enquanto o usuário digita
 */
export function maskBrazilianNumber(input: string): string {
  // Remove tudo que não é número
  const onlyNumbers = input.replace(/\D/g, "");

  if (!onlyNumbers) {
    return "";
  }

  // Se tem mais de 2 dígitos, adiciona separadores de milhares
  if (onlyNumbers.length <= 2) {
    return onlyNumbers;
  }

  // Separa parte inteira e decimal (últimos 2 dígitos são decimais se houver)
  // Exemplo: 1000050 → 1.000.050 (sem decimal)
  // Exemplo: 100005050 → 1.000.050,50

  // Aqui vamos considerar que o usuário está digitando um inteiro
  // e aplicar separadores de milhares

  let result = "";
  let count = 0;

  for (let i = onlyNumbers.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      result = "." + result;
    }
    result = onlyNumbers[i] + result;
    count++;
  }

  return result;
}

/**
 * Máscara para input de números com decimais brasileiros
 * Formata enquanto o usuário digita
 */
export function maskBrazilianNumberWithDecimals(input: string): string {
  // Remove tudo que não é número
  const onlyNumbers = input.replace(/\D/g, "");

  if (!onlyNumbers) {
    return "";
  }

  // Últimos 2 dígitos são decimais
  if (onlyNumbers.length <= 2) {
    return "0," + onlyNumbers.padStart(2, "0");
  }

  const integerPart = onlyNumbers.slice(0, -2);
  const decimalPart = onlyNumbers.slice(-2);

  // Aplica separadores de milhares na parte inteira
  let formattedInteger = "";
  let count = 0;

  for (let i = integerPart.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      formattedInteger = "." + formattedInteger;
    }
    formattedInteger = integerPart[i] + formattedInteger;
    count++;
  }

  return `${formattedInteger},${decimalPart}`;
}
