import React from "react";

// Hash-router stand-in for next/link, used only by the standalone preview build.
export default function Link({ href, children, ...rest }: any) {
  return (
    <a href={"#" + href} {...rest}>
      {children}
    </a>
  );
}
