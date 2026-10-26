import { useEffect, useState } from "react";

const read = () => (typeof window === "undefined" ? "/dashboard" : window.location.hash.replace(/^#/, "") || "/dashboard");

export function usePathname() {
  const [p, setP] = useState(read);
  useEffect(() => {
    const on = () => { setP(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return p;
}

export function redirect(to: string) {
  window.location.hash = to;
}
