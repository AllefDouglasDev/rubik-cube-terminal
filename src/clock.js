// Relógio monotônico em ms; Date.now() pode pular com ajuste de NTP.
export const now = () => Number(process.hrtime.bigint()) / 1e6;
