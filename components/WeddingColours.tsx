 "use client";

const colours = [
  {
    name: "White",
    gradient:
      "radial-gradient(circle at 35% 35%, #ffffff 0%, #f0eee8 50%, #d8d4cc 100%)",
    border: "2px solid rgba(0,0,0,0.12)",
    highlight: "rgba(255,255,255,0.9)",
    labelColour: "#a3a3a3",
  },
  {
    name: "Burnt Orange",
    gradient:
      "radial-gradient(circle at 35% 35%, #cf6f42 0%, #b5522b 45%, #7f3418 100%)",
    border: "2px solid rgba(255,255,255,0.15)",
    highlight: "rgba(255,255,255,0.3)",
    labelColour: "#b5522b",
  },
  {
    name: "Gold",
    gradient:
      "radial-gradient(circle at 35% 35%, #f3da7a 0%, #d4af37 45%, #997915 100%)",
    border: "2px solid rgba(111,47,22,0.22)",
    highlight: "rgba(255,255,255,0.25)",
    labelColour: "#997915",
  },
];

export function WeddingColours() {
  return (
    <div className="mt-4">
      <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-neutral-400">
        Wedding Colours
      </p>
      <div className="flex items-center justify-start gap-8">
        {colours.map((colour) => {
          const isWhite = colour.name === "White";
          return (
            <div
              key={colour.name}
              className="pot-wrapper flex flex-col items-center"
            >
              <div
                className="relative h-14 w-14 rounded-full"
                style={{
                  background: colour.gradient,
                  border: colour.border,
                  boxShadow:
                    "0 8px 24px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.10)",
                }}
              >
                <div
                  className="pot-highlight"
                  style={{ background: colour.highlight }}
                />
              </div>
              <p
                className={`mt-3 text-[10px] uppercase tracking-[0.22em] font-medium${
                  isWhite ? " text-neutral-400" : ""
                }`}
                style={isWhite ? undefined : { color: colour.labelColour }}
              >
                {colour.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

