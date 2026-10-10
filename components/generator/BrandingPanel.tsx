"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";

import { sectionTitle, smallButton } from "@/components/generator/panel-styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LOGO_TYPES,
  MAX_LOGO_BYTES,
  PRESET_ACCENTS,
  brandingSchema,
  isHexColor,
  type Branding,
} from "@/lib/branding";

type BrandingPanelProps = {
  value: Branding;
  onLogoChange: (logo: string | null) => void;
  onAccentChange: (accent: string) => void;
};

const TYPE_ERROR = "Use a PNG, JPEG, WebP, or SVG image";
const SIZE_ERROR = "Choose an image under 256 KB";
const READ_ERROR = "Couldn't read that file. Try another.";
const HEX_ERROR = "Enter a hex color like #8B5CF6";

function formatKilobytes(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function BrandingPanel({ value, onLogoChange, onAccentChange }: BrandingPanelProps) {
  const [logoFile, setLogoFile] = useState<{ name: string; size: number } | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [hexText, setHexText] = useState(value.colors.accent);
  const [hexTouched, setHexTouched] = useState(false);

  function pickLogo(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Reset so choosing the same file again still fires a change.
    input.value = "";
    if (!file) return;

    if (!(LOGO_TYPES as readonly string[]).includes(file.type)) return setLogoError(TYPE_ERROR);
    if (file.size > MAX_LOGO_BYTES) return setLogoError(SIZE_ERROR);

    const reader = new FileReader();
    reader.onload = () => {
      const logo = reader.result;
      const valid =
        typeof logo === "string" &&
        brandingSchema.shape.logo.safeParse(logo).success;
      if (!valid) return setLogoError(READ_ERROR);
      setLogoError(null);
      setLogoFile({ name: file.name, size: file.size });
      onLogoChange(logo);
    };
    reader.onerror = () => setLogoError(READ_ERROR);
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoError(null);
    setLogoFile(null);
    onLogoChange(null);
  }

  function chooseAccent(accent: string) {
    setHexText(accent);
    setHexTouched(false);
    onAccentChange(accent);
  }

  function typeHex(text: string) {
    setHexText(text);
    if (isHexColor(text)) onAccentChange(text.toUpperCase());
  }

  const hexError = hexTouched && !isHexColor(hexText) ? HEX_ERROR : null;
  const accent = value.colors.accent.toUpperCase();

  return (
    <section aria-labelledby="form-branding" className="flex flex-col gap-4 border-b border-border p-4">
      <h2 id="form-branding" className={sectionTitle}>
        Branding
      </h2>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Logo</span>
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-ticket-paper">
            {value.logo ? (
              <Image
                src={value.logo}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="max-h-10 w-auto max-w-10 object-contain"
              />
            ) : (
              <span aria-hidden className="font-mono text-[10px] text-ticket-muted">
                LOGO
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {value.logo && logoFile ? (
              <>
                <p className="truncate text-sm">{logoFile.name}</p>
                <p className="font-mono text-xs text-faint">{formatKilobytes(logoFile.size)}</p>
              </>
            ) : value.logo ? (
              // Restored from storage or reopened from history: no file details.
              <p className="text-sm">Saved logo</p>
            ) : (
              <p className="text-xs text-faint">PNG, JPEG, WebP, or SVG up to 256 KB</p>
            )}
          </div>
          <label className={`${smallButton} has-focus-visible:outline-2 has-focus-visible:outline-accent`}>
            {value.logo ? "Replace" : "Upload"}
            <input
              type="file"
              accept={LOGO_TYPES.join(",")}
              aria-label={value.logo ? "Replace logo" : "Upload logo"}
              aria-invalid={logoError ? true : undefined}
              aria-describedby={logoError ? "field-logo-error" : undefined}
              onChange={pickLogo}
              className="sr-only"
            />
          </label>
          {value.logo && (
            <button type="button" onClick={removeLogo} className={smallButton}>
              Remove
            </button>
          )}
        </div>
        {logoError && (
          <p id="field-logo-error" className="text-xs text-danger">
            {logoError}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-xs text-muted-foreground">Accent color</legend>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_ACCENTS.map((preset) => (
            <label
              key={preset}
              className="cursor-pointer rounded-full p-0.5 ring-border-strong has-checked:ring-2 has-checked:ring-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="accent"
                value={preset}
                aria-label={preset}
                checked={accent === preset}
                onChange={() => chooseAccent(preset)}
                // An already-checked radio fires no change event; clicking it must
                // still restore its hex value after an invalid edit.
                onClick={() => chooseAccent(preset)}
                className="sr-only"
              />
              <span
                aria-hidden
                className="block size-6 rounded-full outline-1 outline-border-strong"
                style={{ backgroundColor: preset }}
              />
            </label>
          ))}
          <div className="ml-auto flex w-28 flex-col gap-1">
            <Label htmlFor="field-accent-hex" className="sr-only">
              Accent hex
            </Label>
            <Input
              id="field-accent-hex"
              value={hexText}
              onChange={(event) => typeHex(event.target.value)}
              onBlur={() => setHexTouched(true)}
              aria-invalid={hexError ? true : undefined}
              aria-describedby={hexError ? "field-accent-hex-error" : undefined}
              spellCheck={false}
              className="h-[30px] bg-bg font-mono text-xs uppercase aria-invalid:bg-danger/10 dark:bg-bg dark:aria-invalid:bg-danger/10"
            />
          </div>
        </div>
        {hexError && (
          <p id="field-accent-hex-error" className="text-xs text-danger">
            {hexError}
          </p>
        )}
      </fieldset>
    </section>
  );
}
