import { Archivo } from "next/font/google";

// One variable family: the condensed width carries the tape lettering, normal width the body.
export const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
