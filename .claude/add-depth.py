#!/usr/bin/env python3
"""Add depthMm field to each phone model in phone-models.ts.

Reads the file, finds each `{ slug: "X", ... heightMm: N, cornerRadiusMm: M, ...}`
block, and inserts `depthMm: <value>` between heightMm and cornerRadiusMm.
"""
import re
import sys
import io

# Force UTF-8 output for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# Mapping slug -> depthMm (en mm). Specs publicas (apple.com, samsung.com,
# GSMArena) o estimaciones razonables para modelos de marcas con menos data.
DEPTH = {
    # Apple
    "iphone-5-se1": 7.6,
    "iphone-6-7-8-se": 7.3,
    "iphone-6-7-8-plus": 7.4,
    "iphone-x-xs-11pro": 7.7,
    "iphone-xs-max-11-pro-max": 7.7,
    "iphone-11-xr": 8.3,
    "iphone-12-13-mini": 7.4,
    "iphone-12-13-14": 7.4,
    "iphone-12-13-pro": 7.4,
    "iphone-12-13-pro-max": 7.4,
    "iphone-14-15-plus": 7.8,
    "iphone-14-15-16-pro": 8.25,
    "iphone-14-15-16-pro-max": 8.25,
    "iphone-15-16": 7.8,
    "iphone-16-plus": 7.8,
    "iphone-16e": 7.8,
    "iphone-17": 7.95,
    "iphone-17-pro": 8.7,
    "iphone-17-pro-max": 8.7,
    "iphone-17-air": 5.6,

    # Samsung
    "galaxy-j5-j5prime": 7.9,
    "galaxy-j7": 7.8,
    "galaxy-j4-j6": 8.0,
    "galaxy-j4plus-j6plus": 7.9,
    "galaxy-a04-a05": 9.1,
    "galaxy-a14-a15": 9.1,
    "galaxy-a20-a30": 7.7,
    "galaxy-a21": 8.5,
    "galaxy-a22": 8.4,
    "galaxy-a24-a25": 8.3,
    "galaxy-a32-a33": 8.4,
    "galaxy-a34-a35": 8.2,
    "galaxy-a50-a51": 7.7,
    "galaxy-a52-a53": 8.4,
    "galaxy-a54-a55": 8.2,
    "galaxy-s20-s21": 7.9,
    "galaxy-s20plus-s21plus": 7.8,
    "galaxy-s20ultra-s21ultra": 8.8,
    "galaxy-s22-s23": 7.6,
    "galaxy-s22plus-s23plus": 7.6,
    "galaxy-s22-ultra": 8.9,
    "galaxy-s23-s24-ultra": 8.9,
    "galaxy-s24-s25": 7.6,
    "galaxy-s24plus-s25plus": 7.7,
    "galaxy-s25-ultra": 8.2,
    "galaxy-note-9-10plus": 8.8,
    "galaxy-note-20-ultra": 8.1,

    # Xiaomi
    "redmi-a1-a2-a3": 9.1,
    "redmi-9-9a-9c": 9.0,
    "redmi-10": 8.9,
    "redmi-12-12c": 8.2,
    "redmi-note-9": 8.9,
    "redmi-note-9-pro-9s": 8.8,
    "redmi-note-10-10s": 8.3,
    "redmi-note-10-pro": 8.1,
    "redmi-note-11-12": 8.0,
    "redmi-note-11-pro": 8.1,
    "redmi-note-12-pro": 8.0,
    "redmi-note-13-13pro": 8.0,
    "redmi-note-13-pro-plus": 9.0,
    "redmi-note-14": 8.4,
    "poco-x3": 9.4,
    "poco-x4-x5": 8.0,
    "poco-x6": 7.9,
    "poco-m3-m4-m5": 9.6,
    "poco-f3-f4": 7.8,
    "poco-f5": 7.9,
    "mi-9-9se": 7.6,
    "mi-10-10t": 9.3,
    "mi-11": 8.1,
    "mi-11-lite": 6.8,
    "xiaomi-12-13-14": 8.2,
    "xiaomi-12pro-13pro-14pro": 8.5,
    "xiaomi-12t-13t-14t": 8.6,

    # Huawei / Honor
    "huawei-y6": 8.0,
    "huawei-y7": 8.1,
    "huawei-y9": 8.8,
    "huawei-p20": 7.7,
    "huawei-p20-pro": 7.8,
    "huawei-p30": 7.4,
    "huawei-p30-pro": 8.4,
    "huawei-p40-lite": 8.7,
    "huawei-p40": 8.5,
    "huawei-p50": 8.0,
    "huawei-p60": 8.3,
    "huawei-mate-lite": 7.6,
    "huawei-nova-9-10-11": 6.9,
    "honor-x7-x8-x9": 7.9,
    "honor-50-70": 7.8,
    "honor-90-100": 7.8,

    # Motorola
    "moto-e-series": 8.5,
    "moto-g-series": 8.5,
    "moto-g-pro": 9.5,
    "moto-edge": 8.0,

    # Other (Tecno / Infinix / Realme / OPPO)
    "tecno-spark": 8.7,
    "tecno-camon": 8.0,
    "tecno-pop": 9.0,
    "infinix-hot": 8.5,
    "infinix-note": 8.0,
    "infinix-smart": 9.0,
    "realme-c-series": 8.5,
    "realme-9-10-11": 8.0,
    "realme-12": 7.6,
    "oppo-a-series": 8.0,
    "oppo-reno": 7.8,

    # LG
    "lg-k8-k10": 8.5,
    "lg-k-series": 8.0,
    "lg-g6": 7.9,
    "lg-g7-g8": 8.0,
    "lg-v-series": 7.5,
    "lg-stylo": 8.4,
    "lg-velvet": 7.9,

    # Nokia
    "nokia-1-2-3": 8.7,
    "nokia-5": 8.0,
    "nokia-6": 8.6,
    "nokia-7-8": 8.0,
    "nokia-g-series": 9.2,
    "nokia-x-series": 9.3,

    # ZTE
    "zte-blade-a3-a5-a7": 8.6,
    "zte-blade-a30": 9.4,
    "zte-blade-a52-a53": 9.4,
    "zte-blade-a72-a73": 8.5,
    "zte-blade-v": 8.4,
    "zte-axon": 7.8,

    # Alcatel / TCL
    "alcatel-1": 9.6,
    "alcatel-3": 8.6,
    "alcatel-5": 8.7,
    "tcl-10": 7.7,
    "tcl-20-30": 8.4,

    # BLU
    "blu-g-series": 8.5,
    "blu-v-series": 9.0,
    "blu-vivo": 8.5,
    "blu-studio": 8.5,

    # Pixel
    "pixel-3": 7.9,
    "pixel-3a": 8.2,
    "pixel-4-5": 8.2,
    "pixel-6": 8.9,
    "pixel-7": 8.7,
    "pixel-8": 8.8,
    "pixel-9": 8.5,

    # OnePlus
    "oneplus-7": 8.8,
    "oneplus-8": 8.5,
    "oneplus-9": 8.7,
    "oneplus-10": 8.8,
    "oneplus-11-12": 9.2,
    "oneplus-nord": 8.2,
    "oneplus-nord-ce": 7.9,
}


def main():
    path = "src/lib/data/phone-models.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Pattern: matches a model object's `heightMm: N,\n    cornerRadiusMm:` and we
    # need to know the slug from the same block. Simplest approach: split by `{`
    # to get blocks, process each, rejoin.
    out_lines = []
    lines = content.splitlines(keepends=True)

    # We track: when we see `slug: "X"`, remember slug. When we see
    # `cornerRadiusMm: ...`, insert `depthMm: <DEPTH[slug]>,` BEFORE that line.
    current_slug = None
    inserted_for_current = False
    missing = []
    inserted = 0

    slug_re = re.compile(r'slug:\s*"([^"]+)"')
    height_re = re.compile(r'^(\s*)heightMm:\s*[\d.]+,?\s*$')
    corner_re = re.compile(r'^(\s*)cornerRadiusMm:')

    for line in lines:
        # Detect a slug line
        m_slug = slug_re.search(line)
        if m_slug:
            current_slug = m_slug.group(1)
            inserted_for_current = False
        # Detect heightMm line — we'll insert depthMm AFTER it
        out_lines.append(line)
        m_height = height_re.match(line)
        if m_height and current_slug and not inserted_for_current:
            depth = DEPTH.get(current_slug)
            indent = m_height.group(1)
            if depth is None:
                missing.append(current_slug)
            else:
                # If next line already has depthMm, skip (idempotent)
                # We'll insert here always since we control input.
                out_lines.append(f"{indent}depthMm: {depth},\n")
                inserted += 1
            inserted_for_current = True

    new_content = "".join(out_lines)

    if missing:
        print("WARN missing depthMm for slugs:")
        for s in missing:
            print(f"  - {s}")

    print(f"\nInserted depthMm into {inserted} models.")

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(new_content)
    print("Done.")


if __name__ == "__main__":
    main()
