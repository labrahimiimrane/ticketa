import QRCode from "qrcode";

const QUIET_ZONE = 4;

type TicketQrProps = {
  value: string;
};

export default function TicketQr({ value }: TicketQrProps) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const viewSize = modules.size + QUIET_ZONE * 2;

  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) path += `M${col} ${row}h1v1h-1z`;
    }
  }

  return (
    <svg
      role="img"
      aria-label={`QR code for ticket ${value}`}
      viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${viewSize} ${viewSize}`}
      shapeRendering="crispEdges"
      className="size-full fill-ticket-ink"
    >
      <path d={path} />
    </svg>
  );
}
